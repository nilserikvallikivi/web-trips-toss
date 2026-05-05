import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { useAuth } from "@/modules/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AceCourt" }] }),
  component: () => (
    <AppShell>
      <RequireAuth><Inner /></RequireAuth>
    </AppShell>
  ),
});

function Inner() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({ clubs: 0, regs: 0, matches: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [c, r, m] = await Promise.all([
        supabase.from("club_members").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("matches").select("id", { count: "exact", head: true }).or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`),
      ]);
      setStats({ clubs: c.count ?? 0, regs: r.count ?? 0, matches: m.count ?? 0 });
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t("dashboard.welcome")}</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label={t("nav.clubs")} value={stats.clubs} to="/clubs" />
        <Card label={t("dashboard.registrations")} value={stats.regs} to="/events" />
        <Card label={t("dashboard.upcoming")} value={stats.matches} to="/dashboard" />
      </div>
    </div>
  );
}

function Card({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link to={to} className="rounded-xl border border-border bg-card p-5 hover:bg-accent transition-colors">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </Link>
  );
}