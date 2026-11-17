import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { classify, worst, type Kind, type Level } from "./ranges";

export type Reading = { id: string; user_id: string; kind: Kind; value: number; value2: number | null; source: string; measured_at: string };
export type Checkin = { id: string; user_id: string; mood: number | null; sleep_quality: number | null; symptoms: string[]; note: string | null; created_at: string };

export const readingsQuery = (userId: string) => queryOptions({
  queryKey: ["readings", userId],
  queryFn: async () => {
    const { data, error } = await supabase.from("readings").select("*").eq("user_id", userId).order("measured_at", { ascending: false }).limit(1000);
    if (error) throw error; return (data ?? []) as Reading[];
  },
});
export const checkinsQuery = (userId: string) => queryOptions({
  queryKey: ["checkins", userId],
  queryFn: async () => {
    const { data, error } = await supabase.from("checkins").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200);
    if (error) throw error; return (data ?? []) as Checkin[];
  },
});
export const profileQuery = (userId: string) => queryOptions({
  queryKey: ["profile", userId],
  queryFn: async () => (await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()).data,
});

/** Latest reading per kind and the overall level (only readings from the last 48 h count toward urgency). */
export function latestByKind(rs: Reading[]) {
  const m = new Map<Kind, Reading>();
  for (const r of rs) if (!m.has(r.kind)) m.set(r.kind, r);
  return m;
}
export function overallLevel(rs: Reading[], now = Date.now()): Level {
  const recent = [...latestByKind(rs).values()].filter((r) => now - new Date(r.measured_at).getTime() < 48 * 3600e3);
  return worst(recent.map((r) => classify(r.kind, Number(r.value), r.value2 == null ? null : Number(r.value2))));
}
/** Consecutive days (ending today or yesterday) with at least one reading or check-in. */
export function dayStreak(dates: string[], today = new Date()): number {
  const days = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)));
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (!days.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0; while (days.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}
