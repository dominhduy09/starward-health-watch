export type ScenarioId = "nominal" | "spe" | "eva" | "circadian";
export type CrewId = "vance" | "chen" | "sato";

export interface Vitals {
  hr: number; hrv: number; spo2: number; temp: number;
  radiation: number; // cumulative mSv
  bone: number; // % change since launch
  cognitive: number; // 0-100
  sleepHours: number; remPct: number; stress: number; // 0-100
  hydration: number; // % of target
}

export interface Crew {
  id: CrewId; name: string; role: string;
  baseline: Vitals; missionLimit: number; careerLimit: number;
}

const base = (o: Partial<Vitals>): Vitals => ({
  hr: 64, hrv: 62, spo2: 98, temp: 36.8, radiation: 68, bone: -1.9, cognitive: 88,
  sleepHours: 7.1, remPct: 22, stress: 28, hydration: 96, ...o,
});

export const CREW: Crew[] = [
  { id: "vance", name: "Cmdr. Elena Vance", role: "Mission Commander", baseline: base({}), missionLimit: 300, careerLimit: 600 },
  { id: "chen", name: "Dr. Marcus Chen", role: "Flight Surgeon", baseline: base({ hr: 60, hrv: 70, radiation: 54, bone: -1.4, cognitive: 91 }), missionLimit: 300, careerLimit: 600 },
  { id: "sato", name: "Spec. Kenji Sato", role: "Mission Specialist / EVA", baseline: base({ hr: 67, hrv: 55, radiation: 81, bone: -2.6, cognitive: 85 }), missionLimit: 300, careerLimit: 600 },
];

export interface Scenario { id: ScenarioId; label: string; short: string; delta: Partial<Vitals>; }

export const SCENARIOS: Scenario[] = [
  { id: "nominal", label: "Nominal Orbit", short: "All systems nominal", delta: {} },
  { id: "spe", label: "Solar Particle Event", short: "SPE in progress — proton flux elevated",
    delta: { hr: 24, hrv: -18, radiation: 46, cognitive: -18, stress: 30, sleepHours: -1.5, spo2: -1 } },
  { id: "eva", label: "Extended EVA Strain", short: "Post-EVA (7h 42m) recovery",
    delta: { hr: 38, hrv: -32, temp: 1.6, hydration: -19, spo2: -3, cognitive: -14, stress: 22 } },
  { id: "circadian", label: "Circadian & Isolation Stress", short: "Week 3 of shifted sleep schedule",
    delta: { hr: 10, hrv: -20, stress: 46, sleepHours: -2.9, remPct: -11, cognitive: -33, bone: -0.4 } },
];

export function vitalsFor(crew: Crew, scenario: ScenarioId): Vitals {
  const d = SCENARIOS.find((s) => s.id === scenario)!.delta;
  const out = { ...crew.baseline };
  (Object.keys(d) as (keyof Vitals)[]).forEach((k) => { out[k] = +(out[k] + (d[k] ?? 0)).toFixed(2); });
  return out;
}

// deterministic pseudo-random
export function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function jitter(v: Vitals, r: () => number): Vitals {
  const j = (x: number, amp: number) => x + (r() - 0.5) * 2 * amp;
  return {
    ...v,
    hr: Math.round(j(v.hr, 2)), hrv: Math.round(j(v.hrv, 2)),
    spo2: Math.min(100, Math.round(j(v.spo2, 0.6))), temp: +j(v.temp, 0.05).toFixed(1),
    radiation: +(v.radiation + r() * 0.02).toFixed(2),
  };
}

export interface Point { t: string; hr: number; hrv: number; spo2: number; temp: number; radiation: number; dose: number; sleep: number; rem: number; stress: number; }

export function series(crew: Crew, scenario: ScenarioId, range: "24h" | "30d", seed = 1): Point[] {
  const target = vitalsFor(crew, scenario);
  const b = crew.baseline;
  const r = rng(seed * 97 + crew.id.length * 13 + scenario.length * 7 + (range === "24h" ? 1 : 2));
  const n = range === "24h" ? 48 : 30;
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    // anomaly ramps in over the last third
    const a = Math.max(0, (f - 0.66) / 0.34);
    const mix = (k: keyof Vitals) => b[k] + (target[k] - b[k]) * a;
    const circ = range === "24h" ? Math.sin((i / n) * Math.PI * 2) : 0;
    const noise = () => (r() - 0.5);
    pts.push({
      t: range === "24h" ? `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}` : `D${113 + i}`,
      hr: Math.round(mix("hr") + circ * 5 + noise() * 4),
      hrv: Math.round(mix("hrv") - circ * 4 + noise() * 5),
      spo2: +(mix("spo2") + noise() * 0.8).toFixed(1),
      temp: +(mix("temp") + circ * 0.15 + noise() * 0.1).toFixed(2),
      radiation: +(b.radiation - (range === "30d" ? (1 - f) * 15 : (1 - f) * 0.6) + (target.radiation - b.radiation) * a).toFixed(2),
      dose: +(0.45 + noise() * 0.1 + (scenario === "spe" ? a * 9 : 0)).toFixed(2),
      sleep: +(mix("sleepHours") + noise() * 0.6).toFixed(1),
      rem: Math.round(mix("remPct") + noise() * 3),
      stress: Math.round(mix("stress") + noise() * 6),
    });
  }
  return pts;
}
