import { describe, expect, it } from "vitest";
import { triage, readinessScore } from "./triage";
import { CREW, vitalsFor } from "./telemetry";

const v = vitalsFor(CREW[0], "nominal");
describe("triage", () => {
  it("nominal scenario is NOMINAL", () => expect(triage(v).level).toBe("NOMINAL"));
  it("SpO2 below 92 is CRITICAL", () => expect(triage({ ...v, spo2: 91 }).level).toBe("CRITICAL"));
  it("EVA strain raises a caution or worse", () => expect(triage(vitalsFor(CREW[0], "eva")).level).not.toBe("NOMINAL"));
  it("symptoms lower readiness score", () => {
    const log = { id: "1", at: "", headache: true, dizziness: true, visualFlashes: false, nausea: false, sleepQuality: 3, mood: 3, notes: "" };
    expect(readinessScore(v, log)).toBe(v.cognitive - 6 - 9 - 6 - 6);
  });
});
