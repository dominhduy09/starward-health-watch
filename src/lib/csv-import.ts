import { validateReading, type Kind } from "./ranges";

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === "," || c === ";" || c === "\t") { row.push(cell.trim()); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell.trim()); if (row.some((x) => x)) rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  row.push(cell.trim()); if (row.some((x) => x)) rows.push(row);
  return rows;
}

export type Mapping = { time: number; cols: Partial<Record<Kind, number>>; dia?: number };
export interface NewReading { kind: Kind; value: number; value2: number | null; measured_at: string; source: "import" }

/** Turns data rows (header excluded) into validated readings; skips impossible values. */
export function mapRows(rows: string[][], m: Mapping): { readings: NewReading[]; skipped: number } {
  const readings: NewReading[] = []; let skipped = 0;
  for (const r of rows) {
    const t = new Date(r[m.time] ?? "");
    if (Number.isNaN(t.getTime())) { skipped++; continue; }
    for (const [k, col] of Object.entries(m.cols) as [Kind, number][]) {
      const raw = r[col]; if (!raw) continue;
      let v = Number(raw.replace(",", ".")); let v2: number | null = null;
      if (k === "bp") {
        const parts = raw.split("/");
        if (parts.length === 2) { v = Number(parts[0]); v2 = Number(parts[1]); }
        else if (m.dia !== undefined) v2 = Number(r[m.dia]);
      }
      if (validateReading(k, v, v2)) { skipped++; continue; }
      readings.push({ kind: k, value: v, value2: v2, measured_at: t.toISOString(), source: "import" });
    }
  }
  return { readings, skipped };
}

/** Guesses columns from header names. */
export function guessMapping(header: string[]): Mapping {
  const find = (re: RegExp) => { const i = header.findIndex((h) => re.test(h.toLowerCase())); return i < 0 ? undefined : i; };
  const cols: Partial<Record<Kind, number>> = {};
  const set = (k: Kind, re: RegExp) => { const i = find(re); if (i !== undefined) cols[k] = i; };
  set("hr", /heart|pulse|bpm|^hr$/); set("spo2", /spo2|oxygen|o2/); set("temp", /temp/);
  set("glucose", /glucose|sugar/); set("sleep", /sleep/); set("bp", /systolic|blood pressure|^bp$|^sys/);
  const dia = find(/diastolic|^dia/);
  return { time: find(/date|time|timestamp/) ?? 0, cols, ...(dia !== undefined ? { dia } : {}) };
}
