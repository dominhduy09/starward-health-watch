import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, SendHorizontal, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askHealthHelper } from "@/lib/health.functions";
import { Textarea } from "@/components/ui/textarea";

type Msg = { role: "user" | "assistant"; content: string };
export function HealthHelper() {
  const ask = useServerFn(askHealthHelper);
  const [msgs, setMsgs] = useState<Msg[]>([]); const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const send = async (q: string) => {
    if (!q.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, content: q.trim() }];
    setMsgs(next); setInput(""); setBusy(true); setErr(null);
    try { const r = await ask({ data: { messages: next } }); if (r.error) { setErr(r.error); setMsgs(msgs); } else setMsgs([...next, { role: "assistant", content: r.text }]); }
    catch { setErr("The helper couldn't answer."); setMsgs(msgs); } finally { setBusy(false); }
  };
  return (
    <div className="glass flex flex-col p-4">
      <h2 className="flex items-center gap-2 font-medium"><Sparkles className="size-4 text-primary" />Health helper</h2>
      <p className="text-xs text-caution">Reads your saved readings. Wellness info only — not medical advice.</p>
      <div className="my-2 max-h-80 space-y-3 overflow-y-auto">
        {msgs.length === 0 && <button onClick={() => send("How do my readings look this week?")} className="w-full rounded-md border border-border px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground">How do my readings look this week?</button>}
        {msgs.map((m, i) => m.role === "user" ? <div key={i} className="ml-6 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">{m.content}</div>
          : <div key={i} className="copilot-md text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>)}
        {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />Looking at your readings…</div>}
        {err && <p className="text-xs text-critical">{err}</p>}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <Textarea rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your readings…" className="resize-none" />
        <button aria-label="Send" disabled={busy || !input.trim()} className="grid size-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"><SendHorizontal className="size-4" /></button>
      </form>
    </div>
  );
}
