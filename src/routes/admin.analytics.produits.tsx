import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { useAnalytics, byCategory, byProduct, bySupplier, eur, eurCompact, pct1, num, litres } from "@/lib/analytics-store";
import { KpiTile, Section, DataTable, Tag, RankBars, DrillSheet, MiniStat, marginTone } from "@/components/admin/analytics/parts";

export const Route = createFileRoute("/admin/analytics/produits")({
  head: () => ({
    meta: [
      { title: "Produits & Pricing — Analyse AKWA" },
      { name: "description", content: "Performance des catégories de lubrifiants, dérive des prix d'achat et impact des règles tarifaires AKWA." },
      { property: "og:title", content: "Produits & Pricing — Analyse AKWA" },
      { property: "og:description", content: "Rentabilité par référence, catégories et effet des règles de prix sur la marge." },
    ],
  }),
  component: ProductsView,
});

function ProductsView() {
  const d = useAnalytics();
  const [cat, setCat] = useState<string | null>(null);
  const cats = byCategory(d.sales);
  const prods = byProduct(d.sales);
  const sups = bySupplier(d.sales);
  const rules = d.rules;
  const risky = d.drift.filter((p) => p.costVar > 5);
  const best = prods[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiTile label="Références vendues" value={num(prods.length)} />
        <KpiTile label="Volume total" value={litres(d.cur.litres)} />
        <KpiTile label="Catégories actives" value={num(cats.length)} />
        <KpiTile label="Référence n°1" value={best ? best.label.split(" ").slice(0, 3).join(" ") : "—"} hint={best ? eurCompact(best.revenue) : undefined} />
        <KpiTile label="Hausses fournisseurs" value={num(risky.length)} hint="prix d'achat en hausse" accent={risky.length ? "warning" : "success"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section className="lg:col-span-2" title="Performance par catégorie" description="CA et taux de marge par famille de produits AKWA">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cats.map((c) => ({ ...c, short: c.label }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 245)" />
              <XAxis dataKey="short" fontSize={10} interval={0} angle={-12} textAnchor="end" height={54} />
              <YAxis fontSize={11} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
              <Tooltip
                formatter={(v) => eur(Number(v))}
                contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid oklch(0.92 0.015 245)" }}
              />
              <Bar dataKey="revenue" name="CA" radius={[4, 4, 0, 0]} barSize={38} onClick={(p) => setCat((p as unknown as { payload?: { label?: string } }).payload?.label ?? null)}>
                {cats.map((c) => (
                  <Cell key={c.key} fill={c.marginPct >= d.thresholds.ok ? "oklch(0.62 0.16 150)" : c.marginPct >= d.thresholds.watch ? "oklch(0.62 0.18 235)" : "oklch(0.68 0.17 55)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Vert : marge &gt; {d.thresholds.ok} % · Bleu : marge correcte · Orange : marge sous {d.thresholds.watch} %. Cliquez sur une barre pour explorer la catégorie.
          </p>
        </Section>

        <Section title="Top références" description="Par chiffre d'affaires">
          <RankBars groups={prods} max={8} />
        </Section>
      </div>

      <Section title="Détail par catégorie" description="Volume, marge et poids dans le chiffre d'affaires">
        <DataTable
          rows={cats}
          onRow={(r) => setCat(r.label)}
          columns={[
            { key: "c", label: "Catégorie", render: (r) => <span className="font-medium">{r.label}</span> },
            { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
            { key: "part", label: "Part du CA", align: "right", render: (r) => pct1(d.cur.revenue ? (r.revenue / d.cur.revenue) * 100 : 0) },
            { key: "l", label: "Volume", align: "right", render: (r) => litres(r.litres), sort: (r) => r.litres },
            { key: "m", label: "Marge €", align: "right", render: (r) => eur(r.margin), sort: (r) => r.margin },
            { key: "mp", label: "Marge %", align: "right", sort: (r) => r.marginPct, render: (r) => <Tag tone={marginTone(r.marginPct, d.thresholds).tone}>{pct1(r.marginPct)}</Tag> },
            { key: "cl", label: "Clients", align: "right", render: (r) => num(r.clients) },
          ]}
        />
      </Section>

      <Section title="Rentabilité par référence" description="Les meilleures ventes ne sont pas toujours les plus rentables">
        <DataTable
          rows={prods}
          max={15}
          columns={[
            { key: "r", label: "Référence", render: (r) => <span className="font-mono text-xs">{r.key}</span> },
            { key: "n", label: "Produit", render: (r) => r.label },
            { key: "l", label: "Volume", align: "right", render: (r) => litres(r.litres), sort: (r) => r.litres },
            { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
            { key: "m", label: "Marge €", align: "right", render: (r) => eur(r.margin), sort: (r) => r.margin },
            { key: "mp", label: "Marge %", align: "right", sort: (r) => r.marginPct, render: (r) => <span className={marginTone(r.marginPct, d.thresholds).cls}>{pct1(r.marginPct)}</span> },
            { key: "o", label: "Commandes", align: "right", render: (r) => num(r.orders), sort: (r) => r.orders },
          ]}
        />
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Dérive des prix d'achat / vente" description="Écart entre l'évolution du coût fournisseur et du prix de vente">
          <DataTable
            rows={d.drift}
            max={12}
            columns={[
              { key: "n", label: "Produit", render: (r) => r.name },
              { key: "c", label: "Prix d'achat", align: "right", sort: (r) => r.costVar, render: (r) => <span className={r.costVar > 0 ? "text-destructive" : "text-success"}>{r.costVar >= 0 ? "+" : ""}{r.costVar.toFixed(1).replace(".", ",")} %</span> },
              { key: "s", label: "Prix de vente", align: "right", sort: (r) => r.saleVar, render: (r) => <span className={r.saleVar >= 0 ? "text-success" : "text-warning"}>{r.saleVar >= 0 ? "+" : ""}{r.saleVar.toFixed(1).replace(".", ",")} %</span> },
              { key: "m", label: "Marge actuelle", align: "right", render: (r) => pct1(r.marginNow), sort: (r) => r.marginNow },
              { key: "i", label: "Effet marge", align: "right", sort: (r) => r.impact, render: (r) => <Tag tone={r.impact < -1 ? "danger" : r.impact < 0 ? "warning" : "success"}>{r.impact >= 0 ? "+" : ""}{r.impact.toFixed(1).replace(".", ",")} pt</Tag> },
            ]}
          />
        </Section>

        <Section title="Impact des règles tarifaires" description="Effet réel des règles pricing sur le CA et la marge">
          <DataTable
            rows={rules}
            max={12}
            columns={[
              { key: "n", label: "Règle", render: (r) => <span className="font-medium">{r.name}</span> },
              { key: "s", label: "Statut", render: (r) => <Tag tone={r.status === "Active" ? "success" : "warning"}>{r.status}</Tag> },
              { key: "o", label: "Commandes", align: "right", render: (r) => num(r.orders), sort: (r) => r.orders },
              { key: "ca", label: "CA concerné", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
              { key: "d", label: "Remises", align: "right", render: (r) => <span className="text-warning">−{eur(r.discounts)}</span>, sort: (r) => r.discounts },
              { key: "m", label: "Marge %", align: "right", sort: (r) => r.marginPct, render: (r) => <span className={marginTone(r.marginPct, d.thresholds).cls}>{pct1(r.marginPct)}</span> },
              { key: "i", label: "Impact", align: "right", render: (r) => <Tag tone={r.impact === "Positif" ? "success" : r.impact === "Neutre" ? "info" : "warning"}>{r.impact}</Tag> },
            ]}
          />
        </Section>
      </div>

      <Section title="Contribution des fournisseurs" description="Poids et rentabilité des sources d'approvisionnement">
        <DataTable
          rows={sups}
          columns={[
            { key: "s", label: "Fournisseur", render: (r) => r.label },
            { key: "ca", label: "CA généré", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
            { key: "l", label: "Volume", align: "right", render: (r) => litres(r.litres), sort: (r) => r.litres },
            { key: "m", label: "Marge %", align: "right", render: (r) => pct1(r.marginPct), sort: (r) => r.marginPct },
            { key: "o", label: "Commandes", align: "right", render: (r) => num(r.orders), sort: (r) => r.orders },
          ]}
        />
      </Section>

      <DrillSheet open={!!cat} onOpenChange={(v) => !v && setCat(null)} title={cat ?? ""} description="Détail de la catégorie sur la période sélectionnée">
        {cat && (() => {
          const g = cats.find((c) => c.label === cat);
          const items = prods.filter((p) => d.sales.some((s) => s.lines.some((l) => l.productRef === p.key && l.category === cat)));
          return (
            <>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="CA" value={eur(g?.revenue ?? 0)} />
                <MiniStat label="Marge" value={pct1(g?.marginPct ?? 0)} tone={marginTone(g?.marginPct ?? 0, d.thresholds).cls} />
                <MiniStat label="Volume" value={litres(g?.litres ?? 0)} />
              </div>
              <Section title="Références de la catégorie">
                <DataTable
                  rows={items}
                  columns={[
                    { key: "n", label: "Produit", render: (r) => r.label },
                    { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
                    { key: "m", label: "Marge %", align: "right", render: (r) => pct1(r.marginPct), sort: (r) => r.marginPct },
                  ]}
                />
              </Section>
            </>
          );
        })()}
      </DrillSheet>
    </div>
  );
}
