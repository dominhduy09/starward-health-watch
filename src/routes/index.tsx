import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/astra/Header";
import { VitalCards } from "@/components/astra/VitalCards";
import { TelemetryChart } from "@/components/astra/TelemetryChart";
import { TriagePanel } from "@/components/astra/TriagePanel";
import { SymptomDrawer } from "@/components/astra/SymptomDrawer";
import { CopilotChat, type PendingAsk } from "@/components/astra/CopilotChat";
import { BodyMap } from "@/components/astra/BodyMap";
import { StreakWidget } from "@/components/astra/StreakWidget";
import { DemoVideo } from "@/components/astra/DemoVideo";
import { CommsQueue } from "@/components/astra/CommsQueue";
import { CrewOverview } from "@/components/astra/CrewOverview";
import { CrewReport } from "@/components/astra/CrewReport";
import { useTour } from "@/components/astra/useTour";
import { WelcomeCard } from "@/components/astra/WelcomeCard";
import { play, readSoundPref, setSoundEnabled, writeSoundPref } from "@/lib/sound";
import { toast } from "sonner";
import { type Point, CREW, SCENARIOS, jitter, rng, series, vitalsFor, type CrewId, type ScenarioId } from "@/lib/telemetry";
import { environmentFor, type EnvironmentId } from "@/lib/environment";
import { triage, type SymptomLog } from "@/lib/triage";
import type { SystemId } from "@/lib/systems";
import { advanceStreak, computeAdherence, loadStreak, saveStreak, seedStreak, type StreakState } from "@/lib/adherence";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASTRA-MED — Deep Space Crew Health Telemetry" },
      { name: "description", content: "Simulation-only astronaut health dashboard with fictional telemetry, educational body-map exams and an unvalidated AI copilot. Not for clinical use." },
      { property: "og:title", content: "ASTRA-MED — Deep Space Crew Health Telemetry" },
      { property: "og:description", content: "Simulation-only astronaut health dashboard with fictional telemetry, educational body-map exams and an unvalidated AI copilot. Not for clinical use." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [crewId, setCrewId] = useState<CrewId>("vance");
  const [scenario, setScenario] = useState<ScenarioId>("nominal");
  const [env, setEnv] = useState<EnvironmentId>("transit");
  const [live, setLive] = useState(true);
  const [range, setRange] = useState<"24h" | "30d">("24h");
  const [tick, setTick] = useState(0);
  const [logs, setLogs] = useState<Record<CrewId, SymptomLog[]>>({ vance: [], chen: [], sato: [] });
  const [pending, setPending] = useState<PendingAsk | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<SystemId | null>(null);
  const [streak, setStreak] = useState<StreakState>(seedStreak);
  const [hydrated, setHydrated] = useState(false);

  const [sound, setSound] = useState(true);
  useEffect(() => { const on = readSoundPref(localStorage); setSound(on); setSoundEnabled(on); }, []);
  const toggleSound = () => { const on = !sound; setSound(on); setSoundEnabled(on); writeSoundPref(localStorage, on); if (on) play("blip"); };
  const pick = <T,>(fn: (x: T) => void) => (x: T) => { play("blip"); fn(x); };
  const tour = useTour({ setScenario, setEnv, setCrewId, setFocus, setPending });
  const startTour = () => { if (!tour.active && !sound) toggleSound(); tour.toggle(); };
  const crew = CREW.find((c) => c.id === crewId)!;
  const environment = environmentFor(env);
  useEffect(() => { setDone(new Set()); }, [crewId, scenario]);
  // Symptom logs describe a moment in time; a new scenario starts a fresh assessment.
  useEffect(() => { setLogs({ vance: [], chen: [], sato: [] }); }, [scenario]);
  useEffect(() => { setStreak(loadStreak()); setHydrated(true); }, []);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setTick((n) => n + 1), 2000);
    return () => clearInterval(t);
  }, [live]);

  const base = useMemo(() => vitalsFor(crew, scenario, env), [crew, scenario, env]);
  const v = useMemo(() => (tick ? jitter(base, rng(tick * 31 + 7)) : base), [base, tick]);
  const data = useMemo(() => {
    const s = series(crew, scenario, range, 1, env);
    if (!tick || range === "30d") return s;
    const out: Point[] = [...s.slice(0, -1), { ...s[s.length - 1]!, hr: v.hr, hrv: v.hrv, spo2: v.spo2, temp: v.temp, sys: v.systolic, dia: v.diastolic, glucose: v.glucose }];
    return out;
  }, [crew, scenario, range, tick, v, env]);

  const latestLog = logs[crewId][0] ?? null;
  const t = useMemo(() => triage(v, latestLog, environment), [v, latestLog, environment]);
  const note = `${SCENARIOS.find((s) => s.id === scenario)!.short} · ${environment.short}`;

  const completed = t.actions.filter((a) => done.has(a.id)).length;
  const aredDone = done.has("bone-1") || done.has("nom-1");
  const a = useMemo(() => computeAdherence({
    v, risks: t.risks, log: latestLog, aredDone, completed, total: t.actions.length, streak: streak.streak,
  }), [v, t.risks, latestLog, aredDone, completed, t.actions.length, streak.streak]);

  // Friendly feedback: status sounds and badge celebrations.
  const prevLevel = useRef(t.level);
  useEffect(() => {
    if (prevLevel.current === t.level) return;
    prevLevel.current = t.level;
    play(t.level === "NOMINAL" ? "nominal" : t.level === "CAUTION" ? "caution" : "critical");
  }, [t.level]);
  const prevBadges = useRef<Set<string> | null>(null);
  useEffect(() => {
    const now = new Set(a.badges.filter((b) => b.unlocked).map((b) => b.id));
    const prev = prevBadges.current; prevBadges.current = now;
    if (!prev || !hydrated) return;
    const fresh = a.badges.filter((b) => now.has(b.id) && !prev.has(b.id));
    if (fresh.length) { play("badge"); fresh.forEach((b) => toast.success(`Badge unlocked: ${b.label} 🎉`, { description: "Great job — keep it up!" })); }
  }, [a.badges, hydrated]);

  // A day only banks once the adherence score clears the flight-rule threshold.
  const today = new Date().toISOString().slice(0, 10);
  useEffect(() => {
    if (!hydrated) return;
    const next = advanceStreak(streak, today, a.score >= 70);
    if (next !== streak) { setStreak(next); saveStreak(next); }
  }, [hydrated, streak, today, a.score]);

  return (
    <div className="min-h-screen space-bg">
      <main className="print:hidden mx-auto max-w-[1600px] p-3 md:p-6 space-y-4">
        <Header crew={crewId} onCrew={pick(setCrewId)} scenario={scenario} onScenario={pick(setScenario)}
          env={env} onEnv={pick(setEnv)} live={live} onLive={setLive}
          touring={tour.active} onTour={startTour} sound={sound} onSound={toggleSound} onReport={() => window.print()} />
        <WelcomeCard onTour={startTour} />
        {tour.caption && (
          <div role="status" className="glass border-primary/60 p-4 text-sm"><span className="readout mr-2 text-primary">TOUR {tour.step}/5</span>{tour.caption}</div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 min-w-0 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
              <h2 className="text-sm font-semibold">{crew.name} <span className="text-muted-foreground font-normal">· {crew.role}</span></h2>
              <p className="w-full text-xs text-muted-foreground">These cards show how {crew.name.split(" ").pop()}'s body is doing right now. Green is good, amber means watch, red means act.</p>
              <span className="readout text-[10px] text-caution">SIMULATION ONLY · {live ? "STREAMING · 0.5 Hz" : "PAUSED"}</span>
            </div>
            <VitalCards v={v} crew={crew} data={data} score={t.score} focus={focus} />
            <BodyMap v={v} crew={crew} risks={t.risks} selected={focus} onSelect={setFocus} onAsk={(prompt) => setPending({ prompt })} />
            <TelemetryChart data={data} range={range} onRange={setRange} />
          </div>
          <div className="min-w-0 space-y-4">
            <CrewOverview scenario={scenario} env={env} selected={crewId} onSelect={setCrewId} />
            <StreakWidget a={a} streak={streak.streak} best={streak.best} />
            <SymptomDrawer history={logs[crewId]} onSubmit={(l) => setLogs((p) => ({ ...p, [crewId]: [l, ...p[crewId]] }))}
              onAsk={(prompt, scan) => setPending({ prompt, scan })} />
            <TriagePanel level={t.level} risks={t.risks} actions={t.actions} done={done} scenarioNote={note}
              hazards={t.hazards} envName={environment.label}
              onToggle={(id) => { play("tick"); if (!done.has(id) && completed + 1 === t.actions.length) toast.success("All review steps done — nice work! ✅"); setDone((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }}>
              <CopilotChat pending={pending} onPendingDone={() => setPending(null)} context={{
                crew: crew.name, role: crew.role, scenario: SCENARIOS.find((s) => s.id === scenario)!.label, status: t.level,
                environment: `${environment.label} (${environment.gravity}, comms ${environment.comms})`,
                vitals: {
                  hr: v.hr, hrv: v.hrv, spo2: v.spo2, temp: v.temp, radiation: v.radiation, missionLimit: crew.missionLimit,
                  bone: v.bone, readiness: t.score, sleepHours: v.sleepHours, stress: Math.round(v.stress), hydration: Math.round(v.hydration),
                  systolic: v.systolic, diastolic: v.diastolic, glucose: v.glucose, ossd: v.ossd, ared: v.ared, viral: v.viral,
                },
                risks: t.risks.map((r) => r.title),
              }} />
            </TriagePanel>
            <CommsQueue comms={environment.comms} envName={environment.label}
              summary={`${crew.name}: ${t.level}, readiness ${t.score}${t.risks.length ? ` · ${t.risks.map((r) => r.title).join(", ")}` : ""}`} />
          </div>
        </div>
        <DemoVideo />
      </main>
      <CrewReport crew={crew} v={v} level={t.level} score={t.score} risks={t.risks} actions={t.actions} done={done}
        hazards={t.hazards} logs={logs[crewId]} scenario={SCENARIOS.find((s) => s.id === scenario)!.label} envName={environment.label} />
    </div>
  );
}
