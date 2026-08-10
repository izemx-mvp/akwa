import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useAnalytics, eur, eurCompact, pct1, num } from "@/lib/analytics-store";
import { KpiTile, Section, DataTable, Tag, DrillSheet, MiniStat, Progress } from "@/components/admin/analytics/parts";

export const Route = createFileRoute("/admin/analytics/cash")({
  head: () => ({
    meta: [
      { title: "Facturation & Cash — Analyse AKWA" },
      { name: "description", content: "Encaissements, balance âgée, clients débiteurs et écarts proforma / facture finale chez AKWA." },
      { property: "og:title", content: "Facturation & Cash — Analyse AKWA" },
      { property: "og:description", content: "Pilotage de la trésorerie export : recouvrement, retards de paiement et variances de facturation." },
    ],
  }),
  component: CashView,
});

function CashView() {
  const d = useAnalytics();
  const cash = d.cash;
  const [debtor, setDebtor] = useState<string | null>(null);
  const cur = cash.debtors.find((x) => x.clientId === debtor) ?? null;
  const invoices = d.invoices.filter((i) => i.clientId === debtor);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <KpiTile label="Facturé" value={eurCompact(cash.invoiced)} />
        <KpiTile label="Encaissé" value={eurCompact(cash.collected)} accent="success" />
        <KpiTile label="Reste à encaisser" value={eurCompact(cash.outstanding)} accent="warning" />
        <KpiTile label="En retard" value={eurCompact(cash.late)} hint={`${num(cash.lateCount)} factures`} accent={cash.late ? "danger" : "success"} />
        <KpiTile label="Taux de recouvrement" value={pct1(cash.collectRate)} accent={cash.collectRate >= 85 ? "success" : "warning"} />
        <KpiTile label="Délai moyen de paiement" value={`${Math.round(cash.avgDelay)} j`} />
        <KpiTile label="Factures ouvertes" value={num(cash.open)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section className="lg:col-span-2" title="Facturé vs encaissé" description="Évolution mensuelle de la trésorerie export">
          <ResponsiveContainer width="100%" height={270}>
            <ComposedChart data={cash.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 245)" />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => eur(Number(v))} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="invoiced" name="Facturé" fill="oklch(0.62 0.18 235)" radius={[4, 4, 0, 0]} barSize={22} />
              <Line type="monotone" dataKey="collected" name="Encaissé" stroke="oklch(0.62 0.16 150)" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Balance âgée" description="Ancienneté des créances clients">
          <div className="space-y-3">
            {cash.aging.map((a, i) => (
              <div key={a.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{a.label} <span className="text-muted-foreground">· {num(a.count)}</span></span>
                  <span className="font-semibold">{eur(a.amount)}</span>
                </div>
                <Progress
                  value={cash.outstanding ? (a.amount / cash.outstanding) * 100 : 0}
                  tone={i === 0 ? "bg-success" : i === 1 ? "bg-primary" : i === 2 ? "bg-warning" : "bg-destructive"}
                />
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Clients débiteurs" description="Encours, retard et niveau de risque — cliquez pour le détail des factures">
        <DataTable
          rows={cash.debtors}
          onRow={(r) => setDebtor(r.clientId)}
          columns={[
            { key: "c", label: "Client", render: (r) => <span className="font-medium">{r.client}</span> },
            { key: "i", label: "Facturé", align: "right", render: (r) => eur(r.invoiced), sort: (r) => r.invoiced },
            { key: "p", label: "Encaissé", align: "right", render: (r) => <span className="text-success">{eur(r.paid)}</span>, sort: (r) => r.paid },
            { key: "b", label: "Solde dû", align: "right", render: (r) => <span className="font-semibold text-warning">{eur(r.balance)}</span>, sort: (r) => r.balance },
            { key: "d", label: "Retard max", align: "right", render: (r) => `${num(r.delay)} j`, sort: (r) => r.delay },
            { key: "r", label: "Risque", align: "right", render: (r) => <Tag tone={r.risk === "Élevé" ? "danger" : r.risk === "Modéré" ? "warning" : "success"}>{r.risk}</Tag> },
          ]}
          empty="Aucun encours client sur la période."
        />
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Écarts proforma / facture finale" description="Causes des variations constatées à la facturation définitive">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <MiniStat label="Écart moyen" value={`${cash.avgVariancePct >= 0 ? "+" : ""}${cash.avgVariancePct.toFixed(1).replace(".", ",")} %`} tone={cash.avgVariancePct > 2 ? "text-warning" : "text-success"} />
            <MiniStat label="Postes d'écart" value={num(cash.variance.length)} />
          </div>
          <DataTable
            rows={cash.variance}
            columns={[
              { key: "l", label: "Cause", render: (r) => r.label },
              { key: "n", label: "Occurrences", align: "right", render: (r) => num(r.count) },
              { key: "a", label: "Montant", align: "right", sort: (r) => r.amount, render: (r) => <span className={r.amount >= 0 ? "text-warning" : "text-success"}>{r.amount >= 0 ? "+" : ""}{eur(r.amount)}</span> },
            ]}
            empty="Aucun écart enregistré sur la période."
          />
        </Section>

        <Section title="Santé du recouvrement" description="Lecture synthétique pour la direction">
          <div className="space-y-2 text-sm">
            <p className="rounded-lg border border-border bg-muted/20 p-3">
              {cash.collectRate >= 85
                ? `Le recouvrement est sain : ${pct1(cash.collectRate)} du montant facturé a été encaissé sur la période.`
                : `Le recouvrement est à surveiller : seulement ${pct1(cash.collectRate)} du facturé est encaissé, soit ${eurCompact(cash.outstanding)} en attente.`}
            </p>
            <p className="rounded-lg border border-border bg-muted/20 p-3">
              {cash.late > 0
                ? `${eurCompact(cash.late)} sont en retard de paiement sur ${num(cash.lateCount)} facture(s). Une relance prioritaire est recommandée sur ${cash.debtors[0]?.client ?? "les principaux débiteurs"}.`
                : "Aucune facture en retard de paiement sur la période."}
            </p>
            <p className="rounded-lg border border-border bg-muted/20 p-3">
              Le délai moyen de règlement observé est de {Math.round(cash.avgDelay)} jours après émission de la facture définitive.
            </p>
          </div>
        </Section>
      </div>

      <DrillSheet open={!!cur} onOpenChange={(v) => !v && setDebtor(null)} title={cur?.client ?? ""} description={cur ? `Solde dû ${eur(cur.balance)} · retard maximum ${cur.delay} jours` : ""}>
        {cur && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Facturé" value={eur(cur.invoiced)} />
              <MiniStat label="Encaissé" value={eur(cur.paid)} tone="text-success" />
              <MiniStat label="Solde" value={eur(cur.balance)} tone="text-warning" />
            </div>
            <Section title="Factures du client">
              <DataTable
                rows={invoices}
                columns={[
                  { key: "id", label: "Facture", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
                  { key: "t", label: "Type", render: (r) => <Tag tone={r.type === "Proforma" ? "info" : "ai"}>{r.type}</Tag> },
                  { key: "s", label: "Statut", render: (r) => <Tag tone={r.status === "Payée" ? "success" : r.status === "En retard" ? "danger" : "warning"}>{r.status}</Tag> },
                  { key: "d", label: "Échéance", align: "right", render: (r) => new Date(r.dueAt).toLocaleDateString("fr-FR") },
                ]}
              />
            </Section>
          </>
        )}
      </DrillSheet>
    </div>
  );
}
