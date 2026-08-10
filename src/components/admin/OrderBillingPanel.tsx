import { Link } from "@tanstack/react-router";
import { Receipt, FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import { Panel, Chip, Field } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  useBilling, billingStore, invoiceTotal, paidOf, eur, fdate, invoiceStatusTone,
} from "@/lib/billing-store";

/** Dossier de facturation d'une commande, affiché dans le cockpit back-office. */
export function OrderBillingPanel({ orderRef }: { orderRef: string }) {
  const state = useBilling();
  const invoices = state.invoices.filter((i) => i.orderRef === orderRef);
  const folder = billingStore.folderOf(orderRef);

  return (
    <Panel
      title={<span className="flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Dossier de facturation</span>}
      description="Factures proforma et définitives rattachées à cette commande."
      className="mt-6"
      action={
        <Button size="sm" variant="secondary" asChild>
          <Link to="/admin/facturation/factures">Ouvrir la facturation</Link>
        </Button>
      }
    >
      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <Field label="Montant facturé" value={eur(folder.invoiced)} />
        <Field label="Encaissé" value={<span className="text-success">{eur(folder.paid)}</span>} />
        <Field label="Reste dû" value={<span className={folder.balance ? "text-warning" : "text-success"}>{eur(folder.balance)}</span>} />
        <Field label="État" value={<Chip tone={folder.settled ? "success" : folder.invoiced ? "warning" : "muted"}>{folder.settled ? "Soldé" : folder.invoiced ? "Solde en attente" : "Non facturé"}</Chip>} />
      </div>

      <div className="divide-y divide-border">
        {invoices.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium">
                {i.id} <Chip tone={i.type === "Proforma" ? "info" : "ai"}>{i.type}</Chip>
                <Chip tone={invoiceStatusTone(i.status)}>{i.status}</Chip>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Émise le {fdate(i.issuedAt)} • Échéance {fdate(i.dueAt)} • Réglé {eur(paidOf(i.id, state.payments))} / {eur(invoiceTotal(i))}
              </div>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link to="/admin/facturation/factures/$invoiceId" params={{ invoiceId: i.id }}>Ouvrir</Link>
            </Button>
          </div>
        ))}
        {invoices.length === 0 && (
          <div className="py-8 text-center">
            <p className="mb-3 text-sm text-muted-foreground">Aucune facture pour cette commande.</p>
            <Button size="sm" onClick={() => toast.info("Créez la facture depuis le devis accepté du dossier.")}>
              <FilePlus2 className="mr-1.5 h-3.5 w-3.5" /> Créer une proforma
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}
