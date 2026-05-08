import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { useIsAdmin } from "@/modules/auth/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — AceCourt" }] }),
  component: () => <AppShell><RequireAuth><Inner /></RequireAuth></AppShell>,
});

const STATUSES = ["new","under_review","resolved","dismissed","malicious"];

function Inner() {
  const { isAdmin } = useIsAdmin();
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const { data } = await (supabase as any)
      .from("user_reports")
      .select("id,reason,status,details,admin_notes,created_at,reported_user_id,reporter_id, reported:reported_user_id(full_name), reporter:reporter_id(full_name)")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) {
    return <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">Reports are only visible to admins.</div>;
  }

  const update = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("user_reports").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User reports</h1>
        <p className="text-sm text-muted-foreground">Reports are private. The reported user does not see who submitted the report.</p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No reports.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{r.reported?.full_name || r.reported_user_id}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Reason: {r.reason} · By: {r.reporter?.full_name || "—"}</div>
                  {r.details && <p className="text-sm mt-2 whitespace-pre-wrap">{r.details}</p>}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <Badge variant="secondary">{r.status}</Badge>
                  <Select value={r.status} onValueChange={(v) => update(r.id, v)}>
                    <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}