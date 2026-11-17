import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { KINDS, classify, validateReading, type Kind } from "@/lib/ranges";
import { CameraPulse } from "@/components/health/CameraPulse";
import { UrgentBanner } from "@/components/health/LevelBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/log")({
  head: () => ({ meta: [{ title: "Add a Reading — ASTRA-MED" }, { name: "description", content: "Type in your vitals, measure your pulse with your phone camera, or log how you feel." }, { property: "og:title", content: "Add a Reading — ASTRA-MED" }, { property: "og:description", content: "Log your vitals and how you feel." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Log,
});

const SYMPTOMS = ["Headache", "Dizziness", "Chest pain", "Short of breath", "Nausea", "Fever / chills", "Tired", "Cough"];

function Log() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [urgent, setUrgent] = useState(false);
  const [cameraBpm, setCameraBpm] = useState<number | null>(null);
  const [mood, setMood] = useState(3); const [sleepQ, setSleepQ] = useState(3);
  const [sym, setSym] = useState<string[]>([]); const [note, setNote] = useState("");
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["readings", user.id] }); void qc.invalidateQueries({ queryKey: ["checkins", user.id] }); };

  const saveReadings = async () => {
    const rows: { kind: Kind; value: number; value2: number | null; source: string }[] = []; const e: Record<string, string> = {};
    for (const k of KINDS) {
      const raw = vals[k.id]; if (!raw) continue;
      const v = Number(raw); const v2 = k.id === "bp" ? Number(vals["bp2"]) : null;
      const err = validateReading(k.id, v, v2); if (err) { e[k.id] = err; continue; }
      rows.push({ kind: k.id, value: v, value2: v2, source: "manual" });
    }
    setErrs(e); if (Object.keys(e).length || !rows.length) { if (!rows.length && !Object.keys(e).length) toast.error("Enter at least one reading"); return; }
    const { error } = await supabase.from("readings").insert(rows.map((r) => ({ ...r, user_id: user.id })));
    if (error) { toast.error("Couldn't save. Try again."); return; }
    setUrgent(rows.some((r) => classify(r.kind, r.value, r.value2) === "urgent"));
    setVals({}); refresh(); toast.success(`Saved ${rows.length} reading${rows.length > 1 ? "s" : ""}`);
  };
  const saveCamera = async () => {
    if (!cameraBpm) return;
    const { error } = await supabase.from("readings").insert({ user_id: user.id, kind: "hr", value: cameraBpm, source: "camera" });
    if (error) { toast.error("Couldn't save."); return; }
    setCameraBpm(null); refresh(); toast.success("Camera pulse saved");
  };
  const saveCheckin = async () => {
    const { error } = await supabase.from("checkins").insert({ user_id: user.id, mood, sleep_quality: sleepQ, symptoms: sym, note: note.trim() || null });
    if (error) { toast.error("Couldn't save."); return; }
    if (sym.includes("Chest pain") || sym.includes("Short of breath")) setUrgent(true);
    setSym([]); setNote(""); refresh(); toast.success("Check-in saved — nice work!");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Add a reading</h1>
      {urgent && <UrgentBanner />}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass space-y-3 p-4 lg:col-span-2">
          <h2 className="font-medium">Type it in</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {KINDS.map((k) => (
              <div key={k.id} className="space-y-1">
                <Label htmlFor={k.id}>{k.label} <span className="text-muted-foreground">({k.unit})</span></Label>
                <div className="flex items-center gap-2">
                  <Input id={k.id} inputMode="decimal" placeholder={k.hint} value={vals[k.id] ?? ""} onChange={(e) => setVals({ ...vals, [k.id]: e.target.value })} />
                  {k.id === "bp" && <><span>/</span><Input aria-label="Bottom number" inputMode="decimal" placeholder="80" value={vals["bp2"] ?? ""} onChange={(e) => setVals({ ...vals, bp2: e.target.value })} /></>}
                </div>
                {errs[k.id] && <p className="text-xs text-critical">{errs[k.id]}</p>}
              </div>
            ))}
          </div>
          <Button onClick={saveReadings}>Save readings</Button>
        </div>
        <div className="space-y-2">
          <CameraPulse onResult={setCameraBpm} />
          {cameraBpm && <Button className="w-full" onClick={saveCamera}>Save {cameraBpm} bpm</Button>}
        </div>
      </div>
      <div className="glass space-y-3 p-4">
        <h2 className="font-medium">How do you feel?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Mood: {mood}/5</Label><Slider min={1} max={5} step={1} value={[mood]} onValueChange={(v) => setMood(v[0]!)} /></div>
          <div className="space-y-2"><Label>Sleep quality: {sleepQ}/5</Label><Slider min={1} max={5} step={1} value={[sleepQ]} onValueChange={(v) => setSleepQ(v[0]!)} /></div>
        </div>
        <div className="flex flex-wrap gap-3">
          {SYMPTOMS.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm"><Checkbox checked={sym.includes(s)} onCheckedChange={(c) => setSym(c ? [...sym, s] : sym.filter((x) => x !== s))} />{s}</label>
          ))}
        </div>
        <Input placeholder="Anything else? (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        <Button onClick={saveCheckin}>Save check-in</Button>
      </div>
    </div>
  );
}
