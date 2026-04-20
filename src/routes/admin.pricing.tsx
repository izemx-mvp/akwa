import { createFileRoute } from "@tanstack/react-router";
import { products, countryPerformance, formatCurrency } from "@/lib/mock-data";
import { AgentBadge } from "@/components/AgentBadge";
import { RecommendationCard } from "@/components/RecommendationCard";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pricing")({
  component: Pricing,
});

const recs = [
  { id: "1", title: "Augmenter le prix de 2,5 % pour le Sénégal", message: "L'élasticité de la demande est faible et la moyenne concurrentielle est à +3,1 %. Marge supplémentaire estimée : 4 210 $/mois.", severity: "info" as const, cta: "Appliquer", delta: "+4,2k $" },
  { id: "2", title: "Marge sous la cible pour Dakar Energy Supply", message: "Les 3 dernières commandes ont une marge moyenne de 11,2 % (cible : 16 %). Renégociation suggérée sur les SKUs Butane.", severity: "warning" as const, cta: "Revoir le pricing" },
  { id: "3", title: "Prix optimal détecté : 125,50 $", message: "Sur Lubrifiant Pack XL — prix moyen actuel 118,20 $. Confiance IA : 87 %.", severity: "info" as const, cta: "Simuler", delta: "+6,2 %" },
];

function Pricing() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 max-w-[1500px]">
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">Pricing <AgentBadge name="Pricing Advisor" icon={TrendingUp} /></h1>
            <p className="text-sm text-muted-foreground">Optimisation dynamique des prix par produit et corridor.</p>
          </div>
          <Button variant="outline" className="gap-1.5"><Sparkles className="h-4 w-4" /> Lancer une simulation</Button>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Produit</th>
                <th className="text-right px-5 py-3 font-medium">Prix actuel</th>
                <th className="text-right px-5 py-3 font-medium">Coût</th>
                <th className="text-right px-5 py-3 font-medium">Marge</th>
                <th className="text-right px-5 py-3 font-medium">Suggestion IA</th>
                <th className="text-right px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p, i) => {
                const margin = ((p.unitPrice - p.cost) / p.unitPrice) * 100;
                const suggestion = p.unitPrice * (1 + (i % 3 === 0 ? 0.025 : i % 3 === 1 ? -0.018 : 0.041));
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3"><span className="mr-2">{p.image}</span>{p.name}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(p.unitPrice)}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{formatCurrency(p.cost)}</td>
                    <td className="px-5 py-3 text-right text-success font-semibold">{margin.toFixed(1)}%</td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-ai font-semibold">{formatCurrency(suggestion)}</span>
                      <span className={`ml-2 text-[10px] font-medium ${suggestion > p.unitPrice ? "text-success" : "text-warning"}`}>
                        {suggestion > p.unitPrice ? "+" : ""}{(((suggestion - p.unitPrice) / p.unitPrice) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success(`Pricing mis à jour pour ${p.name}`)}>
                        <Sparkles className="h-3 w-3" /> Appliquer
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card p-5">
          <h3 className="font-semibold mb-4">Marge par pays</h3>
          <div className="space-y-3">
            {countryPerformance.map((c) => (
              <div key={c.country}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{c.country}</span>
                  <span className="text-muted-foreground">{c.margin}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${(c.margin / 25) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl bg-gradient-ai text-ai-foreground p-5 shadow-ai sticky top-20">
          <AgentBadge name="Pricing Advisor" icon={TrendingUp} />
          <h3 className="mt-3 text-base font-semibold">3 suggestions à fort impact</h3>
          <p className="text-xs text-white/80 mt-1">Uplift combiné estimé : <span className="font-bold">+11 840 $/mois</span></p>
        </div>
        {recs.map((r) => (
          <RecommendationCard key={r.id} rec={r} onApply={() => toast.success(`${r.title} appliqué`)} />
        ))}
      </aside>
    </div>
  );
}
