import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/join/$code")({
  head: () => ({ meta: [
    { title: "Join a team — ASTRA-MED Health" },
    { name: "description", content: "You've been invited to a health team on ASTRA-MED." },
    { property: "og:title", content: "Join a team — ASTRA-MED Health" },
    { property: "og:description", content: "You've been invited to a health team on ASTRA-MED." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Join,
});

function Join() {
  const { code } = Route.useParams();
  const { session, ready } = useSession();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!session) return;
    void supabase.rpc("join_team", { _code: code }).then(({ data, error }) => {
      if (error || !data) setErr("This invite link isn't valid."); else navigate({ to: "/teams/$id", params: { id: data } });
    });
  }, [session, code, navigate]);
  return (
    <div className="min-h-screen space-bg grid place-items-center p-4">
      <div className="glass max-w-sm space-y-3 p-6 text-center">
        <h1 className="text-lg font-semibold">Join a health team</h1>
        {err ? <p className="text-sm text-critical">{err}</p>
          : ready && !session ? (<><p className="text-sm text-muted-foreground">Sign in to join. Your readings stay private until you choose to share them.</p>
            <Link to="/auth" search={{ redirect: `/join/${code}` }} className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground">Sign in to join</Link></>)
          : <p className="text-sm text-muted-foreground">Joining…</p>}
      </div>
    </div>
  );
}
