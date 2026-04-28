import { createFileRoute } from "@tanstack/react-router";
import { clients, monthlyRevenue, formatCurrency } from "@/lib/mock-data";
import { AgentBadge } from "@/components/AgentBadge";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { BarChart3, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/margins")({
  component: Margins,
});

function Margins() {
  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">Marges <AgentBadge name="Margin Analyst" icon={BarChart3} /></h1>
          <p className="text-sm text-muted-foreground">Intelligence de rentabilité par client, produit et corridor.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card p-5">
          <h3 className="font-semibold mb-4">Tendance de marge (6 mois)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 245)" />
              <XAxis dataKey="month" stroke="oklch(0.5 0.04 250)" fontSize={11} />
              <YAxis stroke="oklch(0.5 0.04 250)" fontSize={11} domain={[14, 22]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.015 245)" }} />
              <Line type="monotone" dataKey="margin" stroke="oklch(0.62 0.18 235)" strokeWidth={3} dot={{ r: 4, fill: "oklch(0.62 0.18 235)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-warning/40 bg-warning/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-warning">Alertes IA</h3>
          </div>
          <div className="space-y-3">
            <div className="text-sm">Le client <strong>Dakar Energy Supply</strong> a perdu <span className="text-destructive font-semibold">6,2 %</span> de marge</div>
            <div className="text-sm">Le produit <strong>Pack Carburant Aviation</strong> est sous-performant ce trimestre</div>
            <div className="text-sm">La marge en <strong>Côte d'Ivoire</strong> a baissé de 4 %</div>
            <button className="text-xs text-warning font-medium hover:underline mt-2">Voir le rapport complet →</button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Rentabilité par client</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Client</th>
              <th className="text-left px-5 py-3 font-medium">Pays</th>
              <th className="text-left px-5 py-3 font-medium">Segment</th>
              <th className="text-right px-5 py-3 font-medium">Revenu YTD</th>
              <th className="text-right px-5 py-3 font-medium">Marge</th>
              <th className="text-right px-5 py-3 font-medium">Tendance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.country}</td>
                <td className="px-5 py-3"><span className="text-[11px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{c.segment}</span></td>
                <td className="px-5 py-3 text-right font-semibold">{formatCurrency(c.ytdRevenue)}</td>
                <td className="px-5 py-3 text-right">{c.marginPct.toFixed(1)}%</td>
                <td className="px-5 py-3 text-right">
                  <span className={`inline-flex items-center gap-1 font-semibold text-xs ${c.trend >= 0 ? "text-success" : "text-destructive"}`}>
                    {c.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {c.trend >= 0 ? "+" : ""}{c.trend}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
