import { useEffect, useState } from "react";
import { Activity, Radio, Satellite, Orbit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CREW, SCENARIOS, type CrewId, type ScenarioId } from "@/lib/telemetry";
import { ENVIRONMENTS, environmentFor, type EnvironmentId } from "@/lib/environment";
import { cn } from "@/lib/utils";

function useMet() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return now ? now.toISOString().slice(11, 19) : "--:--:--";
}

interface Props {
  crew: CrewId; onCrew: (c: CrewId) => void;
  scenario: ScenarioId; onScenario: (s: ScenarioId) => void;
  env: EnvironmentId; onEnv: (e: EnvironmentId) => void;
  live: boolean; onLive: (b: boolean) => void;
}

export function Header({ crew, onCrew, scenario, onScenario, env, onEnv, live, onLive }: Props) {
  const met = useMet();
  const e = environmentFor(env);
  return (
    <header className="glass p-4 md:p-5 space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/10"><Activity className="size-5 text-primary" /></div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-semibold tracking-tight">ASTRA-MED <span className="text-primary">//</span> <span className="block sm:inline text-muted-foreground font-normal text-sm sm:text-lg md:text-xl">Deep Space Crew Health Telemetry</span></h1>
            <p className="readout text-xs text-muted-foreground">MET: <span className="text-foreground">Day 142 | {met} UTC</span></p>
            <p className="mt-1 text-xs font-medium text-caution">SIMULATION ONLY · Fictional telemetry and readiness · Not for clinical use</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] md:flex md:flex-wrap md:items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border border-caution/30 sm:col-span-2 md:col-span-1 bg-caution/5 px-3 py-2 text-xs">
            <Satellite className="size-4 shrink-0 text-caution" />
            <span className="readout whitespace-nowrap">Earth Comms Latency: <span className="text-caution">{e.comms}</span></span>
            <span className="whitespace-nowrap text-muted-foreground">— Autonomous Mode Active</span>
          </div>
          <label className="flex min-h-10 items-center justify-between gap-2 rounded-lg border border-border px-3 py-1.5 text-xs">
            <span className="flex items-center gap-2"><Radio className={cn("size-4", live ? "text-nominal live-dot" : "text-muted-foreground")} />Live Stream</span>
            <Switch checked={live} onCheckedChange={onLive} aria-label="Live stream" />
          </label>
          <Select value={crew} onValueChange={(v) => onCrew(v as CrewId)}>
            <SelectTrigger className="w-full md:w-52 min-h-10" aria-label="Crew member"><SelectValue /></SelectTrigger>
            <SelectContent>{CREW.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="-mx-4 px-4 md:mx-0 md:px-0 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="readout flex shrink-0 items-center gap-1.5 mr-1 text-[10px] uppercase tracking-widest text-muted-foreground"><Orbit className="size-3.5" />Mission Environment</span>
          {ENVIRONMENTS.map((x) => (
            <button key={x.id} onClick={() => onEnv(x.id)}
              className={cn("shrink-0 whitespace-nowrap rounded-md border px-3 py-2 text-xs transition-colors",
                env === x.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
              {x.label}
            </button>
          ))}
        </div>
        <p className="readout px-0.5 text-[10px] leading-relaxed text-muted-foreground">
          {e.gravity} · {e.dose} · {e.short}
        </p>
      </div>

      <div className="-mx-4 px-4 md:mx-0 md:px-0 flex items-center gap-2 overflow-x-auto md:flex-wrap pb-1 md:pb-0">
        <span className="readout shrink-0 mr-1 text-[10px] uppercase tracking-widest text-muted-foreground">Scenario Sim</span>
        {SCENARIOS.map((s, i) => (
          <button key={s.id} onClick={() => onScenario(s.id)}
            className={cn("shrink-0 whitespace-nowrap rounded-md border px-3 py-2 text-xs transition-colors",
              scenario === s.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
            <span className="readout opacity-60 mr-1.5">0{i + 1}</span>{s.label}
          </button>
        ))}
      </div>
    </header>
  );
}
