import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tag, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AgentHeader, OrderContextPanel } from "@/components/admin/AgentShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/agents/pricing")({
  head: () => ({
    meta: [
      { title: "Agent Pricing — Back-office AKWA" },
      { name: "description", content: "Recommandations de prix, règles tarifaires en masse, simulations et historique des prix." },
      { property: "og:title", content: "Agent Pricing — Back-office AKWA" },
      { property: "og:description", content: "Pricing Management System AKWA : analyses, règles tarifaires, campagnes et audit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingLayout,
});

const TABS = [
  { to: "/admin/agents/pricing", label: "Vue d'ensemble", exact: true },
  { to: "/admin/agents/pricing/analyse", label: "Analyse & recommandations" },
  { to: "/admin/agents/pricing/regles", label: "Règles tarifaires" },
  { to: "/admin/agents/pricing/historique", label: "Historique des prix" },
  { to: "/admin/agents/pricing/configuration", label: "Configuration" },
];

function PricingLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="max-w-[1500px] space-y-6">
      <AgentHeader agentKey="pricing" icon={Tag}>
        <Button variant="secondary" size="sm" onClick={() => toast.info("Analyse tarifaire relancée sur le catalogue")}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Relancer l'analyse
        </Button>
      </AgentHeader>

      <nav className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-card">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.to || pathname === `${t.to}/` : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-medium transition-smooth",
                active ? "bg-ai text-ai-foreground shadow-sm" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <OrderContextPanel from="pricing" />

      <Outlet />
    </div>
  );
}
