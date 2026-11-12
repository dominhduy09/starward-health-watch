import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/astra/Header";
import { VitalCards } from "@/components/astra/VitalCards";
import { TelemetryChart } from "@/components/astra/TelemetryChart";
import { TriagePanel } from "@/components/astra/TriagePanel";
import { SymptomDrawer } from "@/components/astra/SymptomDrawer";
import { type Point, CREW, SCENARIOS, jitter, rng, series, vitalsFor, type CrewId, type ScenarioId } from "@/lib/telemetry";
import { triage, type SymptomLog } from "@/lib/triage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASTRA-MED — Deep Space Crew Health Telemetry" },
      { name: "description", content: "Real-time astronaut biometric monitoring and autonomous medical triage for deep space missions." },
      { property: "og:title", content: "ASTRA-MED — Deep Space Crew Health Telemetry" },
      { property: "og:description", content: "Real-time astronaut biometric monitoring and autonomous medical triage for deep space missions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [crewId, setCrewId] = useState<CrewId>("vance");
  const [scenario, setScenario] = useState<ScenarioId>("nominal");
  const [live, setLive] = useState(true);
  const [range, setRange] = useState<"24h" | "30d">("24h");
  const [tick, setTick] = useState(0);
  const [logs, setLogs] = useState<Record<CrewId, SymptomLog[]>>({ vance: [], chen: [], sato: [] });
  const [done, setDone] = useState<Set<string>>(new Set());

  const crew = CREW.find((c) => c.id === crewId)!;
  useEffect(() => { setDone(new Set()); }, [crewId, scenario]);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setTick((n) => n + 1), 2000);
    return () => clearInterval(t);
  }, [live]);

  const base = useMemo(() => vitalsFor(crew, scenario), [crew, scenario]);
  const v = useMemo(() => (tick ? jitter(base, rng(tick * 31 + 7)) : base), [base, tick]);
  const data = useMemo(() => {
    const s = series(crew, scenario, range);
    if (!tick || range === "30d") return s;
    const out: Point[] = [...s.slice(0, -1), { ...s[s.length - 1]!, hr: v.hr, hrv: v.hrv, spo2: v.spo2, temp: v.temp }];
    return out;
  }, [crew, scenario, range, tick, v]);

  const latestLog = logs[crewId][0] ?? null;
  const t = useMemo(() => triage(v, latestLog), [v, latestLog]);
  const note = SCENARIOS.find((s) => s.id === scenario)!.short;

  return (
    <div className="min-h-screen space-bg">
      <main className="mx-auto max-w-[1600px] p-3 md:p-6 space-y-4">
        <Header crew={crewId} onCrew={setCrewId} scenario={scenario} onScenario={setScenario} live={live} onLive={setLive} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-sm font-semibold">{crew.name} <span className="text-muted-foreground font-normal">· {crew.role}</span></h2>
              <span className="readout text-[10px] text-muted-foreground">{live ? "STREAMING · 0.5 Hz" : "PAUSED"}</span>
            </div>
            <VitalCards v={v} crew={crew} data={data} score={t.score} />
            <TelemetryChart data={data} range={range} onRange={setRange} />
          </div>
          <div className="space-y-4">
            <SymptomDrawer history={logs[crewId]} onSubmit={(l) => setLogs((p) => ({ ...p, [crewId]: [l, ...p[crewId]] }))} />
            <TriagePanel level={t.level} risks={t.risks} actions={t.actions} done={done} scenarioNote={note}
              onToggle={(id) => setDone((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; })} />
          </div>
        </div>
      </main>
    </div>
  );
}
