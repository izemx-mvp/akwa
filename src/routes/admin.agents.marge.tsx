import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { AgentHeader, OrderContextPanel, Explain, Factors, CrossLink, ToneBar } from "@/components/admin/AgentShell";
import { Bar as MiniBar, Chip, Kpi, Panel } from "@/components/admin/ui";
import { orderContext, useAgentHub } from "@/lib/agent-hub";
import { eur, pct, goodsTotal, orderCostTotal, useBackoffice } from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/agents/marge")({
  head: () => ({
    meta: [
      { title: "Agent Marge — Back-office AKWA" },
      { name: "description", content: "Rentabilité par commande, client et produit avec décomposition de la marge." },
      { property: "og:title", content: "Agent Marge — Back-office AKWA" },
      { property: "og:description", content: "Pilotez la rentabilité réelle de vos opérations export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentMarge,
});

function AgentMarge() {
  useAgentHub();
  const { orders, clients, products } = useBackoffice();
  const ctx = orderContext();
  const order = ctx.order;

  const c = order?.costs;
  const waterfall = order
    ? [
        { name: "CA", value: ctx.revenue, tone: "oklch(0.62 0.18 235)" },
        { name: "Achat", value: -(c?.goods ?? 0), tone: "oklch(0.6 0.16 25)" },
        { name: "Préparation", value: -(c?.preparation ?? 0), tone: "oklch(0.65 0.14 45)" },
        { name: "Transport local", value: -(c?.localTransport ?? 0), tone: "oklch(0.65 0.14 45)" },
        { name: "Fret", value: -(c?.freight ?? 0), tone: "oklch(0.65 0.14 45)" },
        { name: "Assurance", value: -(c?.insurance ?? 0), tone: "oklch(0.65 0.14 45)" },
        { name: "Documents", value: -((c?.documents ?? 0) + (c?.other ?? 0)), tone: "oklch(0.65 0.14 45)" },
        { name: "Marge nette", value: ctx.margin, tone: "oklch(0.65 0.17 155)" },
      ]
    : [];

  const rows = orders.map((o) => {
    const rev = goodsTotal(o.items);
    const cost = orderCostTotal(o.costs);
    const m = rev - cost;
    return { ref: o.reference, client: clients.find((cl) => cl.id === o.clientId)?.name ?? "—", rev, cost, m, pctv: rev ? (m / rev) * 100 : 0 };
  });
  const below = rows.filter((r) => r.pctv < 15);
  const avg = rows.length ? rows.reduce((s, r) => s + r.pctv, 0) / rows.length : 0;

  const topProducts = [...products]
    .map((p) => ({ name: p.name, m: p.salePrice ? ((p.salePrice - p.purchasePrice) / p.salePrice) * 100 : 0 }))
    .sort((a, b) => b.m - a.m);

  return (
    <div className="max-w-[1500px] space-y-6">
      <AgentHeader agentKey="marge" icon={TrendingUp} />
      <OrderContextPanel from="marge" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Marge commande" value={pct(ctx.marginPct)} />
        <Kpi label="Marge en valeur" value={eur(ctx.margin)} />
        <Kpi label="Marge moyenne portefeuille" value={pct(avg)} />
        <Kpi label="Commandes sous 15 %" value={String(below.length)} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Décomposition de la marge (waterfall)">
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={waterfall}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 245)" />
                <XAxis dataKey="name" fontSize={11} stroke="oklch(0.5 0.04 250)" />
                <YAxis fontSize={11} stroke="oklch(0.5 0.04 250)" />
                <Tooltip formatter={(v) => eur(Math.abs(Number(v)))} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {waterfall.map((w) => <Cell key={w.name} fill={w.tone} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Seuil interne 15 % · cible 20 %</span><span>{pct(ctx.marginPct)}</span>
              </div>
              <ToneBar value={ctx.marginPct} />
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <Explain>
            La marge de cette commande s'établit à <strong>{pct(ctx.marginPct)}</strong> ({eur(ctx.margin)}). Les coûts
            logistiques représentent {eur((c?.freight ?? 0) + (c?.localTransport ?? 0) + (c?.insurance ?? 0))}, soit le
            principal levier d'amélioration. Une optimisation du chargement conteneur ou une révision tarifaire des
            références à faible marge permettrait de repasser au-dessus de la cible de 20 %.
            <Factors items={["Coût d'achat", "Fret maritime", "Assurance", "Préparation", "Remises client", "Volume"]} />
          </Explain>

          <Panel title="Actions croisées">
            <div className="flex flex-wrap gap-2 p-4">
              <CrossLink from="marge" to="pricing" label="Optimiser les prix" />
              <CrossLink from="marge" to="container" label="Réduire le coût fret" />
              <CrossLink from="marge" to="devis" label="Réviser le devis" />
            </div>
          </Panel>

          <Panel title="Produits les plus / moins rentables">
            <div className="space-y-2 p-4">
              {[...topProducts.slice(0, 3), ...topProducts.slice(-3)].map((p, i) => (
                <div key={p.name + i}>
                  <div className="flex justify-between text-xs">
                    <span className="truncate pr-2">{p.name}</span>
                    <span className={p.m >= 20 ? "text-success" : p.m >= 15 ? "text-warning" : "text-destructive"}>{pct(p.m)}</span>
                  </div>
                  <MiniBar value={Math.max(0, Math.min(100, p.m * 3))} tone={p.m >= 20 ? "bg-success" : p.m >= 15 ? "bg-warning" : "bg-destructive"} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {below.length > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold text-warning">
            <AlertTriangle className="h-4 w-4" /> Alertes rentabilité
          </div>
          <ul className="space-y-1 text-sm">
            {below.map((r) => (
              <li key={r.ref}>
                <strong>{r.ref}</strong> — {r.client} : marge {pct(r.pctv)} (sous le seuil de 15 %)
              </li>
            ))}
          </ul>
        </div>
      )}

      <Panel title="Rentabilité par commande">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Commande</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-right font-medium">CA</th>
                <th className="px-4 py-3 text-right font-medium">Coûts</th>
                <th className="px-4 py-3 text-right font-medium">Marge</th>
                <th className="px-4 py-3 text-right font-medium">Taux</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.ref} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{r.ref}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.client}</td>
                  <td className="px-4 py-3 text-right">{eur(r.rev)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{eur(r.cost)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{eur(r.m)}</td>
                  <td className="px-4 py-3 text-right">
                    <Chip tone={r.pctv >= 20 ? "success" : r.pctv >= 15 ? "warning" : "danger"}>{pct(r.pctv)}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
