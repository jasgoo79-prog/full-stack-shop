import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { renderProductHtml, type ProductData } from "@/lib/product-template/render";

export const Route = createFileRoute("/p/$slug")({
  head: () => ({ meta: [
    { title: "Pagina prodotto | Panou produse" },
    { name: "description", content: "Dettagli e immagini del prodotto." },
    { property: "og:title", content: "Pagina prodotto | Panou produse" },
    { property: "og:description", content: "Dettagli e immagini del prodotto." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });
        const { data } = await sb
          .from("product_pages")
          .select("data")
          .eq("slug", params.slug)
          .eq("published", true)
          .maybeSingle();
        if (!data) {
          return new Response("<!doctype html><meta charset=utf-8><title>Pagina non trovata</title><p style='font-family:sans-serif;padding:40px'>Pagina non trovata.</p>", {
            status: 404,
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }
        return new Response(renderProductHtml(data.data as Partial<ProductData>), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});
