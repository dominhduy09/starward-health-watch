import { useState } from "react";
import { ClipboardPlus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { SymptomLog } from "@/lib/triage";

const FLAGS = [["headache", "Headache"], ["dizziness", "Dizziness / vertigo"], ["visualFlashes", "Visual flashes (phosphenes)"], ["nausea", "Nausea"]] as const;

export function SymptomDrawer({ history, onSubmit }: { history: SymptomLog[]; onSubmit: (l: SymptomLog) => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ headache: false, dizziness: false, visualFlashes: false, nausea: false, sleepQuality: 7, mood: 7, notes: "" });
  const submit = () => {
    onSubmit({ ...f, id: crypto.randomUUID(), at: new Date().toISOString().slice(11, 16) + " UTC" });
    setOpen(false);
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full gap-2"><ClipboardPlus className="size-4" />Log Symptoms & Self-Assessment</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Crew Self-Assessment</SheetTitle>
          <SheetDescription>Subjective inputs recalculate readiness and triage instantly.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6">
          {FLAGS.map(([k, label]) => (
            <label key={k} className="flex items-center justify-between text-sm">{label}
              <Switch checked={f[k]} onCheckedChange={(b) => setF({ ...f, [k]: b })} />
            </label>
          ))}
          {([["sleepQuality", "Sleep quality"], ["mood", "Mood (1 isolated · 10 great)"]] as const).map(([k, label]) => (
            <div key={k} className="space-y-2">
              <div className="flex justify-between text-sm">{label}<span className="readout text-primary">{f[k]}/10</span></div>
              <Slider min={1} max={10} step={1} value={[f[k]]} onValueChange={([n]) => setF({ ...f, [k]: n })} />
            </div>
          ))}
          <Textarea placeholder="Notes for flight surgeon…" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <Button className="w-full" onClick={submit}>Submit Assessment</Button>
          {history.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recent Logs</h4>
              <ul className="space-y-2">{history.slice(0, 5).map((h) => (
                <li key={h.id} className="readout text-xs rounded border border-border p-2">
                  <span className="text-primary">{h.at}</span> · sleep {h.sleepQuality} · mood {h.mood}
                  {FLAGS.filter(([k]) => h[k]).map(([, l]) => <span key={l} className="block text-caution">+ {l}</span>)}
                </li>))}</ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
