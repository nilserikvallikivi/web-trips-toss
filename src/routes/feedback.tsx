import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { useAuth } from "@/modules/auth/AuthContext";
import { useIsAdmin } from "@/modules/auth/useIsAdmin";
import { useIsSuperAdmin } from "@/modules/auth/useIsSuperAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/feedback")({
  head: () => ({ meta: [{ title: "Feedback — AceCourt" }] }),
  component: () => <AppShell><RequireAuth><Inner /></RequireAuth></AppShell>,
});

const CATEGORIES = ["bug","feature_request","ux","ranking","registration","scheduling","scoring","club_mgmt","moderation","other"];
const PRIORITIES = ["low","medium","high","critical"];
const STATUSES = ["submitted","under_review","planned","in_progress","released","rejected"];

function Inner() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isSuperAdmin } = useIsSuperAdmin();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", category: "feature_request", priority: "medium", affected_module: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await (supabase as any).from("admin_feedback").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [user?.id]);

  if (!isAdmin) {
    return <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">Feedback box is available for Club Admins and Super Admins.</div>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await (supabase as any).from("admin_feedback").insert({ ...form, submitted_by: user.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Feedback submitted. Thank you!");
    setForm({ title: "", description: "", category: "feature_request", priority: "medium", affected_module: "" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("admin_feedback").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Feedback box</h1>
        <p className="text-sm text-muted-foreground">Share ideas, bugs, and improvements. {isSuperAdmin ? "Super Admins can review all feedback." : "Super Admins will review your submissions."}</p>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-border bg-card p-6">
        <div className="md:col-span-2 space-y-1">
          <Label>Title</Label>
          <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1">
          <Label>Affected module (optional)</Label>
          <Input value={form.affected_module} onChange={(e) => setForm({ ...form, affected_module: e.target.value })} placeholder="e.g. Rankings, Events" />
        </div>
        <div className="md:col-span-2 space-y-1">
          <Label>Description</Label>
          <Textarea rows={5} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={busy}>Submit feedback</Button>
        </div>
      </form>

      <div>
        <h2 className="text-lg font-medium mb-3">{isSuperAdmin ? "All feedback" : "Your feedback"}</h2>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No feedback yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map((f) => (
              <div key={f.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{f.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{f.category} · priority {f.priority} {f.affected_module ? `· ${f.affected_module}` : ""}</div>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{f.description}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <Badge variant="secondary">{f.status}</Badge>
                    {isSuperAdmin && (
                      <Select value={f.status} onValueChange={(v) => updateStatus(f.id, v)}>
                        <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}