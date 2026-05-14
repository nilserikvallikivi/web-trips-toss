import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { useIsAdmin } from "@/modules/auth/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, Search, Trash2, Pencil, KeyRound, UserCog, Power } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type AppRole = "super_admin" | "club_admin" | "organizer" | "player";

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  skill_level: string;
};

type RoleRow = { user_id: string; role: AppRole };
type MembershipRow = { user_id: string; club_id: string; role: string };
type ClubRow = { id: string; name: string };
type AuditRow = {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  previous_value: any;
  new_value: any;
  notes: string | null;
  created_at: string;
};

function AdminPage() {
  return (
    <RequireAuth>
      <AppShell>
        <AdminGate />
      </AppShell>
    </RequireAuth>
  );
}

function AdminGate() {
  const { isAdmin, loading } = useIsAdmin();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !isAdmin) nav({ to: "/dashboard" });
  }, [loading, isAdmin, nav]);
  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin)
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <Shield className="h-5 w-5" /> Access denied. Admin permission required.
        </div>
      </Card>
    );
  return <AdminConsole />;
}

const ROLES: AppRole[] = ["super_admin", "club_admin", "organizer", "player"];

function AdminConsole() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Admin Console</h1>
      </div>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function logAction(
  adminId: string,
  action: string,
  target_type: string,
  target_id: string | null,
  previous_value: any,
  new_value: any,
  notes?: string,
) {
  await supabase.from("admin_audit_logs" as any).insert({
    admin_user_id: adminId,
    action_type: action,
    target_type,
    target_id,
    previous_value,
    new_value,
    notes,
  });
}

function UsersTab() {
  const { user: me } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [clubFilter, setClubFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [deleting, setDeleting] = useState<ProfileRow | null>(null);
  const [historyFor, setHistoryFor] = useState<ProfileRow | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const load = async () => {
    const [{ data: p }, { data: r }, { data: m }, { data: c }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("club_members").select("user_id, club_id, role"),
      supabase.from("clubs").select("id, name").is("deleted_at", null),
    ]);
    setProfiles((p ?? []) as any);
    setRoles((r ?? []) as any);
    setMemberships((m ?? []) as any);
    setClubs((c ?? []) as any);
  };
  useEffect(() => {
    load();
  }, []);

  const rolesByUser = useMemo(() => {
    const map = new Map<string, AppRole[]>();
    roles.forEach((r) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role);
      map.set(r.user_id, arr);
    });
    return map;
  }, [roles]);

  const clubsByUser = useMemo(() => {
    const map = new Map<string, MembershipRow[]>();
    memberships.forEach((m) => {
      const arr = map.get(m.user_id) ?? [];
      arr.push(m);
      map.set(m.user_id, arr);
    });
    return map;
  }, [memberships]);

  const filtered = profiles.filter((p) => {
    const userRoles = rolesByUser.get(p.id) ?? [];
    const userClubs = clubsByUser.get(p.id) ?? [];
    if (search && !p.full_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== "all" && !userRoles.includes(roleFilter as AppRole)) return false;
    if (clubFilter !== "all" && !userClubs.some((m) => m.club_id === clubFilter)) return false;
    if (statusFilter === "active" && !p.is_active) return false;
    if (statusFilter === "inactive" && p.is_active) return false;
    return true;
  });

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const toggleActive = async (p: ProfileRow) => {
    const next = !p.is_active;
    const { error } = await supabase.from("profiles").update({ is_active: next }).eq("id", p.id);
    if (error) return toast.error(error.message);
    await logAction(me!.id, next ? "user_reactivated" : "user_deactivated", "user", p.id, { is_active: p.is_active }, { is_active: next });
    toast.success(next ? "User reactivated" : "User deactivated");
    load();
  };

  const resetPassword = async (p: ProfileRow & { email?: string }) => {
    // We don't have email in profiles; use admin-side password reset via Supabase auth API requires service role.
    // Trigger the standard reset flow by email if known. Without email we surface guidance.
    toast.message("Send a password reset link from the user's sign-in screen, or wire a server function with the service role to send it directly.");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={clubFilter} onValueChange={setClubFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Club" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clubs</SelectItem>
            {clubs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3 hidden md:table-cell">Roles</th>
                <th className="text-left p-3 hidden lg:table-cell">Clubs</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3 hidden md:table-cell">Created</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No users match your filters.</td></tr>
              )}
              {paged.map((p) => {
                const userRoles = rolesByUser.get(p.id) ?? [];
                const userClubs = (clubsByUser.get(p.id) ?? []).map((m) =>
                  clubs.find((c) => c.id === m.club_id)?.name ?? "—",
                );
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3 font-medium">{p.full_name || "(no name)"}</td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {userRoles.length === 0 && <span className="text-muted-foreground">—</span>}
                        {userRoles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      {userClubs.join(", ") || "—"}
                    </td>
                    <td className="p-3">
                      <Badge variant={p.is_active ? "default" : "outline"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setHistoryFor(p)} title="View"><UserCog className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(p)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => resetPassword(p)} title="Reset password"><KeyRound className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(p)} title={p.is_active ? "Deactivate" : "Reactivate"}><Power className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(p)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-3 border-t border-border">
          <span className="text-xs text-muted-foreground">{filtered.length} users</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
            <span className="text-sm self-center">{page + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      </Card>

      {editing && (
        <EditUserDialog
          profile={editing}
          allClubs={clubs}
          userRoles={rolesByUser.get(editing.id) ?? []}
          userClubs={clubsByUser.get(editing.id) ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {deleting && (
        <DeleteUserDialog
          profile={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => { setDeleting(null); load(); }}
        />
      )}

      {historyFor && (
        <UserHistoryDialog profile={historyFor} onClose={() => setHistoryFor(null)} />
      )}
    </div>
  );
}

function EditUserDialog({
  profile,
  allClubs,
  userRoles,
  userClubs,
  onClose,
  onSaved,
}: {
  profile: ProfileRow;
  allClubs: ClubRow[];
  userRoles: AppRole[];
  userClubs: MembershipRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user: me } = useAuth();
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [skill, setSkill] = useState(profile.skill_level);
  const [isActive, setIsActive] = useState(profile.is_active);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(userRoles);
  const [selectedClubs, setSelectedClubs] = useState<string[]>(userClubs.map((c) => c.club_id));
  const [saving, setSaving] = useState(false);

  const toggleRole = (r: AppRole) =>
    setSelectedRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  const toggleClub = (id: string) =>
    setSelectedClubs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const save = async () => {
    setSaving(true);
    const prev = { full_name: profile.full_name, phone: profile.phone, skill_level: profile.skill_level, is_active: profile.is_active };
    const next = { full_name: fullName, phone: phone || null, skill_level: skill, is_active: isActive };
    const { error: e1 } = await supabase.from("profiles").update(next as any).eq("id", profile.id);
    if (e1) { toast.error(e1.message); setSaving(false); return; }

    // Sync roles
    const prevRoles = userRoles;
    const toAdd = selectedRoles.filter((r) => !prevRoles.includes(r));
    const toRemove = prevRoles.filter((r) => !selectedRoles.includes(r));
    for (const r of toAdd) await supabase.from("user_roles").insert({ user_id: profile.id, role: r });
    for (const r of toRemove) await supabase.from("user_roles").delete().eq("user_id", profile.id).eq("role", r);

    // Sync clubs
    const prevClubIds = userClubs.map((c) => c.club_id);
    const clubsToAdd = selectedClubs.filter((id) => !prevClubIds.includes(id));
    const clubsToRemove = prevClubIds.filter((id) => !selectedClubs.includes(id));
    for (const id of clubsToAdd) await supabase.from("club_members").insert({ club_id: id, user_id: profile.id, role: "member" });
    for (const id of clubsToRemove) await supabase.from("club_members").delete().eq("club_id", id).eq("user_id", profile.id);

    await logAction(me!.id, "user_edited", "user", profile.id, { ...prev, roles: prevRoles, clubs: prevClubIds }, { ...next, roles: selectedRoles, clubs: selectedClubs });
    toast.success("User updated");
    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>Update profile, roles, and club memberships.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Full name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Skill</label>
              <Select value={skill} onValueChange={setSkill}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["beginner","intermediate","advanced","league"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select value={isActive ? "active" : "inactive"} onValueChange={(v) => setIsActive(v === "active")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Roles</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ROLES.map((r) => (
                <Button key={r} type="button" size="sm" variant={selectedRoles.includes(r) ? "default" : "outline"} onClick={() => toggleRole(r)}>{r}</Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Clubs</label>
            <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-auto">
              {allClubs.length === 0 && <span className="text-muted-foreground text-sm">No clubs yet.</span>}
              {allClubs.map((c) => (
                <Button key={c.id} type="button" size="sm" variant={selectedClubs.includes(c.id) ? "default" : "outline"} onClick={() => toggleClub(c.id)}>{c.name}</Button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  profile,
  onClose,
  onDeleted,
}: {
  profile: ProfileRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { user: me } = useAuth();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const doDelete = async () => {
    setBusy(true);
    // We can only soft-delete via profile here (auth user removal requires service role).
    const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", profile.id);
    if (error) { toast.error(error.message); setBusy(false); return; }
    await logAction(me!.id, "user_deleted", "user", profile.id, { full_name: profile.full_name, is_active: profile.is_active }, { is_active: false }, "Soft-deleted (deactivated). Removing the auth account requires a service-role server function.");
    toast.success("User deactivated. Auth account removal requires a privileged server action.");
    setBusy(false);
    onDeleted();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete user</DialogTitle>
          <DialogDescription>
            This will deactivate <b>{profile.full_name || "this user"}</b>. They will lose access immediately.
            Type <b>DELETE</b> to confirm.
          </DialogDescription>
        </DialogHeader>
        <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={confirm !== "DELETE" || busy} onClick={doDelete}>
            {busy ? "Working…" : "Confirm delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserHistoryDialog({ profile, onClose }: { profile: ProfileRow; onClose: () => void }) {
  const [regs, setRegs] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: r }, { data: m }, { data: rk }] = await Promise.all([
        supabase.from("event_registrations").select("*, events(title, starts_at)").eq("user_id", profile.id),
        supabase.from("matches").select("*").or(`player1_id.eq.${profile.id},player2_id.eq.${profile.id},player3_id.eq.${profile.id},player4_id.eq.${profile.id}`),
        supabase.from("rankings").select("*").eq("user_id", profile.id),
      ]);
      setRegs(r ?? []);
      setMatches(m ?? []);
      setRankings(rk ?? []);
    })();
  }, [profile.id]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{profile.full_name || "User"} — Activity</DialogTitle>
          <DialogDescription>Registrations, matches, and rankings history.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="regs">
          <TabsList>
            <TabsTrigger value="regs">Registrations ({regs.length})</TabsTrigger>
            <TabsTrigger value="matches">Matches ({matches.length})</TabsTrigger>
            <TabsTrigger value="rankings">Rankings ({rankings.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="regs" className="max-h-80 overflow-auto">
            {regs.length === 0 ? <p className="text-muted-foreground text-sm p-2">No registrations.</p> :
              regs.map((r) => (
                <div key={r.id} className="text-sm p-2 border-b border-border">
                  <div>{r.events?.title ?? "Event"} — <Badge variant="outline">{r.status}</Badge></div>
                </div>
              ))}
          </TabsContent>
          <TabsContent value="matches" className="max-h-80 overflow-auto">
            {matches.length === 0 ? <p className="text-muted-foreground text-sm p-2">No matches.</p> :
              matches.map((m) => (
                <div key={m.id} className="text-sm p-2 border-b border-border flex justify-between">
                  <span>{m.score ?? "—"}</span>
                  <Badge variant="outline">{m.status}</Badge>
                </div>
              ))}
          </TabsContent>
          <TabsContent value="rankings" className="max-h-80 overflow-auto">
            {rankings.length === 0 ? <p className="text-muted-foreground text-sm p-2">No rankings.</p> :
              rankings.map((rk) => (
                <div key={rk.id} className="text-sm p-2 border-b border-border flex justify-between">
                  <span>{rk.discipline}</span>
                  <span>{Number(rk.rating).toFixed(0)} ({rk.wins}-{rk.losses})</span>
                </div>
              ))}
          </TabsContent>
        </Tabs>
        <DialogFooter><Button onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AuditTab() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("admin_audit_logs" as any) as any).select("*").order("created_at", { ascending: false }).limit(200);
      setRows((data ?? []) as AuditRow[]);
      const { data: p } = await supabase.from("profiles").select("id, full_name");
      setProfiles(new Map((p ?? []).map((r) => [r.id, r.full_name])));
    })();
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Admin</th>
              <th className="text-left p-3">Action</th>
              <th className="text-left p-3">Target</th>
              <th className="text-left p-3 hidden md:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No admin actions recorded yet.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3">{profiles.get(r.admin_user_id) ?? r.admin_user_id.slice(0, 8)}</td>
                <td className="p-3"><Badge variant="secondary">{r.action_type}</Badge></td>
                <td className="p-3 text-muted-foreground">{r.target_type}{r.target_id ? ` · ${r.target_id.slice(0,8)}` : ""}</td>
                <td className="p-3 hidden md:table-cell text-muted-foreground">{r.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}