import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSyncExternalStore, useMemo } from "react";
import { AgentBadge } from "@/components/AgentBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye } from "lucide-react";
import { clients, products } from "@/lib/mock-data";
import { ordersStore, type SubmittedOrder } from "@/lib/orders-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/container")({
  component: ContainerList,
});

type Status = "À optimiser" | "Optimisé" | "Appliqué";

// statut mock par référence (un seul client par commande, pas de regroupement)
const statusByRef: Record<string, Status> = {
  "AKW-2410-0182": "Appliqué",
  "AKW-2410-0183": "Optimisé",
  "AKW-2410-0184": "À optimiser",
  "AKW-2410-0185": "À optimiser",
  "AKW-2410-0186": "À optimiser",
  "AKW-2410-0187": "Appliqué",
};

function recommendContainer(volumeM3: number) {
  if (volumeM3 <= 28) return { name: "20 pieds", capacity: 33 };
  if (volumeM3 <= 60) return { name: "40 pieds", capacity: 67 };
  return { name: "40 pieds High Cube", capacity: 76 };
}

function useOrders() {
  return useSyncExternalStore(
    (cb) => ordersStore.subscribe(cb),
    () => ordersStore.getAll(),
    () => ordersStore.getAll(),
  );
}

function ContainerList() {
  const orders = useOrders();
  const navigate = useNavigate();

  const rows = useMemo(
    () =>
      orders.map((o) => {
        const volume = o.lines.reduce((s, l) => {
          const p = products.find((x) => x.id === l.productId);
          return s + (p?.unitVolumeM3 ?? 0) * l.quantity;
        }, 0);
        const container = recommendContainer(volume);
        const fill = Math.min(99, Math.round((volume / container.capacity) * 100));
        const status: Status =
          statusByRef[o.reference] ??
          ((o as SubmittedOrder).stage === "BC_Provisoire" ? "À optimiser" : "Optimisé");
        return { order: o, volume, container, fill, status };
      }),
    [orders],
  );

  const statusColor: Record<Status, string> = {
    "À optimiser": "bg-warning/15 text-warning",
    Optimisé: "bg-ai/15 text-ai",
    Appliqué: "bg-success/15 text-success",
  };

  return (
    <div className="max-w-[1500px] space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <AgentBadge name="Agent d’Optimisation des Conteneurs" icon={Package} />
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Optimisation par commande</h1>
          <p className="text-sm text-muted-foreground">
            Optimisation logistique pour une seule commande à la fois — pas de regroupement, pas d’anticipation.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">{rows.length} commandes</Badge>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">ID commande</th>
                <th className="text-left px-5 py-3 font-medium">Client</th>
                <th className="text-right px-5 py-3 font-medium">Volume total</th>
                <th className="text-left px-5 py-3 font-medium">Conteneur recommandé</th>
                <th className="text-right px-5 py-3 font-medium">Taux remplissage</th>
                <th className="text-left px-5 py-3 font-medium">Statut</th>
                <th className="text-right px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ order, volume, container, fill, status }) => {
                const client = clients.find((c) => c.id === order.clientId);
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/30 transition-smooth cursor-pointer"
                    onClick={() => navigate({ to: "/admin/container/$orderId", params: { orderId: order.id } })}
                  >
                    <td className="px-5 py-3 font-medium">{order.reference}</td>
                    <td className="px-5 py-3">{client?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-right">{volume.toFixed(1)} m³</td>
                    <td className="px-5 py-3">{container.name}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn("font-semibold", fill >= 85 ? "text-success" : fill >= 65 ? "text-warning" : "text-destructive")}>
                        {fill}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded", statusColor[status])}>{status}</span>
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate({ to: "/admin/container/$orderId", params: { orderId: order.id } })}
                      >
                        <Eye className="h-3.5 w-3.5" /> Voir optimisation
                      </Button>
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
