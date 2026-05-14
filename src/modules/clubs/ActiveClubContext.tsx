import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthContext";

type ClubRef = { id: string; name: string; role: string };

type Ctx = {
  clubs: ClubRef[];
  activeClubId: string | null;
  setActiveClubId: (id: string | null) => void;
  reload: () => void;
  loading: boolean;
};

const ActiveClubCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "acecourt.activeClubId";

export function ActiveClubProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<ClubRef[]>([]);
  const [activeClubId, setActiveClubIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setActiveClubId = useCallback((id: string | null) => {
    setActiveClubIdState(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const reload = useCallback(async () => {
    if (!user) {
      setClubs([]);
      setActiveClubIdState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("club_members")
      .select("role, clubs:club_id(id, name, deleted_at)")
      .eq("user_id", user.id);
    const refs: ClubRef[] = (data ?? [])
      .filter((r: any) => r.clubs && !r.clubs.deleted_at)
      .map((r: any) => ({ id: r.clubs.id, name: r.clubs.name, role: r.role }));
    setClubs(refs);
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const initial = (stored && refs.find((r) => r.id === stored)?.id) || refs[0]?.id || null;
    setActiveClubIdState(initial);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { reload(); }, [reload]);

  return (
    <ActiveClubCtx.Provider value={{ clubs, activeClubId, setActiveClubId, reload, loading }}>
      {children}
    </ActiveClubCtx.Provider>
  );
}

export function useActiveClub() {
  const c = useContext(ActiveClubCtx);
  if (!c) throw new Error("useActiveClub must be used inside ActiveClubProvider");
  return c;
}