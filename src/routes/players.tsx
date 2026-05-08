import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { PresenceDot } from "@/components/PresenceDot";

export const Route = createFileRoute("/players")({
  head: () => ({ meta: [{ title: "Players — AceCourt" }] }),
  component: () => <AppShell><RequireAuth><Inner /></RequireAuth></AppShell>,
});

function Inner() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("id,full_name,skill_level,rating_singles,rating_doubles").order("rating_singles", { ascending: false }).limit(200);
      setRows(data ?? []);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter(r => (r.full_name ?? "").toLowerCase().includes(q.toLowerCase())), [rows, q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("players.title")}</h1>
        <Input className="max-w-xs" placeholder={t("players.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">{t("players.empty")}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-card p-4">
              <div className="font-medium flex items-center gap-2">
                <PresenceDot userId={p.id} />
                <span>{p.full_name || "—"}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{p.skill_level} · S {Math.round(p.rating_singles)} · D {Math.round(p.rating_doubles)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}