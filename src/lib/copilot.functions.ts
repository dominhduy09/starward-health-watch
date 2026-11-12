import { createServerFn } from "@tanstack/react-start";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";

export interface CopilotContext {
  crew: string; role: string; scenario: string; status: string;
  vitals: { hr: number; hrv: number; spo2: number; temp: number; radiation: number; missionLimit: number; bone: number; readiness: number; sleepHours: number; stress: number; hydration: number };
  risks: string[];
}
interface Input { context: CopilotContext; messages: { role: "user" | "assistant"; content: string }[] }

const SYSTEM = `You are ASTRA-MED Copilot, an autonomous space-medicine assistant aboard a deep-space vehicle with a 14-minute one-way Earth comms delay.
Ground your advice in NASA Flight Surgeon practice, the ISS Medical Checklist, NASA-STD-3001 and known spaceflight conditions (SANS, space motion sickness, radiation exposure, EVA decompression and thermal stress, microgravity bone loss, circadian disruption).
Always factor in the astronaut's live telemetry provided. Be concise and operational.
Format strictly in markdown:
### Assessment (2-3 sentences linking symptoms to telemetry)
### Intervention Protocol (GitHub task list "- [ ] step", 3-6 concrete steps, cite the protocol source in parentheses when relevant)
### Escalation Criteria (bullets: when to wake crew medical officer / relay to ground)
Flag medication contraindications (e.g. NSAIDs with dehydration, radiation-related thrombocytopenia, or suspected intracranial pressure). This is decision support, not a diagnosis.`;

export const askCopilot = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => {
    if (!d?.messages?.length || d.messages.length > 30) throw new Error("Invalid messages");
    return d;
  })
  .handler(async ({ data }) => {
    const c = data.context; const v = c.vitals;
    const telemetry = `LIVE TELEMETRY — ${c.crew} (${c.role})
Scenario: ${c.scenario} | Triage status: ${c.status}
HR ${v.hr} bpm, HRV ${v.hrv} ms, SpO2 ${v.spo2}%, core temp ${v.temp} °C, hydration ${v.hydration}% of target
Cumulative radiation ${v.radiation} mSv (mission limit ${v.missionLimit}), BMD ${v.bone}% since launch
Cognitive readiness ${v.readiness}/100, sleep ${v.sleepHours} h, stress index ${v.stress}
Active risks: ${c.risks.length ? c.risks.join("; ") : "none"}`;
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: `${SYSTEM}\n\n${telemetry}`,
        input: data.messages.map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
      });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") for (const part of item.content) if (part.type === "output_text") text += part.text;
      }
      return { text: text || "_No response returned._", error: null as string | null };
    } catch (e) {
      console.error("copilot error", e);
      if (e instanceof GatewayError) {
        if (e.code === "rate_limited" || e.httpStatus === 429) return { text: "", error: "Copilot is busy — please wait a moment and try again." };
        if (e.httpStatus === 402) return { text: "", error: "AI credits are exhausted. Add credits to keep using the Copilot." };
      }
      return { text: "", error: "Copilot uplink failed. Follow the onboard protocol checklist and try again." };
    }
  });
