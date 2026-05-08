import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthContext";

type PresenceRow = { user_id: string; status: "online" | "idle" | "offline"; last_seen_at: string };
type Ctx = {
  presence: Record<string, PresenceRow>;
  isOnline: (userId: string) => boolean;
  onlineCount: () => number;
};
const C = createContext<Ctx | null>(null);

const HEARTBEAT_MS = 60_000;
const IDLE_MS = 5 * 60_000;

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [presence, setPresence] = useState<Record<string, PresenceRow>>({});
  const lastActivity = useRef<number>(Date.now());

  // Heartbeat
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const beat = async () => {
      if (cancelled) return;
      const idle = Date.now() - lastActivity.current > IDLE_MS;
      if (!idle) {
        await supabase.rpc("presence_heartbeat" as any);
      }
    };
    beat();
    const id = setInterval(beat, HEARTBEAT_MS);
    const onActivity = () => { lastActivity.current = Date.now(); };
    const onUnload = () => { supabase.rpc("presence_set_offline" as any); };
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("click", onActivity);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [user?.id]);

  // Initial load + realtime
  useEffect(() => {
    if (!user) { setPresence({}); return; }
    let active = true;
    (async () => {
      const { data } = await ((supabase as any).from("user_presence").select("user_id,status,last_seen_at"));
      if (!active || !data) return;
      const map: Record<string, PresenceRow> = {};
      for (const r of data as any[]) map[r.user_id] = r;
      setPresence(map);
    })();
    const ch = supabase
      .channel("user_presence_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, (payload: any) => {
        const row = (payload.new ?? payload.old) as PresenceRow;
        if (!row) return;
        setPresence((p) => ({ ...p, [row.user_id]: row }));
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [user?.id]);

  const isOnline = (uid: string) => {
    const p = presence[uid];
    if (!p) return false;
    if (p.status === "offline") return false;
    return Date.now() - new Date(p.last_seen_at).getTime() < 10 * 60_000;
  };
  const onlineCount = () => Object.keys(presence).filter(isOnline).length;

  return <C.Provider value={{ presence, isOnline, onlineCount }}>{children}</C.Provider>;
}

export function usePresence() {
  const c = useContext(C);
  if (!c) throw new Error("usePresence must be inside PresenceProvider");
  return c;
}