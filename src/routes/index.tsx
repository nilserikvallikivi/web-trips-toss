import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Trophy, Users, CalendarDays, ListChecks, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AceCourt — Tennis management made calm" },
      { name: "description", content: "Run tennis clubs, leagues, tournaments, registrations, matches, scores and rankings — all in one calm, mobile-friendly platform." },
      { property: "og:title", content: "AceCourt — Tennis management made calm" },
      { property: "og:description", content: "Clubs, events, registrations, matches and rankings in one place." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useTranslation();
  const features = [
    { icon: Users, title: t("landing.f1Title"), body: t("landing.f1Body") },
    { icon: CalendarDays, title: t("landing.f2Title"), body: t("landing.f2Body") },
    { icon: ListChecks, title: t("landing.f3Title"), body: t("landing.f3Body") },
    { icon: Trophy, title: t("landing.f4Title"), body: t("landing.f4Body") },
  ];

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border mt-4 md:mt-8" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 bg-court-lines opacity-60" aria-hidden />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full tennis-ball-dot opacity-90" aria-hidden />
        <div className="relative px-6 py-14 md:px-14 md:py-24 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15">
            <Sparkles className="h-3.5 w-3.5" /> Built for clubs, leagues & weekly groups
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight text-white">
            {t("landing.hero")}
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/80 max-w-xl leading-relaxed">
            {t("landing.sub")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/auth">{t("landing.ctaPrimary")} <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/0 text-white hover:bg-white/10 hover:text-white">
              <Link to="/auth">{t("landing.ctaSecondary")}</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-2 text-xs text-white/70">
            <ShieldCheck className="h-4 w-4" /> No credit card. Free for amateur clubs.
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 md:py-20">
        <div className="max-w-2xl mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Everything a tennis community needs</h2>
          <p className="mt-2 text-muted-foreground">One calm place for players, organizers and coaches — without the spreadsheet chaos.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases strip */}
      <section className="pb-16">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-primary">For clubs</div>
              <h3 className="mt-2 text-lg font-semibold">Members, courts, events</h3>
              <p className="mt-1 text-sm text-muted-foreground">Manage memberships, court bookings and seasonal events in one place.</p>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-primary">For leagues</div>
              <h3 className="mt-2 text-lg font-semibold">Brackets & rankings</h3>
              <p className="mt-1 text-sm text-muted-foreground">Round-robin, ladders, knockouts — with automatic ranking updates.</p>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-primary">For players</div>
              <h3 className="mt-2 text-lg font-semibold">Register in two taps</h3>
              <p className="mt-1 text-sm text-muted-foreground">See your matches, scores and rating without digging through chats.</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg"><Link to="/auth">{t("landing.ctaPrimary")} <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="ghost"><Link to="/auth">{t("landing.ctaSecondary")}</Link></Button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}