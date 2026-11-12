import { useEffect, useState } from "react";
import { Activity, Radio, Satellite } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CREW, SCENARIOS, type CrewId, type ScenarioId } from "@/lib/telemetry";
import { cn } from "@/lib/utils";

function useMet() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return now ? now.toISOString().slice(11, 19) : "--:--:--";
}

interface Props {
  crew: CrewId; onCrew: (c: CrewId) => void;
  scenario: ScenarioId; onScenario: (s: ScenarioId) => void;
  live: boolean; onLive: (b: boolean) => void;
}

export function Header({ crew, onCrew, scenario, onScenario, live, onLive }: Props) {
  const met = useMet();
  return (
    <header className="glass p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg border border-primary/40 bg-primary/10"><Activity className="size-5 text-primary" /></div>
          <div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight">ASTRA-MED <span className="text-primary">//</span> <span className="text-muted-foreground font-normal">Deep Space Crew Health Telemetry</span></h1>
            <p className="readout text-xs text-muted-foreground">MET: <span className="text-foreground">Day 142 | {met} UTC</span></p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-caution/30 bg-caution/5 px-3 py-2 text-xs">
            <Satellite className="size-4 text-caution" />
            <span className="readout">Earth Comms Latency: <span className="text-caution">14m 20s</span></span>
            <span className="hidden lg:inline text-muted-foreground">— Autonomous Mode Active</span>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs">
            <Radio className={cn("size-4", live ? "text-nominal live-dot" : "text-muted-foreground")} />
            Live Stream
            <Switch checked={live} onCheckedChange={onLive} aria-label="Live stream" />
          </label>
          <Select value={crew} onValueChange={(v) => onCrew(v as CrewId)}>
            <SelectTrigger className="w-52" aria-label="Crew member"><SelectValue /></SelectTrigger>
            <SelectContent>{CREW.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="readout mr-1 text-[10px] uppercase tracking-widest text-muted-foreground">Scenario Sim</span>
        {SCENARIOS.map((s, i) => (
          <button key={s.id} onClick={() => onScenario(s.id)}
            className={cn("rounded-md border px-3 py-1.5 text-xs transition-colors",
              scenario === s.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
            <span className="readout opacity-60 mr-1.5">0{i + 1}</span>{s.label}
          </button>
        ))}
      </div>
    </header>
  );
}
