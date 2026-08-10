import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Download, Upload, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard, Chip, MiniBar } from "./shared";
import { cn } from "@/lib/utils";
import { downloadMock, eur, exportOrderStore, type ExportOrder } from "@/lib/export-order-store";

export function TabPaiements({ order }: { order: ExportOrder }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ bank: "", ref: "", amount: "", date: "", comment: "", file: "" });
  const t = order.totals;
  const balance = t.total - t.paid;
  const paidPct = Math.round((t.paid / t.total) * 100);

  return (
    <div className="space-y-4">
      <SectionCard
        title="Paiements"
        subtitle={order.paymentTerms}
        icon={CreditCard}
        action={<Chip tone={balance > 0 ? "warning" : "success"}>{balance > 0 ? "Acompte reçu" : "Soldé"}</Chip>}
      >
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { l: "Montant total", v: eur(t.total), tone: "" },
            { l: "Acompte reçu", v: eur(t.paid), tone: "text-success" },
            { l: "Solde restant", v: eur(balance), tone: "text-warning" },
            { l: "Échéance", v: "16 août 2026", tone: "" },
          ].map((k) => (
            <div key={k.l} className="rounded-lg border border-border p-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
              <div className={cn("text-base font-bold", k.tone)}>{k.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">Progression du règlement</span>
            <span className="font-semibold">{paidPct} %</span>
          </div>
          <MiniBar pct={paidPct} tone="success" />
        </div>

        <ol className="mt-5 space-y-3 border-l border-border pl-6">
          {order.payments.map((p) => (
            <li key={p.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full border-2 border-card",
                  p.state === "done" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground",
                )}
              >
                {p.state === "done" ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.date}{p.meta ? ` • ${p.meta}` : ""}</div>
                </div>
                <span className={cn("text-sm font-bold", p.state === "done" ? "text-success" : "text-warning")}>{eur(p.amount)}</span>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => { downloadMock(`facture-${order.reference}.txt`, `Facture proforma ${order.reference} — ${eur(t.total)}`); toast.success("Facture téléchargée."); }}>
            <Download className="h-3.5 w-3.5" /> Télécharger facture
          </Button>
          <Button size="sm" variant="outline" onClick={() => { downloadMock(`recu-acompte-${order.reference}.txt`, `Reçu acompte ${eur(t.paid)} — ${order.reference}`); toast.success("Reçu téléchargé."); }}>
            <Download className="h-3.5 w-3.5" /> Télécharger reçu
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Upload className="h-3.5 w-3.5" /> Envoyer justificatif de paiement
          </Button>
        </div>
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer un justificatif de paiement</DialogTitle>
            <DialogDescription>Commande {order.reference} — solde {eur(balance)}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Banque</Label>
              <Input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="Ex : SGCI Abidjan" />
            </div>
            <div className="space-y-1.5">
              <Label>Référence transaction</Label>
              <Input value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} placeholder="Ex : VIR-2026-88421" />
            </div>
            <div className="space-y-1.5">
              <Label>Montant (€)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="19500" />
            </div>
            <div className="space-y-1.5">
              <Label>Date de paiement</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Justificatif</Label>
              <Input type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0]?.name ?? "" })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Commentaire</Label>
              <Textarea rows={3} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button
              disabled={!form.bank.trim() || !form.ref.trim() || !form.amount}
              onClick={() => {
                exportOrderStore.addPaymentProof({
                  bank: form.bank,
                  ref: form.ref,
                  amount: Number(form.amount),
                  date: form.date ? new Date(form.date).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR"),
                  comment: form.comment,
                  file: form.file,
                });
                toast.success("Justificatif transmis à la comptabilité AKWA.");
                setForm({ bank: "", ref: "", amount: "", date: "", comment: "", file: "" });
                setOpen(false);
              }}
            >
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
