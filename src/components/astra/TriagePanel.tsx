import { AlertTriangle, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Action, Level, Risk } from "@/lib/triage";
import { sevBadge, sevText } from "./status";
import { cn } from "@/lib/utils";

const levelSev = { NOMINAL: "nominal", CAUTION: "caution", CRITICAL: "critical" } as const;

export function TriagePanel({ level, risks, actions, done, onToggle, scenarioNote, children }: { level: Level; risks: Risk[]; actions: Action[]; done: Set<string>; onToggle: (id: string) => void; scenarioNote: string; children?: React.ReactNode }) {
  const sev = levelSev[level];
  const Icon = level === "NOMINAL" ? CheckCircle2 : level === "CAUTION" ? AlertTriangle : ShieldAlert;
  const completed = actions.filter((a) => done.has(a.id)).length;
  return (
    <div className="glass p-4 md:p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Cpu className="size-4 text-primary" />Autonomous Triage Copilot</div>
      <div className={cn("rounded-lg border p-4", sevBadge[sev], level === "CRITICAL" && "animate-pulse")}>
        <div className="readout text-[10px] uppercase tracking-widest opacity-80">Crew Health Status</div>
        <div className="flex items-center gap-2 mt-1"><Icon className="size-6" /><span className="readout text-2xl font-bold">{level}</span></div>
        <div className="text-xs mt-1 text-muted-foreground">{scenarioNote}</div>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Detected Physiological Risks</h3>
        {risks.length === 0 ? <p className="text-sm text-muted-foreground">No anomalies detected. All biometrics within flight rules.</p> :
          <ul className="space-y-2">{risks.map((r) => (
            <li key={r.id} className="rounded-md border border-border bg-background/40 p-3">
              <div className={cn("text-sm font-medium flex items-center gap-2", sevText[r.severity])}><span className="size-1.5 rounded-full bg-current" />{r.title}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.detail}</p>
            </li>))}</ul>}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Intervention Protocol</h3>
          <span className="readout text-xs text-primary">{completed}/{actions.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted mb-3 overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${actions.length ? (completed / actions.length) * 100 : 0}%` }} /></div>
        <ul className="space-y-1.5">{actions.map((a) => (
          <li key={a.id}>
            <label className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/40 cursor-pointer">
              <Checkbox checked={done.has(a.id)} onCheckedChange={() => onToggle(a.id)} className="mt-0.5" />
              <span className={cn("text-sm flex-1", done.has(a.id) && "line-through text-muted-foreground")}>{a.text}</span>
              <span className={cn("readout text-[9px] uppercase rounded border px-1", sevBadge[a.priority])}>{a.priority === "critical" ? "P1" : a.priority === "caution" ? "P2" : "P3"}</span>
            </label>
          </li>))}</ul>
      </div>
      {children}
    </div>
  );
}
