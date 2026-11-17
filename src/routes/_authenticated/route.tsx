import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { HealthNav } from "@/components/health/HealthNav";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.href } });
    return { user: data.user };
  },
  component: () => (
    <div className="min-h-screen space-bg">
      <HealthNav />
      <main className="mx-auto max-w-6xl p-3 md:p-6"><Outlet /></main>
    </div>
  ),
});
