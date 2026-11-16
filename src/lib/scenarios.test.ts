import { describe, expect, it } from "vitest";
import { triage, vitalStatus } from "./triage";
import { CREW, vitalsFor } from "./telemetry";

describe.each(CREW.map((c) => [c.name, c] as const))("%s", (_n, crew) => {
  it("Nominal Orbit is NOMINAL with all vitals nominal", () => {
    const v = vitalsFor(crew, "nominal");
    expect(triage(v).level).toBe("NOMINAL");
    expect(Object.values(vitalStatus(v)).every((s) => s === "nominal")).toBe(true);
  });
  it("Solar Particle Event is CRITICAL with shelter but no unverified potassium iodide", () => {
    const v = vitalsFor(crew, "spe");
    const t = triage(v);
    expect(t.level).toBe("CRITICAL");
    expect(vitalStatus(v).radiation).toBe("critical");
    expect(t.actions.some((a) => /shelter in place/i.test(a.text))).toBe(true);
    expect(t.actions.some((a) => /potassium iodide|\bKI\b/i.test(a.text))).toBe(false);
  });
  it("Circadian stress lowers readiness and logs sleep deficit", () => {
    const n = triage(vitalsFor(crew, "nominal")).score;
    const t = triage(vitalsFor(crew, "circadian"));
    expect(t.score).toBeLessThan(n - 25);
    expect(t.risks.some((r) => r.id === "circ")).toBe(true);
  });
});
