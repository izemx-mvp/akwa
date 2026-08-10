import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { FileText, FilePlus2, Search, AlertTriangle, Clock, Percent, Wallet, CheckCircle2 } from "lucide-react";
import { Kpi, Panel, Chip } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useBilling, billingKpis, invoiceTotal, paidOf, eur, fdate, invoiceStatusTone,
  billingStore, type InvoiceStatus, type InvoiceType,
} from "@/lib/billing-store";

export const Route = createFileRoute("/admin/facturation/factures/")({
  head: () => ({
    meta: [
      { title: "Factures — Facturation AKWA" },
      { name: "description", content: "Suivi des factures proforma et définitives AKWA : encaissements, échéances et retards de paiement." },
      { property: "og:title", content: "Factures — Facturation AKWA" },
      { property: "og:description", content: "Pilotez la facturation export AKWA : proformas, factures finales et soldes clients." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvoicesList,
});

const STATUSES: (InvoiceStatus | "Tous")[] = [
  "Tous", "Brouillon", "Émise", "Envoyée", "Partiellement payée", "Payée", "En retard", "Annulée", "Remplacée",
];
const TYPES: (InvoiceType | "Tous")[] = ["Tous", "Proforma", "Facture finale"];

function InvoicesList() {
  const state = useBilling();
  const navigate = useNavigate();
  const k = billingKpis(state);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Tous");
  const [type, setType] = useState<(typeof TYPES)[number]>("Tous");
  const [client, setClient] = useState("Tous");

  const clients = useMemo(
    () => ["Tous", ...Array.from(new Set(state.invoices.map((i) => i.client))).sort()],
    [state.invoices],
  );

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.invoices
      .filter((i) => (status === "Tous" ? true : i.status === status))
      .filter((i) => (type === "Tous" ? true : i.type === type))
      .filter((i) => (client === "Tous" ? true : i.client === client))
      .filter((i) =>
        !term || [i.id, i.orderRef, i.client, i.destination, i.quoteId ?? ""].some((v) => v.toLowerCase().includes(term)),
      )
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }, [state.invoices, q, status, type, client]);

  const urgent = state.invoices.filter((i) => i.status === "En retard");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Total facturé" value={eur(k.totalInvoiced)} icon={FileText} />
        <Kpi label="Encaissé" value={eur(k.collected)} icon={Wallet} tone="bg-success/15 text-success" sub={`${k.rate.toFixed(0)} % du facturé`} />
        <Kpi label="Reste à encaisser" value={eur(k.outstanding)} icon={Clock} tone="bg-warning/15 text-warning" />
        <Kpi label="Proformas" value={k.proformas} icon={FilePlus2} />
        <Kpi label="Factures finales" value={k.finals} icon={CheckCircle2} />
        <Kpi label="En retard" value={k.late} icon={AlertTriangle} tone="bg-destructive/15 text-destructive" />
        <Kpi label="Taux de recouvrement" value={`${k.rate.toFixed(1)} %`} icon={Percent} />
      </div>

      {urgent.length > 0 && (
        <Panel title="Actions urgentes" description="Factures échues sans règlement complet.">
          <div className="grid gap-2 md:grid-cols-2">
            {urgent.map((i) => (
              <Link
                key={i.id}
                to="/admin/facturation/factures/$invoiceId"
                params={{ invoiceId: i.id }}
                className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm hover:bg-destructive/10"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold">{i.id} — {i.client}</div>
                  <div className="text-xs text-muted-foreground">Échue le {fdate(i.dueAt)} • Reste {eur(invoiceTotal(i) - paidOf(i.id, state.payments))}</div>
                </div>
                <Chip tone="danger">Relancer</Chip>
              </Link>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title="Toutes les factures"
        description={`${rows.length} facture(s)`}
        action={
          <Button
            size="sm"
            onClick={() => {
              const inv = billingStore.duplicateInvoice("PF-AKW-2026-0187");
              if (inv) {
                toast.success(`Brouillon ${inv.id} créé`);
                navigate({ to: "/admin/facturation/factures/$invoiceId", params: { invoiceId: inv.id } });
              }
            }}
          >
            <FilePlus2 className="mr-1.5 h-3.5 w-3.5" /> Nouvelle facture
          </Button>
        }
      >
        <div className="mb-4 grid gap-2 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-8" placeholder="N° facture, commande, client…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value as never)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as never)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={client} onChange={(e) => setClient(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            {clients.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">N° facture</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Commande</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Émission</th>
                <th className="px-3 py-2">Échéance</th>
                <th className="px-3 py-2 text-right">Montant</th>
                <th className="px-3 py-2 text-right">Payé</th>
                <th className="px-3 py-2 text-right">Reste dû</th>
                <th className="px-3 py-2">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((i) => {
                const total = invoiceTotal(i);
                const paid = paidOf(i.id, state.payments);
                return (
                  <tr
                    key={i.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate({ to: "/admin/facturation/factures/$invoiceId", params: { invoiceId: i.id } })}
                  >
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold">{i.id}</td>
                    <td className="px-3 py-2.5"><Chip tone={i.type === "Proforma" ? "info" : "ai"}>{i.type}</Chip></td>
                    <td className="px-3 py-2.5 font-mono text-xs">{i.orderRef}</td>
                    <td className="px-3 py-2.5">{i.client}<div className="text-[11px] text-muted-foreground">{i.country}</div></td>
                    <td className="px-3 py-2.5 text-xs">{fdate(i.issuedAt)}</td>
                    <td className="px-3 py-2.5 text-xs">{fdate(i.dueAt)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{eur(total)}</td>
                    <td className="px-3 py-2.5 text-right text-success">{eur(paid)}</td>
                    <td className="px-3 py-2.5 text-right">{eur(Math.max(0, total - paid))}</td>
                    <td className="px-3 py-2.5"><Chip tone={invoiceStatusTone(i.status)}>{i.status}</Chip></td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-10 text-center text-sm text-muted-foreground">Aucune facture ne correspond aux filtres.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
