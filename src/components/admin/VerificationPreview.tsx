import { useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { renderCheckoutHtml } from "@/lib/product-template/render";

const states = ["verifying", "challenge", "waiting", "error_challenge", "error_details", "timeout", "success"] as const;
type State = typeof states[number];
type DemoWindow = Window & { checkoutVerification?: { setState: (state: State, options: { message: string }) => void } };
const previewHtml = renderCheckoutHtml({});

/** Only controls this local preview iframe, never customer sessions. */
export function VerificationPreview() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<State>("verifying");
  const [message, setMessage] = useState("Controlla l’indirizzo di spedizione e riprova.");
  function show(next: State, text = message) {
    setState(next);
    const target = frame.current?.contentWindow as DemoWindow | null;
    target?.checkoutVerification?.setState(next, { message: text });
  }
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline"><FlaskConical /> Verificare demo</Button></DialogTrigger>
      <DialogContent className="max-h-[95dvh] w-[96vw] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verificare comandă — demonstrație</DialogTitle>
          <DialogDescription>Simulare locală, fără plăți sau coduri bancare reale.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2" aria-label="Stări verificare">
          {states.map(item => <Button key={item} size="sm" variant={item === state ? "default" : "outline"} onClick={() => show(item)}>{item}</Button>)}
        </div>
        {state === "error_details" && <div className="space-y-2"><Label htmlFor="demo-message">Mesaj pentru date incorecte</Label><Input id="demo-message" value={message} onChange={event => { setMessage(event.target.value); show(state, event.target.value); }} /></div>}
        <iframe ref={frame} title="Previzualizare verificare checkout" srcDoc={previewHtml} className="h-[60dvh] min-h-96 w-full rounded-lg border bg-background" onLoad={() => show(state)} />
      </DialogContent>
    </Dialog>
  );
}