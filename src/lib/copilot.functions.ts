import { createServerFn } from "@tanstack/react-start";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import { COPILOT_INSTRUCTIONS, safeCopilotResponse } from "./copilot-safety";

export interface CopilotContext {
  crew: string; role: string; scenario: string; status: string; environment: string;
  vitals: { hr: number; hrv: number; spo2: number; temp: number; radiation: number; missionLimit: number; bone: number; readiness: number; sleepHours: number; stress: number; hydration: number; systolic: number; diastolic: number; glucose: number; ossd: number; ared: number; viral: number };
  risks: string[];
}
interface Input {
  context: CopilotContext;
  messages: { role: "user" | "assistant"; content: string }[];
  /** Optional diagnostic image (bundled sample or crew upload) as a JPEG data URL. */
  scan?: { label: string; dataUrl: string } | null;
}

export const askCopilot = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => {
    if (!d?.messages?.length || d.messages.length > 30) throw new Error("Invalid messages");
    const s = d.scan;
    if (s && (typeof s.dataUrl !== "string" || !s.dataUrl.startsWith("data:image/") || s.dataUrl.length > 4_000_000)) {
      throw new Error("Invalid scan");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const c = data.context; const v = c.vitals;
    const telemetry = `SIMULATION-ONLY TELEMETRY — NOT CLINICAL DATA — ${c.crew} (${c.role})
Environment: ${c.environment}
Scenario: ${c.scenario} | Triage status: ${c.status}
HR ${v.hr} bpm, HRV ${v.hrv} ms, SpO2 ${v.spo2}%, core temp ${v.temp} °C, hydration ${v.hydration}% of target
Blood pressure ${v.systolic}/${v.diastolic} mmHg, blood glucose ${v.glucose} mg/dL
Optic nerve sheath diameter ${v.ossd.toFixed(1)} mm, ARED load ${v.ared} kg, immune index ${Math.round(v.viral)}/100
Cumulative radiation ${v.radiation} mSv (mission limit ${v.missionLimit}), BMD ${v.bone}% since launch
Cognitive readiness ${v.readiness}/100, sleep ${v.sleepHours} h, stress index ${v.stress}
Active risks: ${c.risks.length ? c.risks.join("; ") : "none"}`;
    const last = data.messages.length - 1;
    const input = data.messages.map((m, i) => {
      const text = m.content.slice(0, 4000);
      if (m.role === "user" && i === last && data.scan) {
        return {
          role: "user" as const,
          content: [
            { type: "input_text" as const, text: `${data.scan.label}\n${text}` },
            { type: "input_image" as const, image_url: data.scan.dataUrl, detail: "auto" as const },
          ],
        };
      }
      return { role: m.role, content: text };
    });
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
          instructions: `${COPILOT_INSTRUCTIONS}\n\n${telemetry}`,
        input,
      });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") for (const part of item.content) if (part.type === "output_text") text += part.text;
      }
      return { text: safeCopilotResponse(text), error: null as string | null };
    } catch (e) {
      console.error("copilot error", e);
      if (e instanceof GatewayError) {
        if (e.code === "rate_limited" || e.httpStatus === 429) return { text: "", error: "Copilot is busy — please wait a moment and try again." };
        if (e.httpStatus === 402) return { text: "", error: "AI credits are exhausted. Add credits to keep using the Copilot." };
        if (e.httpStatus === 400 && data.scan) return { text: "", error: "The Copilot could not read that image. Attach a plain JPG/PNG capture and try again." };
      }
      return { text: "", error: "Copilot uplink failed. Follow the onboard protocol checklist and try again." };
    }
  });
