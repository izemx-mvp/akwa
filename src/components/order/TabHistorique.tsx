import { History } from "lucide-react";
import { SectionCard, Chip } from "./shared";
import type { ExportOrder } from "@/lib/export-order-store";

export function TabHistorique({ order }: { order: ExportOrder }) {
  return (
    <SectionCard title="Historique des modifications" subtitle="Journal d'audit de la commande" icon={History} dense>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Date</th>
              <th className="px-4 py-2.5 text-left font-medium">Action</th>
              <th className="px-4 py-2.5 text-left font-medium">Ancienne valeur</th>
              <th className="px-4 py-2.5 text-left font-medium">Nouvelle valeur</th>
              <th className="px-4 py-2.5 text-left font-medium">Utilisateur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.audit.map((a, i) => (
              <tr key={`${a.at}-${i}`} className="transition-smooth hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{a.at}</td>
                <td className="px-4 py-2.5 font-medium">{a.action}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{a.from ?? "—"}</td>
                <td className="px-4 py-2.5">{a.to ? <Chip tone="success">{a.to}</Chip> : "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{a.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
