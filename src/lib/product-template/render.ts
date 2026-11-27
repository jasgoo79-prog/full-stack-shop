import template from "./template.html?raw";
import defaults from "./defaults.json";
import verificationScript from "./verification.js?raw";
import verificationStyles from "./verification.css?raw";

export type ProductData = Omit<typeof defaults, "immagini"> & { immagini: string[] };
export const defaultProduct: ProductData = defaults;

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

/** Fills the uploaded product-page template with one product's data. */
export function renderProductHtml(data: Partial<ProductData>): string {
  const merged = { ...defaultProduct, ...data };
  const json = JSON.stringify(merged).replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, "");
  const title = esc((merged.titolo || "Inserzione Prodotto") + (merged.nomeSito ? ` | ${merged.nomeSito}` : ""));
  const desc = esc(String(merged.descrizione || "").slice(0, 160));
  const image = merged.immagini?.[0];
  const img = image?.startsWith("https://") ? `<meta property="og:image" content="${esc(image)}" /><meta name="twitter:image" content="${esc(image)}" />` : "";
  return template
    .replace("<title>Inserzione Prodotto</title>", `<title>${title}</title><meta name="description" content="${desc}" /><meta property="og:title" content="${title}" /><meta property="og:description" content="${desc}" /><meta property="og:type" content="product" /><meta name="twitter:card" content="summary_large_image" />${img}`)
    .replace("/*__PRODOTTO__*/null", json);
}

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "produs";
}

import checkoutTemplate from "./checkout.html?raw";

/** Fills the checkout page (card-only payment) with one product's data. */
export function renderCheckoutHtml(data: Partial<ProductData>): string {
  const merged = { ...defaultProduct, ...data };
  const json = JSON.stringify(merged).replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, "");
  return checkoutTemplate.replace("/*__PRODOTTO__*/null", json)
    .replace("<title>Paga</title>", `<title>Paga — ${esc(merged.titolo)}</title><meta name="description" content="Riepilogo ordine e checkout dimostrativo." /><meta property="og:title" content="Paga — ${esc(merged.titolo)}" /><meta property="og:description" content="Riepilogo ordine e checkout dimostrativo." /><meta property="og:type" content="website" /><meta name="twitter:card" content="summary" />${merged.immagini?.[0]?.startsWith("https://") ? `<meta property="og:image" content="${esc(merged.immagini[0])}" /><meta name="twitter:image" content="${esc(merged.immagini[0])}" />` : ""}`)
    .replace("</head>", `<style>${verificationStyles}</style></head>`)
    .replace("</body>", `<script>${verificationScript}</script></body>`);
}
