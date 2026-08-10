import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/admin/ui";
import { useBilling, billingKpis, paymentKpis, eur } from "@/lib/billing-store";

export const Route = createFileRoute("/admin/facturation")({
  component: BillingLayout,
});

const TABS = [
  { to: "/admin/facturation/factures", label: "Factures" },
  { to: "/admin/facturation/paiements", label: "Paiements" },
];

function BillingLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const state = useBilling();
  const k = billingKpis(state);
  const p = paymentKpis(state);

  return (
    <div className="max-w-[1500px] space-y-6">
      <header className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Receipt className="h-5 w-5 text-primary" /> Facturation AKWA
            </h1>
            <p className="text-sm text-muted-foreground">
              Factures proforma et définitives, encaissements et rapprochement bancaire.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip tone="info">Facturé {eur(k.totalInvoiced)}</Chip>
            <Chip tone="success">Encaissé {eur(k.collected)}</Chip>
            <Chip tone={k.outstanding ? "warning" : "muted"}>Reste dû {eur(k.outstanding)}</Chip>
            {p.toReconcile > 0 && <Chip tone="danger">{p.toReconcile} virements à rapprocher</Chip>}
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-card">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.to);
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
    </div>
  );
}
