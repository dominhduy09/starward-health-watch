import { useEffect, useState } from "react";
import { Send, Satellite, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { commsSeconds, fmtDelay } from "@/lib/comms";

type Msg = { id: string; text: string; sentAt: number; delay: number };

export function CommsQueue({ comms, envName, summary }: { comms: string; envName: string; summary: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const delay = commsSeconds(comms);
  const send = () => setMsgs((p) => [{ id: crypto.randomUUID(), text: summary, sentAt: Date.now(), delay }, ...p].slice(0, 4));
  return (
    <div className="glass p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs text-muted-foreground"><Satellite className="size-4 text-caution" />Downlink to Mission Control</span>
        <span className="readout text-[10px] text-caution">{envName} · {comms} one-way</span>
      </div>
      <p className="text-[11px] text-muted-foreground">Why autonomy matters: a reply from Earth takes {fmtDelay(delay * 2)} round-trip. The crew must act before help arrives.</p>
      <Button variant="outline" className="w-full gap-2" onClick={send}><Send className="size-4" />Send health status to Earth</Button>
      {msgs.length > 0 && <ul className="space-y-1.5">{msgs.map((m) => {
        const left = m.delay - (now - m.sentAt) / 1000;
        return (
          <li key={m.id} className="rounded border border-border p-2 text-xs">
            <div className="truncate">{m.text}</div>
            <div className={left > 0 ? "readout text-caution" : "readout text-nominal flex items-center gap-1"}>
              {left > 0 ? `In transit · arrives in ${fmtDelay(left)}` : <><CheckCircle2 className="size-3" />Delivered to Houston</>}
            </div>
          </li>
        );
      })}</ul>}
    </div>
  );
}
