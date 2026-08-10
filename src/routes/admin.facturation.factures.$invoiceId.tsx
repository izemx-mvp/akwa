import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft, Send, CheckCircle2, Copy, Ban, Download, StickyNote, Plus, Wallet, GitCompare, History,
} from "lucide-react";
import { Panel, Chip, Field, Bar, Crumbs } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useBilling, billingStore, invoiceTotal, goodsTotal, feesTotal, paidOf, eur, eur2, fdate, fdatetime,
  invoiceStatusTone, paymentStatusTone, FEE_LABELS, type InvoiceFees, type PaymentKind, type PaymentMethod,
} from "@/lib/billing-store";

export const Route = createFileRoute("/admin/facturation/factures/$invoiceId")({
  head: ({ params }) => ({
    meta: [
      { title: `Facture ${params.invoiceId} — Facturation AKWA` },
      { name: "description", content: `Détail de la facture ${params.invoiceId} : lignes, frais export, paiements et comparaison proforma / facture finale.` },
      { property: "og:title", content: `Facture ${params.invoiceId} — AKWA` },
      { property: "og:description", content: "Détail de facture export AKWA avec suivi des encaissements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvoiceDetail,
});

const METHODS: PaymentMethod[] = ["Virement bancaire", "SWIFT", "Crédit documentaire", "Chèque", "Espèces", "Autre"];
const KINDS: PaymentKind[] = ["Acompte", "Solde", "Paiement partiel", "Autre"];

function InvoiceDetail() {
  const { invoiceId } = Route.useParams();
  const state = useBilling();
  const inv = state.invoices.find((i) => i.id === invoiceId);
  const [note, setNote] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<PaymentKind>("Acompte");
  const [method, setMethod] = useState<PaymentMethod>("Virement bancaire");
  const [bankRef, setBankRef] = useState("");
  const [finalOpen, setFinalOpen] = useState(false);
  const [adjKey, setAdjKey] = useState<keyof InvoiceFees>("freight");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");

  if (!inv) throw notFound();

  const total = invoiceTotal(inv);
  const paid = paidOf(inv.id, state.payments);
  const balance = Math.max(0, total - paid);
  const payments = state.payments.filter((p) => p.invoiceId === inv.id);
  const comparison = billingStore.comparison(inv.orderRef);
  const canGenerateFinal = inv.type === "Proforma" && !inv.finalId && !["Brouillon", "Annulée"].includes(inv.status);

  return (
    <div className="space-y-6">
      <Crumbs items={[{ label: "Facturation", to: "/admin/facturation/factures" }, { label: "Factures", to: "/admin/facturation/factures" }, { label: inv.id }]} />

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link to="/admin/facturation/factures" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Retour aux factures
            </Link>
            <h1 className="text-xl font-bold tracking-tight">{inv.id}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Chip tone={inv.type === "Proforma" ? "info" : "ai"}>{inv.type}</Chip>
              <Chip tone={invoiceStatusTone(inv.status)}>{inv.status}</Chip>
              <span className="text-xs text-muted-foreground">Commande {inv.orderRef}{inv.quoteId ? ` • Devis ${inv.quoteId}` : ""}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {inv.status === "Brouillon" && (
              <Button size="sm" onClick={() => { billingStore.validateInvoice(inv.id); toast.success("Facture validée"); }}>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Valider
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => { const m = billingStore.sendInvoice(inv.id); toast.success(m ?? "Facture envoyée"); }}>
              <Send className="mr-1.5 h-3.5 w-3.5" /> Envoyer au client
            </Button>
            <Button size="sm" variant="secondary" onClick={() => toast.success(`PDF ${inv.id} généré`)}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { const c = billingStore.duplicateInvoice(inv.id); toast.success(`Copie ${c?.id} créée`); }}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Dupliquer
            </Button>
            {inv.status !== "Annulée" && (
              <Button size="sm" variant="destructive" onClick={() => { billingStore.cancelInvoice(inv.id, "Annulation manuelle"); toast.success("Facture annulée"); }}>
                <Ban className="mr-1.5 h-3.5 w-3.5" /> Annuler
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Client" value={inv.client} />
          <Field label="Destination" value={inv.destination} />
          <Field label="Incoterm" value={inv.incoterm} />
          <Field label="Émise le" value={fdate(inv.issuedAt)} />
          <Field label="Échéance" value={fdate(inv.dueAt)} />
          <Field label="Responsable" value={inv.owner} />
        </div>

        <div className="mt-5 grid gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-4">
          <Field label="Montant total" value={<span className="text-base">{eur2(total)}</span>} />
          <Field label="Encaissé" value={<span className="text-success">{eur2(paid)}</span>} />
          <Field label="Reste dû" value={<span className={balance ? "text-warning" : "text-success"}>{eur2(balance)}</span>} />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Avancement</div>
            <div className="mt-2"><Bar value={total ? (paid / total) * 100 : 0} tone="bg-success" /></div>
            <div className="mt-1 text-[11px] text-muted-foreground">{total ? Math.round((paid / total) * 100) : 0} % réglé</div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Lignes de la facture" description="Produits AKWA facturés au client.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Référence</th>
                    <th className="px-3 py-2">Produit</th>
                    <th className="px-3 py-2 text-right">Qté</th>
                    <th className="px-3 py-2 text-right">PU</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inv.lines.map((l) => (
                    <tr key={l.ref}>
                      <td className="px-3 py-2.5 font-mono text-xs">{l.ref}</td>
                      <td className="px-3 py-2.5">{l.name}<div className="text-[11px] text-muted-foreground">{l.category}</div></td>
                      <td className="px-3 py-2.5 text-right">{l.qty.toLocaleString("fr-FR")} <span className="text-[11px] text-muted-foreground">{l.unit}</span></td>
                      <td className="px-3 py-2.5 text-right">{eur2(l.unitPrice)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{eur(l.qty * l.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-2 rounded-lg border border-border p-3 text-sm sm:grid-cols-2">
              {FEE_LABELS.filter((f) => inv.fees[f.key] !== 0).map((f) => (
                <div key={f.key} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">{eur(inv.fees[f.key])}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total marchandises</span><span>{eur(goodsTotal(inv))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Frais export</span><span>{eur(feesTotal(inv.fees))}</span></div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span>Total {inv.currency}</span><span>{eur2(total)}</span></div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">Conditions de paiement : {inv.paymentTerms}. {inv.notes}</p>
          </Panel>

          {comparison && (
            <Panel
              title={<span className="flex items-center gap-2"><GitCompare className="h-4 w-4 text-primary" /> Comparaison proforma / facture finale</span>}
              description="Écarts entre le devis facturé et la facturation définitive du dossier."
              action={canGenerateFinal ? <Button size="sm" variant="secondary" onClick={() => setFinalOpen((v) => !v)}>Générer la facture finale</Button> : undefined}
            >
              {finalOpen && canGenerateFinal && (
                <div className="mb-4 grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
                  <select value={adjKey} onChange={(e) => setAdjKey(e.target.value as keyof InvoiceFees)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                    {FEE_LABELS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                  <Input className="h-9" type="number" placeholder="Écart €" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} />
                  <Input className="h-9" placeholder="Motif de l'écart" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
                  <Button
                    size="sm"
                    onClick={() => {
                      const created = billingStore.generateFinalInvoice(
                        inv.orderRef,
                        adjAmount ? [{ key: adjKey, amount: Number(adjAmount), reason: adjReason || "Ajustement réel constaté" }] : [],
                      );
                      if (created) { toast.success(`Facture finale ${created.id} générée`); setFinalOpen(false); }
                      else toast.error("Une facture finale existe déjà pour ce dossier");
                    }}
                  >
                    Générer
                  </Button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Poste</th>
                      <th className="px-3 py-2 text-right">Proforma</th>
                      <th className="px-3 py-2 text-right">Facture finale</th>
                      <th className="px-3 py-2 text-right">Écart</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {comparison.rows.map((r) => {
                      const delta = r.fi === null ? null : r.fi - r.pf;
                      return (
                        <tr key={r.label}>
                          <td className="px-3 py-2">{r.label}</td>
                          <td className="px-3 py-2 text-right">{eur(r.pf)}</td>
                          <td className="px-3 py-2 text-right">{r.fi === null ? "—" : eur(r.fi)}</td>
                          <td className="px-3 py-2 text-right">
                            {delta === null ? "—" : <Chip tone={delta === 0 ? "muted" : delta > 0 ? "danger" : "success"}>{delta > 0 ? "+" : ""}{eur(delta)}</Chip>}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-semibold">
                      <td className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right">{eur(comparison.totalPf)}</td>
                      <td className="px-3 py-2 text-right">{comparison.totalFi === null ? "—" : eur(comparison.totalFi)}</td>
                      <td className="px-3 py-2 text-right">
                        {comparison.totalFi === null ? "—" : `${comparison.totalFi - comparison.totalPf >= 0 ? "+" : ""}${eur(comparison.totalFi - comparison.totalPf)}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {comparison.variances.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {comparison.variances.map((v, idx) => (
                    <li key={idx}>• {v.label} : {v.amount >= 0 ? "+" : ""}{eur(v.amount)} — {v.reason}</li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          <Panel
            title={<span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Paiements liés</span>}
            description={`${payments.length} mouvement(s) rattaché(s) à cette facture.`}
            action={<Button size="sm" variant="secondary" onClick={() => setPayOpen((v) => !v)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Enregistrer un paiement</Button>}
          >
            {payOpen && (
              <div className="mb-4 grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-5">
                <Input className="h-9" type="number" placeholder="Montant €" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <select value={kind} onChange={(e) => setKind(e.target.value as PaymentKind)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                  {KINDS.map((k) => <option key={k}>{k}</option>)}
                </select>
                <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                  {METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
                <Input className="h-9" placeholder="Référence bancaire" value={bankRef} onChange={(e) => setBankRef(e.target.value)} />
                <Button
                  size="sm"
                  onClick={() => {
                    const value = Number(amount);
                    if (!value) return toast.error("Montant invalide");
                    billingStore.recordPayment({
                      clientId: inv.clientId, client: inv.client, orderRef: inv.orderRef, invoiceId: inv.id,
                      amount: value, kind, method, bank: "—", bankRef: bankRef || "—",
                    });
                    setAmount(""); setBankRef(""); setPayOpen(false);
                    toast.success("Paiement enregistré");
                  }}
                >
                  Enregistrer
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-semibold">{eur2(p.amount)} <span className="text-xs font-normal text-muted-foreground">— {p.kind} • {p.method}</span></div>
                    <div className="text-[11px] text-muted-foreground">{fdate(p.date)} • {p.bank} • {p.bankRef} • {p.id}</div>
                  </div>
                  <Chip tone={paymentStatusTone(p.status)}>{p.status}</Chip>
                </div>
              ))}
              {payments.length === 0 && <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={<span className="flex items-center gap-2"><StickyNote className="h-4 w-4 text-primary" /> Notes internes</span>} description="Visible uniquement par les équipes AKWA.">
            <Textarea rows={3} placeholder="Ajouter une note interne…" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button
              className="mt-2 w-full" size="sm" variant="secondary"
              onClick={() => { if (!note.trim()) return; billingStore.addInternalNote(inv.id, note.trim()); setNote(""); toast.success("Note ajoutée"); }}
            >
              Ajouter la note
            </Button>
            <div className="mt-3 space-y-2">
              {inv.internalNotes.map((n) => (
                <div key={n.id} className="rounded-lg border border-border p-2.5 text-sm">
                  <div className="text-[11px] text-muted-foreground">{n.author} • {fdatetime(n.at)}</div>
                  {n.text}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={<span className="flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Historique</span>}>
            <ol className="space-y-3">
              {[...inv.history].reverse().map((h, idx) => (
                <li key={idx} className="border-l-2 border-border pl-3">
                  <div className="text-sm font-medium">{h.label}</div>
                  <div className="text-[11px] text-muted-foreground">{h.user} • {fdatetime(h.at)}</div>
                  {h.detail && <div className="text-xs text-muted-foreground">{h.detail}</div>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}
