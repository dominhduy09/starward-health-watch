import { useState } from "react";
import { ClipboardPlus, Stethoscope } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScanInput } from "./ScanInput";
import type { SymptomLog } from "@/lib/triage";
import type { ScanAttachment } from "@/lib/scans";

const FLAGS = [["headache", "Headache"], ["dizziness", "Dizziness / vertigo"], ["visualFlashes", "Visual flashes (phosphenes)"], ["nausea", "Nausea"]] as const;

const EMPTY = { headache: false, dizziness: false, visualFlashes: false, nausea: false, sleepQuality: 7, mood: 7, notes: "" };

export function SymptomDrawer({ history, onSubmit, onAsk }: {
  history: SymptomLog[];
  onSubmit: (l: SymptomLog) => void;
  onAsk: (prompt: string, scan: ScanAttachment | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [scan, setScan] = useState<ScanAttachment | null>(null);

  const stamp = () => new Date().toISOString().slice(11, 16) + " UTC";
  const build = (): SymptomLog => (scan
    ? { ...f, id: crypto.randomUUID(), at: stamp(), scan }
    : { ...f, id: crypto.randomUUID(), at: stamp() });

  const submit = () => { onSubmit(build()); setOpen(false); };

  const askAi = () => {
    const syms = FLAGS.filter(([k]) => f[k]).map(([, l]) => l.toLowerCase());
    const prompt = `Self-assessment: ${syms.length ? `I am experiencing ${syms.join(", ")}.` : "No specific symptoms flagged."} Sleep quality ${f.sleepQuality}/10, mood ${f.mood}/10.${f.notes.trim() ? ` Notes: ${f.notes.trim()}` : ""}${scan ? ` A diagnostic scan is attached — read it and fold the findings into my assessment.` : ""} What is the likely cause given my vitals, and what should I do?`;
    onSubmit(build());
    onAsk(prompt, scan);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full gap-2"><ClipboardPlus className="size-4" />Log Symptoms & Self-Assessment</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto overscroll-contain p-0">
        <SheetHeader className="p-5 pr-12 pb-2 text-left">
          <SheetTitle>Crew Self-Assessment</SheetTitle>
          <SheetDescription>Subjective inputs recalculate readiness and triage instantly.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-5 pb-8">
          {FLAGS.map(([k, label]) => (
            <label key={k} className="flex min-h-11 items-center justify-between gap-4 text-sm">{label}
              <Switch checked={f[k]} onCheckedChange={(b) => setF({ ...f, [k]: b })} />
            </label>
          ))}
          {([["sleepQuality", "Sleep quality"], ["mood", "Mood (1 isolated · 10 great)"]] as const).map(([k, label]) => (
            <div key={k} className="space-y-2">
              <div className="flex justify-between gap-4 text-sm">{label}<span className="readout text-primary">{f[k]}/10</span></div>
              <Slider min={1} max={10} step={1} value={[f[k]]} onValueChange={([n]) => setF({ ...f, [k]: n })} />
            </div>
          ))}

          <ScanInput value={scan} onChange={setScan} />

          <Textarea placeholder="Notes for flight surgeon…" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button onClick={submit}>Submit Assessment</Button>
            <Button variant="outline" className="gap-2" onClick={askAi}><Stethoscope className="size-4" />Ask AI Copilot</Button>
          </div>
          {history.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recent Logs</h4>
              <ul className="space-y-2">{history.slice(0, 5).map((h) => (
                <li key={h.id} className="readout text-xs rounded border border-border p-2">
                  <span className="text-primary">{h.at}</span> · sleep {h.sleepQuality} · mood {h.mood}
                  {FLAGS.filter(([k]) => h[k]).map(([, l]) => <span key={l} className="block text-caution">+ {l}</span>)}
                  {h.scan && <span className="block text-primary">+ {h.scan.label}</span>}
                </li>))}</ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
