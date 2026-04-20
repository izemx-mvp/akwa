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
  { id: "1", title: "Increase price by 2.5% for Senegal", message: "Demand elasticity is low and competitor average sits at +3.1%. Estimated extra margin: $4,210/month.", severity: "info" as const, cta: "Apply suggestion", delta: "+$4.2k" },
  { id: "2", title: "Margin below target for Dakar Energy Supply", message: "Last 3 orders averaged 11.2% margin (target: 16%). Suggest renegotiation on Butane SKUs.", severity: "warning" as const, cta: "Review pricing" },
  { id: "3", title: "Optimal price detected: $125.50 USD", message: "On Lubricant Pack XL — current avg sell $118.20. AI confidence: 87%.", severity: "info" as const, cta: "Simulate", delta: "+6.2%" },
];

function Pricing() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 max-w-[1500px]">
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">Pricing <AgentBadge name="Pricing Advisor" icon={TrendingUp} /></h1>
            <p className="text-sm text-muted-foreground">Dynamic price optimization across products and corridors.</p>
          </div>
          <Button variant="outline" className="gap-1.5"><Sparkles className="h-4 w-4" /> Run simulation</Button>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Product</th>
                <th className="text-right px-5 py-3 font-medium">Current price</th>
                <th className="text-right px-5 py-3 font-medium">Cost</th>
                <th className="text-right px-5 py-3 font-medium">Margin</th>
                <th className="text-right px-5 py-3 font-medium">AI Suggestion</th>
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
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success(`Pricing updated for ${p.name}`)}>
                        <Sparkles className="h-3 w-3" /> Apply
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card p-5">
          <h3 className="font-semibold mb-4">Margin by country</h3>
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
          <h3 className="mt-3 text-base font-semibold">3 high-value suggestions</h3>
          <p className="text-xs text-white/80 mt-1">Estimated combined uplift: <span className="font-bold">+$11,840/month</span></p>
        </div>
        {recs.map((r) => (
          <RecommendationCard key={r.id} rec={r} onApply={() => toast.success(`${r.title} applied`)} />
        ))}
      </aside>
    </div>
  );
}
