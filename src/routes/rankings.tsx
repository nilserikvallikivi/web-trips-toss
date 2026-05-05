import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/rankings")({
  head: () => ({ meta: [{ title: "Rankings — AceCourt" }] }),
  component: () => <AppShell><RequireAuth><Inner /></RequireAuth></AppShell>,
});

function Inner() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("rankings")
        .select("rating,matches_played,wins,losses,discipline, profiles:user_id(full_name), clubs:club_id(name)")
        .order("rating", { ascending: false })
        .limit(100);
      setRows(data ?? []);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("rankings.title")}</h1>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">{t("rankings.empty")}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3">#</th>
                <th className="p-3">Player</th>
                <th className="p-3">Club</th>
                <th className="p-3">{t("rankings.rating")}</th>
                <th className="p-3 hidden sm:table-cell">{t("rankings.played")}</th>
                <th className="p-3 hidden sm:table-cell">{t("rankings.wins")}</th>
                <th className="p-3 hidden sm:table-cell">{t("rankings.losses")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="p-3 text-muted-foreground">{i + 1}</td>
                  <td className="p-3 font-medium">{r.profiles?.full_name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{r.clubs?.name}</td>
                  <td className="p-3">{Math.round(r.rating)}</td>
                  <td className="p-3 hidden sm:table-cell">{r.matches_played}</td>
                  <td className="p-3 hidden sm:table-cell">{r.wins}</td>
                  <td className="p-3 hidden sm:table-cell">{r.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}