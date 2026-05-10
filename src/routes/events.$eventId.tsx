import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { useAuth } from "@/modules/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shuffle } from "lucide-react";

export const Route = createFileRoute("/events/$eventId")({
  head: () => ({ meta: [{ title: "Event — AceCourt" }] }),
  component: () => <AppShell><RequireAuth><Inner /></RequireAuth></AppShell>,
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Inner() {
  const { eventId } = Route.useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [event, setEvent] = useState<any>(null);
  const [regs, setRegs] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rounds, setRounds] = useState(4);
  const [courts, setCourts] = useState(2);

  const load = async () => {
    const { data: ev } = await supabase.from("events").select("*, clubs:club_id(name)").eq("id", eventId).maybeSingle();
    setEvent(ev);
    const { data: r } = await supabase.from("event_registrations").select("user_id, status, profiles:user_id(full_name, gender)").eq("event_id", eventId);
    setRegs(r ?? []);
    const { data: m } = await supabase.from("matches").select("*, p1:player1_id(full_name), p2:player2_id(full_name), p3:player3_id(full_name), p4:player4_id(full_name)").eq("event_id", eventId).order("created_at");
    setMatches(m ?? []);
    if (ev && user) {
      const { data: cm } = await supabase.from("club_members").select("role").eq("club_id", ev.club_id).eq("user_id", user.id).maybeSingle();
      setIsAdmin(cm?.role === "admin" || cm?.role === "organizer" || ev.created_by === user.id);
    }
  };
  useEffect(() => { load(); }, [eventId, user?.id]);

  const generate = async () => {
    if (!event) return;
    const approved = regs.filter((r: any) => r.status === "approved");
    const isDoubles = event.discipline === "doubles" || event.discipline === "mixed";
    const isMixed = event.discipline === "mixed";

    if (!isDoubles && approved.length < 2) {
      return toast.error("Singles requires a minimum of 2 approved players.");
    }
    if (isDoubles && approved.length < 4) {
      return toast.error("Doubles requires a minimum of 4 approved players.");
    }
    if (isDoubles && approved.length % 2 !== 0) {
      return toast.error("Doubles requires an even number of players.");
    }
    if (isMixed) {
      const males = approved.filter((r: any) => r.profiles?.gender === "male").length;
      const females = approved.filter((r: any) => r.profiles?.gender === "female").length;
      const unspecified = approved.length - males - females;
      const pairs = approved.length / 2;
      if (males < pairs || females < pairs) {
        return toast.error("Mixed doubles M+N requires one male and one female per pair. Current player selection does not allow valid pairs.");
      }
      if (unspecified > 0) {
        toast.warning(`${unspecified} player(s) have unspecified gender — pairs may be inaccurate.`);
      }
    }
    const players = approved.map((r: any) => r.user_id);
    const shuffled = shuffle(players);
    const rows: any[] = [];
    if (isDoubles) {
      // Smart schedule generation
      const playerList = approved.map((r: any) => ({
        id: r.user_id as string,
        gender: (r.profiles?.gender ?? "unspecified") as string,
      }));
      const pairCount: Record<string, number> = {};
      const oppCount: Record<string, number> = {};
      const gameCount: Record<string, number> = {};
      playerList.forEach((p) => { gameCount[p.id] = 0; });
      const pk = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
      const combos2 = (arr: string[]): [string, string][] => {
        const res: [string, string][] = [];
        for (let i = 0; i < arr.length - 1; i++)
          for (let j = i + 1; j < arr.length; j++) res.push([arr[i], arr[j]]);
        return res;
      };
      const combos4 = (arr: string[]): [string, string, string, string][] => {
        const res: [string, string, string, string][] = [];
        for (let i = 0; i < arr.length - 3; i++)
          for (let j = i + 1; j < arr.length - 2; j++)
            for (let k = j + 1; k < arr.length - 1; k++)
              for (let l = k + 1; l < arr.length; l++) res.push([arr[i], arr[j], arr[k], arr[l]]);
        return res;
      };
      const scoreCandidate = (
        p1a: string, p1b: string, p2a: string, p2b: string,
        pc: Record<string, number>, oc: Record<string, number>, gc: Record<string, number>,
      ): number => {
        let s = 0;
        s -= (pc[pk(p1a, p1b)] ?? 0) * 1000;
        s -= (pc[pk(p2a, p2b)] ?? 0) * 1000;
        for (const [a, b] of [[p1a, p2a], [p1a, p2b], [p1b, p2a], [p1b, p2b]] as [string, string][])
          s -= (oc[pk(a, b)] ?? 0) * 100;
        const counts = [gc[p1a] ?? 0, gc[p1b] ?? 0, gc[p2a] ?? 0, gc[p2b] ?? 0];
        s -= (Math.max(...counts) - Math.min(...counts)) * 50;
        s -= counts.reduce((a, b) => a + b, 0) * 5;
        s += Math.random() * 0.5;
        return s;
      };
      type Assign = { p1a: string; p1b: string; p2a: string; p2b: string };
      const commit = (g: Assign, pc: Record<string, number>, oc: Record<string, number>, gc: Record<string, number>) => {
        pc[pk(g.p1a, g.p1b)] = (pc[pk(g.p1a, g.p1b)] ?? 0) + 1;
        pc[pk(g.p2a, g.p2b)] = (pc[pk(g.p2a, g.p2b)] ?? 0) + 1;
        for (const [a, b] of [[g.p1a, g.p2a], [g.p1a, g.p2b], [g.p1b, g.p2a], [g.p1b, g.p2b]] as [string, string][])
          oc[pk(a, b)] = (oc[pk(a, b)] ?? 0) + 1;
        [g.p1a, g.p1b, g.p2a, g.p2b].forEach((id) => { gc[id] = (gc[id] ?? 0) + 1; });
      };
      const genGame = (
        used: Set<string>,
        pc: Record<string, number>, oc: Record<string, number>, gc: Record<string, number>,
      ): Assign | null => {
        const avail = shuffle(playerList.filter((p) => !used.has(p.id)));
        if (avail.length < 4) return null;
        let best: Assign | null = null;
        let bestScore = -Infinity;
        if (isMixed) {
          const men = avail.filter((p) => p.gender === "male").map((p) => p.id);
          const women = avail.filter((p) => p.gender === "female").map((p) => p.id);
          if (men.length < 2 || women.length < 2) return null;
          for (const [m1, m2] of combos2(men))
            for (const [w1, w2] of combos2(women))
              for (const [p1a, p1b, p2a, p2b] of [[m1, w1, m2, w2], [m1, w2, m2, w1]] as [string, string, string, string][]) {
                const sc = scoreCandidate(p1a, p1b, p2a, p2b, pc, oc, gc);
                if (sc > bestScore) { bestScore = sc; best = { p1a, p1b, p2a, p2b }; }
              }
        } else {
          for (const [a, b, c, d] of combos4(avail.map((p) => p.id)))
            for (const [p1a, p1b, p2a, p2b] of [[a, b, c, d], [a, c, b, d], [a, d, b, c]] as [string, string, string, string][]) {
              const sc = scoreCandidate(p1a, p1b, p2a, p2b, pc, oc, gc);
              if (sc > bestScore) { bestScore = sc; best = { p1a, p1b, p2a, p2b }; }
            }
        }
        return best;
      };
      const trialSchedule = (): (Assign | null)[][] => {
        const tPC = { ...pairCount }, tOC = { ...oppCount }, tGC = { ...gameCount };
        const allRounds: (Assign | null)[][] = [];
        for (let r = 0; r < rounds; r++) {
          let bestRound: (Assign | null)[] = [];
          let bestScore = -Infinity;
          for (let attempt = 0; attempt < 10; attempt++) {
            const order = shuffle(Array.from({ length: courts }, (_, i) => i));
            const rGames: (Assign | null)[] = new Array(courts).fill(null);
            const aPC = { ...tPC }, aOC = { ...tOC }, aGC = { ...tGC };
            const used = new Set<string>();
            let rScore = 0;
            for (const c of order) {
              const g = genGame(used, aPC, aOC, aGC);
              if (g) {
                [g.p1a, g.p1b, g.p2a, g.p2b].forEach((id) => used.add(id));
                commit(g, aPC, aOC, aGC);
                rScore += scoreCandidate(g.p1a, g.p1b, g.p2a, g.p2b, tPC, tOC, tGC);
                rGames[c] = g;
              }
            }
            if (rScore > bestScore) { bestScore = rScore; bestRound = [...rGames]; }
          }
          bestRound.forEach((g) => { if (g) commit(g, tPC, tOC, tGC); });
          allRounds.push(bestRound);
        }
        return allRounds;
      };
      let bestRounds: (Assign | null)[][] = [];
      let bestTrialScore = -Infinity;
      for (let t = 0; t < 30; t++) {
        const trial = trialSchedule();
        const pc: Record<string, number> = {}, oc: Record<string, number> = {};
        trial.flat().forEach((g) => {
          if (!g) return;
          pc[pk(g.p1a, g.p1b)] = (pc[pk(g.p1a, g.p1b)] ?? 0) + 1;
          pc[pk(g.p2a, g.p2b)] = (pc[pk(g.p2a, g.p2b)] ?? 0) + 1;
          for (const [a, b] of [[g.p1a, g.p2a], [g.p1a, g.p2b], [g.p1b, g.p2a], [g.p1b, g.p2b]] as [string, string][])
            oc[pk(a, b)] = (oc[pk(a, b)] ?? 0) + 1;
        });
        const pR = Object.values(pc).filter((v) => v > 1).reduce((a, b) => a + b - 1, 0);
        const oR = Object.values(oc).filter((v) => v > 1).reduce((a, b) => a + b - 1, 0);
        const score = -(oR * 100 + pR * 10);
        if (score > bestTrialScore) { bestTrialScore = score; bestRounds = trial; }
      }
      bestRounds.flat().forEach((g) => {
        if (!g) return;
        rows.push({
          event_id: eventId,
          club_id: event.club_id,
          player1_id: g.p1a,
          player2_id: g.p1b,
          player3_id: g.p2a,
          player4_id: g.p2b,
          status: "scheduled",
        });
      });
    } else {
      // round-robin singles
      for (let i = 0; i < shuffled.length; i++) {
        for (let j = i + 1; j < shuffled.length; j++) {
          rows.push({ event_id: eventId, club_id: event.club_id, player1_id: shuffled[i], player2_id: shuffled[j], status: "scheduled" });
        }
      }
    }
    if (rows.length === 0) return toast.error("Not enough players");
    const { error } = await supabase.from("matches").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} matches created`);
    load();
  };

  if (!event) return <div className="text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/events" className="text-sm text-muted-foreground hover:text-foreground">← {t("common.back")}</Link>
        <h1 className="text-2xl font-semibold mt-1">{event.title}</h1>
        <p className="text-sm text-muted-foreground">{event.clubs?.name} · {event.event_type} · {event.discipline}</p>
      </div>

      <Tabs defaultValue="players">
        <TabsList>
          <TabsTrigger value="players">{t("events.title")} ({regs.length})</TabsTrigger>
          <TabsTrigger value="matches">{t("matches.title")} ({matches.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="players" className="space-y-2 mt-4">
          {regs.length === 0 ? <div className="text-sm text-muted-foreground">{t("dashboard.none")}</div> : regs.map((r: any) => (
            <div key={r.user_id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
              <span>{r.profiles?.full_name || "—"}</span>
              <span className="text-xs text-muted-foreground">{r.status}</span>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="matches" className="space-y-3 mt-4">
          {isAdmin && (
            <div className="flex flex-wrap gap-2 items-end">
              {(event.discipline === "doubles" || event.discipline === "mixed") && (
                <>
                  <label className="text-sm">
                    <span className="block text-xs text-muted-foreground mb-1">Rounds</span>
                    <Input type="number" min={1} max={20} className="w-20" value={rounds} onChange={(e) => setRounds(Math.max(1, Number(e.target.value) || 1))} />
                  </label>
                  <label className="text-sm">
                    <span className="block text-xs text-muted-foreground mb-1">Courts</span>
                    <Input type="number" min={1} max={20} className="w-20" value={courts} onChange={(e) => setCourts(Math.max(1, Number(e.target.value) || 1))} />
                  </label>
                </>
              )}
              <Button onClick={generate} variant="outline"><Shuffle /> {t("matches.generate")}</Button>
            </div>
          )}
          {matches.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("matches.empty")}</div>
          ) : matches.map((m) => (
            <MatchRow key={m.id} m={m} canEdit={isAdmin} onSaved={load} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MatchRow({ m, canEdit, onSaved }: { m: any; canEdit: boolean; onSaved: () => void }) {
  const { t } = useTranslation();
  const [score, setScore] = useState(m.score ?? "");
  const [winner, setWinner] = useState<string>(m.winner_side ? String(m.winner_side) : "");
  const [busy, setBusy] = useState(false);
  const isDoubles = !!m.player3_id;
  const side1 = isDoubles ? `${m.p1?.full_name ?? "?"} / ${m.p2?.full_name ?? "?"}` : (m.p1?.full_name ?? "?");
  const side2 = isDoubles ? `${m.p3?.full_name ?? "?"} / ${m.p4?.full_name ?? "?"}` : (m.p2?.full_name ?? "?");

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("matches").update({
      score: score || null,
      winner_side: winner ? Number(winner) : null,
      status: winner ? "completed" : m.status,
    }).eq("id", m.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("matches.save"));
    onSaved();
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-4 text-sm">
        <div className={winner === "1" ? "font-semibold" : ""}>{side1}</div>
        <span className="text-muted-foreground">vs</span>
        <div className={winner === "2" ? "font-semibold" : ""}>{side2}</div>
      </div>
      {canEdit ? (
        <div className="flex flex-wrap gap-2 items-center">
          <Input className="w-40" placeholder="6-4 6-3" value={score} onChange={(e) => setScore(e.target.value)} />
          <select value={winner} onChange={(e) => setWinner(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">{t("matches.winner")}</option>
            <option value="1">{t("matches.side1")}</option>
            <option value="2">{t("matches.side2")}</option>
          </select>
          <Button size="sm" onClick={save} disabled={busy}>{t("matches.save")}</Button>
          <span className="text-xs text-muted-foreground ml-auto">{m.status}</span>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">{m.score || "—"} · {m.status}</div>
      )}
    </div>
  );
}