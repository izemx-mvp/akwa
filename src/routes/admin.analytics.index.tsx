import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Lightbulb, Target, TriangleAlert } from "lucide-react";
import {
  useAnalytics, series, byCountry, byClient, byCategory, byProduct, delta, insights,
  eur, eurCompact, pct1, num, useAnalyticsState,
  type Granularity, type Group,
} from "@/lib/analytics-store";
import { KpiTile, Section, Bullet, Waterfall, RankBars, AlertCard, DrillSheet, MiniStat, DataTable, Tag, marginTone } from "@/components/admin/analytics/parts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/analytics/")({
  head: () => ({
    meta: [
      { title: "Analyse & KPI — Cockpit de pilotage AKWA" },
      { name: "description", content: "Vue exécutive AKWA : chiffre d'affaires, marge, encaissements et alertes sur l'activité export de lubrifiants." },
    ],
  }),
  component: ExecutiveView,
});

type Metric = "ca" | "margin" | "orders";

function ExecutiveView() {
  const d = useAnalytics();
  const { goals } = useAnalyticsState();
  const [metric, setMetric] = useState<Metric>("ca");
  const [gran, setGran] = useState<Granularity>("month");
  const [drill, setDrill] = useState<null | "ca" | "margin" | "orders" | "cash" | "due">(null);

  const points = useMemo(() => series(d.sales, gran), [d.sales, gran]);
  const countries = byCountry(d.sales);
  const clientsG = byClient(d.sales);
  const cats = byCategory(d.sales);
  const prods = byProduct(d.sales);

  const dRev = d.prev ? delta(d.cur.revenue, d.prev.revenue) : undefined;
  const dMarg = d.prev ? delta(d.cur.margin, d.prev.margin) : undefined;
  const dRate = d.prev ? d.cur.marginPct - d.prev.marginPct : undefined;
  const dOrders = d.prev ? delta(d.cur.orders, d.prev.orders) : undefined;
  const dBasket = d.prev ? delta(d.cur.avgBasket, d.prev.avgBasket) : undefined;

  const list = insights(d.cur, d.prev, cats, clientsG, d.conc, d.cont, d.inactive, d.cash);

  const drillRows = (): Group[] =>
    drill === "ca" || drill === "margin" || drill === "orders" ? countries : [];

  return (
    <div className="space-y-4">
      {/* KPI stratégiques */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <KpiTile label="Chiffre d'affaires" value={eurCompact(d.cur.revenue)} delta={dRev} hint={d.cmp ? `vs ${d.cmp.label}` : undefined} onClick={() => setDrill("ca")} />
        <KpiTile label="Marge brute" value={eurCompact(d.cur.margin)} delta={dMarg} accent="success" onClick={() => setDrill("margin")} />
        <KpiTile label="Taux de marge" value={pct1(d.cur.marginPct)} delta={dRate} deltaUnit=" pt" accent={d.cur.marginPct >= 18 ? "success" : "warning"} onClick={() => setDrill("margin")} />
        <KpiTile label="Commandes" value={num(d.cur.orders)} delta={dOrders} onClick={() => setDrill("orders")} />
        <KpiTile label="Panier moyen" value={eurCompact(d.cur.avgBasket)} delta={dBasket} />
        <KpiTile label="Encaissements" value={eurCompact(d.cash.collected)} hint={`${pct1(d.cash.collectRate)} du facturé`} accent="success" onClick={() => setDrill("cash")} />
        <KpiTile label="À recevoir" value={eurCompact(d.cash.outstanding)} hint={`dont ${eurCompact(d.cash.late)} en retard`} accent={d.cash.late > 0 ? "danger" : "primary"} onClick={() => setDrill("due")} />
      </div>

      {/* Courbe CA & marge */}
      <Section
        title="Évolution du chiffre d'affaires et de la marge"
        description={`${d.range.label}${d.cmp ? ` · comparé à la ${d.cmp.label}` : ""}`}
        action={
          <div className="flex flex-wrap gap-1">
            {(["ca", "margin", "orders"] as Metric[]).map((m) => (
              <button key={m} onClick={() => setMetric(m)}
                className={cn("rounded-md px-2 py-1 text-[11px] font-medium transition-smooth", metric === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}>
                {m === "ca" ? "CA" : m === "margin" ? "Marge" : "Commandes"}
              </button>
            ))}
            <span className="mx-1 w-px bg-border" />
            {(["day", "week", "month", "quarter"] as Granularity[]).map((g) => (
              <button key={g} onClick={() => setGran(g)}
                className={cn("rounded-md px-2 py-1 text-[11px] font-medium transition-smooth", gran === g ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}>
                {g === "day" ? "Jour" : g === "week" ? "Semaine" : g === "month" ? "Mois" : "Trimestre"}
              </button>
            ))}
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={290}>
          <ComposedChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 245)" />
            <XAxis dataKey="label" fontSize={11} stroke="oklch(0.5 0.04 250)" />
            <YAxis yAxisId="l" fontSize={11} stroke="oklch(0.5 0.04 250)" tickFormatter={(v: number) => (metric === "orders" ? String(v) : `${Math.round(v / 1000)}k`)} />
            <YAxis yAxisId="r" orientation="right" fontSize={11} stroke="oklch(0.5 0.04 250)" tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid oklch(0.92 0.015 245)", fontSize: 12 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as { ca: number; margin: number; marginPct: number; orders: number };
                return (
                  <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-elegant">
                    <div className="mb-1 font-semibold">{label}</div>
                    <div>CA : <strong>{eur(p.ca)}</strong></div>
                    <div>Marge : <strong>{eur(p.margin)}</strong></div>
                    <div>Marge : <strong>{pct1(p.marginPct)}</strong></div>
                    <div>Commandes : <strong>{num(p.orders)}</strong></div>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey={metric === "orders" ? "orders" : metric === "margin" ? "margin" : "ca"} name={metric === "orders" ? "Commandes" : metric === "margin" ? "Marge" : "CA"} fill="oklch(0.62 0.18 235)" radius={[4, 4, 0, 0]} barSize={26} />
            <Line yAxisId="r" type="monotone" dataKey="marginPct" name="Taux de marge %" stroke="oklch(0.62 0.16 150)" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Objectifs */}
        <Section title={<span className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Performance vs objectifs</span>} description="Objectifs annuels direction AKWA">
          <div className="space-y-4">
            <Bullet label="Objectif CA" value={d.cur.revenue} goal={goals.revenue} />
            <Bullet label="Objectif taux de marge" value={d.cur.marginPct} goal={goals.marginPct} unit=" %" />
            <Bullet label="Objectif commandes" value={d.cur.orders} goal={goals.orders} format={num} />
          </div>
        </Section>

        {/* Alertes direction */}
        <Section
          className="lg:col-span-2"
          title={<span className="flex items-center gap-2"><TriangleAlert className="h-4 w-4 text-warning" /> Points nécessitant votre attention</span>}
          description="Alertes business consolidées sur la période"
        >
          <div className="grid gap-2 md:grid-cols-2">
            {d.alerts.map((a) => <AlertCard key={a.id} alert={a} />)}
            {d.alerts.length === 0 && <p className="text-sm text-muted-foreground">Aucun point bloquant détecté sur la période.</p>}
          </div>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Top clients" description="Par chiffre d'affaires et marge"><RankBars groups={clientsG} max={6} /></Section>
        <Section title="Top produits" description="Références lubrifiants les plus vendues"><RankBars groups={prods} max={6} /></Section>
        <Section title="Marchés" description="CA par pays de destination"><RankBars groups={countries} max={6} /></Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Où part l'argent" description="Décomposition du chiffre d'affaires jusqu'à la marge réelle">
          <Waterfall steps={d.waterfall} />
        </Section>

        <Section title={<span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-ai" /> Insights &amp; opportunités</span>} description="Lectures générées depuis les données de la période">
          <ul className="space-y-2">
            {list.map((i, k) => (
              <li key={k} className="flex gap-2 rounded-lg border border-border bg-muted/20 p-2.5 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ai" />{i}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Drill-down */}
      <DrillSheet
        open={drill !== null}
        onOpenChange={(v) => !v && setDrill(null)}
        title={
          drill === "ca" ? "Analyse du chiffre d'affaires"
            : drill === "margin" ? "Analyse de la marge"
              : drill === "orders" ? "Analyse des commandes"
                : drill === "cash" ? "Analyse des encaissements" : "Analyse des créances"
        }
        description={`${d.range.label} · exploration par marché, client puis commande`}
      >
        {(drill === "ca" || drill === "margin" || drill === "orders") && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="CA" value={eurCompact(d.cur.revenue)} />
              <MiniStat label="Marge" value={eurCompact(d.cur.margin)} />
              <MiniStat label="Commandes" value={num(d.cur.orders)} />
            </div>
            <Section title="Par période">
              <DataTable
                rows={points}
                columns={[
                  { key: "l", label: "Période", render: (r) => r.label },
                  { key: "ca", label: "CA", align: "right", render: (r) => eur(r.ca), sort: (r) => r.ca },
                  { key: "m", label: "Marge", align: "right", render: (r) => eur(r.margin), sort: (r) => r.margin },
                  { key: "p", label: "Marge %", align: "right", render: (r) => pct1(r.marginPct), sort: (r) => r.marginPct },
                  { key: "o", label: "Cdes", align: "right", render: (r) => num(r.orders), sort: (r) => r.orders },
                ]}
              />
            </Section>
            <Section title="Par pays">
              <DataTable
                rows={drillRows()}
                columns={[
                  { key: "c", label: "Pays", render: (r) => r.label },
                  { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
                  { key: "m", label: "Marge %", align: "right", render: (r) => pct1(r.marginPct), sort: (r) => r.marginPct },
                  { key: "o", label: "Cdes", align: "right", render: (r) => num(r.orders), sort: (r) => r.orders },
                ]}
              />
            </Section>
            <Section title="Par client">
              <DataTable
                rows={clientsG}
                max={10}
                columns={[
                  { key: "c", label: "Client", render: (r) => r.label },
                  { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
                  { key: "m", label: "Marge %", align: "right", render: (r) => pct1(r.marginPct), sort: (r) => r.marginPct },
                ]}
              />
            </Section>
            <Section title="Par commande">
              <DataTable
                rows={[...d.sales].sort((a, b) => b.revenue - a.revenue).slice(0, 12)}
                columns={[
                  { key: "r", label: "Commande", render: (r) => <span className="font-mono text-xs">{r.ref}</span> },
                  { key: "cl", label: "Client", render: (r) => r.client },
                  { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
                  { key: "mp", label: "Marge", align: "right", render: (r) => <span className={marginTone(r.marginPct, d.thresholds).cls}>{pct1(r.marginPct)}</span>, sort: (r) => r.marginPct },
                ]}
              />
            </Section>
          </>
        )}

        {(drill === "cash" || drill === "due") && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Facturé" value={eurCompact(d.cash.invoiced)} />
              <MiniStat label="Encaissé" value={eurCompact(d.cash.collected)} tone="text-success" />
              <MiniStat label="À recevoir" value={eurCompact(d.cash.outstanding)} tone="text-warning" />
            </div>
            <Section title="Aging des créances">
              <DataTable
                rows={d.cash.aging}
                columns={[
                  { key: "l", label: "Ancienneté", render: (r) => r.label },
                  { key: "n", label: "Factures", align: "right", render: (r) => num(r.count) },
                  { key: "a", label: "Montant", align: "right", render: (r) => eur(r.amount) },
                ]}
              />
            </Section>
            <Section title="Clients débiteurs">
              <DataTable
                rows={d.cash.debtors}
                max={10}
                columns={[
                  { key: "c", label: "Client", render: (r) => r.client },
                  { key: "b", label: "Solde", align: "right", render: (r) => eur(r.balance), sort: (r) => r.balance },
                  { key: "d", label: "Retard", align: "right", render: (r) => `${r.delay} j` },
                  { key: "r", label: "Risque", align: "right", render: (r) => <Tag tone={r.risk === "Élevé" ? "danger" : r.risk === "Modéré" ? "warning" : "success"}>{r.risk}</Tag> },
                ]}
              />
            </Section>
          </>
        )}
      </DrillSheet>
    </div>
  );
}
