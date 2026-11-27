import { useRef, useState } from "react";
import { Check, Circle, FlaskConical, LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { renderCheckoutHtml } from "@/lib/product-template/render";
import { decidePreview, initialPreviewSession, isPreviewLoading, respondPreview, verificationStates, type DemoResponse, type FrameState, type VerificationState } from "@/lib/verification-preview";

// A value-free interface: never read payment fields or challenge digits from the frame.
type DemoWindow = Window & { checkoutVerification?: {
  setState: (state: FrameState, options: { message: string }) => void;
  configure: (handlers: Record<string, (detail: { state: FrameState; demo: true }) => void>) => void;
} };
const previewHtml = renderCheckoutHtml({});
const columns = ["Number", "Name", "Exp", "CVV"];
const fixture = ["•••• •••• •••• 0000", "CLIENT DEMO", "12/30", "***"];
const presences = ["Online", "Offline", "Away", "Inactiv"];
const decisions = [
  { label: "Send OTP", state: "challenge" },
  { label: "Error OTP", state: "error_challenge" },
  { label: "Error Card", state: "error_details" },
  { label: "Finalizare Succes", state: "success" },
] as const;

/** Controls only the embedded local demo; the row consists entirely of fixed fixtures. */
export function VerificationPreview() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [session, setSession] = useState(initialPreviewSession);
  const [exists, setExists] = useState(true);
  const [message, setMessage] = useState("Controlla l’indirizzo di spedizione e riprova.");
  const [presence, setPresence] = useState("Online");
  const [activeColumn, setActiveColumn] = useState("none");
  const [frameReady, setFrameReady] = useState(false);
  const target = () => (frame.current?.contentWindow as DemoWindow | null)?.checkoutVerification;

  function show(next: FrameState, text = message) {
    setSession(current => ({ ...current, state: next }));
    target()?.setState(next, { message: text });
  }
  function decide(next: VerificationState) {
    if (!session.ready || !frameReady) return;
    setSession(current => decidePreview(current, next));
    target()?.setState(next, { message });
  }
  function reset() {
    setExists(true);
    setSession({ ...initialPreviewSession });
    setPresence("Online");
    setActiveColumn("none");
    target()?.setState("verifying", { message });
  }
  function connect() {
    const demo = target();
    if (!demo) return;
    const handlers: Record<string, (detail: { state: FrameState; demo: true }) => void> = {
      statechange: detail => setSession(current => ({ ...current, state: detail.state })),
    };
    (["confirm", "quickApproval", "retry", "correctDetails", "close"] as DemoResponse[]).forEach(name => {
      handlers[name] = () => setSession(current => respondPreview(current, name));
    });
    demo.configure(handlers);
    demo.setState(session.state, { message });
    setFrameReady(true);
  }

  return (
    <Dialog onOpenChange={open => { if (!open) { target()?.configure({}); setFrameReady(false); setExists(true); setSession({ ...initialPreviewSession }); } }}>
      <DialogTrigger asChild><Button variant="outline"><FlaskConical /> Verificare demo</Button></DialogTrigger>
      <DialogContent className="max-h-[95dvh] w-[96vw] min-w-0 max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verificare comandă — demonstrație</DialogTitle>
          <DialogDescription>Doar date fictive și previzualizare locală. Fără plăți sau coduri bancare reale.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2" aria-label="Stări verificare">
          {verificationStates.map(item => <Button key={item} size="sm" variant={item === session.state ? "default" : "outline"} disabled={!exists || !frameReady} onClick={() => show(item)}>{item}</Button>)}
        </div>
        <section className="min-w-0 space-y-3" aria-label="Sesiune fictivă">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="demo-presence">Status demo</Label>
              <Select value={presence} onValueChange={setPresence} disabled={!exists}>
                <SelectTrigger id="demo-presence" className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{presences.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="demo-column">Câmp activ demo</Label>
              <Select value={activeColumn} onValueChange={setActiveColumn} disabled={!exists}>
                <SelectTrigger id="demo-column" className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">—</SelectItem>{columns.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="min-w-48 flex-1 space-y-1">
              <Label htmlFor="demo-message">Mesaj Error Card</Label>
              <Input id="demo-message" maxLength={500} value={message} onChange={event => {
                setMessage(event.target.value);
                if (session.state === "error_details") show("error_details", event.target.value);
              }} />
            </div>
            <Button variant="outline" size="icon" title="Resetează sesiunea demo" aria-label="Resetează sesiunea demo" disabled={!frameReady} onClick={reset}><RotateCcw /></Button>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <Table className="min-w-[850px]">
              <TableHeader><TableRow>{[...columns, "OTP", "Loading", "Submit", "Options"].map(column => <TableHead key={column} className={column === activeColumn ? "bg-accent text-accent-foreground" : ""}>{column}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {exists ? <TableRow>
                  {fixture.map((value, index) => <TableCell key={columns[index]} className={columns[index] === activeColumn ? "bg-accent font-medium text-accent-foreground" : "whitespace-nowrap"}>{value}</TableCell>)}
                  <TableCell aria-label="Răspuns demonstrativ">{session.response || "—"}</TableCell>
                  <TableCell><span className="inline-flex items-center gap-1" role="status">{isPreviewLoading(session.state) ? <LoaderCircle aria-label="Încărcare" className="size-4 animate-spin text-primary motion-reduce:animate-none" /> : <Circle aria-label="Oprit" className="size-4 text-muted-foreground" />}</span></TableCell>
                  <TableCell>{session.result && <span className={`inline-flex items-center gap-1 ${session.result === "success" ? "text-success" : "text-foreground"}`}><Check className="size-4" />{session.result === "success" ? "Succes" : "Eroare"}</span>}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><span className={`size-2 rounded-full ${presence === "Online" ? "bg-success" : presence === "Away" ? "bg-primary" : "bg-muted-foreground"}`} />{presence}<Button variant="ghost" size="icon" title="Delete" aria-label="Delete" onClick={() => { show("idle"); setExists(false); }}><Trash2 /></Button></div></TableCell>
                </TableRow> : <TableRow><TableCell colSpan={8} className="py-4 text-center text-muted-foreground">Nicio sesiune demonstrativă.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Acțiuni sesiune demo">
            {decisions.map(item => <Button key={item.label} size="sm" variant="outline" disabled={!exists || !session.ready || !frameReady} onClick={() => decide(item.state)}>{item.label}</Button>)}
          </div>
        </section>
        <iframe ref={frame} title="Previzualizare verificare checkout" srcDoc={previewHtml} className="h-[60dvh] min-h-96 w-full rounded-lg border bg-background" onLoad={connect} />
      </DialogContent>
    </Dialog>
  );
}
