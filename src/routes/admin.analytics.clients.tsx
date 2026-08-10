import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAnalytics, eur, eurCompact, pct1, num, byCountry, byZone } from "@/lib/analytics-store";
import { KpiTile, Section, Scatter, DataTable, Tag, RankBars, DrillSheet, MiniStat, marginTone } from "@/components/admin/analytics/parts";

export const Route = createFileRoute("/admin/analytics/clients")({
  head: () => ({
    meta: [
      { title: "Analyse clients — AKWA" },
      { name: "description", content: "Matrice CA / marge, concentration du portefeuille et clients à réactiver pour l'activité export AKWA." },
      { property: "og:title", content: "Analyse clients — AKWA" },
      { property: "og:description", content: "Segmentation, rentabilité et risque de paiement du portefeuille clients AKWA." },
    ],
  }),
  component: ClientsView,
});

function ClientsView() {
  const d = useAnalytics();
  const [sel, setSel] = useState<string | null>(null);
  const rows = d.clientInsights;
  const cur = rows.find((r) => r.key === sel) ?? null;
  const countries = byCountry(d.sales);
  const zones = byZone(d.sales);
  const inactifs = rows.filter((r) => r.daysSinceLast > 90);
  const avgRevenue = rows.length ? d.cur.revenue / rows.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiTile label="Clients actifs" value={num(d.cur.clients)} />
        <KpiTile label="CA moyen / client" value={eurCompact(avgRevenue)} />
        <KpiTile label="Top 5 clients" value={pct1(d.conc.top5)} hint="part du CA" accent={d.conc.top5 > 60 ? "warning" : "primary"} />
        <KpiTile label="Top 10 clients" value={pct1(d.conc.top10)} hint="part du CA" />
        <KpiTile label="Clients à réactiver" value={num(inactifs.length)} accent={inactifs.length ? "warning" : "success"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Section className="xl:col-span-2" title="Matrice CA × marge" description="Chaque bulle est un client — taille proportionnelle au nombre de commandes">
          <Scatter
            xLabel="Chiffre d'affaires →"
            yLabel="↑ Taux de marge"
            avgX={avgRevenue}
            avgY={d.cur.marginPct}
            onPoint={(p) => setSel(p.key)}
            points={rows.map((r) => ({
              key: r.key,
              label: r.label,
              x: r.revenue,
              y: r.marginPct,
              r: r.orders,
              meta: (
                <div className="space-y-0.5 text-muted-foreground">
                  <div>CA : <strong className="text-foreground">{eur(r.revenue)}</strong></div>
                  <div>Marge : <strong className="text-foreground">{pct1(r.marginPct)}</strong></div>
                  <div>Commandes : <strong className="text-foreground">{num(r.orders)}</strong></div>
                  <div>Segment : <strong className="text-foreground">{r.segment}</strong></div>
                </div>
              ),
            }))}
          />
        </Section>
        <Section title="Concentration du portefeuille" description="Dépendance commerciale AKWA">
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Top 3" value={pct1(d.conc.top3)} />
            <MiniStat label="Top 5" value={pct1(d.conc.top5)} />
            <MiniStat label="Top 10" value={pct1(d.conc.top10)} />
            <MiniStat label="Autres clients" value={pct1(d.conc.others)} />
          </div>
          <p className="mt-3 rounded-lg border border-border bg-muted/20 p-2.5 text-xs text-muted-foreground">
            {d.conc.top5 > 60
              ? "Concentration élevée : la perte d'un client majeur impacterait fortement le chiffre d'affaires. Diversification recommandée."
              : "Portefeuille correctement diversifié, aucune dépendance critique détectée."}
          </p>
          <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zones</h3>
          <RankBars groups={zones} max={5} />
        </Section>
      </div>

      <Section title="Portefeuille clients" description="Volume, rentabilité, fidélité et encours — cliquez pour ouvrir la fiche">
        <DataTable
          rows={rows}
          onRow={(r) => setSel(r.key)}
          columns={[
            { key: "n", label: "Client", render: (r) => <span className="font-medium">{r.label}</span> },
            { key: "p", label: "Pays", render: (r) => r.country },
            { key: "s", label: "Segment", render: (r) => <Tag tone={r.segment === "Stratégique" ? "success" : r.segment === "À optimiser" ? "warning" : r.segment === "À développer" ? "info" : "muted"}>{r.segment}</Tag> },
            { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
            { key: "m", label: "Marge %", align: "right", sort: (r) => r.marginPct, render: (r) => <span className={marginTone(r.marginPct, d.thresholds).cls}>{pct1(r.marginPct)}</span> },
            { key: "o", label: "Commandes", align: "right", render: (r) => num(r.orders), sort: (r) => r.orders },
            { key: "b", label: "Panier moyen", align: "right", render: (r) => eur(r.avgBasket), sort: (r) => r.avgBasket },
            { key: "f", label: "Fréquence", align: "right", render: (r) => (r.frequencyDays ? `1 cde / ${num(r.frequencyDays)} j` : "—") },
            { key: "d", label: "Dernière cde", align: "right", render: (r) => `${num(r.daysSinceLast)} j`, sort: (r) => r.daysSinceLast },
            { key: "e", label: "Encours", align: "right", render: (r) => eur(r.balance), sort: (r) => r.balance },
            { key: "r", label: "Risque", align: "right", render: (r) => <Tag tone={r.risk === "Élevé" ? "danger" : r.risk === "Modéré" ? "warning" : "success"}>{r.risk}</Tag> },
          ]}
        />
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Clients à réactiver" description="Aucune commande depuis plus de 90 jours">
          <DataTable
            rows={inactifs}
            columns={[
              { key: "n", label: "Client", render: (r) => r.label },
              { key: "d", label: "Inactivité", align: "right", render: (r) => `${num(r.daysSinceLast)} j`, sort: (r) => r.daysSinceLast },
              { key: "ca", label: "CA historique", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
              { key: "a", label: "Action", align: "right", render: () => <Tag tone="ai">Relance commerciale</Tag> },
            ]}
            empty="Tous les clients ont commandé récemment."
          />
        </Section>
        <Section title="Performance par pays" description="Marchés export AKWA">
          <DataTable
            rows={countries}
            columns={[
              { key: "c", label: "Pays", render: (r) => r.label },
              { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
              { key: "m", label: "Marge %", align: "right", render: (r) => pct1(r.marginPct), sort: (r) => r.marginPct },
              { key: "o", label: "Commandes", align: "right", render: (r) => num(r.orders), sort: (r) => r.orders },
              { key: "cl", label: "Clients", align: "right", render: (r) => num(r.clients) },
            ]}
          />
        </Section>
      </div>

      <DrillSheet open={!!cur} onOpenChange={(v) => !v && setSel(null)} title={cur?.label ?? ""} description={cur ? `${cur.country} · ${cur.segment} · risque ${cur.risk.toLowerCase()}` : ""}>
        {cur && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="CA" value={eur(cur.revenue)} />
              <MiniStat label="Marge" value={pct1(cur.marginPct)} tone={marginTone(cur.marginPct, d.thresholds).cls} />
              <MiniStat label="Encours" value={eur(cur.balance)} tone={cur.balance ? "text-warning" : undefined} />
            </div>
            <Section title="Commandes">
              <DataTable
                rows={d.sales.filter((s) => s.clientId === cur.key)}
                columns={[
                  { key: "r", label: "Réf", render: (r) => <span className="font-mono text-xs">{r.ref}</span> },
                  { key: "d", label: "Date", render: (r) => new Date(r.date).toLocaleDateString("fr-FR") },
                  { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
                  { key: "m", label: "Marge", align: "right", render: (r) => pct1(r.marginPct), sort: (r) => r.marginPct },
                ]}
              />
            </Section>
            <Section title="Produits achetés">
              <DataTable
                rows={Object.values(
                  d.sales.filter((s) => s.clientId === cur.key).flatMap((s) => s.lines).reduce((acc, l) => {
                    acc[l.product] = acc[l.product] ?? { product: l.product, litres: 0, revenue: 0 };
                    acc[l.product].litres += l.litres;
                    acc[l.product].revenue += l.revenue;
                    return acc;
                  }, {} as Record<string, { product: string; litres: number; revenue: number }>),
                ).sort((a, b) => b.revenue - a.revenue)}
                max={10}
                columns={[
                  { key: "p", label: "Produit", render: (r) => r.product },
                  { key: "l", label: "Litres", align: "right", render: (r) => num(r.litres) },
                  { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
                ]}
              />
            </Section>
          </>
        )}
      </DrillSheet>
    </div>
  );
}
