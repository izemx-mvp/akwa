import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAnalytics, analyticsStore, useAnalyticsState, eur, eurCompact, pct1, num } from "@/lib/analytics-store";
import { KpiTile, Section, Waterfall, DataTable, Tag, marginTone, DrillSheet, MiniStat } from "@/components/admin/analytics/parts";
import type { Sale } from "@/lib/analytics-store";

export const Route = createFileRoute("/admin/analytics/rentabilite")({
  head: () => ({
    meta: [
      { title: "Rentabilité — Analyse & KPI AKWA" },
      { name: "description", content: "Waterfall de rentabilité, écarts marge prévisionnelle / réelle et classement des commandes AKWA par rentabilité." },
    ],
  }),
  component: ProfitView,
});

function ProfitView() {
  const d = useAnalytics();
  const { thresholds } = useAnalyticsState();
  const [sale, setSale] = useState<Sale | null>(null);

  const under = d.sales.filter((s) => s.marginPct < thresholds.watch);
  const discounts = d.rules.reduce((s, r) => s + r.discounts, 0);
  const gaps = [...d.sales]
    .map((s) => ({ ...s, gap: s.marginPct - s.forecastMarginPct }))
    .sort((a, b) => a.gap - b.gap);
  const avgGap = gaps.length ? gaps.reduce((s, x) => s + x.gap, 0) / gaps.length : 0;
  const top = [...d.sales].sort((a, b) => b.marginPct - a.marginPct).slice(0, 8);
  const flop = [...d.sales].sort((a, b) => a.marginPct - b.marginPct).slice(0, 8);

  const cols = [
    { key: "r", label: "Commande", render: (r: Sale) => <span className="font-mono text-xs">{r.ref}</span> },
    { key: "c", label: "Client", render: (r: Sale) => r.client },
    { key: "ca", label: "CA", align: "right" as const, render: (r: Sale) => eur(r.revenue), sort: (r: Sale) => r.revenue },
    { key: "co", label: "Coût", align: "right" as const, render: (r: Sale) => eur(r.cost), sort: (r: Sale) => r.cost },
    { key: "m", label: "Marge €", align: "right" as const, render: (r: Sale) => eur(r.margin), sort: (r: Sale) => r.margin },
    {
      key: "mp", label: "Marge %", align: "right" as const, sort: (r: Sale) => r.marginPct,
      render: (r: Sale) => {
        const t = marginTone(r.marginPct, thresholds);
        return <Tag tone={t.tone}>{pct1(r.marginPct)} · {t.label}</Tag>;
      },
    },
    { key: "d", label: "Destination", render: (r: Sale) => r.country },
    { key: "rm", label: "Responsable", render: (r: Sale) => r.exportManager },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Chiffre d'affaires" value={eurCompact(d.cur.revenue)} />
        <KpiTile label="Coût total" value={eurCompact(d.cur.cost)} accent="warning" />
        <KpiTile label="Marge brute" value={eurCompact(d.cur.margin)} accent="success" />
        <KpiTile label="Taux de marge" value={pct1(d.cur.marginPct)} accent={d.cur.marginPct >= thresholds.ok ? "success" : "warning"} />
        <KpiTile label="Marge moyenne / commande" value={eurCompact(d.cur.orders ? d.cur.margin / d.cur.orders : 0)} />
        <KpiTile label="Commandes sous seuil" value={num(under.length)} hint={`seuil ${thresholds.watch} %`} accent="danger" />
        <KpiTile label="Marge perdue par remises" value={eurCompact(discounts)} accent="warning" />
        <KpiTile label="Écart prévisionnel / réel" value={`${avgGap >= 0 ? "+" : ""}${avgGap.toFixed(2).replace(".", ",")} pt`} accent={avgGap < 0 ? "danger" : "success"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Waterfall de rentabilité" description="Du chiffre d'affaires à la marge réelle, poste par poste">
          <Waterfall steps={d.waterfall} />
        </Section>

        <Section
          title="Seuils de rentabilité"
          description="Configurables — appliqués à toutes les analyses"
          action={<Settings2 className="h-4 w-4 text-muted-foreground" />}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {([["critical", "Critique <", "danger"], ["watch", "À surveiller <", "warning"], ["ok", "Bonne rentabilité ≥", "success"]] as const).map(([k, label]) => (
              <label key={k} className="block">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Input
                  type="number"
                  value={thresholds[k]}
                  onChange={(e) => analyticsStore.setThresholds({ [k]: Number(e.target.value) })}
                  className="mt-1 h-8 text-sm"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-xs">
            {[
              ["Critique", `< ${thresholds.critical} %`, "danger" as const],
              ["À surveiller", `${thresholds.critical}–${thresholds.watch} %`, "warning" as const],
              ["Correct", `${thresholds.watch}–${thresholds.ok} %`, "info" as const],
              ["Bonne rentabilité", `> ${thresholds.ok} %`, "success" as const],
            ].map(([l, r, tone]) => (
              <div key={l} className="flex items-center justify-between rounded-lg border border-border p-2">
                <Tag tone={tone}>{l}</Tag>
                <span className="text-muted-foreground">{r}</span>
                <span className="font-semibold">{num(d.sales.filter((s) => {
                  if (l === "Critique") return s.marginPct < thresholds.critical;
                  if (l === "À surveiller") return s.marginPct >= thresholds.critical && s.marginPct < thresholds.watch;
                  if (l === "Correct") return s.marginPct >= thresholds.watch && s.marginPct < thresholds.ok;
                  return s.marginPct >= thresholds.ok;
                }).length)} commandes</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Marge prévisionnelle vs marge réelle" description="Écarts constatés entre le devis et la facturation finale">
        <DataTable
          rows={gaps.slice(0, 10)}
          onRow={(r) => setSale(r)}
          columns={[
            { key: "r", label: "Commande", render: (r) => <span className="font-mono text-xs">{r.ref}</span> },
            { key: "c", label: "Client", render: (r) => r.client },
            { key: "f", label: "Marge prévue", align: "right", render: (r) => pct1(r.forecastMarginPct), sort: (r) => r.forecastMarginPct },
            { key: "m", label: "Marge finale", align: "right", render: (r) => pct1(r.marginPct), sort: (r) => r.marginPct },
            { key: "g", label: "Écart", align: "right", sort: (r) => r.gap, render: (r) => <span className={r.gap < 0 ? "text-destructive" : "text-success"}>{r.gap >= 0 ? "+" : ""}{r.gap.toFixed(1).replace(".", ",")} pt</span> },
            { key: "cause", label: "Cause principale", render: (r) => (r.gap < 0 ? (r.costs.insurance > r.costs.documentation ? "Assurance finale plus élevée" : "Frais portuaires supplémentaires") : "Fret négocié à la baisse") },
          ]}
        />
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Top commandes rentables"><DataTable rows={top} columns={cols} onRow={setSale} /></Section>
        <Section title="Commandes à faible rentabilité"><DataTable rows={flop} columns={cols} onRow={setSale} /></Section>
      </div>

      <DrillSheet open={!!sale} onOpenChange={(v) => !v && setSale(null)} title={sale?.ref ?? ""} description={sale ? `${sale.client} · ${sale.country} · ${sale.incoterm}` : ""}>
        {sale && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="CA" value={eur(sale.revenue)} />
              <MiniStat label="Coût" value={eur(sale.cost)} />
              <MiniStat label="Marge" value={`${eur(sale.margin)} · ${pct1(sale.marginPct)}`} tone={marginTone(sale.marginPct, thresholds).cls} />
            </div>
            <Section title="Structure de coûts">
              <DataTable
                rows={Object.entries(sale.costs).map(([k, v]) => ({ k, v }))}
                columns={[
                  { key: "k", label: "Poste", render: (r) => ({ goods: "Marchandises", freight: "Fret maritime", localTransport: "Transport local", insurance: "Assurance", preparation: "Préparation", documentation: "Documentation", other: "Autres" } as Record<string, string>)[r.k] ?? r.k },
                  { key: "v", label: "Montant", align: "right", render: (r) => eur(r.v) },
                ]}
              />
            </Section>
            <Section title="Lignes produits">
              <DataTable
                rows={sale.lines}
                columns={[
                  { key: "p", label: "Produit", render: (r) => r.product },
                  { key: "l", label: "Litres", align: "right", render: (r) => num(r.litres) },
                  { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue) },
                  { key: "m", label: "Marge", align: "right", render: (r) => eur(r.revenue - r.cost) },
                ]}
              />
            </Section>
          </>
        )}
      </DrillSheet>
    </div>
  );
}
