import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Users, Trophy, CalendarDays, LogOut, LogIn, Globe, User, UserCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/modules/auth/AuthContext";
import { useIsAdmin } from "@/modules/auth/useIsAdmin";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/clubs", label: t("nav.clubs"), icon: Users },
    { to: "/events", label: t("nav.events"), icon: CalendarDays },
    { to: "/rankings", label: t("nav.rankings"), icon: Trophy },
    { to: "/players", label: t("nav.players"), icon: User },
    ...(isAdmin ? [{ to: "/admin", label: t("nav.admin"), icon: Shield }] : []),
  ];

  const toggleLang = () => i18n.changeLanguage(i18n.language?.startsWith("et") ? "en" : "et");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">A</span>
            <span>{t("app.name")}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {user && navItems.map((n) => {
              const active = path.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
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
              const active = path.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex flex-col items-center gap-1 py-2 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}
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