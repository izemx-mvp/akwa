import { createFileRoute } from "@tanstack/react-router";
import { useSyncExternalStore, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ordersStore, type SubmittedOrder, type Quote } from "@/lib/orders-store";
import { products, formatCurrency, formatNumber } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client/quotes")({
  component: ClientQuotes,
});

function useSubmitted() {
  return useSyncExternalStore(
    (cb) => ordersStore.subscribe(cb),
    () => ordersStore.getSubmitted(),
    () => ordersStore.getSubmitted(),
  );
}

const stageBadge: Record<string, { label: string; cls: string }> = {
  BC_Provisoire: { label: "BC provisoire", cls: "bg-muted text-muted-foreground" },
  En_Pricing: { label: "En pricing", cls: "bg-warning/15 text-warning" },
  Devis_Envoye: { label: "Devis reçu", cls: "bg-ai/15 text-ai" },
  Accepte: { label: "Accepté", cls: "bg-success/15 text-success" },
  Refuse: { label: "Refusé", cls: "bg-destructive/15 text-destructive" },
};

function ClientQuotes() {
  const orders = useSubmitted();
  const [viewing, setViewing] = useState<{ order: SubmittedOrder; quote: Quote } | null>(null);
  const [refusing, setRefusing] = useState<{ orderId: string; quoteId: string } | null>(null);
  const [reason, setReason] = useState("");

  const accept = (orderId: string, quoteId: string) => {
    ordersStore.updateQuoteStatus(orderId, quoteId, "accepte");
    toast.success("Devis accepté");
    setViewing(null);
  };

  const submitRefuse = () => {
    if (!refusing) return;
    ordersStore.updateQuoteStatus(refusing.orderId, refusing.quoteId, "refuse", reason);
    toast("Devis refusé", { description: "L'admin sera notifié et pourra renvoyer une nouvelle proposition." });
    setRefusing(null);
    setReason("");
    setViewing(null);
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes devis</h1>
        <p className="text-sm text-muted-foreground">Consultez les devis générés par AKWA AI pour vos commandes.</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Aucune commande envoyée pour l'instant.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const last = o.quotes[0];
            const sb = stageBadge[o.stage];
            return (
              <Card key={o.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {o.reference}
                        <Badge className={cn("text-[10px]", sb.cls)}>{sb.label}</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {o.destination} • {o.lines.length} produit(s) • Soumise le {new Date(o.submittedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    {last && (
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Devis V{last.version}</div>
                        <div className="text-lg font-bold">{formatCurrency(last.total)}</div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!last ? (
                    <div className="text-sm text-muted-foreground">⏳ En attente du devis AKWA AI…</div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewing({ order: o, quote: last })}>
                        <Eye className="h-3.5 w-3.5" /> Voir le devis
                      </Button>
                      {last.status === "envoye" && (
                        <>
                          <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => accept(o.id, last.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Accepter
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setRefusing({ orderId: o.id, quoteId: last.id })}>
                            <XCircle className="h-3.5 w-3.5" /> Refuser
                          </Button>
                        </>
                      )}
                      {last.status === "accepte" && <Badge className="bg-success text-success-foreground">Accepté ✓</Badge>}
                      {last.status === "refuse" && <Badge variant="destructive">Refusé</Badge>}
                      {o.quotes.length > 1 && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {o.quotes.length} versions · historique conservé
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Devis {viewing?.order.reference} — V{viewing?.quote.version}
            </DialogTitle>
            <DialogDescription>
              Émis le {viewing && new Date(viewing.quote.createdAt).toLocaleDateString("fr-FR")} • {viewing?.quote.scenarioName}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">Produit</th>
                      <th className="text-right px-3 py-2">Qté</th>
                      <th className="text-right px-3 py-2">PU</th>
                      <th className="text-right px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {viewing.quote.lines.map((l) => {
                      const p = products.find((x) => x.id === l.productId)!;
                      return (
                        <tr key={l.productId}>
                          <td className="px-3 py-2">
                            <span className="mr-2">{p.image}</span>
                            {p.name}
                          </td>
                          <td className="px-3 py-2 text-right">{formatNumber(l.quantity)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(l.unitPrice)}</td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {formatCurrency(l.unitPrice * l.quantity)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/30">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-lg">{formatCurrency(viewing.quote.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="text-xs text-muted-foreground border-t pt-3">
                <strong>Conditions :</strong> {viewing.quote.conditions}
              </div>
              {viewing.quote.status === "envoye" && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRefusing({ orderId: viewing.order.id, quoteId: viewing.quote.id })}>
                    <XCircle className="h-4 w-4" /> Refuser
                  </Button>
                  <Button className="bg-success hover:bg-success/90" onClick={() => accept(viewing.order.id, viewing.quote.id)}>
                    <CheckCircle2 className="h-4 w-4" /> Accepter le devis
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!refusing} onOpenChange={(v) => !v && setRefusing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser ce devis</DialogTitle>
            <DialogDescription>Indiquez la raison — l'admin pourra réajuster.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Prix trop élevé, quantité à revoir…" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRefusing(null)}>Annuler</Button>
            <Button variant="destructive" onClick={submitRefuse}>Confirmer le refus</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
