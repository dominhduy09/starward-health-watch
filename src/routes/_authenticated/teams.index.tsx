import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const myTeams = (uid: string) => queryOptions({
  queryKey: ["my-teams", uid],
  queryFn: async () => {
    const { data, error } = await supabase.from("team_members").select("team_id, role, sharing, teams(name, invite_code, created_by)").eq("user_id", uid);
    if (error) throw error; return data ?? [];
  },
});

export const Route = createFileRoute("/_authenticated/teams/")({
  head: () => ({ meta: [{ title: "Teams — ASTRA-MED" }, { name: "description", content: "Share your health status with family, a coach or a team medic." }, { property: "og:title", content: "Teams — ASTRA-MED" }, { property: "og:description", content: "Share your health status with people you trust." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myTeams(context.user.id)),
  component: Teams,
  errorComponent: ({ error }) => <p role="alert" className="text-critical">{error instanceof Error ? error.message : "Something went wrong"}</p>,
});

function Teams() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(myTeams(user.id));
  const [name, setName] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-teams", user.id] });
  const create = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("teams").insert({ name: name.trim().slice(0, 80), created_by: user.id });
    if (error) { toast.error("Couldn't create team."); return; } setName(""); void refresh(); toast.success("Team created — share the invite link");
  };
  const share = async (team: string, on: boolean) => { await supabase.rpc("set_sharing", { _team: team, _on: on }); void refresh(); };
  const leave = async (team: string) => { await supabase.from("team_members").delete().eq("team_id", team).eq("user_id", user.id); void refresh(); };
  const copy = (code: string) => { void navigator.clipboard.writeText(`${window.location.origin}/join/${code}`); toast.success("Invite link copied"); };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Teams</h1>
      <p className="text-sm text-muted-foreground">Create a team for your family, club or crew. You become its <b>helper</b> and see the status of everyone who chooses to share.</p>
      <div className="glass flex gap-2 p-4"><Input placeholder="Team name, e.g. Family" value={name} onChange={(e) => setName(e.target.value)} /><Button onClick={create}>Create team</Button></div>
      {data.length === 0 ? <p className="text-sm text-muted-foreground">You're not in any team yet. Create one, or open an invite link someone sent you.</p> : data.map((m) => {
        const t = m.teams as unknown as { name: string; invite_code: string; created_by: string } | null;
        return (
          <div key={m.team_id} className="glass flex flex-wrap items-center gap-3 p-4">
            <div className="mr-auto"><div className="font-medium">{t?.name}</div><div className="text-xs text-muted-foreground">You are a {m.role}</div></div>
            {m.role === "helper" ? <>
              <Button variant="outline" size="sm" onClick={() => t && copy(t.invite_code)}>Copy invite link</Button>
              <Link to="/teams/$id" params={{ id: m.team_id }} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Open team board</Link>
            </> : <label className="flex items-center gap-2 text-sm"><Switch checked={m.sharing} onCheckedChange={(v) => share(m.team_id, v)} />Share my health with helpers</label>}
            {t?.created_by !== user.id && <Button variant="ghost" size="sm" onClick={() => leave(m.team_id)}>Leave</Button>}
          </div>
        );
      })}
    </div>
  );
}
