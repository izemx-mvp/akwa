import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/components/admin/analytics/FilterBar";
import { ReportWizard } from "@/components/admin/analytics/ReportWizard";
import { Tag } from "@/components/admin/analytics/parts";
import { useAnalytics, eurCompact, pct1, num } from "@/lib/analytics-store";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsLayout,
});

const TABS = [
  { to: "/admin/analytics", label: "Vue exécutive", exact: true },
  { to: "/admin/analytics/commercial", label: "Commercial" },
  { to: "/admin/analytics/rentabilite", label: "Rentabilité" },
  { to: "/admin/analytics/clients", label: "Clients" },
  { to: "/admin/analytics/produits", label: "Produits & Pricing" },
  { to: "/admin/analytics/export", label: "Export & Logistique" },
  { to: "/admin/analytics/cash", label: "Facturation & Cash" },
];

function AnalyticsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [wizard, setWizard] = useState(false);
  const d = useAnalytics();

  const exportRows = () =>
    d.sales.map((s) => ({
      Commande: s.ref, Date: s.date.slice(0, 10), Client: s.client, Pays: s.country,
      Commercial: s.commercial, Incoterm: s.incoterm, Statut: s.status,
      CA: s.revenue, Cout: s.cost, Marge: s.margin, "Marge %": s.marginPct.toFixed(1),
      Litres: s.litres, Conteneur: s.container.type, "Remplissage %": s.container.fillPct,
    }));

  return (
    <div className="max-w-[1600px] space-y-4">
      <header className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Gauge className="h-5 w-5 text-primary" /> Analyse &amp; KPI
            </h1>
            <p className="text-sm text-muted-foreground">
              Centre de pilotage de la performance AKWA — export de lubrifiants et fluides automobiles.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag tone="info">CA {eurCompact(d.cur.revenue)}</Tag>
            <Tag tone="success">Marge {pct1(d.cur.marginPct)}</Tag>
            <Tag tone="muted">{num(d.cur.orders)} commandes</Tag>
            {d.cash.late > 0 && <Tag tone="danger">{eurCompact(d.cash.late)} en retard</Tag>}
          </div>
        </div>
      </header>

      <FilterBar onReport={() => setWizard(true)} exportRows={exportRows} />

      <nav className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-card">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-medium transition-smooth",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />

      <ReportWizard open={wizard} onOpenChange={setWizard} data={d} />
    </div>
  );
}
