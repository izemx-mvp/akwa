// route: liste des commandes
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { clients, formatCurrency, products } from "@/lib/mock-data";
import { ordersStore, type SubmittedOrder } from "@/lib/orders-store";
import { cn } from "@/lib/utils";
import { AgentBadge } from "@/components/AgentBadge";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Tag } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const statusLabel: Record<string, string> = {
  Draft: "Brouillon",
  Pending: "En attente",
  Validated: "Validée",
  Shipped: "Expédiée",
  Delivered: "Livrée",
};

const statusColor: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Pending: "bg-warning/15 text-warning",
  Validated: "bg-primary/10 text-primary",
  Shipped: "bg-ai/15 text-ai",
  Delivered: "bg-success/15 text-success",
};

function useOrders() {
  return useSyncExternalStore(
    (cb) => ordersStore.subscribe(cb),
    () => ordersStore.getAll(),
    () => ordersStore.getAll(),
  );
}

function AdminOrders() {
  const orders = useOrders();
  const navigate = useNavigate();
  const proposedCount = orders.filter((o) =>
    (o as SubmittedOrder).lines?.some((l: any) => l.proposedPrice !== undefined)
  ).length;

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
          <p className="text-sm text-muted-foreground">Validez, suivez et optimisez chaque commande.</p>
        </div>
        <div className="flex items-center gap-2">
          {proposedCount > 0 && (
            <Badge className="gap-1 bg-ai text-ai-foreground">
              <Tag className="h-3 w-3" /> {proposedCount} prix proposé(s) client
            </Badge>
          )}
          <AgentBadge name="2 actions suggérées" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Référence</th>
                <th className="text-left px-5 py-3 font-medium">Client</th>
                <th className="text-left px-5 py-3 font-medium">Destination</th>
                <th className="text-right px-5 py-3 font-medium">Valeur</th>
                <th className="text-left px-5 py-3 font-medium">Prix proposé client</th>
                <th className="text-right px-5 py-3 font-medium">Conteneur</th>
                <th className="text-right px-5 py-3 font-medium">Marge</th>
                <th className="text-left px-5 py-3 font-medium">Statut</th>
                <th className="text-left px-5 py-3 font-medium">Note IA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => {
                const value = o.lines.reduce((s, l: any) => s + l.quantity * (l.proposedPrice ?? l.unitPrice), 0);
                const refValue = o.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
                const client = clients.find((c) => c.id === o.clientId);
                const proposedLines = (o.lines as any[]).filter((l) => l.proposedPrice !== undefined);
                const isNew = (o as SubmittedOrder).source === "client";
                const note =
                  proposedLines.length > 0
                    ? "Validation prix client requise"
                    : o.containerFillPct < 60
                    ? "Consolider pour économiser 640 $"
                    : o.marginPct < 12
                    ? "Appliquer pricing +1,8 %"
                    : "Optimal ✓";

                return (
                  <tr
                    key={o.id}
                    onClick={() => navigate({ to: "/admin/order-details/$orderId", params: { orderId: o.id } })}
                    className={cn("hover:bg-muted/30 transition-smooth cursor-pointer", isNew && "bg-ai/5")}
                  >
                    <td className="px-5 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {o.reference}
                        {isNew && <Badge variant="secondary" className="text-[10px]">Nouveau</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3">{client?.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{o.destination}</td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {formatCurrency(value)}
                      {proposedLines.length > 0 && value !== refValue && (
                        <div className="text-[10px] text-muted-foreground line-through">{formatCurrency(refValue)}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {proposedLines.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="space-y-1">
                          {proposedLines.map((l: any) => {
                            const p = products.find((x) => x.id === l.productId);
                            const diffPct = ((l.proposedPrice - l.unitPrice) / l.unitPrice) * 100;
                            return (
                              <div key={l.productId} className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground truncate max-w-[120px]">{p?.sku}</span>
                                <span className="font-semibold">{formatCurrency(l.proposedPrice)}</span>
                                <span className="text-muted-foreground line-through text-[10px]">{formatCurrency(l.unitPrice)}</span>
                                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", diffPct < 0 ? "bg-warning/15 text-warning" : "bg-ai/15 text-ai")}>
                                  {diffPct > 0 ? "+" : ""}{diffPct.toFixed(1)}%
                                </span>
                                {l.priceNote && (
                                  <span className="text-[10px] text-muted-foreground italic truncate max-w-[140px]" title={l.priceNote}>
                                    « {l.priceNote} »
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn("text-xs font-semibold", o.containerFillPct >= 85 ? "text-success" : o.containerFillPct >= 60 ? "text-warning" : "text-destructive")}>{o.containerFillPct}%</span>
                    </td>
                    <td className="px-5 py-3 text-right text-success font-semibold">{o.marginPct}%</td>
                    <td className="px-5 py-3">
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded", statusColor[o.status])}>{statusLabel[o.status]}</span>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <span className={cn("inline-flex items-center gap-1.5", note === "Optimal ✓" ? "text-success" : "text-ai font-medium")}>
                        {note !== "Optimal ✓" && <Sparkles className="h-3 w-3 animate-pulse" />}
                        {note}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
