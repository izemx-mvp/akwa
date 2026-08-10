import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Ship } from "lucide-react";
import { useAnalytics, byPort, byCountry, eur, eurCompact, pct1, num, litres, type Sale } from "@/lib/analytics-store";
import { KpiTile, Section, DataTable, Tag, Progress, DrillSheet, MiniStat } from "@/components/admin/analytics/parts";

export const Route = createFileRoute("/admin/analytics/export")({
  head: () => ({
    meta: [
      { title: "Export & Logistique — Analyse AKWA" },
      { name: "description", content: "Taux de remplissage conteneurs, coût logistique au litre et ponctualité des expéditions AKWA." },
      { property: "og:title", content: "Export & Logistique — Analyse AKWA" },
      { property: "og:description", content: "Optimisation des conteneurs, économies estimées et performance des corridors maritimes." },
    ],
  }),
  component: ExportView,
});

function ExportView() {
  const d = useAnalytics();
  const [sale, setSale] = useState<Sale | null>(null);
  const c = d.cont;
  const ports = byPort(d.sales);
  const countries = byCountry(d.sales);
  const under = d.sales.filter((s) => s.container.fillPct < 75);
  const logisticsShare = d.cur.revenue ? (d.cur.logisticsCost / d.cur.revenue) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <KpiTile label="Conteneurs expédiés" value={num(d.cur.containers)} />
        <KpiTile label="Taux de remplissage" value={pct1(c.avgFill)} accent={c.avgFill >= 85 ? "success" : "warning"} />
        <KpiTile label="Volume expédié" value={litres(d.cur.litres)} />
        <KpiTile label="Coût logistique" value={eurCompact(d.cur.logisticsCost)} hint={`${pct1(logisticsShare)} du CA`} accent="warning" />
        <KpiTile label="Coût / conteneur" value={eurCompact(c.costPerContainer)} />
        <KpiTile label="Livraisons à l'heure" value={pct1(d.cur.onTimeRate)} accent={d.cur.onTimeRate >= 90 ? "success" : "warning"} hint={`${num(d.cur.late)} en retard`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Distribution du remplissage" description="Répartition des commandes par niveau d'optimisation">
          <div className="space-y-3">
            {c.buckets.map((b) => (
              <div key={b.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{b.label}</span>
                  <span className="font-semibold">{num(b.count)} cdes</span>
                </div>
                <Progress
                  value={d.cur.orders ? (b.count / d.cur.orders) * 100 : 0}
                  tone={b.tone === "success" ? "bg-success" : b.tone === "info" ? "bg-primary" : b.tone === "warning" ? "bg-warning" : "bg-destructive"}
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Économies liées à l'optimisation" description="Effet de l'Agent Conteneur sur le coût de fret">
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Coût sans optimisation" value={eurCompact(c.baselineCost)} />
            <MiniStat label="Coût réel" value={eurCompact(c.optimizedCost)} tone="text-success" />
            <MiniStat label="Économies estimées" value={eurCompact(c.savings)} tone="text-success" />
            <MiniStat label="Conteneurs évités" value={num(c.savedContainers)} />
            <MiniStat label="Volume non utilisé" value={`${num(c.unused)} m³`} tone="text-warning" />
            <MiniStat label="Coût / litre" value={`${c.costPerLitre.toFixed(2).replace(".", ",")} €`} />
          </div>
          <p className="mt-3 rounded-lg border border-border bg-muted/20 p-2.5 text-xs text-muted-foreground">
            {c.underfilled > 0
              ? `${c.underfilled} commande(s) sous 75 % de remplissage : un regroupement d'expéditions permettrait d'économiser environ ${eurCompact(c.savings)}.`
              : "Toutes les expéditions dépassent 75 % de remplissage : l'optimisation est déjà efficace."}
          </p>
        </Section>

        <Section title={<span className="flex items-center gap-2"><Ship className="h-4 w-4 text-primary" /> Parc conteneurs</span>} description="Types utilisés sur la période">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ t: "20'", n: c.c20 }, { t: "40'", n: c.c40 }, { t: "40' HC", n: c.chc }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 245)" />
              <XAxis dataKey="t" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="n" name="Conteneurs" fill="oklch(0.62 0.18 235)" radius={[4, 4, 0, 0]} barSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Performance par corridor" description="Ports de destination : volume, coût logistique et rentabilité">
        <DataTable
          rows={ports}
          columns={[
            { key: "p", label: "Port", render: (r) => <span className="font-medium">{r.label}</span> },
            { key: "o", label: "Expéditions", align: "right", render: (r) => num(r.orders), sort: (r) => r.orders },
            { key: "l", label: "Volume", align: "right", render: (r) => litres(r.litres), sort: (r) => r.litres },
            { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
            { key: "lc", label: "Coût logistique", align: "right", render: (r) => eur(r.logisticsCost), sort: (r) => r.logisticsCost },
            { key: "sh", label: "Part du CA", align: "right", render: (r) => pct1(r.revenue ? (r.logisticsCost / r.revenue) * 100 : 0) },
            { key: "m", label: "Marge %", align: "right", render: (r) => pct1(r.marginPct), sort: (r) => r.marginPct },
          ]}
        />
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Commandes sous-optimisées" description="Remplissage inférieur à 75 % — potentiel de regroupement">
          <DataTable
            rows={under}
            onRow={setSale}
            columns={[
              { key: "r", label: "Commande", render: (r) => <span className="font-mono text-xs">{r.ref}</span> },
              { key: "c", label: "Client", render: (r) => r.client },
              { key: "f", label: "Remplissage", align: "right", sort: (r) => r.container.fillPct, render: (r) => <Tag tone="warning">{pct1(r.container.fillPct)}</Tag> },
              { key: "t", label: "Type", align: "right", render: (r) => r.container.type },
              { key: "co", label: "Coût fret", align: "right", render: (r) => eur(r.costs.freight), sort: (r) => r.costs.freight },
            ]}
            empty="Aucune expédition sous-optimisée."
          />
        </Section>

        <Section title="Ponctualité par destination" description="Respect des délais annoncés au client">
          <DataTable
            rows={countries.map((g) => {
              const s = d.sales.filter((x) => x.country === g.label);
              const ok = s.filter((x) => x.onTime).length;
              return { ...g, rate: s.length ? (ok / s.length) * 100 : 0, late: s.length - ok };
            })}
            columns={[
              { key: "c", label: "Pays", render: (r) => r.label },
              { key: "o", label: "Expéditions", align: "right", render: (r) => num(r.orders), sort: (r) => r.orders },
              { key: "r", label: "À l'heure", align: "right", sort: (r) => r.rate, render: (r) => <Tag tone={r.rate >= 90 ? "success" : r.rate >= 75 ? "warning" : "danger"}>{pct1(r.rate)}</Tag> },
              { key: "l", label: "Retards", align: "right", render: (r) => num(r.late), sort: (r) => r.late },
            ]}
          />
        </Section>
      </div>

      <DrillSheet open={!!sale} onOpenChange={(v) => !v && setSale(null)} title={sale?.ref ?? ""} description={sale ? `${sale.client} · ${sale.port} · ${sale.incoterm}` : ""}>
        {sale && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Remplissage" value={pct1(sale.container.fillPct)} tone="text-warning" />
              <MiniStat label="Conteneurs" value={`${num(sale.container.count)} × ${sale.container.type}`} />
              <MiniStat label="Volume" value={litres(sale.litres)} />
            </div>
            <Section title="Coûts logistiques">
              <DataTable
                rows={[
                  { k: "Fret maritime", v: sale.costs.freight },
                  { k: "Transport local", v: sale.costs.localTransport },
                  { k: "Assurance", v: sale.costs.insurance },
                  { k: "Documentation", v: sale.costs.documentation },
                ]}
                columns={[
                  { key: "k", label: "Poste", render: (r) => r.k },
                  { key: "v", label: "Montant", align: "right", render: (r) => eur(r.v) },
                ]}
              />
            </Section>
          </>
        )}
      </DrillSheet>
    </div>
  );
}
