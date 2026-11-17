import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { estimateBpm } from "@/lib/ppg";
import { Button } from "@/components/ui/button";

export function CameraPulse({ onResult }: { onResult: (bpm: number) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "measuring" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("");
  const start = async () => {
    setMsg(""); setProgress(0);
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: 160, height: 120 } }); }
    catch { setState("error"); setMsg("Camera not available. Allow camera access, or type your heart rate instead."); return; }
    const track = stream.getVideoTracks()[0]!;
    try { await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] }); } catch { /* no flash: works in good light */ }
    const v = video.current!; v.srcObject = stream; await v.play();
    const c = document.createElement("canvas"); c.width = 40; c.height = 30; const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const samples: number[] = []; const t0 = performance.now(); const DUR = 30000;
    setState("measuring");
    const tick = () => {
      ctx.drawImage(v, 0, 0, 40, 30);
      const d = ctx.getImageData(0, 0, 40, 30).data; let r = 0; for (let i = 0; i < d.length; i += 4) r += d[i]!;
      samples.push(r / (d.length / 4));
      const el = performance.now() - t0; setProgress(Math.min(1, el / DUR));
      if (el < DUR) requestAnimationFrame(tick);
      else {
        stream.getTracks().forEach((t) => t.stop());
        const fps = samples.length / (el / 1000);
        const res = estimateBpm(samples, fps);
        if (!res || res.quality < 0.4) { setState("error"); setMsg("Signal too noisy. Cover the camera fully with your fingertip, keep still, and try again."); }
        else { setState("done"); setMsg(`Estimated ${res.bpm} bpm (signal quality ${Math.round(res.quality * 100)}%).`); onResult(res.bpm); }
      }
    };
    requestAnimationFrame(tick);
  };
  return (
    <div className="glass space-y-2 p-4">
      <h2 className="flex items-center gap-2 font-medium"><Camera className="size-4 text-primary" />Camera pulse</h2>
      <p className="text-xs text-muted-foreground">Gently cover the back camera (and flash) with a fingertip, keep still for 30 seconds. <b className="text-caution">Estimate only — not medical.</b></p>
      <video ref={video} playsInline muted className="h-16 w-20 rounded bg-muted object-cover" />
      {state === "measuring" ? <div className="h-2 overflow-hidden rounded bg-muted"><div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} /></div>
        : <Button variant="outline" onClick={start}>{state === "idle" ? "Start measuring" : "Measure again"}</Button>}
      {msg && <p className={state === "error" ? "text-sm text-caution" : "text-sm text-nominal"}>{msg}</p>}
    </div>
  );
}
