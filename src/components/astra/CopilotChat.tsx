import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Stethoscope, SendHorizontal, Loader2, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askCopilot, type CopilotContext } from "@/lib/copilot.functions";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

function TaskBox() {
  const [on, setOn] = useState(false);
  return <Checkbox checked={on} onCheckedChange={() => setOn(!on)} className="mr-2 align-[-3px]" />;
}

function Markdown({ text }: { text: string }) {
  return (
    <div className="copilot-md text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ input: ({ type }) => (type === "checkbox" ? <TaskBox /> : null) }}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

export function CopilotChat({ context, pending, onPendingDone }: { context: CopilotContext; pending: string | null; onPendingDone: () => void }) {
  const ask = useServerFn(askCopilot);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef(context);
  ctxRef.current = context;

  useEffect(() => { const el = listRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next); setInput(""); setBusy(true); setErr(null);
    try {
      const r = await ask({ data: { context: ctxRef.current, messages: next } });
      if (r.error) { setErr(r.error); setInput(q); setMsgs(msgs); }
      else setMsgs([...next, { role: "assistant", content: r.text }]);
    } catch {
      setErr("Copilot uplink failed. Try again."); setInput(q); setMsgs(msgs);
    } finally { setBusy(false); }
  };

  useEffect(() => {
    if (pending) { void send(pending); onPendingDone(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <div className="rounded-lg border border-border bg-background/40 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="flex min-w-0 items-center gap-2 text-xs font-medium"><Stethoscope className="size-4 text-primary" />AI Space-Medicine Copilot</span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="readout hidden sm:inline text-[10px] text-muted-foreground">Vitals linked · {context.crew.split(" ").pop()}</span>
          {msgs.length > 0 && <button aria-label="Clear chat" onClick={() => setMsgs([])} className="text-muted-foreground hover:text-foreground"><Trash2 className="size-3.5" /></button>}
        </span>
      </div>
      <div ref={listRef} className="max-h-[55vh] md:max-h-[480px] overflow-y-auto overscroll-contain p-3 space-y-3">
        {msgs.length === 0 && !busy && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Describe symptoms or ask a medical question. Current vitals and scenario are sent automatically.</p>
            {["Mild throbbing headache and slight visual blurring after EVA — should I take ibuprofen?", "I feel nauseous and disoriented. What should I do?"].map((s) => (
              <button key={s} onClick={() => send(s)} className="block w-full text-left text-xs rounded-md border border-border px-3 py-2.5 text-muted-foreground hover:border-primary/50 hover:text-foreground">{s}</button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => m.role === "user"
          ? <div key={i} className="ml-6 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm">{m.content}</div>
          : <div key={i} className="flex gap-2"><Stethoscope className="size-4 mt-1 shrink-0 text-primary" /><Markdown text={m.content} /></div>)}
        {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />Analyzing telemetry against flight surgeon protocols…</div>}
        {err && <div className="text-xs text-critical">{err}</div>}
              </div>
      <form className="flex items-end gap-2 border-t border-border p-2" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2} placeholder="Describe symptoms…" className="min-h-11 resize-none text-base md:text-sm"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }} />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className={cn("grid size-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40")}>
          <SendHorizontal className="size-4" />
        </button>
      </form>
    </div>
  );
}
