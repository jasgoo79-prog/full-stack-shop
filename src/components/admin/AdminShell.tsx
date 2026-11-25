import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Button } from "@/components/ui/button";

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: isAdmin, isLoading } = useIsAdmin();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/admin" className="text-lg font-extrabold tracking-tight">
            Panou <span className="text-primary">produse</span>
          </Link>
          <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/demo-checkout">Checkout DEMO</Link></Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={signOut}>
            Ieșire
          </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        {isLoading ? (
          <p className="text-muted-foreground">Se încarcă…</p>
        ) : isAdmin ? (
          children
        ) : (
          <div className="rounded-2xl border bg-card p-8">
            <h2 className="text-xl font-bold">Acces restricționat</h2>
            <p className="mt-2 text-muted-foreground">Contul tău nu are rol de administrator.</p>
          </div>
        )}
      </main>
    </div>
  );
}
