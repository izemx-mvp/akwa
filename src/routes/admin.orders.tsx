import { createFileRoute } from "@tanstack/react-router";
import { orders, clients, formatCurrency } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { AgentBadge } from "@/components/AgentBadge";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const statusColor: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Pending: "bg-warning/15 text-warning",
  Validated: "bg-primary/10 text-primary",
  Shipped: "bg-ai/15 text-ai",
  Delivered: "bg-success/15 text-success",
};

function AdminOrders() {
  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">Validate, track and optimize every order.</p>
        </div>
        <AgentBadge name="2 actions suggested" />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Reference</th>
              <th className="text-left px-5 py-3 font-medium">Client</th>
              <th className="text-left px-5 py-3 font-medium">Destination</th>
              <th className="text-right px-5 py-3 font-medium">Value</th>
              <th className="text-right px-5 py-3 font-medium">Container</th>
              <th className="text-right px-5 py-3 font-medium">Margin</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">AI Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o, i) => {
              const value = o.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
              const client = clients.find((c) => c.id === o.clientId);
              const note = o.containerFillPct < 60 ? "Consolidate to save $640" : o.marginPct < 12 ? "Apply pricing +1.8%" : "Optimal ✓";
              return (
                <tr key={o.id} className="hover:bg-muted/30 transition-smooth">
                  <td className="px-5 py-3 font-medium">{o.reference}</td>
                  <td className="px-5 py-3">{client?.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{o.destination}</td>
                  <td className="px-5 py-3 text-right font-semibold">{formatCurrency(value)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={cn("text-xs font-semibold", o.containerFillPct >= 85 ? "text-success" : o.containerFillPct >= 60 ? "text-warning" : "text-destructive")}>{o.containerFillPct}%</span>
                  </td>
                  <td className="px-5 py-3 text-right text-success font-semibold">{o.marginPct}%</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded", statusColor[o.status])}>{o.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs">
                    <span className={cn("inline-flex items-center gap-1.5", note === "Optimal ✓" ? "text-success" : "text-ai font-medium")}>
                      {note !== "Optimal ✓" && <span className="h-1.5 w-1.5 rounded-full bg-ai animate-pulse" />}
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
  );
}
