import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import { HEALTH_INSTRUCTIONS, safeHealthResponse } from "./copilot-safety";

type Msg = { role: "user" | "assistant"; content: string };

export const askHealthHelper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { messages: Msg[] }) => {
    if (!Array.isArray(d?.messages) || !d.messages.length || d.messages.length > 30) throw new Error("Invalid messages");
    return { messages: d.messages.map((m) => ({ role: m.role === "assistant" ? "assistant" as const : "user" as const, content: String(m.content).slice(0, 4000) })) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 14 * 864e5).toISOString();
    const [{ data: readings }, { data: checkins }] = await Promise.all([
      supabase.from("readings").select("kind,value,value2,source,measured_at").eq("user_id", userId).gte("measured_at", since).order("measured_at", { ascending: false }).limit(80),
      supabase.from("checkins").select("mood,sleep_quality,symptoms,note,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);
    const ctx = `REAL USER DATA — self-reported, NOT clinical. Last 14 days, newest first:\n${(readings ?? []).map((r) => `${r.measured_at.slice(0, 16)} ${r.kind} ${r.value}${r.value2 != null ? "/" + r.value2 : ""} (${r.source})`).join("\n") || "no readings"}\nCheck-ins:\n${(checkins ?? []).map((c) => `${c.created_at.slice(0, 10)} mood ${c.mood ?? "-"}/5 sleep ${c.sleep_quality ?? "-"}/5 symptoms: ${c.symptoms.join(", ") || "none"}${c.note ? " note: " + c.note.slice(0, 200) : ""}`).join("\n") || "none"}`;
    try {
      const res = await generateResponse({ model: "openai/gpt-6-astra", instructions: `${HEALTH_INSTRUCTIONS}\n\n${ctx}`, input: data.messages });
      let text = "";
      for (const item of res.output ?? []) if (item.type === "message") for (const p of item.content) if (p.type === "output_text") text += p.text;
      return { text: safeHealthResponse(text), error: null as string | null };
    } catch (e) {
      console.error("health helper error", e);
      if (e instanceof GatewayError && (e.code === "rate_limited" || e.httpStatus === 429)) return { text: "", error: "The helper is busy — try again in a moment." };
      if (e instanceof GatewayError && e.httpStatus === 402) return { text: "", error: "AI credits are used up." };
      return { text: "", error: "The helper couldn't answer. Please try again." };
    }
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("readings").delete().eq("user_id", userId);
    await supabase.from("checkins").delete().eq("user_id", userId);
    await supabase.from("team_members").delete().eq("user_id", userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("teams").delete().eq("created_by", userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) { console.error(error); return { ok: false }; }
    return { ok: true };
  });
