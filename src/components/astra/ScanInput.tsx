import { useRef, useState } from "react";
import { ImageUp, Loader2, X } from "lucide-react";
import { SAMPLE_SCANS, fileToScan, sampleToScan, type SampleScan, type ScanAttachment } from "@/lib/scans";
import { cn } from "@/lib/utils";

interface Props {
  value: ScanAttachment | null;
  onChange: (s: ScanAttachment | null) => void;
  disabled?: boolean;
  /** Compact = thumbnail row only, for inside the chat box. */
  compact?: boolean;
}

export function ScanInput({ value, onChange, disabled, compact }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (key: string, fn: () => Promise<ScanAttachment>) => {
    if (disabled) return;
    setBusy(key); setErr(null);
    try { onChange(await fn()); }
    catch { setErr("Could not read that image. Try a JPG or PNG."); }
    finally { setBusy(null); }
  };

  const pick = (s: SampleScan) => void run(s.id, () => sampleToScan(s));

  const onFile = (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setErr("Please choose an image file."); return; }
    void run("file", () => fileToScan(f));
  };

  if (value) {
    return (
      <div className="rounded-md border border-primary/40 bg-primary/5 p-2 flex items-center gap-2">
        <img src={value.dataUrl} alt="Attached diagnostic scan" loading="lazy" className={cn("rounded object-cover", compact ? "size-11" : "size-16")} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-caution">Unvalidated image · Not a clinical finding</p>
          <p className="break-words text-[11px] text-muted-foreground">{value.label}</p>
        </div>
        <button type="button" aria-label="Remove attached scan" disabled={disabled} onClick={() => onChange(null)}
          className="grid size-8 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="readout text-[10px] uppercase tracking-widest text-muted-foreground">Diagnostic image / scan input</div>
      <p className="text-[11px] font-medium text-caution">Samples: simulation only · Generated illustrations, not clinical captures. Image measurements are unvalidated.</p>
      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
        {SAMPLE_SCANS.map((s) => (
          <button key={s.id} type="button" disabled={disabled || !!busy} onClick={() => pick(s)}
            className={cn("group flex items-center gap-2 rounded-md border border-border bg-background/40 p-2 text-left transition-colors hover:border-primary/50 disabled:opacity-50")}>
            <span className="relative shrink-0 overflow-hidden rounded">
              <img src={s.url} alt="" loading="lazy" width={56} height={56} className={cn("object-cover", compact ? "size-10" : "size-14")} />
              {busy === s.id && <span className="absolute inset-0 grid place-items-center bg-background/70"><Loader2 className="size-4 animate-spin text-primary" /></span>}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium group-hover:text-primary">{s.label}</span>
              <span className="block text-[11px] text-muted-foreground">{s.sub}</span>
            </span>
          </button>
        ))}
      </div>
      <button type="button" disabled={disabled || !!busy} onClick={() => fileRef.current?.click()}
        className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50">
        {busy === "file" ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
        Upload camera / ultrasound capture
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      {err && <p className="text-[11px] text-critical">{err}</p>}
    </div>
  );
}
