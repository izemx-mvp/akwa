import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Layers, Tag, TrendingDown } from "lucide-react";
import { Chip, Kpi, Panel } from "@/components/admin/ui";
import { Explain, Factors } from "@/components/admin/AgentShell";
import { eur, eur2, pct, useBackoffice } from "@/lib/backoffice-store";
import { orderContext, useAgentHub } from "@/lib/agent-hub";
import {
  adjustmentLabel, effectiveStatus, resolvePrice, ruleStatusTone, rulesDashboard, usePricing,
} from "@/lib/pricing-rules";
import { pricingAlerts } from "@/lib/agent-hub";

export const Route = createFileRoute("/admin/agents/pricing/")({
  head: () => ({
    meta: [
      { title: "Vue d'ensemble Pricing — Back-office AKWA" },
      { name: "description", content: "Dashboard Pricing AKWA : KPI, alertes de coûts et règles tarifaires actives." },
      { property: "og:title", content: "Vue d'ensemble Pricing — Back-office AKWA" },
      { property: "og:description", content: "Pilotez les prix, les marges et les règles tarifaires AKWA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingOverview,
});

function PricingOverview() {
  useAgentHub();
  const { rules } = usePricing();
  const { products, clients } = useBackoffice();
  const dash = rulesDashboard();
  const alerts = pricingAlerts();
  const ctx = orderContext();

  const sample = products.find((p) => p.ref === "AKW-OLV-001") ?? products[0];
  const client = clients.find((c) => c.id === ctx.order?.clientId) ?? clients[0];
  const res = sample ? resolvePrice({ product: sample, client, quantity: 500, destination: ctx.destination }) : null;

  const activeRules = rules.filter((r) => effectiveStatus(r) === "Active");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Produits à repricer" value={String(alerts.length)} icon={Tag} />
        <Kpi label="Règles actives" value={String(dash.active)} icon={Layers} tone="bg-success/10 text-success" />
        <Kpi label="Règles programmées" value={String(dash.scheduled)} />
        <Kpi label="Produits impactés" value={String(dash.products)} />
        <Kpi label="Impact CA estimé" value={eur(dash.revenueImpact)} icon={TrendingDown} tone="bg-destructive/10 text-destructive" />
        <Kpi label="Impact marge" value={`${dash.marginPts.toFixed(1).replace(".", ",")} pts`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel
          title="Alertes de coûts d'achat"
          description="Produits dont le coût fournisseur a augmenté et dont le prix doit être révisé."
          action={<Link to="/admin/agents/pricing/analyse" className="text-xs font-medium text-primary hover:underline">Analyser →</Link>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Produit</th>
                  <th className="px-3 py-2 text-right font-medium">Coût avant</th>
                  <th className="px-3 py-2 text-right font-medium">Coût actuel</th>
                  <th className="px-3 py-2 text-right font-medium">Prix recommandé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alerts.map((a) => (
                  <tr key={a.ref}>
                    <td className="px-3 py-2"><div className="font-medium">{a.name}</div><div className="text-[11px] text-muted-foreground">{a.ref}</div></td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{eur2(a.oldCost)}</td>
                    <td className="px-3 py-2 text-right">
                      {eur2(a.newCost)} <Chip tone="warning">+{(((a.newCost - a.oldCost) / a.oldCost) * 100).toFixed(1).replace(".", ",")} %</Chip>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-ai">{eur2(a.recommended)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel
            title="Règles tarifaires actives"
            action={<Link to="/admin/agents/pricing/regles" className="text-xs font-medium text-primary hover:underline">Gérer →</Link>}
          >
            <ul className="space-y-2">
              {activeRules.slice(0, 6).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground">Priorité {r.priority} · {adjustmentLabel(r)}</div>
                  </div>
                  <Chip tone={ruleStatusTone(effectiveStatus(r))}>{effectiveStatus(r)}</Chip>
                </li>
              ))}
            </ul>
          </Panel>

          {res && (
            <Explain title="Prix applicable — exemple en contexte">
              Le prix catalogue de <strong>{sample.name}</strong> est de <strong>{eur2(res.catalogPrice)}</strong>.
              {res.applied.length ? (
                <> Une règle « {res.applied[0].rule.name} » est active pour {client?.name}
                  {res.applied[0].rule.end ? ` jusqu'au ${new Date(res.applied[0].rule.end).toLocaleDateString("fr-FR")}` : ""}.
                  Le prix applicable est donc de <strong>{eur2(res.applicablePrice)}</strong>, avec une marge estimée de <strong>{pct(res.marginPct)}</strong>.</>
              ) : (
                <> Aucune règle tarifaire n'est active pour ce client : le prix applicable reste le prix catalogue.</>
              )}
              <Factors items={["Prix catalogue", "Règles tarifaires", "Segment client", "Quantité", "Destination", "Marge minimale"]} />
            </Explain>
          )}

          {dash.suspended > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
              <span>{dash.suspended} règle(s) suspendue(s) et {dash.drafts} brouillon(s) en attente de validation.</span>
            </div>
          )}

          <Link to="/admin/agents/pricing/regles" className="flex items-center justify-between rounded-xl border border-ai/30 bg-ai/5 p-4 text-sm font-medium text-ai">
            Ouvrir le gestionnaire de règles tarifaires <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
