import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Wallet, Clock, AlertTriangle, Search, Link2, ShieldQuestion, Plus, TrendingUp } from "lucide-react";
import { Kpi, Panel, Chip } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useBilling, billingStore, paymentKpis, eur, eur2, fdate, paymentStatusTone,
  invoiceTotal, paidOf, type PaymentStatus, type PaymentMethod, type PaymentKind,
} from "@/lib/billing-store";

export const Route = createFileRoute("/admin/facturation/paiements/")({
  head: () => ({
    meta: [
      { title: "Paiements — Facturation AKWA" },
      { name: "description", content: "Encaissements clients AKWA : suivi des virements, acomptes, soldes et rapprochement bancaire." },
      { property: "og:title", content: "Paiements — Facturation AKWA" },
      { property: "og:description", content: "Pilotez les encaissements export AKWA et rapprochez les virements bancaires." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaymentsPage,
});

const STATUSES: (PaymentStatus | "Tous")[] = ["Tous", "Attendu", "Reçu", "À vérifier", "Confirmé", "Partiel", "Rejeté", "Remboursé", "Annulé"];
const METHODS: PaymentMethod[] = ["Virement bancaire", "SWIFT", "Crédit documentaire", "Chèque", "Espèces", "Autre"];
const KINDS: PaymentKind[] = ["Acompte", "Solde", "Paiement partiel", "Autre"];

function PaymentsPage() {
  const state = useBilling();
  const k = paymentKpis(state);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Tous");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ invoiceId: "", amount: "", kind: "Acompte" as PaymentKind, method: "Virement bancaire" as PaymentMethod, bank: "", bankRef: "" });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.payments
      .filter((p) => (status === "Tous" ? true : p.status === status))
      .filter((p) => !term || [p.id, p.client, p.orderRef, p.invoiceId ?? "", p.bankRef].some((v) => v.toLowerCase().includes(term)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.payments, q, status]);

  const openInvoices = state.invoices.filter((i) => !["Payée", "Annulée", "Remplacée", "Brouillon"].includes(i.status));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Encaissé ce mois" value={eur(k.monthReceived)} icon={Wallet} tone="bg-success/15 text-success" />
        <Kpi label="Paiements attendus" value={eur(k.expected)} icon={Clock} tone="bg-warning/15 text-warning" />
        <Kpi label="Paiements en retard" value={eur(k.late)} icon={AlertTriangle} tone="bg-destructive/15 text-destructive" />
        <Kpi label="À vérifier" value={k.toCheck} icon={ShieldQuestion} />
        <Kpi label="À rapprocher" value={k.toReconcile} icon={Link2} tone="bg-ai/15 text-ai" />
        <Kpi label="Taux de recouvrement" value={`${k.recovery.toFixed(1)} %`} icon={TrendingUp} />
      </div>

      {state.unmatched.length > 0 && (
        <Panel title="Rapprochement bancaire" description="Virements détectés sans facture associée — suggestion automatique AKWA.">
          <div className="space-y-2">
            {state.unmatched.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ai/40 bg-ai/5 p-3 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold">{eur2(u.amount)} — {u.detectedClient}</div>
                  <div className="text-[11px] text-muted-foreground">{fdate(u.date)} • {u.bank} • {u.bankRef}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone="ai">Suggestion {u.suggestedInvoiceId} · {u.confidence} %</Chip>
                  <Button size="sm" onClick={() => { billingStore.reconcile(u.id, u.suggestedInvoiceId); toast.success(`Virement rapproché sur ${u.suggestedInvoiceId}`); }}>
                    Rapprocher
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { billingStore.ignoreUnmatched(u.id); toast.info("Virement ignoré"); }}>
                    Ignorer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title="Journal des paiements"
        description={`${rows.length} mouvement(s)`}
        action={<Button size="sm" onClick={() => setOpen((v) => !v)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Enregistrer un paiement</Button>}
      >
        {open && (
          <div className="mb-4 grid gap-2 rounded-lg border border-border p-3 md:grid-cols-6">
            <select value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm md:col-span-2">
              <option value="">Facture…</option>
              {openInvoices.map((i) => <option key={i.id} value={i.id}>{i.id} — {i.client}</option>)}
            </select>
            <Input className="h-9" type="number" placeholder="Montant €" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as PaymentKind })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              {KINDS.map((x) => <option key={x}>{x}</option>)}
            </select>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              {METHODS.map((x) => <option key={x}>{x}</option>)}
            </select>
            <Input className="h-9" placeholder="Réf. bancaire" value={form.bankRef} onChange={(e) => setForm({ ...form, bankRef: e.target.value })} />
            <Button
              size="sm" className="md:col-span-6"
              onClick={() => {
                const inv = state.invoices.find((i) => i.id === form.invoiceId);
                const value = Number(form.amount);
                if (!inv || !value) return toast.error("Sélectionnez une facture et un montant valide");
                billingStore.recordPayment({
                  clientId: inv.clientId, client: inv.client, orderRef: inv.orderRef, invoiceId: inv.id,
                  amount: value, kind: form.kind, method: form.method, bank: form.bank || "—", bankRef: form.bankRef || "—",
                });
                setForm({ invoiceId: "", amount: "", kind: "Acompte", method: "Virement bancaire", bank: "", bankRef: "" });
                setOpen(false);
                toast.success("Paiement enregistré et rattaché à la facture");
              }}
            >
              Valider le paiement
            </Button>
          </div>
        )}

        <div className="mb-4 grid gap-2 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-8" placeholder="Client, commande, facture, référence bancaire…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as never)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">N° paiement</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Facture</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2 text-right">Montant</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-muted/50">
                  <td className="px-3 py-2.5 font-mono text-xs">{p.id}</td>
                  <td className="px-3 py-2.5 text-xs">{fdate(p.date)}</td>
                  <td className="px-3 py-2.5">{p.client}<div className="text-[11px] text-muted-foreground">{p.orderRef}</div></td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {p.invoiceId ? (
                      <Link to="/admin/facturation/factures/$invoiceId" params={{ invoiceId: p.invoiceId }} className="text-primary hover:underline">{p.invoiceId}</Link>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs">{p.kind}</td>
                  <td className="px-3 py-2.5 text-xs">{p.method}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{eur2(p.amount)}</td>
                  <td className="px-3 py-2.5"><Chip tone={paymentStatusTone(p.status)}>{p.status}</Chip></td>
                  <td className="px-3 py-2.5 text-right">
                    {p.status !== "Confirmé" && (
                      <Button size="sm" variant="secondary" onClick={() => { billingStore.setPaymentStatus(p.id, "Confirmé"); toast.success("Paiement confirmé"); }}>
                        Confirmer
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="px-3 py-10 text-center text-sm text-muted-foreground">Aucun paiement.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Soldes clients ouverts" description="Factures non totalement réglées, par client.">
        <div className="grid gap-2 md:grid-cols-2">
          {openInvoices.map((i) => {
            const balance = invoiceTotal(i) - paidOf(i.id, state.payments);
            return (
              <Link
                key={i.id}
                to="/admin/facturation/factures/$invoiceId"
                params={{ invoiceId: i.id }}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{i.client}</div>
                  <div className="text-[11px] text-muted-foreground">{i.id} • échéance {fdate(i.dueAt)}</div>
                </div>
                <span className="font-semibold text-warning">{eur(Math.max(0, balance))}</span>
              </Link>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
