import { Flame, Droplets, Dumbbell, ClipboardCheck, ListChecks, Lock, Award } from "lucide-react";
import type { Adherence } from "@/lib/adherence";
import { cn } from "@/lib/utils";

const tone = (p: number) => (p >= 0.99 ? "bg-nominal" : p >= 0.5 ? "bg-caution" : "bg-critical");

function Bar({ icon: Icon, label, value, text }: { icon: typeof Droplets; label: string; value: number; text: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="flex items-center gap-1.5 text-muted-foreground"><Icon className="size-3.5" />{label}</span>
        <span className="readout text-foreground">{text}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-500", tone(value))} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

export function StreakWidget({ a, streak, best }: { a: Adherence; streak: number; best: number }) {
  const unlocked = a.badges.filter((b) => b.unlocked);
  return (
    <div className="glass p-4 space-y-3">
      <p className="text-[11px] font-medium text-caution">SIMULATION ONLY · Demo readiness, streaks and badges</p>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-caution/40 bg-caution/10">
            <Flame className="size-5 text-caution" />
          </div>
          <div className="min-w-0">
            <div className="readout text-2xl font-bold leading-none text-caution">{streak}-Day</div>
            <div className="text-[11px] text-muted-foreground">Demo Streak · best {best}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("readout text-2xl font-bold leading-none", a.score >= 70 ? "text-nominal" : a.score >= 40 ? "text-caution" : "text-critical")}>{a.score}</div>
          <div className="text-[11px] text-muted-foreground">Adherence</div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">Includes seeded fictional history; ticks are practice logs, not medical clearance or verified treatment.</p>

      <div className="space-y-2">
        <Bar icon={Droplets} label="Hydration" value={a.progress.hydration} text={`${Math.round(a.progress.hydration * 100)}%`} />
        <Bar icon={Dumbbell} label="ARED exercise" value={a.progress.exercise} text={a.progress.exercise ? "Logged" : "Pending"} />
        <Bar icon={ClipboardCheck} label="Self-assessment" value={a.progress.assessed} text={a.progress.assessed ? "Filed" : "Pending"} />
        <Bar icon={ListChecks} label="Protocol steps" value={a.progress.protocol} text={`${Math.round(a.progress.protocol * 100)}%`} />
      </div>

      <div>
        <div className="readout mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Award className="size-3.5" />Mission badges · {unlocked.length}/{a.badges.length}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {a.badges.map((b) => (
            <span key={b.id} title={b.desc}
              className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition-colors",
                b.unlocked ? "border-nominal/40 bg-nominal/10 text-nominal" : "border-border bg-background/40 text-muted-foreground/70")}>
              {b.unlocked ? <Award className="size-3" /> : <Lock className="size-3" />}{b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
