import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useActiveClub } from "@/modules/clubs/ActiveClubContext";
import { PresenceDot } from "@/components/PresenceDot";
import { Info } from "lucide-react";

export const Route = createFileRoute("/rankings")({
  head: () => ({ meta: [{ title: "Rankings — AceCourt" }] }),
  component: () => <AppShell><RequireAuth><Inner /></RequireAuth></AppShell>,
});

function Inner() {
  const { t } = useTranslation();
  const { activeClubId } = useActiveClub();
  const [scope, setScope] = useState<"all" | "club">("all");
  const [discipline, setDiscipline] = useState<string>("all");
  const [minMatches, setMinMatches] = useState<number>(0);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      let q = supabase
        .from("rankings")
        .select("rating,matches_played,wins,losses,discipline,user_id, profiles:user_id(full_name), clubs:club_id(name)")
        .order("rating", { ascending: false })
        .limit(200);
      if (scope === "club" && activeClubId) q = q.eq("club_id", activeClubId);
      if (discipline !== "all") q = q.eq("discipline", discipline as any);
      const { data } = await q;
      setRows(data ?? []);
    })();
  }, [scope, activeClubId, discipline]);

  const filtered = useMemo(
    () => rows.filter((r) => (r.matches_played ?? 0) >= minMatches),
    [rows, minMatches]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("rankings.title")}</h1>
        <p className="text-sm text-muted-foreground">Global Elo-based ratings, normalized so playing more matches doesn't inflate your rank.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Scope</label>
          <Select value={scope} onValueChange={(v) => setScope(v as any)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clubs</SelectItem>
              <SelectItem value="club" disabled={!activeClubId}>Active club</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Discipline</label>
          <Select value={discipline} onValueChange={setDiscipline}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="singles">Singles</SelectItem>
              <SelectItem value="doubles">Doubles</SelectItem>
              <SelectItem value="mixed">Mixed doubles</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Min matches</label>
          <Input type="number" min={0} className="w-24" value={minMatches} onChange={(e) => setMinMatches(parseInt(e.target.value) || 0)} />
        </div>
      </div>

      <details className="rounded-xl border border-border bg-secondary/30 p-4">
        <summary className="cursor-pointer font-medium flex items-center gap-2"><Info className="h-4 w-4" /> How ranking works</summary>
        <div className="mt-3 text-sm text-muted-foreground space-y-2">
          <p>Each player starts with a rating of 1500. After every confirmed official match your rating changes based on the result and the opponent's rating.</p>
          <p>Beating a stronger player gains more points; losing to a stronger player loses fewer. The K-factor is 32. Singles, doubles, and mixed doubles use separate ratings.</p>
          <p>Unconfirmed, abandoned, or casual matches do not affect your rating.</p>
        </div>
      </details>

      {filtered.length === 0 ? (
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
              {filtered.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="p-3 text-muted-foreground">{i + 1}</td>
                  <td className="p-3 font-medium">
                    <span className="inline-flex items-center gap-2">
                      {r.user_id && <PresenceDot userId={r.user_id} />}
                      {r.profiles?.full_name || "—"}
                    </span>
                  </td>
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