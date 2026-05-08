import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthContext";
import { toast } from "sonner";

const REASONS = [
  ["bad_behavior", "Bad behavior"],
  ["abusive_language", "Abusive language"],
  ["no_show", "No-show"],
  ["repeated_cancellations", "Repeated cancellations"],
  ["false_score", "False score entry"],
  ["unfair_play", "Unfair play"],
  ["harassment", "Harassment"],
  ["safety_concern", "Safety concern"],
  ["do_not_recommend", "Do not recommend for my matches"],
  ["other", "Other"],
] as const;

export function ReportUserDialog({ targetUserId, targetName }: { targetUserId: string; targetName?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("bad_behavior");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await (supabase as any).from("user_reports").insert({
      reporter_id: user.id,
      reported_user_id: targetUserId,
      reason,
      details: details || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Report submitted. An admin will review it.");
    setOpen(false);
    setDetails("");
  };

  const addAvoidance = async () => {
    if (!user) return;
    await (supabase as any).from("user_avoidance_preferences").upsert({ user_id: user.id, avoided_user_id: targetUserId });
    toast.success("Added to your private avoidance list.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground"><Flag className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetName ?? "player"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Reports are private. The reported user will not see who reported them.</p>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Details (optional)</Label>
            <Textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe what happened — keep it factual." />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={addAvoidance}>Avoid in future matches</Button>
          <Button onClick={submit} disabled={busy}>Submit report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}