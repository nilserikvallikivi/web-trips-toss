import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Users, Trophy, CalendarDays, LogOut, LogIn, Globe, User, UserCircle, Shield, Circle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/modules/auth/AuthContext";
import { useIsAdmin } from "@/modules/auth/useIsAdmin";
import { useActiveClub } from "@/modules/clubs/ActiveClubContext";
import { usePresence } from "@/modules/presence/PresenceProvider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { clubs, activeClubId, setActiveClubId } = useActiveClub();
  const { onlineCount } = usePresence();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/clubs", label: t("nav.clubs"), icon: Users },
    { to: "/events", label: t("nav.events"), icon: CalendarDays },
    { to: "/rankings", label: t("nav.rankings"), icon: Trophy },
    { to: "/players", label: t("nav.players"), icon: User },
    ...(isAdmin ? [{ to: "/admin", label: t("nav.admin"), icon: Shield }] : []),
    { to: "/feedback", label: "Feedback", icon: MessageSquare },
  ];

  const toggleLang = () => i18n.changeLanguage(i18n.language?.startsWith("et") ? "en" : "et");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight" aria-label={t("app.name")}>
            <span className="inline-block h-7 w-7 rounded-full tennis-ball-dot ring-1 ring-black/5" aria-hidden />
            <span>{t("app.name")}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="Main">
            {user && navItems.map((n) => {
              const active = path === n.to || path.startsWith(n.to + "/");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={active ? "page" : undefined}
                  className={`relative px-3 py-2 rounded-md text-sm transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`}
                >
                  {n.label}
                  {active && <span className="absolute left-3 right-3 -bottom-[13px] h-[2px] rounded-full bg-primary" aria-hidden />}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground" aria-label={`${onlineCount()} users online`}>
                    <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" aria-hidden />
                    {onlineCount()} online
                  </span>
                </TooltipTrigger>
                <TooltipContent>{onlineCount()} users currently online</TooltipContent>
              </Tooltip>
            )}
            {user && clubs.length > 0 && (
              <Select value={activeClubId ?? undefined} onValueChange={(v) => setActiveClubId(v)}>
                <SelectTrigger className="h-9 w-[160px] hidden sm:flex" aria-label="Active club">
                  <SelectValue placeholder="Active club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="ghost" size="sm" onClick={toggleLang} aria-label="Language">
              <Globe /> {i18n.language?.startsWith("et") ? "ET" : "EN"}
            </Button>
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/profile"><UserCircle /> {t("nav.profile")}</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  <LogOut /> {t("nav.signOut")}
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth"><LogIn /> {t("nav.signIn")}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-6">{children}</div>
      </main>

      {user && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-border bg-card">
          <div className={`grid ${navItems.length >= 6 ? "grid-cols-6" : "grid-cols-5"}`}>
            {navItems.map((n) => {
              const Icon = n.icon;
              const active = path === n.to || path.startsWith(n.to + "/");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] min-h-[56px] ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Icon className="h-5 w-5" />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}