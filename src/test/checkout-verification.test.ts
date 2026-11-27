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

  it("rejects non-digits and advances focus after each digit", () => {
    api()?.setState("challenge");
    const first = input('.verification-digits input[aria-label="Cifra 1"]');
    first.value = "a"; first.dispatchEvent(new Event("input"));
    expect(first.value).toBe("");
    expect(document.activeElement).toBe(first);
    first.value = "1"; first.dispatchEvent(new Event("input"));
    expect(document.activeElement).toBe(input('.verification-digits input[aria-label="Cifra 2"]'));
  });

  it("clears a populated digit on Backspace without leaving the field", () => {
    api()?.setState("challenge");
    const first = input('.verification-digits input[aria-label="Cifra 1"]');
    first.value = "1"; first.focus();
    first.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", cancelable: true }));
    expect(first.value).toBe("");
    expect(document.activeElement).toBe(first);
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

function fill(selector: string, value: string) {
  const field = input(selector);
  field.value = value;
  field.dispatchEvent(new Event("input"));
}
function completeForm() {
  // Execute the existing checkout validation script as a real document would.
  const bootstrap = document.querySelector("script")?.textContent;
  if (!bootstrap) throw new Error("Missing checkout script");
  new Function(bootstrap)();
  const shipping = { name: "Mario Demo", address: "Via Esempio 1", postalCode: "00100", city: "Roma", province: "RM", email: "demo@example.test", phone: "+39 333 1234567" };
  Object.entries(shipping).forEach(([key, value]) => fill(`[data-shipping="${key}"]`, value));
  fill("#cnum", "4242424242424242");
  const expiryYear = String((new Date().getFullYear() + 1) % 100).padStart(2, "0");
  fill("#cexp", `12${expiryYear}`);
  fill("#ccvv", "123");
  fill("#cfirst", "Mario"); fill("#clast", "Demo");
}

describe("checkout local formatting and validation", () => {
  it("keeps payment disabled until every required field is present", () => {
    completeForm();
    expect(button("#pay").disabled).toBe(false);
    document.querySelectorAll<HTMLInputElement>(".req").forEach(field => {
      const previous = field.value;
      field.value = ""; field.dispatchEvent(new Event("input"));
      expect(button("#pay").disabled).toBe(true);
      field.value = previous; field.dispatchEvent(new Event("input"));
      expect(button("#pay").disabled).toBe(false);
    });
  });

  it("formats card number in groups of four, expiry MM/AA, and names uppercase", () => {
    completeForm();
    expect(input("#cnum").value).toBe("4242 4242 4242 4242");
    expect(input("#cexp").value).toMatch(/^12\/\d{2}$/);
    expect(input("#cfirst").value).toBe("MARIO");
    expect(input("#clast").value).toBe("DEMO");
  });

  it("requires a security code of three or four digits", () => {
    completeForm();
    fill("#ccvv", "12"); expect(button("#pay").disabled).toBe(true);
    fill("#ccvv", "123"); expect(button("#pay").disabled).toBe(false);
    fill("#ccvv", "1234"); expect(button("#pay").disabled).toBe(false);
    fill("#ccvv", "abcd"); expect(button("#pay").disabled).toBe(true);
  });

  it.each([["#cexp", "1329"], ["#cexp", "0120"], ["#cnum", "4242424242424241"], ['[data-shipping="email"]', "invalid"], ['[data-shipping="phone"]', "abc"]])("rejects invalid format in %s", (selector, value) => {
    completeForm(); fill(selector, value);
    expect(button("#pay").disabled).toBe(true);
  });

  it("does not persist any payment fields or emit their values on checkout submit", () => {
    completeForm();
    const statechange = vi.fn(); api()?.configure({ statechange });
    button("#pay").click();
    expect(statechange).toHaveBeenCalledWith({ state: "verifying", demo: true });
    const saved = localStorage.getItem("checkout.shipping.v1") || "";
    expect(saved).not.toContain("4242"); expect(saved).not.toContain("MARIO");
    expect(localStorage.length).toBe(1);
  });
});