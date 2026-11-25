import { createFileRoute } from "@tanstack/react-router";
import { useReducer } from "react";
import { CheckCircle2, FlaskConical, LoaderCircle, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_CODE, transitionDemo } from "@/lib/checkout-demo";

export const Route = createFileRoute("/demo-checkout")({
  head: () => ({ meta: [
    { title: "Checkout DEMO | Panou produse" },
    { name: "description", content: "Simulare izolată de checkout, cu date exclusiv fictive." },
    { property: "og:title", content: "Checkout DEMO | Panou produse" },
    { property: "og:description", content: "Simulare izolată, fără plăți sau coduri reale." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: CheckoutDemo,
});

function CheckoutDemo() {
  const [stage, dispatch] = useReducer(transitionDemo, "ready");
  const active = stage === "loading" || stage === "otp" || stage === "review";
  const labels = {
    ready: "Pregătit", loading: "Se procesează simularea…", otp: "Confirmare fictivă",
    review: "În așteptarea deciziei locale", approved: "Simulare aprobată", rejected: "Simulare respinsă",
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-muted px-6 py-4 text-center text-sm font-semibold">
        DEMO · Fără plăți, carduri sau coduri reale · Stare temporară în această pagină
      </div>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-10 flex items-center gap-3">
          <FlaskConical className="size-8 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Checkout DEMO</h1>
        </header>
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-label="Comandă fictivă">
            <h2 className="mb-4 text-lg font-semibold">Comandă de test</h2>
            <dl className="mb-8 space-y-3 border-y py-5 text-sm">
              <div className="flex justify-between gap-4"><dt>Produs fictiv</dt><dd>Articol DEMO × 1</dd></div>
              <div className="flex justify-between gap-4"><dt>Destinatar fictiv</dt><dd>Client DEMO</dd></div>
              <div className="flex justify-between gap-4"><dt>Total simulat</dt><dd className="font-bold">10,00 EUR</dd></div>
            </dl>
            <div className="min-h-64 rounded-lg border p-6" role="status" aria-live="polite">
              {stage === "loading" || stage === "review" ? <LoaderCircle className="mb-4 size-8 text-primary motion-safe:animate-spin" aria-hidden="true" /> : stage === "approved" ? <CheckCircle2 className="mb-4 size-8 text-primary" aria-hidden="true" /> : stage === "rejected" ? <XCircle className="mb-4 size-8 text-destructive" aria-hidden="true" /> : <ShieldCheck className="mb-4 size-8 text-primary" aria-hidden="true" />}
              <h2 className="mb-5 text-lg font-semibold">{labels[stage]}</h2>
              {stage === "ready" && <Button onClick={() => dispatch("start")}>Pornește simularea</Button>}
              {stage === "otp" && <div className="space-y-5">
                <p className="text-sm text-muted-foreground">Cod DEMO prestabilit — nu este trimis prin SMS.</p>
                <output aria-label="Cod fictiv" className="block font-mono text-3xl">{DEMO_CODE}</output>
                <Button onClick={() => dispatch("use-demo-code")}>Folosește codul DEMO</Button>
              </div>}
              {(stage === "approved" || stage === "rejected") && <p className="text-sm text-muted-foreground">Nu s-a efectuat nicio plată.</p>}
            </div>
          </section>
          <aside aria-label="Control local DEMO" className="border-t pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <h2 className="mb-6 text-lg font-semibold">Control local DEMO</h2>
            <div className="flex flex-col gap-3">
              <Button variant="outline" disabled={stage !== "loading"} onClick={() => dispatch("request-code")}>Afișează codul fictiv</Button>
              <Button disabled={stage !== "review"} onClick={() => dispatch("approve")}><CheckCircle2 /> Aprobă simularea</Button>
              <Button variant="destructive" disabled={!active} onClick={() => dispatch("reject")}><XCircle /> Respinge simularea</Button>
              <Button variant="ghost" onClick={() => dispatch("reset")}><RotateCcw /> Resetează</Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Sesiune DEMO locală. Fără acces la vizitatori, carduri sau mesaje SMS.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}