import { describe, expect, it } from "vitest";
import { assessCopilotOutput, COPILOT_SAFETY, safeCopilotResponse } from "./copilot-safety";
import { CREW, SCENARIOS, vitalsFor } from "./telemetry";
import { triage } from "./triage";

describe("Medical safety boundaries", () => {
  it("never treats image measurements as validated", () => {
    expect(COPILOT_SAFETY.validatedImageMeasurements).toBe(false);
    expect(assessCopilotOutput("The optic nerve sheath measures 5.4 mm.").allowed).toBe(false);
  });
  it("rejects unverified NASA protocol claims", () => {
    expect(COPILOT_SAFETY.verifiedProtocolCitations).toBe(false);
    expect(assessCopilotOutput("Follow NASA-STD-3001 for this treatment.").allowed).toBe(false);
    expect(assessCopilotOutput("Apply protocol IMM-3.").allowed).toBe(false);
  });
  it("requires flight-surgeon confirmation and withholds drug instructions", () => {
    expect(COPILOT_SAFETY.flightSurgeonConfirmationRequired).toBe(true);
    const text = "Take ibuprofen 400 mg now.";
    expect(assessCopilotOutput(text).allowed).toBe(false);
    expect(safeCopilotResponse(text)).not.toContain(text);
  });
  it("allows observation logging without treatment instructions", () => {
    expect(assessCopilotOutput("Record symptom onset and contact the flight surgeon for review.").allowed).toBe(true);
  });
  it("gates checklist treatments for every crew and scenario", () => {
    for (const crew of CREW) for (const scenario of SCENARIOS) {
      const t = triage(vitalsFor(crew, scenario.id), {
        id: "safety", at: "", headache: false, dizziness: false, visualFlashes: false,
        nausea: true, sleepQuality: 8, mood: 8, notes: "",
      });
      expect(t.actions.find((a) => a.id === "sym-nau-1")?.requiresFlightSurgeonConfirmation).toBe(true);
      for (const a of t.actions.filter((a) => ["spe-3", "heat-1", "o2-2", "sans-2", "imm-2", "circ-3", "bone-1"].includes(a.id))) {
        expect(a.requiresFlightSurgeonConfirmation).toBe(true);
      }
    }
  });
});