import { createFileRoute } from "@tanstack/react-router";
import { orders, products, formatCurrency } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client/orders")({
  component: MyOrders,
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

function MyOrders() {
  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes commandes</h1>
        <p className="text-sm text-muted-foreground">Suivez chaque expédition et son score d'optimisation IA.</p>
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
              <th className="text-right px-5 py-3 font-medium">Marge</th>
              <th className="text-left px-5 py-3 font-medium">Statut</th>
              <th className="text-left px-5 py-3 font-medium">Créée</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => {
              const value = o.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
              return (
                <tr key={o.id} className="hover:bg-muted/30 transition-smooth">
                  <td className="px-5 py-3 font-medium">{o.reference}</td>
                  <td className="px-5 py-3 text-muted-foreground">{o.destination}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {o.lines.map((l) => products.find((p) => p.id === l.productId)?.name).join(", ")}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{formatCurrency(value)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={cn("text-xs font-semibold", o.containerFillPct >= 85 ? "text-success" : o.containerFillPct >= 60 ? "text-warning" : "text-destructive")}>
                      {o.containerFillPct}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-success font-semibold">{o.marginPct}%</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded", statusColor[o.status])}>{statusLabel[o.status]}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{o.createdAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
