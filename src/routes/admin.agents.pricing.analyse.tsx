import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Explain, Factors, CrossLink } from "@/components/admin/AgentShell";
import { Chip, Kpi, Panel } from "@/components/admin/ui";
import { agentHub, pricingAlerts, priceScenarios, useAgentHub, orderContext } from "@/lib/agent-hub";
import { eur2, pct, useBackoffice } from "@/lib/backoffice-store";
import { Button } from "@/components/ui/button";
import { resolvePrice, usePricing } from "@/lib/pricing-rules";

export const Route = createFileRoute("/admin/agents/pricing/analyse")({
  head: () => ({
    meta: [
      { title: "Analyse & recommandations — Agent Pricing AKWA" },
      { name: "description", content: "Analyse intelligente des prix par produit, commande et client avec scénarios tarifaires." },
      { property: "og:title", content: "Analyse & recommandations — Agent Pricing AKWA" },
      { property: "og:description", content: "Scénarios de prix, impact marge et recommandations AKWA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentPricingAnalyse,
});

function AgentPricingAnalyse() {
  useAgentHub();
  usePricing();
  const { products, clients } = useBackoffice();
  const alerts = pricingAlerts();
  const [selected, setSelected] = useState(alerts[0]?.ref ?? products[0]?.ref ?? "");
  const alert = alerts.find((a) => a.ref === selected) ?? alerts[0];
  const product = products.find((p) => p.ref === (alert?.ref ?? selected));
  const ctx = orderContext();
  const client = clients.find((c) => c.id === ctx.order?.clientId);

  const cost = product?.purchasePrice ?? 0;
  const scenarios = priceScenarios(alert?.recommended ?? product?.recommendedPrice ?? 0, cost);
  const [scenario, setScenario] = useState<string>("recommande");
  const chosen = scenarios.find((s) => s.key === scenario) ?? scenarios[1];
  const currentMargin = product && product.salePrice ? ((product.salePrice - cost) / product.salePrice) * 100 : 0;
  const res = product ? resolvePrice({ product, client, quantity: 500, destination: ctx.destination }) : null;

  const apply = () => {
    if (!product) return;
    agentHub.applyPrice(product.ref, chosen.price, product.name);
    toast.success(`Prix appliqué : ${eur2(chosen.price)} sur ${product.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Produits à repricer" value={String(alerts.length)} />
        <Kpi label="Marge produit actuelle" value={pct(currentMargin)} />
        <Kpi label="Marge recommandée" value={pct(chosen?.marginPct ?? 0)} />
        <Kpi label="Marge commande" value={pct(ctx.marginPct)} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Recommandations de prix">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Produit</th>
                  <th className="px-4 py-3 text-right font-medium">Achat avant</th>
                  <th className="px-4 py-3 text-right font-medium">Achat actuel</th>
                  <th className="px-4 py-3 text-right font-medium">Prix vente</th>
                  <th className="px-4 py-3 text-right font-medium">Prix recommandé</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alerts.map((a) => {
                  const delta = ((a.newCost - a.oldCost) / a.oldCost) * 100;
                  return (
                    <tr
                      key={a.ref}
                      onClick={() => setSelected(a.ref)}
                      className={`cursor-pointer hover:bg-muted/30 ${a.ref === selected ? "bg-ai/5" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground">{a.ref}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{eur2(a.oldCost)}</td>
                      <td className="px-4 py-3 text-right">
                        {eur2(a.newCost)} <Chip tone="warning">+{delta.toFixed(1).replace(".", ",")} %</Chip>
                      </td>
                      <td className="px-4 py-3 text-right">{eur2(a.salePrice)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ai">{eur2(a.recommended)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); agentHub.applyPrice(a.ref, a.recommended, a.name); toast.success("Prix appliqué"); }}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); agentHub.ignorePrice(a.ref, a.name); toast("Recommandation ignorée"); }}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title={`Scénarios — ${product?.name ?? "—"}`}>
            <div className="space-y-3">
              {scenarios.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setScenario(s.key)}
                  className={`w-full rounded-lg border p-3 text-left transition-smooth ${
                    scenario === s.key ? "border-ai bg-ai/5" : "border-border hover:border-ai/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{s.label}</span>
                    <span className="text-sm font-bold">{eur2(s.price)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{s.goal}</span>
                    <span className={s.marginPct >= 20 ? "text-success" : s.marginPct >= 15 ? "text-warning" : "text-destructive"}>
                      marge {pct(s.marginPct)}
                    </span>
                  </div>
                </button>
              ))}
              <Button className="w-full" onClick={apply}>Appliquer le prix sélectionné</Button>
            </div>
          </Panel>

          {res && (
            <Panel title="Prix applicable après règles tarifaires">
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between"><span>Prix catalogue</span><strong>{eur2(res.catalogPrice)}</strong></li>
                {res.applied.map((a) => (
                  <li key={a.rule.id} className="flex justify-between text-muted-foreground">
                    <span>{a.rule.name}</span><span>{eur2(a.to)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-border pt-2"><span className="font-semibold">Prix applicable</span><strong className="text-ai">{eur2(res.applicablePrice)}</strong></li>
                <li className="flex justify-between"><span>Marge</span><span>{pct(res.marginPct)}</span></li>
              </ul>
              <p className="mt-2 text-[11px] text-muted-foreground">{res.reason}</p>
              <Link to="/admin/agents/pricing/regles" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">Voir la règle →</Link>
            </Panel>
          )}

          <Explain>
            {product ? (
              <>
                Le prix de <strong>{eur2(chosen?.price ?? 0)}</strong> est recommandé car le coût d'achat est passé de{" "}
                {eur2(alert?.oldCost ?? 0)} à {eur2(alert?.newCost ?? 0)}. Ce niveau maintient une marge de{" "}
                <strong>{pct(chosen?.marginPct ?? 0)}</strong>, au-dessus du seuil interne de 15 %, tout en restant cohérent
                avec l'historique d'acceptation des devis du client {ctx.clientName}.
                <Factors items={["Coût d'achat", "Historique de vente", "Marge cible 20 %", "Fret & assurance", "Concurrence marché", "Volume client"]} />
              </>
            ) : (
              "Sélectionnez un produit pour obtenir une explication détaillée."
            )}
          </Explain>

          <Panel title="Actions croisées">
            <div className="flex flex-wrap gap-2">
              <CrossLink from="pricing" to="marge" label="Analyser l'impact marge" />
              <CrossLink from="pricing" to="devis" label="Recalculer le devis" />
              <Link to="/admin/produits" className="text-xs font-medium text-primary hover:underline">Voir le catalogue →</Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
