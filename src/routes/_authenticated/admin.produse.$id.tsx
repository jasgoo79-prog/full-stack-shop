import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { defaultProduct, renderProductHtml, slugify, type ProductData } from "@/lib/product-template/render";

export const Route = createFileRoute("/_authenticated/admin/produse/$id")({
  head: () => ({
    meta: [
      { title: "Editor pagină produs | Panou" },
      { name: "description", content: "Editează pagina de produs." },
      { property: "og:title", content: "Editor pagină produs | Panou" },
      { property: "og:description", content: "Editează pagina de produs." },
    ],
  }),
  component: Editor,
});

type K = keyof ProductData;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-5">
      <h2 className="font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Editor() {
  const { id } = Route.useParams();
  const isNew = id === "nou";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [d, setD] = useState<ProductData>(structuredClone(defaultProduct));
  const [slug, setSlug] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: row } = useQuery({
    queryKey: ["page", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("product_pages").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (row) {
      setD({ ...structuredClone(defaultProduct), ...(row.data as Partial<ProductData>) });
      setSlug(row.slug);
      setPublished(row.published);
    }
  }, [row]);

  const set = <T extends K>(k: T, v: ProductData[T]) => setD((p) => ({ ...p, [k]: v }));
  const deferred = useDeferredValue(d);
  const html = useMemo(() => renderProductHtml(deferred), [deferred]);

  const text = (k: K, label: string, ph?: string) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={String(d[k] ?? "")} placeholder={ph} onChange={(e) => set(k, e.target.value as never)} />
    </div>
  );

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const path = `${crypto.randomUUID()}-${f.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, f);
      if (error) { toast.error(error.message); continue; }
      const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (data) urls.push(data.signedUrl);
    }
    setUploading(false);
    set("immagini", [...d.immagini, ...urls]);
  }

  async function save() {
    const finalSlug = slugify(slug || d.titolo);
    setSaving(true);
    const payload = { slug: finalSlug, title: d.titolo, published, data: d as never };
    const res = isNew
      ? await supabase.from("product_pages").insert(payload).select("id").single()
      : await supabase.from("product_pages").update(payload).eq("id", id).select("id").single();
    setSaving(false);
    if (res.error) return void toast.error(res.error.code === "23505" ? "Acest link este deja folosit." : res.error.message);
    setSlug(finalSlug);
    toast.success("Salvat");
    qc.invalidateQueries({ queryKey: ["pages"] });
    if (isNew) navigate({ to: "/admin/produse/$id", params: { id: res.data.id }, replace: true });
  }

  const move = (arr: string[], i: number, dir: number) => {
    const a = [...arr]; const j = i + dir;
    if (j < 0 || j >= a.length) return a;
    [a[i], a[j]] = [a[j]!, a[i]!];
    return a;
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Înapoi</Link>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><Switch checked={published} onCheckedChange={setPublished} /> Publicat</label>
          {!isNew && published && slug && (
            <Button variant="outline" className="rounded-full" asChild><a href={`/p/${slug}`} target="_blank" rel="noreferrer"><ExternalLink /> Deschide</a></Button>
          )}
          <Button className="rounded-full" onClick={save} disabled={saving}>{saving ? "Se salvează…" : "Salvează"}</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <Section title="Link pagină">
            <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">/p/</span>
              <Input value={slug} placeholder={slugify(d.titolo)} onChange={(e) => setSlug(e.target.value)} /></div>
          </Section>

          <Section title="Logo și magazin">
            <div className="grid gap-3 sm:grid-cols-2">
              {text("logoUrl", "Link logo (imagine)")}{text("logoLink", "Link la click pe logo")}
              {text("nomeSito", "Nume site")}{text("coloreBrand", "Culoare brand", "#e53238")}
            </div>
          </Section>

          <Section title="Poze">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {d.immagini.map((src, i) => (
                <div key={src + i} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-background/80 p-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => set("immagini", move(d.immagini, i, -1))}><ArrowUp className="size-4" /></button>
                    <button onClick={() => set("immagini", move(d.immagini, i, 1))}><ArrowDown className="size-4" /></button>
                    <button onClick={() => set("immagini", d.immagini.filter((_, j) => j !== i))}><Trash2 className="size-4 text-destructive" /></button>
                  </div>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground hover:bg-muted">
                <Upload className="size-5" />{uploading ? "Se încarcă…" : "Încarcă"}
                <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
              </label>
            </div>
            <UrlAdder onAdd={(u) => set("immagini", [...d.immagini, u])} />
          </Section>

          <Section title="Titlu și categorie">
            {text("titolo", "Titlu")}
            <div className="grid gap-3 sm:grid-cols-2">
              {text("votoRecensioni", "Notă recenzii", "4,9")}{text("numeroRecensioni", "Număr recenzii", "(24 recensioni prodotto)")}
              {text("categoria", "Categorie")}{text("sottocategoria", "Subcategorie")}
            </div>
          </Section>

          <Section title="Preț și disponibilitate">
            <div className="grid gap-3 sm:grid-cols-2">
              {text("prezzo", "Preț", "EUR 0,00")}{text("prezzoPrecedente", "Preț vechi")}
              {text("scontoBadge", "Reducere", "-20%")}{text("notaIva", "Notă TVA")}
              {text("condizione", "Stare")}{text("disponibilita", "Disponibilitate")}
            </div>
          </Section>

          <Section title="Vânzător, livrare și retur">
            <div className="grid gap-3 sm:grid-cols-2">
              {text("venditore", "Vânzător")}{text("venditeVenditore", "Vânzări vânzător")}
              {text("feedbackVenditore", "Feedback vânzător")}{text("luogoOggetto", "Locația obiectului")}
              {text("spedizione", "Livrare")}{text("ritiro", "Ridicare personală")}
              {text("consegna", "Dată livrare")}{text("numeroOggetto", "Număr obiect")}
              {text("visualizzazioniOggi", "Vizualizări azi")}{text("osservatori", "Observatori")}
              {text("restituzione", "Retur")}{text("dettagliRestituzione", "Detalii retur")}
              {text("garanzia", "Garanție")}{text("altriOsservano", "Text „alții urmăresc”")}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Metode de plată (separate prin virgulă)</Label>
              <Input value={d.pagamenti.join(", ")} onChange={(e) => set("pagamenti", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
            </div>
          </Section>

          <Section title="Specificații">
            {d.specifiche.map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input value={s.nome} placeholder="Nume" onChange={(e) => set("specifiche", d.specifiche.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))} />
                <Input value={s.valore} placeholder="Valoare" onChange={(e) => set("specifiche", d.specifiche.map((x, j) => (j === i ? { ...x, valore: e.target.value } : x)))} />
                <Button variant="ghost" size="icon" onClick={() => set("specifiche", d.specifiche.filter((_, j) => j !== i))}><Trash2 /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => set("specifiche", [...d.specifiche, { nome: "", valore: "" }])}><Plus /> Adaugă</Button>
          </Section>

          <Section title="Descriere">
            <Textarea rows={8} value={d.descrizione} onChange={(e) => set("descrizione", e.target.value)} />
          </Section>

          <Section title="Informații vânzător">
            <div className="grid gap-3 sm:grid-cols-2">
              {(["feedbackPct", "oggettiVenduti", "valutazioni", "dal"] as const).map((k) => (
                <div key={k} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{{ feedbackPct: "Feedback %", oggettiVenduti: "Obiecte vândute", valutazioni: "Evaluări", dal: "Pe site din" }[k]}</Label>
                  <Input value={d.venditoreInfo[k]} onChange={(e) => set("venditoreInfo", { ...d.venditoreInfo, [k]: e.target.value })} />
                </div>
              ))}
            </div>
            <Textarea rows={2} value={d.venditoreInfo.nota} onChange={(e) => set("venditoreInfo", { ...d.venditoreInfo, nota: e.target.value })} />
            {text("linkFeedback", "Link spre toate feedback-urile")}
          </Section>

          <Section title="Feedback-uri">
            {d.feedback.map((f, i) => {
              const up = (patch: Partial<typeof f>) => set("feedback", d.feedback.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              return (
                <div key={i} className="space-y-2 rounded-xl border p-3">
                  <div className="flex gap-2">
                    <Input value={f.utente} placeholder="Utilizator" onChange={(e) => up({ utente: e.target.value })} />
                    <Input value={f.quando} placeholder="Când" onChange={(e) => up({ quando: e.target.value })} />
                    <Button variant="ghost" size="icon" onClick={() => set("feedback", d.feedback.filter((_, j) => j !== i))}><Trash2 /></Button>
                  </div>
                  <Input value={f.testo} placeholder="Text" onChange={(e) => up({ testo: e.target.value })} />
                  <Input value={f.oggetto} placeholder="Obiect cumpărat" onChange={(e) => up({ oggetto: e.target.value })} />
                  <label className="flex items-center gap-2 text-sm"><Switch checked={f.verificato} onCheckedChange={(v) => up({ verificato: v })} /> Achiziție verificată</label>
                </div>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => set("feedback", [...d.feedback, { utente: "", quando: "", verificato: true, testo: "", oggetto: "" }])}><Plus /> Adaugă feedback</Button>
          </Section>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b px-4 py-2 text-xs font-semibold text-muted-foreground">Previzualizare live</div>
            <iframe title="Previzualizare" srcDoc={html} className="h-[80vh] w-full bg-background" />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function UrlAdder({ onAdd }: { onAdd: (u: string) => void }) {
  const [u, setU] = useState("");
  return (
    <div className="flex gap-2">
      <Input value={u} placeholder="sau lipește un link de imagine" onChange={(e) => setU(e.target.value)} />
      <Button variant="outline" onClick={() => { if (u.trim()) { onAdd(u.trim()); setU(""); } }}>Adaugă</Button>
    </div>
  );
}
