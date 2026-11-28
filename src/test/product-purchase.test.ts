import { afterEach, expect, it, vi } from "vitest";
import { renderProductHtml } from "@/lib/product-template/render";

afterEach(() => { document.body.innerHTML = ""; vi.restoreAllMocks(); });

it("opens the purchase choice before checkout and routes guests to this product checkout", async () => {
  const html = renderProductHtml({ titolo: "Prodotto demo" });
  document.body.innerHTML = html;
  const dialog = document.querySelector<HTMLDialogElement>("#elPurchaseDialog");
  const buy = document.querySelector<HTMLButtonElement>("#btnPurchase");
  const script = document.querySelector("script")?.textContent;
  if (!dialog || !buy || !script) throw new Error("Missing purchase flow");
  const show = vi.fn(() => dialog.setAttribute("open", ""));
  const close = vi.fn(() => dialog.removeAttribute("open"));
  Object.defineProperty(dialog, "showModal", { value: show });
  Object.defineProperty(dialog, "close", { value: close });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  await new Function(`${script}\nreturn __init();`)();
  expect(dialog.hasAttribute("open")).toBe(false);
  buy.click();
  expect(show).toHaveBeenCalledOnce();
  expect(document.querySelector("#elPurchaseGuest")?.getAttribute("href")).toBe(window.location.pathname.replace(/\/$/, "") + "/checkout");
  expect(document.querySelector("#elPurchaseLogin")?.getAttribute("href")).toBe("/auth");
  document.querySelector<HTMLButtonElement>("#btnPurchaseClose")?.click();
  expect(close).toHaveBeenCalledOnce();
  vi.unstubAllGlobals();
});