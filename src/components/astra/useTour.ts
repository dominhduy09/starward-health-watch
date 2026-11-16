import { useCallback, useEffect, useRef, useState } from "react";
import type { CrewId, ScenarioId } from "@/lib/telemetry";
import type { EnvironmentId } from "@/lib/environment";
import type { SystemId } from "@/lib/systems";
import type { PendingAsk } from "./CopilotChat";

const DEMO_REPLY = `### Assessment (simulation)
Acute solar particle event: dose rate is far above baseline. This is an illustrative review, not a diagnosis.

### Suggested review steps
- [ ] Move to the storm shelter / most shielded area now
- [ ] Log symptoms (nausea, fatigue) every 30 min
- [ ] Track dosimeter readings and compare with mission limit
- [ ] Send status to Mission Control — reply takes ~29 min round-trip

**Any medication requires flight-surgeon confirmation.**`;

interface Setters {
  setScenario: (s: ScenarioId) => void; setEnv: (e: EnvironmentId) => void; setCrewId: (c: CrewId) => void;
  setFocus: (f: SystemId | null) => void; setPending: (p: PendingAsk | null) => void;
}

/** Scripted ~30s walkthrough for judges; uses a saved Copilot reply so it costs nothing and always works. */
export function useTour(s: Setters) {
  const [step, setStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ref = useRef(s); ref.current = s;
  const stop = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; setStep(0); }, []);
  const start = useCallback(() => {
    stop();
    const plan: [number, () => void][] = [
      [0, () => { ref.current.setEnv("transit"); ref.current.setCrewId("vance"); ref.current.setScenario("nominal"); ref.current.setFocus(null); setStep(1); }],
      [6000, () => { ref.current.setScenario("spe"); setStep(2); }],
      [12000, () => { ref.current.setFocus("radiation"); setStep(3); }],
      [18000, () => { ref.current.setPending({ prompt: "Solar flare alert — what should I do right now?", demoReply: DEMO_REPLY }); setStep(4); }],
      [24000, () => { ref.current.setScenario("nominal"); ref.current.setFocus(null); setStep(5); }],
      [30000, () => setStep(0)],
    ];
    timers.current = plan.map(([ms, fn]) => setTimeout(fn, ms));
  }, [stop]);
  useEffect(() => stop, [stop]);
  const captions = ["",
    "14 minutes from Earth, no doctor can answer in time. ASTRA-MED watches the crew's vital signs live.",
    "A solar storm hits: radiation spikes, status turns CRITICAL and the shelter checklist appears instantly.",
    "The body map shows which organ system is at risk and how the crew can check it themselves.",
    "The AI Copilot explains next steps in plain language — medication always needs a flight surgeon.",
    "Storm passes, the crew returns to NOMINAL. Autonomous care for deep-space missions.",
  ];
  return { active: step > 0, step, caption: captions[step] ?? "", toggle: step > 0 ? stop : start };
}
