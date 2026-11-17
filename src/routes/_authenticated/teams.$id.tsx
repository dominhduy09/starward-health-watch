import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { overallLevel, latestByKind, type Reading } from "@/lib/health-data";
import { KINDS, fmtValue } from "@/lib/ranges";
import { LevelBadge, UrgentBanner } from "@/components/health/LevelBadge";

const board = (team: string) => queryOptions({
  queryKey: ["team-board", team],
  queryFn: async () => {
    const { data: t } = await supabase.from("teams").select("name").eq("id", team).maybeSingle();
    const { data: members } = await supabase.from("team_members").select("user_id, display_name, role, sharing").eq("team_id", team);
    const shared = (members ?? []).filter((m) => m.sharing && m.role === "member");
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const { data: rs } = shared.length ? await supabase.from("readings").select("*").in("user_id", shared.map((m) => m.user_id)).gte("measured_at", since).order("measured_at", { ascending: false }).limit(1000) : { data: [] };
    const rank = { urgent: 0, watch: 1, ok: 2 } as const;
    const rows = (members ?? []).filter((m) => m.role === "member").map((m) => {
      const mine = ((rs ?? []) as Reading[]).filter((r) => r.user_id === m.user_id);
      return { ...m, readings: mine, level: overallLevel(mine) };
    }).sort((a, b) => Number(b.sharing) - Number(a.sharing) || rank[a.level] - rank[b.level]);
    return { name: t?.name ?? "Team", rows };
  },
  refetchInterval: 60_000,
});

export const Route = createFileRoute("/_authenticated/teams/$id")({
  head: () => ({ meta: [{ title: "Team Board — ASTRA-MED" }, { name: "description", content: "See who on your team needs attention first." }, { property: "og:title", content: "Team Board — ASTRA-MED" }, { property: "og:description", content: "See who on your team needs attention first." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(board(params.id)),
  component: Board,
  errorComponent: ({ error }) => <p role="alert" className="text-critical">{error instanceof Error ? error.message : "Something went wrong"}</p>,
  notFoundComponent: () => <p>Team not found.</p>,
});

function Board() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(board(id));
  return (
    <div className="space-y-4">
      <Link to="/teams" className="text-sm text-primary">← Teams</Link>
      <h1 className="text-xl font-semibold">{data.name} — team board</h1>
      <p className="text-sm text-muted-foreground">Most worrying first. Based on each person's readings from the last 7 days. Updates every minute.</p>
      {data.rows.length === 0 && <p className="glass p-4 text-sm">No members yet. Copy the invite link from the Teams page and send it to them.</p>}
      {data.rows.map((m) => {
        const latest = latestByKind(m.readings);
        return (
          <div key={m.user_id} className="glass space-y-2 p-4">
            <div className="flex items-center gap-2"><span className="font-medium">{m.display_name ?? "Member"}</span>{m.sharing ? (m.readings.length ? <LevelBadge level={m.level} /> : <span className="text-xs text-muted-foreground">no readings this week</span>) : <span className="text-xs text-muted-foreground">not sharing</span>}</div>
            {m.sharing && m.level === "urgent" && <UrgentBanner who={m.display_name ?? "This person"} />}
            {m.sharing && latest.size > 0 && (
              <div className="flex flex-wrap gap-3 text-sm">
                {KINDS.filter((k) => latest.has(k.id)).map((k) => { const r = latest.get(k.id)!; return <span key={k.id} className="readout"><span className="text-muted-foreground">{k.label} </span>{fmtValue(k.id, Number(r.value), r.value2 == null ? null : Number(r.value2))} {k.unit}</span>; })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
