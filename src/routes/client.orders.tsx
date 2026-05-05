import { createFileRoute } from "@tanstack/react-router";
import { useSyncExternalStore, useState, useMemo } from "react";
import { orders as seedOrders, products, formatCurrency, type Order } from "@/lib/mock-data";
import { ordersStore, type SubmittedOrder } from "@/lib/orders-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/client/orders")({
  component: MyOrders,
});

type Row = {
  id: string;
  reference: string;
  destination: string;
  createdAt: string;
  lines: { productId: string; quantity: number; unitPrice: number }[];
  containerFillPct: number;
  stage: string; // unified stage label key
  isProvisional: boolean;
  submitted?: SubmittedOrder;
};

const stageMeta: Record<string, { label: string; cls: string }> = {
  BC_Provisoire: { label: "BC provisoire", cls: "bg-warning/15 text-warning" },
  En_Pricing: { label: "En pricing", cls: "bg-warning/15 text-warning" },
  Devis_Envoye: { label: "Devis reçu", cls: "bg-ai/15 text-ai" },
  Accepte: { label: "Accepté", cls: "bg-success/15 text-success" },
  Refuse: { label: "Refusé", cls: "bg-destructive/15 text-destructive" },
  Draft: { label: "Brouillon", cls: "bg-muted text-muted-foreground" },
  Pending: { label: "En attente", cls: "bg-warning/15 text-warning" },
  Validated: { label: "Validée", cls: "bg-primary/10 text-primary" },
  Shipped: { label: "Expédiée", cls: "bg-ai/15 text-ai" },
  Delivered: { label: "Livrée", cls: "bg-success/15 text-success" },
};

function useSubmitted() {
  return useSyncExternalStore(
    (cb) => ordersStore.subscribe(cb),
    () => ordersStore.getSubmitted(),
    () => ordersStore.getSubmitted(),
  );
}

function MyOrders() {
  const submitted = useSubmitted();
  const [detail, setDetail] = useState<Row | null>(null);

  const rows: Row[] = useMemo(() => {
    const sub = submitted.map<Row>((o) => ({
      id: o.id,
      reference: o.reference,
      destination: o.destination,
      createdAt: o.submittedAt?.slice(0, 10) ?? o.createdAt,
      lines: o.lines,
      containerFillPct: o.containerFillPct,
      stage: o.stage,
      isProvisional: o.stage === "BC_Provisoire" || o.stage === "En_Pricing",
      submitted: o,
    }));
    const seed = (seedOrders as Order[]).map<Row>((o) => ({
      id: o.id,
      reference: o.reference,
      destination: o.destination,
      createdAt: o.createdAt,
      lines: o.lines,
      containerFillPct: o.containerFillPct,
      stage: o.status,
      isProvisional: o.status === "Draft",
    }));
    return [...sub, ...seed];
  }, [submitted]);

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes commandes</h1>
        <p className="text-sm text-muted-foreground">
          Suivez vos bons de commande, devis reçus et expéditions.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Référence</th>
              <th className="text-left px-5 py-3 font-medium">Destination</th>
              <th className="text-left px-5 py-3 font-medium">Articles</th>
              <th className="text-right px-5 py-3 font-medium">Valeur</th>
              <th className="text-right px-5 py-3 font-medium">Conteneur</th>
              <th className="text-left px-5 py-3 font-medium">Statut</th>
              <th className="text-left px-5 py-3 font-medium">Créée</th>
              <th className="text-right px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const value = r.lines.reduce((s, l) => s + l.quantity * (l.unitPrice || 0), 0);
              const meta = stageMeta[r.stage] ?? { label: r.stage, cls: "bg-muted text-muted-foreground" };
              return (
                <tr key={r.id} className="hover:bg-muted/30 transition-smooth">
                  <td className="px-5 py-3 font-medium">{r.reference}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.destination}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {r.lines.map((l) => products.find((p) => p.id === l.productId)?.name).filter(Boolean).join(", ")}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">
                    {r.isProvisional ? <span className="text-muted-foreground">—</span> : formatCurrency(value)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={cn("text-xs font-semibold", r.containerFillPct >= 85 ? "text-success" : r.containerFillPct >= 60 ? "text-warning" : "text-destructive")}>
                      {r.containerFillPct}%
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded", meta.cls)}>{meta.label}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{r.createdAt}</td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDetail(r)}>
                      <Eye className="h-3.5 w-3.5" /> Détails
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> {detail?.reference}
            </DialogTitle>
            <DialogDescription>
              {detail?.destination} • Créée le {detail?.createdAt}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={stageMeta[detail.stage]?.cls}>{stageMeta[detail.stage]?.label}</Badge>
                {detail.submitted && detail.submitted.quotes.length > 0 ? (
                  <Badge variant="secondary">{detail.submitted.quotes.length} devis reçu(s)</Badge>
                ) : detail.isProvisional ? (
                  <span className="text-xs text-muted-foreground">⏳ En attente du devis AKWA AI</span>
                ) : null}
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">Produit</th>
                      <th className="text-right px-3 py-2">Quantité</th>
                      {!detail.isProvisional && <th className="text-right px-3 py-2">PU</th>}
                      {!detail.isProvisional && <th className="text-right px-3 py-2">Total</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {detail.lines.map((l) => {
                      const p = products.find((x) => x.id === l.productId);
                      return (
                        <tr key={l.productId}>
                          <td className="px-3 py-2">{p?.image} {p?.name}</td>
                          <td className="px-3 py-2 text-right">{l.quantity}</td>
                          {!detail.isProvisional && <td className="px-3 py-2 text-right">{formatCurrency(l.unitPrice || 0)}</td>}
                          {!detail.isProvisional && <td className="px-3 py-2 text-right font-semibold">{formatCurrency((l.unitPrice || 0) * l.quantity)}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {detail.submitted && detail.submitted.quotes.length > 0 && (
                <div className="rounded-lg border border-ai/30 bg-ai/5 p-4 text-sm space-y-2">
                  <div className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-ai" /> Dernier devis AKWA AI — V{detail.submitted.quotes[0].version}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total proposé</span>
                    <span className="text-lg font-bold">{formatCurrency(detail.submitted.quotes[0].total)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rendez-vous dans <strong>Mes devis</strong> pour accepter ou refuser.
                  </p>
                </div>
              )}

              {detail.isProvisional && (!detail.submitted || detail.submitted.quotes.length === 0) && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm">
                  ⏳ Aucun devis reçu pour le moment. L'admin AKWA AI va appliquer un pricing intelligent puis vous envoyer une proposition.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
