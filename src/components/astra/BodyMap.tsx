import { useState } from "react";
import { ChevronRight, Info, Stethoscope } from "lucide-react";
import type { Crew, Vitals } from "@/lib/telemetry";
import type { Risk, Severity } from "@/lib/triage";
import { SYSTEMS, type SystemId } from "@/lib/systems";
import { sevBadge, sevStroke, sevText } from "./status";
import { cn } from "@/lib/utils";

interface Props {
  v: Vitals;
  crew: Crew;
  risks: Risk[];
  selected: SystemId | null;
  onSelect: (s: SystemId | null) => void;
  onAsk: (prompt: string) => void;
}

/** Hotspot anchor for each physiological system on the suit silhouette. */
const HOTSPOTS: { id: SystemId; cx: number; cy: number; r: number }[] = [
  { id: "neuro", cx: 110, cy: 52, r: 16 },
  { id: "cardio", cx: 110, cy: 118, r: 15 },
  { id: "immune", cx: 110, cy: 158, r: 14 },
  { id: "radiation", cx: 61, cy: 120, r: 14 },
  { id: "skeletal", cx: 96, cy: 238, r: 15 },
];

const worst = (rs: Risk[]): Severity =>
  rs.some((r) => r.severity === "critical") ? "critical" : rs.some((r) => r.severity === "caution") ? "caution" : "nominal";

export function BodyMap({ v, crew, risks, selected, onSelect, onAsk }: Props) {
  const [hover, setHover] = useState<SystemId | null>(null);
  const active = selected ?? hover;
  const def = active ? SYSTEMS.find((s) => s.id === active)! : null;
  const sysRisks = def ? risks.filter((r) => r.system === def.id) : [];
  const sev = (id: SystemId) => worst(risks.filter((r) => r.system === id));

  const ask = () => {
    if (!def) return;
    const m = def.metrics(v, crew).map((x) => `${x.label} ${x.value}${x.unit ? ` ${x.unit}` : ""}`).join(", ");
    onAsk(`Focus my ${def.name} exam. My readings: ${m}. What do these mean, how do I self-measure them properly, and what should I do?`);
  };

  return (
    <div className="glass p-4 md:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Interactive Body Telemetry Map</h2>
          <p className="text-xs text-muted-foreground">Tap a glowing region for why the exam matters and how to run it yourself</p>
        </div>
        {selected && (
          <button onClick={() => onSelect(null)} className="readout shrink-0 rounded border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
            Show all
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[190px_1fr]">
        <svg viewBox="0 0 220 312" role="group" aria-label="Astronaut body map with five clickable physiological systems"
          className="mx-auto h-[260px] w-auto max-w-full sm:h-[300px]">
          {/* suit silhouette */}
          <g fill="oklch(0.27 0.035 260 / 0.8)" stroke="var(--color-border)" strokeWidth={1.5}>
            <ellipse cx={110} cy={52} rx={34} ry={32} />
            <rect x={70} y={82} width={80} height={13} rx={6} />
            <rect x={80} y={92} width={60} height={88} rx={18} />
            <rect x={52} y={94} width={18} height={74} rx={9} />
            <rect x={150} y={94} width={18} height={74} rx={9} />
            <circle cx={61} cy={176} r={9} />
            <circle cx={159} cy={176} r={9} />
            <rect x={84} y={176} width={24} height={112} rx={12} />
            <rect x={112} y={176} width={24} height={112} rx={12} />
            <rect x={78} y={284} width={32} height={16} rx={6} />
            <rect x={110} y={284} width={32} height={16} rx={6} />
          </g>
          <path d="M84 40a26 22 0 0152 0v10a26 14 0 01-52 0z" fill="oklch(0.715 0.143 215 / 0.16)" stroke="var(--color-primary)" strokeWidth={1.2} />
          <g stroke="var(--color-border)" strokeWidth={1.1} fill="none">
            <path d="M92 112h36M92 128h36M100 144h20" />
            <rect x={96} y={164} width={28} height={10} rx={3} />
          </g>

          {HOTSPOTS.map((h) => {
            const s = sev(h.id);
            const c = sevStroke[s];
            const on = active === h.id;
            return (
              <g key={h.id} className="cursor-pointer" role="button" tabIndex={0}
                aria-label={`${SYSTEMS.find((x) => x.id === h.id)!.name} — status ${s}`}
                aria-pressed={selected === h.id}
                onClick={() => onSelect(selected === h.id ? null : h.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(selected === h.id ? null : h.id); } }}
                onMouseEnter={() => setHover(h.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(h.id)} onBlur={() => setHover(null)}>
                <circle cx={h.cx} cy={h.cy} r={h.r + 10} fill={c} fillOpacity={on ? 0.22 : 0.09} />
                {on && <circle cx={h.cx} cy={h.cy} r={h.r + 6} fill="none" stroke={c} strokeWidth={1.4} strokeDasharray="4 4" className="hot-dash" />}
                <circle cx={h.cx} cy={h.cy} r={h.r} fill="oklch(0.13 0.02 265 / 0.55)" stroke={c} strokeWidth={on ? 2.6 : 1.6} className={s === "nominal" ? undefined : "live-dot"} />
                <circle cx={h.cx} cy={h.cy} r={3.5} fill={c} />
              </g>
            );
          })}
        </svg>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {SYSTEMS.map((s) => {
              const sv = sev(s.id);
              const on = active === s.id;
              return (
                <button key={s.id} onClick={() => onSelect(selected === s.id ? null : s.id)}
                  className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                    on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                  <span className="size-1.5 rounded-full" style={{ background: sevStroke[sv] }} />
                  {s.region}
                </button>
              );
            })}
          </div>

          {!def && (
            <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
              <Info className="mb-1 size-4" />
              Select a region to read why that exam matters, how to run it with the onboard medical kit, and which vitals it filters.
            </div>
          )}

          {def && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{def.name}</h3>
                <span className={cn("readout rounded border px-1.5 py-0.5 text-[10px] uppercase", sevBadge[sev(def.id)])}>{sev(def.id)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {def.metrics(v, crew).map((m) => (
                  <div key={m.label} className="rounded-md border border-border bg-background/40 p-2">
                    <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                    <div className={cn("readout text-lg font-semibold", sevText[sev(def.id)])}>{m.value}<span className="ml-1 text-[10px] font-normal text-muted-foreground">{m.unit}</span></div>
                  </div>
                ))}
              </div>

              <div>
                <div className="readout mb-1 text-[10px] uppercase tracking-widest text-primary">Why this exam matters</div>
                <p className="text-xs leading-relaxed text-muted-foreground">{def.why}</p>
              </div>

              <div>
                <div className="readout mb-1.5 text-[10px] uppercase tracking-widest text-primary">How to self-measure</div>
                <ol className="space-y-1.5">
                  {def.how.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed">
                      <span className="readout shrink-0 text-primary">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {def.kit.map((k) => <span key={k} className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{k}</span>)}
                </div>
              </div>

              {sysRisks.length > 0 && (
                <ul className="space-y-1.5">
                  {sysRisks.map((r) => (
                    <li key={r.id} className={cn("rounded-md border p-2 text-xs", sevBadge[r.severity])}>
                      <span className="font-medium">{r.title}</span>
                      <p className="mt-0.5 text-muted-foreground">{r.detail}</p>
                    </li>
                  ))}
                </ul>
              )}

              <button onClick={ask} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                <Stethoscope className="size-4" />Ask the Copilot about this system<ChevronRight className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
