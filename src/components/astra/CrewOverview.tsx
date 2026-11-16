import { Users } from "lucide-react";
import { CREW, vitalsFor, type CrewId, type ScenarioId } from "@/lib/telemetry";
import { environmentFor, type EnvironmentId } from "@/lib/environment";
import { triage } from "@/lib/triage";
import { cn } from "@/lib/utils";

const tone = { NOMINAL: "text-nominal border-nominal/40", CAUTION: "text-caution border-caution/40", CRITICAL: "text-critical border-critical/40" } as const;

export function CrewOverview({ scenario, env, selected, onSelect }: { scenario: ScenarioId; env: EnvironmentId; selected: CrewId; onSelect: (c: CrewId) => void }) {
  const rows = CREW.map((c) => ({ c, t: triage(vitalsFor(c, scenario, env), null, environmentFor(env)) }))
    .sort((a, b) => a.t.score - b.t.score);
  return (
    <div className="glass p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="size-4 text-primary" />Whole-crew overview · lowest readiness first</div>
      {rows.map(({ c, t }) => (
        <button key={c.id} onClick={() => onSelect(c.id)}
          className={cn("flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
            selected === c.id ? "bg-primary/10 border-primary/50" : "border-border hover:bg-muted/40")}>
          <span className="min-w-0 truncate">{c.name}</span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="readout text-xs text-muted-foreground">{t.score}</span>
            <span className={cn("readout rounded border px-1.5 text-[10px]", tone[t.level])}>{t.level}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
