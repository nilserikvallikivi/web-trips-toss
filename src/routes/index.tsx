import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Trophy, Users, CalendarDays, ListChecks } from "lucide-react";
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
      <section className="py-10 md:py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto">
          {t("landing.hero")}
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("landing.sub")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/auth">{t("landing.ctaPrimary")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">{t("landing.ctaSecondary")}</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-10">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}