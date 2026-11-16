import type { Action, Level, Risk, SymptomLog } from "@/lib/triage";
import type { Vitals, Crew } from "@/lib/telemetry";
import { hazardFor, type HazardId } from "@/lib/hazards";

export function CrewReport({ crew, v, level, score, risks, actions, done, hazards, logs, scenario, envName }: {
  crew: Crew; v: Vitals; level: Level; score: number; risks: Risk[]; actions: Action[]; done: Set<string>;
  hazards: HazardId[]; logs: SymptomLog[]; scenario: string; envName: string;
}) {
  const row = (k: string, val: string) => <tr><td className="pr-4 py-0.5">{k}</td><td>{val}</td></tr>;
  return (
    <div className="print-report hidden print:block p-6 text-sm space-y-3">
      <h1 className="text-xl font-bold">ASTRA-MED Crew Health Debrief — {crew.name}</h1>
      <p>SIMULATION ONLY · Fictional data · Not for clinical use · Requires flight-surgeon review.</p>
      <p>Generated {new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · Scenario: {scenario} · Environment: {envName}</p>
      <h2 className="font-bold">Status: {level} · Readiness {score}/100</h2>
      <table><tbody>
        {row("Heart rate / HRV", `${v.hr} bpm / ${v.hrv} ms`)}{row("SpO₂", `${v.spo2} %`)}{row("Core temp", `${v.temp} °C`)}
        {row("Blood pressure", `${v.systolic}/${v.diastolic} mmHg`)}{row("Glucose", `${v.glucose} mg/dL`)}
        {row("Radiation", `${v.radiation} mSv (mission limit ${crew.missionLimit})`)}{row("Bone density", `${v.bone} %`)}
      </tbody></table>
      <h2 className="font-bold">Detected risks</h2>
      <ul className="list-disc pl-5">{risks.length ? risks.map((r) => <li key={r.id}>{r.title} — {r.detail}</li>) : <li>None</li>}</ul>
      <p>HRP hazards flagged: {hazards.map((h) => hazardFor(h).label).join(", ") || "none"}</p>
      <h2 className="font-bold">Review checklist</h2>
      <ul className="pl-1">{actions.map((a) => <li key={a.id}>{done.has(a.id) ? "[x]" : "[ ]"} {a.text}</li>)}</ul>
      <h2 className="font-bold">Symptom logs</h2>
      <ul className="list-disc pl-5">{logs.length ? logs.map((l) => <li key={l.id}>{l.at} · sleep {l.sleepQuality}/10 · mood {l.mood}/10{l.notes ? ` · ${l.notes}` : ""}</li>) : <li>None filed</li>}</ul>
    </div>
  );
}
