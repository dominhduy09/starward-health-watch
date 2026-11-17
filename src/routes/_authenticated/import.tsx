import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { guessMapping, mapRows, parseCsv, type Mapping } from "@/lib/csv-import";
import { KINDS, type Kind } from "@/lib/ranges";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/import")({
  head: () => ({ meta: [{ title: "Import Health Data — ASTRA-MED" }, { name: "description", content: "Upload a CSV export from your smartwatch or health app." }, { property: "og:title", content: "Import Health Data — ASTRA-MED" }, { property: "og:description", content: "Upload a CSV export from your smartwatch or health app." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Import,
});

function Import() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [rows, setRows] = useState<string[][] | null>(null);
  const [map, setMap] = useState<Mapping | null>(null);
  const [busy, setBusy] = useState(false);
  const onFile = async (f: File) => {
    if (f.size > 5_000_000) { toast.error("File is too large (max 5 MB)."); return; }
    const r = parseCsv(await f.text()); if (r.length < 2) { toast.error("No rows found in that file."); return; }
    setRows(r); setMap(guessMapping(r[0]!));
  };
  const result = useMemo(() => (rows && map ? mapRows(rows.slice(1), map) : null), [rows, map]);
  const header = rows?.[0] ?? [];
  const sel = (value: number | undefined, on: (v: number | undefined) => void) => (
    <select className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" value={value ?? ""} onChange={(e) => on(e.target.value === "" ? undefined : Number(e.target.value))}>
      <option value="">— not in file —</option>{header.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
    </select>
  );
  const save = async () => {
    if (!result?.readings.length) return;
    setBusy(true);
    for (let i = 0; i < result.readings.length; i += 500) {
      const { error } = await supabase.from("readings").insert(result.readings.slice(i, i + 500).map((r) => ({ ...r, user_id: user.id })));
      if (error) { setBusy(false); { toast.error("Import stopped partway. Try again."); return; } }
    }
    setBusy(false); setRows(null); setMap(null);
    void qc.invalidateQueries({ queryKey: ["readings", user.id] });
    toast.success(`Imported ${result.readings.length} readings`);
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Import a file</h1>
      <div className="glass space-y-2 p-4">
        <p className="text-sm text-muted-foreground">Upload a CSV with a date/time column and one or more health columns (for example from a smartwatch app export). Blood pressure can be one column like "120/80" or two columns.</p>
        <input type="file" accept=".csv,text/csv,.txt" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="text-sm" />
      </div>
      {rows && map && result && (
        <div className="glass space-y-3 p-4">
          <h2 className="font-medium">Match the columns</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-2 text-sm">Date / time {sel(map.time, (v) => setMap({ ...map, time: v ?? 0 }))}</label>
            {KINDS.map((k) => <label key={k.id} className="flex items-center justify-between gap-2 text-sm">{k.label} ({k.unit}) {sel(map.cols[k.id], (v) => { const cols = { ...map.cols }; if (v === undefined) delete cols[k.id as Kind]; else cols[k.id as Kind] = v; setMap({ ...map, cols }); })}</label>)}
            <label className="flex items-center justify-between gap-2 text-sm">BP bottom number {sel(map.dia, (v) => { const { dia: _d, ...rest } = map; setMap(v === undefined ? rest : { ...rest, dia: v }); })}</label>
          </div>
          <p className="text-sm">Ready to import <b>{result.readings.length}</b> readings{result.skipped ? <> · <span className="text-caution">{result.skipped} skipped (missing date or impossible value)</span></> : null}.</p>
          <div className="overflow-x-auto text-xs"><table className="w-full"><tbody>{rows.slice(0, 4).map((r, i) => <tr key={i} className={i === 0 ? "font-semibold" : "text-muted-foreground"}>{r.map((c, j) => <td key={j} className="border-b border-border px-2 py-1">{c}</td>)}</tr>)}</tbody></table></div>
          <Button onClick={save} disabled={busy || !result.readings.length}>{busy ? "Importing…" : "Import"}</Button>
        </div>
      )}
    </div>
  );
}
