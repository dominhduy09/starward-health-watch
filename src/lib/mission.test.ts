import { describe, expect, it } from "vitest";
import { CREW, SCENARIOS, vitalsFor } from "./telemetry";
import { HAZARDS } from "./hazards";
import { ENVIRONMENTS, environmentFor } from "./environment";
import { SYSTEMS } from "./systems";
import { triage, vitalStatus, type SymptomLog } from "./triage";
import { advanceStreak, computeAdherence } from "./adherence";
import { SAMPLE_SCANS } from "./scans";

const LOG = (o: Partial<SymptomLog> = {}): SymptomLog =>
  ({ id: "1", at: "12:00 UTC", headache: false, dizziness: false, visualFlashes: false, nausea: false, sleepQuality: 8, mood: 8, notes: "", ...o });

describe("NASA brief biometric readouts", () => {
  it("baseline reads blood pressure 118/76 mmHg and blood glucose 94 mg/dL", () => {
    const v = vitalsFor(CREW[0]!, "nominal");
    expect(`${v.systolic}/${v.diastolic}`).toBe("118/76");
    expect(v.glucose).toBe(94);
  });
  it("pressure and glucose outside the flight window raise tagged risks", () => {
    const t = triage({ ...vitalsFor(CREW[0]!, "nominal"), systolic: 152, diastolic: 96, glucose: 168 });
    expect(t.level).toBe("CAUTION");
    expect(t.risks.map((r) => r.id)).toEqual(expect.arrayContaining(["bp", "glucose"]));
  });
  it("a widened optic nerve sheath raises a SANS risk on the neuro-ocular system", () => {
    const t = triage({ ...vitalsFor(CREW[0]!, "nominal"), ossd: 5.4 });
    const r = t.risks.find((x) => x.id === "sans")!;
    expect(r.severity).toBe("caution");
    expect(r.system).toBe("neuro");
    expect(r.hazards).toContain("gravity");
  });
});

describe("HRP five-hazard tagging", () => {
  it("defines the five official hazards in order", () => {
    expect(HAZARDS.map((h) => h.label)).toEqual([
      "Space Radiation", "Altered Gravity Fields", "Isolation & Confinement", "Hostile/Closed Environment", "Distance from Earth",
    ]);
  });
  it("tags every risk raised by any crew member in any scenario", () => {
    for (const crew of CREW) {
      for (const s of SCENARIOS) {
        for (const r of triage(vitalsFor(crew, s.id), null, environmentFor("mars")).risks) {
          expect(r.hazards.length).toBeGreaterThan(0);
          expect(HAZARDS.some((h) => r.hazards.includes(h.id))).toBe(true);
        }
      }
    }
  });
  it("mars surface ops put Distance from Earth and Altered Gravity in play", () => {
    const t = triage(vitalsFor(CREW[0]!, "spe"), null, environmentFor("mars"));
    expect(t.hazards).toEqual(expect.arrayContaining(["distance", "gravity"]));
  });
});

describe("Mission environment selector", () => {
  it("offers the four required environments", () => {
    expect(ENVIRONMENTS.map((e) => e.label)).toEqual([
      "Deep-Space Transit", "ISS / Orbital Station", "Lunar South Pole Base", "Mars Surface Rover",
    ]);
  });
  it("deep-space transit accrues more dose than low Earth orbit", () => {
    const transit = vitalsFor(CREW[0]!, "nominal", "transit");
    const iss = vitalsFor(CREW[0]!, "nominal", "iss");
    expect(transit.doseRate).toBeGreaterThan(iss.doseRate);
    expect(transit.radiation).toBeGreaterThan(iss.radiation);
  });
  it("lunar and mars gravity contexts differ from microgravity", () => {
    expect(environmentFor("lunar").gravity).toBe("0.16 g (lunar)");
    expect(environmentFor("mars").gravity).toBe("0.38 g (Mars)");
    expect(environmentFor("transit").gravity).toBe("0 g (microgravity)");
  });
  it("no environment pushes a nominal crew member out of flight rules", () => {
    for (const e of ENVIRONMENTS) {
      for (const crew of CREW) {
        const v = vitalsFor(crew, "nominal", e.id);
        expect(Object.values(vitalStatus(v)).every((s) => s === "nominal")).toBe(true);
      }
    }
  });
});

describe("Body map systems", () => {
  it("covers the five required physiological systems", () => {
    expect(SYSTEMS.map((s) => s.id).sort()).toEqual(["cardio", "immune", "neuro", "radiation", "skeletal"]);
  });
  it("gives every system a plain-language rationale, self-measure steps, kit and readouts", () => {
    const v = vitalsFor(CREW[0]!, "nominal");
    for (const s of SYSTEMS) {
      expect(s.why.length).toBeGreaterThan(80);
      expect(s.how.length).toBeGreaterThanOrEqual(4);
      expect(s.kit.length).toBeGreaterThan(0);
      expect(s.metrics(v, CREW[0]!).length).toBeGreaterThan(2);
    }
  });
});

describe("Crew readiness streak & adherence", () => {
  it("banks a day only once and only above the adherence threshold", () => {
    const s0 = { day: "2026-11-11", streak: 17, best: 17 };
    expect(advanceStreak(s0, "2026-11-12", false)).toBe(s0);
    const s1 = advanceStreak(s0, "2026-11-12", true);
    expect(s1.streak).toBe(18);
    expect(advanceStreak(s1, "2026-11-12", true)).toBe(s1);
    expect(advanceStreak({ day: "2026-11-05", streak: 12, best: 12 }, "2026-11-12", true).streak).toBe(1);
  });
  it("ticks and a filed assessment lift the score and unlock badges", () => {
    const v = vitalsFor(CREW[0]!, "nominal", "iss");
    const t = triage(v, null, environmentFor("iss"));
    const before = computeAdherence({ v, risks: t.risks, log: null, aredDone: false, completed: 0, total: t.actions.length, streak: 17 });
    expect(before.score).toBeLessThan(70);
    expect(before.badges.find((b) => b.id === "ared")!.unlocked).toBe(false);
    const after = computeAdherence({ v, risks: t.risks, log: LOG(), aredDone: true, completed: t.actions.length, total: t.actions.length, streak: 17 });
    expect(after.score).toBeGreaterThanOrEqual(70);
    expect(after.badges.filter((b) => b.unlocked).map((b) => b.id))
      .toEqual(expect.arrayContaining(["ared", "assess", "protocol", "radiation", "circadian", "streak7"]));
  });
  it("locks Radiation Ready during a solar particle event", () => {
    const v = vitalsFor(CREW[0]!, "spe");
    const t = triage(v);
    const a = computeAdherence({ v, risks: t.risks, log: null, aredDone: true, completed: 0, total: t.actions.length, streak: 20 });
    expect(a.badges.find((b) => b.id === "radiation")!.unlocked).toBe(false);
  });
});

describe("Diagnostic scan input", () => {
  it("ships the ocular ultrasound and dermal rash samples with copilot prompts", () => {
    expect(SAMPLE_SCANS.map((s) => s.id)).toEqual(["ocular", "rash"]);
    expect(SAMPLE_SCANS[0]?.prompt).not.toMatch(/5\.4 mm/);
    expect(SAMPLE_SCANS[1]!.prompt).toMatch(/shingles/i);
  });
  it("a filed scan raises a copilot follow-up risk mapped to the right system", () => {
    const t = triage(vitalsFor(CREW[0]!, "nominal"), LOG({ scan: { label: "Ocular Ultrasound Scan (onboard sample)", dataUrl: "data:image/jpeg;base64,AA" } }));
    const r = t.risks.find((x) => x.id === "sym-scan")!;
    expect(r.system).toBe("neuro");
    expect(t.level).toBe("CAUTION");
  });
  it("a dermal photo routes to the immune system", () => {
    const t = triage(vitalsFor(CREW[0]!, "nominal"), LOG({ scan: { label: "Dermal Microgravity Rash Photo (onboard sample)", dataUrl: "data:image/jpeg;base64,AA" } }));
    expect(t.risks.find((x) => x.id === "sym-scan")!.system).toBe("immune");
  });
});
