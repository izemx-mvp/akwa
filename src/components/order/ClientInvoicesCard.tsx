import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionCard, Chip } from "./shared";
import {
  useBilling, invoiceTotal, paidOf, eur, fdate, invoiceStatusTone,
} from "@/lib/billing-store";

/** Factures AKWA (proforma + finale) visibles par le client pour une commande. */
export function ClientInvoicesCard({ orderRef }: { orderRef: string }) {
  const state = useBilling();
  const invoices = state.invoices.filter(
    (i) => i.orderRef === orderRef && i.visibleToClient && i.status !== "Brouillon",
  );

  if (invoices.length === 0) return null;

  return (
    <SectionCard
      title="Factures AKWA"
      subtitle="Facture proforma et facture définitive de votre commande"
      icon={FileText}
    >
      <div className="space-y-2">
        {invoices.map((i) => {
          const total = invoiceTotal(i);
          const paid = paidOf(i.id, state.payments);
          return (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
              <div className="min-w-0">
                <div className="font-semibold">{i.id} <span className="text-xs font-normal text-muted-foreground">— {i.type}</span></div>
                <div className="text-[11px] text-muted-foreground">
                  Émise le {fdate(i.issuedAt)} • Échéance {fdate(i.dueAt)} • Réglé {eur(paid)} / {eur(total)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Chip tone={invoiceStatusTone(i.status) === "danger" ? "warning" : invoiceStatusTone(i.status)}>{i.status}</Chip>
                <Button size="sm" variant="secondary" onClick={() => toast.success(`Téléchargement de ${i.id}`)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
