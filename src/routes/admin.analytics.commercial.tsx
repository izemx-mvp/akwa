import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  useAnalytics, byCommercial, eur, eurCompact, pct1, num,
} from "@/lib/analytics-store";
import { KpiTile, Section, Funnel, DataTable, DrillSheet, MiniStat, Tag } from "@/components/admin/analytics/parts";

export const Route = createFileRoute("/admin/analytics/commercial")({
  head: () => ({
    meta: [
      { title: "Analyse commerciale — AKWA" },
      { name: "description", content: "Funnel commercial, performance des devis et classement des commerciaux AKWA sur l'export de lubrifiants." },
    ],
  }),
  component: CommercialView,
});

function CommercialView() {
  const d = useAnalytics();
  const [step, setStep] = useState<string | null>(null);
  const q = d.q;
  const reps = byCommercial(d.sales);
  const newClients = d.clientInsights.filter((c) => c.orders <= 2).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiTile label="Chiffre d'affaires" value={eurCompact(d.cur.revenue)} />
        <KpiTile label="Commandes" value={num(d.cur.orders)} />
        <KpiTile label="Panier moyen" value={eurCompact(d.cur.avgBasket)} />
        <KpiTile label="Devis" value={num(q.count)} hint={`${eurCompact(q.avgAmount)} en moyenne`} />
        <KpiTile label="Valeur totale devis" value={eurCompact(q.acceptedValue + q.pendingValue + q.lostValue)} />
        <KpiTile label="Taux d'acceptation" value={pct1(q.acceptRate)} accent={q.acceptRate > 65 ? "success" : "warning"} />
        <KpiTile label="Temps moyen de réponse" value={`${q.avgResponseDays.toFixed(1).replace(".", ",")} j`} />
        <KpiTile label="Nouveaux clients" value={num(newClients)} />
        <KpiTile label="Clients actifs" value={num(d.cur.clients)} />
        <KpiTile label="Devis en attente" value={eurCompact(q.pendingValue)} accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Funnel commercial" description="De la commande reçue à la commande exécutée">
          <Funnel steps={d.funnel} onStep={(s) => setStep(s.label)} />
        </Section>

        <Section title="Analyse des devis" description="Décisions clients sur la période">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat label="Acceptation" value={pct1(q.acceptRate)} tone="text-success" />
            <MiniStat label="Refus" value={pct1(q.refuseRate)} tone="text-destructive" />
            <MiniStat label="Expiration" value={pct1(q.expireRate)} tone="text-warning" />
            <MiniStat label="Délai moyen" value={`${q.avgResponseDays.toFixed(1).replace(".", ",")} j`} />
            <MiniStat label="Montant moyen" value={eurCompact(q.avgAmount)} />
            <MiniStat label="En attente" value={eurCompact(q.pendingValue)} tone="text-warning" />
            <MiniStat label="Acceptés" value={eurCompact(q.acceptedValue)} tone="text-success" />
            <MiniStat label="Valeur perdue" value={eurCompact(q.lostValue)} tone="text-destructive" />
          </div>

          <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Motifs de refus</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={q.reasons} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 245)" />
              <XAxis type="number" fontSize={11} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
              <YAxis type="category" dataKey="label" fontSize={11} width={130} />
              <Tooltip formatter={(v: number) => eur(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="value" fill="oklch(0.62 0.18 25)" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Performance par commercial" description="Volume ET rentabilité — le classement CA seul ne suffit pas">
        <DataTable
          rows={reps.map((r) => {
            const sales = d.sales.filter((s) => s.commercial === r.key);
            const quotes = sales.map((s) => s.quote);
            const acc = quotes.filter((x) => x.status === "Accepté").length;
            return {
              ...r,
              sent: quotes.length,
              acceptRate: quotes.length ? (acc / quotes.length) * 100 : 0,
              avgBasket: r.orders ? r.revenue / r.orders : 0,
              newClients: new Set(sales.filter((s) => s.quote.status === "Accepté").map((s) => s.clientId)).size,
            };
          })}
          columns={[
            { key: "n", label: "Commercial", render: (r) => <span className="font-medium">{r.label}</span> },
            { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
            { key: "o", label: "Commandes", align: "right", render: (r) => num(r.orders), sort: (r) => r.orders },
            { key: "s", label: "Devis envoyés", align: "right", render: (r) => num(r.sent), sort: (r) => r.sent },
            { key: "a", label: "Taux acceptation", align: "right", render: (r) => <Tag tone={r.acceptRate > 70 ? "success" : "warning"}>{pct1(r.acceptRate)}</Tag>, sort: (r) => r.acceptRate },
            { key: "m", label: "Marge générée", align: "right", render: (r) => eur(r.margin), sort: (r) => r.margin },
            { key: "mp", label: "Marge %", align: "right", render: (r) => pct1(r.marginPct), sort: (r) => r.marginPct },
            { key: "b", label: "Panier moyen", align: "right", render: (r) => eur(r.avgBasket), sort: (r) => r.avgBasket },
            { key: "nc", label: "Clients", align: "right", render: (r) => num(r.clients), sort: (r) => r.clients },
          ]}
        />
      </Section>

      <DrillSheet open={step !== null} onOpenChange={(v) => !v && setStep(null)} title={step ?? ""} description="Commandes concernées par cette étape du funnel">
        <DataTable
          rows={d.sales.slice(0, 25)}
          columns={[
            { key: "r", label: "Commande", render: (r) => <span className="font-mono text-xs">{r.ref}</span> },
            { key: "c", label: "Client", render: (r) => r.client },
            { key: "s", label: "Statut", render: (r) => <Tag tone="info">{r.status}</Tag> },
            { key: "q", label: "Devis", render: (r) => <Tag tone={r.quote.status === "Accepté" ? "success" : r.quote.status === "Refusé" ? "danger" : "warning"}>{r.quote.status}</Tag> },
            { key: "ca", label: "CA", align: "right", render: (r) => eur(r.revenue), sort: (r) => r.revenue },
          ]}
        />
      </DrillSheet>
    </div>
  );
}
