import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import script from "@/lib/product-template/verification.js?raw";
import { renderCheckoutHtml } from "@/lib/product-template/render";

type Demo = {
  setState: (state: string, options?: { message: string }) => boolean;
  getState: () => string;
  configure: (callbacks: Record<string, (detail: unknown) => void>) => void;
};
const api = () => (window as Window & { checkoutVerification?: Demo }).checkoutVerification;
const input = (selector: string) => {
  const element = document.querySelector<HTMLInputElement>(selector);
  if (!element) throw new Error(`Missing input: ${selector}`);
  return element;
};
const button = (selector: string) => {
  const element = document.querySelector<HTMLButtonElement>(selector);
  if (!element) throw new Error(`Missing button: ${selector}`);
  return element;
};
function start() {
  document.body.innerHTML = renderCheckoutHtml({});
  // HTML inserted with innerHTML does not execute scripts. Only run the isolated demo module.
  new Function(script)();
}
beforeEach(() => { localStorage.clear(); start(); });
afterEach(() => { api()?.setState("idle"); document.body.innerHTML = ""; vi.restoreAllMocks(); });

describe("checkout demo behavior", () => {
  it("enables confirmation only after all six digits are filled", () => {
    api()?.setState("challenge");
    const fields = [...document.querySelectorAll<HTMLInputElement>(".verification-digits input")];
    expect(fields).toHaveLength(6);
    fields.slice(0, 5).forEach(field => { field.value = "1"; field.dispatchEvent(new Event("input")); });
    expect(button(".verification-confirm").disabled).toBe(true);
    const last = fields[5];
    if (!last) throw new Error("Missing sixth field");
    last.value = "6"; last.dispatchEvent(new Event("input"));
    expect(button(".verification-confirm").disabled).toBe(false);
  });

  it("supports six-digit paste and Backspace to the previous field", () => {
    api()?.setState("challenge");
    const event = new Event("paste", { cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "123456" } });
    input('.verification-digits input[aria-label="Cifra 1"]').dispatchEvent(event);
    expect(button(".verification-confirm").disabled).toBe(false);
    const sixth = input('.verification-digits input[aria-label="Cifra 6"]');
    sixth.value = "";
    sixth.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", cancelable: true }));
    expect(document.activeElement).toBe(input('.verification-digits input[aria-label="Cifra 5"]'));
    expect(button(".verification-confirm").disabled).toBe(true);
  });

  it("accepts only the fixed demo code and emits no code values", () => {
    const confirm = vi.fn();
    api()?.configure({ confirm });
    api()?.setState("challenge");
    const event = new Event("paste", { cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "123456" } });
    input(".verification-digits input").dispatchEvent(event);
    button(".verification-confirm").click();
    expect(api()?.getState()).toBe("waiting");
    expect(confirm).toHaveBeenCalledWith({ state: "waiting", demo: true });
  });

  it("emits a quick approval demo event", () => {
    const quickApproval = vi.fn();
    api()?.configure({ quickApproval });
    api()?.setState("challenge");
    button(".verification-quick").click();
    expect(quickApproval).toHaveBeenCalledWith({ state: "waiting", demo: true });
  });

  it("stores and restores only the seven shipping/contact fields, never card values", () => {
    input('[data-shipping="name"]').value = "Mario Demo";
    input("#cnum").value = "4242424242424242";
    input("#ccvv").value = "123";
    input('[data-shipping="name"]').dispatchEvent(new Event("input"));
    const saved = JSON.parse(localStorage.getItem("checkout.shipping.v1") || "{}");
    expect(Object.keys(saved).sort()).toEqual(["address", "city", "email", "name", "phone", "postalCode", "province"]);
    expect(saved.name).toBe("Mario Demo");
    expect(JSON.stringify(saved)).not.toContain("4242424242424242");
    start();
    expect(input('[data-shipping="name"]').value).toBe("Mario Demo");
    expect(input("#cnum").value).toBe("");
    expect(input("#ccvv").value).toBe("");
  });

  it("remains usable when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(start).not.toThrow();
    expect(api()?.setState("verifying")).toBe(true);
  });

  it("rejects unknown states and returns from retry to challenge", () => {
    expect(api()?.setState("unknown")).toBe(false);
    api()?.setState("error_challenge");
    button(".verification-action").click();
    expect(api()?.getState()).toBe("challenge");
  });
});