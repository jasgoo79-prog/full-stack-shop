import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VerificationPreview } from "@/components/admin/VerificationPreview";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Pagini de produs | Panou" },
      { name: "description", content: "Lista paginilor de produs create." },
      { property: "og:title", content: "Pagini de produs | Panou" },
      { property: "og:description", content: "Lista paginilor de produs create." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminList,
});

function AdminList() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["pages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_pages").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pagină ștearsă"); qc.invalidateQueries({ queryKey: ["pages"] }); },
  });

  const dup = useMutation({
    mutationFn: async (row: (typeof data)[number]) => {
      const slug = `${row.slug}-copie-${Math.random().toString(36).slice(2, 6)}`;
      const { data: n, error } = await supabase.from("product_pages").insert({ slug, title: row.title + " (copie)", data: row.data, published: false }).select("id").single();
      if (error) throw error;
      return n.id;
    },
    onSuccess: (id) => { qc.invalidateQueries({ queryKey: ["pages"] }); navigate({ to: "/admin/produse/$id", params: { id } }); },
  });

  const rows = data.filter((r) => (r.title + r.slug).toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Pagini de produs</h1>
        <div className="flex flex-wrap gap-2">
          <VerificationPreview />
          <Input placeholder="Caută…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56 rounded-full bg-card" />
          <Button asChild className="rounded-full">
            <Link to="/admin/produse/$id" params={{ id: "nou" }}><Plus /> Pagină nouă</Link>
          </Button>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
        {isLoading ? (
          <p className="p-6 text-muted-foreground">Se încarcă…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-muted-foreground">Nicio pagină încă. Creează prima pagină de produs.</p>
        ) : (
          rows.map((r) => {
            const img = (r.data as { immagini?: string[] })?.immagini?.[0];
            return (
              <div key={r.id} className="flex items-center gap-4 border-b p-4 last:border-b-0">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.title || "Fără titlu"}</p>
                  <p className="truncate text-sm text-muted-foreground">/p/{r.slug}</p>
                </div>
                <Badge variant={r.published ? "default" : "secondary"}>{r.published ? "Publicat" : "Ciornă"}</Badge>
                <div className="flex gap-1">
                  {r.published && (
                    <Button variant="ghost" size="icon" asChild title="Deschide pagina">
                      <a href={`/p/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink /></a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" title="Editează" asChild>
                    <Link to="/admin/produse/$id" params={{ id: r.id }}><Pencil /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" title="Duplică" onClick={() => dup.mutate(r)}><Copy /></Button>
                  <Button variant="ghost" size="icon" title="Șterge" onClick={() => confirm("Ștergi pagina?") && del.mutate(r.id)}><Trash2 /></Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </AdminShell>
  );
}
