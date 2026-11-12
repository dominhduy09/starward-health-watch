import type { Vitals } from "./telemetry";
import type { Risk, SymptomLog } from "./triage";

const KEY = "astra-med-adherence-v1";

export interface StreakState {
  /** Last day the streak was advanced (YYYY-MM-DD). */
  day: string;
  streak: number;
  best: number;
}

/** Simulated mission history: the crew arrives with 17 days already banked. */
const seedStreak = (): StreakState => ({ day: yesterdayOf(new Date().toISOString().slice(0, 10)), streak: 17, best: 17 });
export { seedStreak };

export function loadStreak(): StreakState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedStreak();
    const s = JSON.parse(raw) as StreakState;
    if (typeof s?.streak !== "number" || typeof s?.day !== "string") return seedStreak();
    return { day: s.day, streak: Math.max(0, Math.round(s.streak)), best: Math.max(s.streak, s.best ?? s.streak) };
  } catch { return seedStreak(); }
}

export function saveStreak(s: StreakState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}

const yesterdayOf = (day: string) => new Date(Date.parse(day) - 86400000).toISOString().slice(0, 10);

/**
 * A day only counts once, and only while the adherence score stays above the
 * flight-rule threshold. Missing a day resets the chain.
 */
export function advanceStreak(s: StreakState, today: string, qualified: boolean): StreakState {
  if (s.day === today || !qualified) return s;
  const next = s.day === yesterdayOf(today) ? s.streak + 1 : 1;
  return { day: today, streak: next, best: Math.max(s.best, next) };
}

export interface AdherenceInput {
  v: Vitals;
  risks: Risk[];
  log: SymptomLog | null;
  /** ARED / countermeasure exercise step ticked in the triage checklist. */
  aredDone: boolean;
  completed: number;
  total: number;
  streak: number;
}

export interface Badge { id: string; label: string; desc: string; unlocked: boolean; }

export interface Adherence {
  score: number;
  progress: { hydration: number; exercise: number; assessed: number; protocol: number };
  badges: Badge[];
}

export function computeAdherence({ v, risks, log, aredDone, completed, total, streak }: AdherenceInput): Adherence {
  const progress = {
    hydration: Math.max(0, Math.min(1, v.hydration / 100)),
    exercise: aredDone ? 1 : 0,
    assessed: log ? 1 : 0,
    protocol: total ? completed / total : 0,
  };
  const score = Math.round(
    100 * (progress.hydration * 0.3 + progress.exercise * 0.25 + progress.assessed * 0.2 + progress.protocol * 0.25),
  );

  const radiationClear = !risks.some((r) => r.system === "radiation");
  const sleepOk = v.sleepHours >= 7 && !risks.some((r) => r.id === "circ") && (!log || log.sleepQuality >= 7);

  const badges: Badge[] = [
    { id: "hydration", label: "Hydration Hero", desc: "Fluid intake at 95%+ of target", unlocked: v.hydration >= 95 },
    { id: "ared", label: "Bone Guardian", desc: "ARED resistive session completed", unlocked: aredDone },
    { id: "radiation", label: "Radiation Ready", desc: "No active radiation risk", unlocked: radiationClear },
    { id: "circadian", label: "Circadian Master", desc: "7 h+ sleep, no circadian risk", unlocked: sleepOk },
    { id: "assess", label: "Self-Check Filed", desc: "Daily self-assessment logged", unlocked: !!log },
    { id: "protocol", label: "Protocol Disciplined", desc: "Every intervention step closed", unlocked: total > 0 && completed === total },
    { id: "streak7", label: "7-Day Streak", desc: "A full week of countermeasures", unlocked: streak >= 7 },
    { id: "streak18", label: "18-Day Streak", desc: "Mission-long adherence chain", unlocked: streak >= 18 },
  ];

  return { score, progress, badges };
}
