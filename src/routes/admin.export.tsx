import { createFileRoute } from "@tanstack/react-router";
import { orders, clients } from "@/lib/mock-data";
import { AgentBadge } from "@/components/AgentBadge";
import { FileCheck, AlertTriangle, CheckCircle2, Ship } from "lucide-react";

export const Route = createFileRoute("/admin/export")({
  component: ExportPage,
});

const docs = [
  { name: "Facture commerciale", status: "ok" },
  { name: "Liste de colisage", status: "ok" },
  { name: "Connaissement (B/L)", status: "ok" },
  { name: "Certificat d'origine", status: "missing" },
  { name: "Déclaration en douane", status: "warning" },
  { name: "Certificat d'assurance", status: "ok" },
];

const statusLabel: Record<string, string> = {
  ok: "OK",
  missing: "manquant",
  warning: "à vérifier",
};

function ExportPage() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 max-w-[1500px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">Opérations export <AgentBadge name="Export Assistant" icon={FileCheck} /></h1>
          <p className="text-sm text-muted-foreground">Documents, douane et conformité d'expédition.</p>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Expéditions actives</h3>
            <span className="text-xs text-muted-foreground">{orders.length} au total</span>
          </div>
          <div className="divide-y divide-border">
            {orders.map((o) => {
              const client = clients.find((c) => c.id === o.clientId);
              return (
                <div key={o.id} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/30">
                  <div className="h-9 w-9 rounded-lg bg-ai/10 text-ai flex items-center justify-center"><Ship className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{o.reference}</div>
                    <div className="text-xs text-muted-foreground">{client?.name} → {o.destination}</div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary">{o.status}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card p-5">
          <h3 className="font-semibold mb-4">Checklist documents — AKW-2410-0185</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {docs.map((d) => (
              <div key={d.name} className={`flex items-center gap-3 rounded-lg border p-3 ${d.status === "missing" ? "border-destructive/40 bg-destructive/5" : d.status === "warning" ? "border-warning/40 bg-warning/5" : "border-border bg-card"}`}>
                {d.status === "ok" ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertTriangle className={`h-4 w-4 ${d.status === "missing" ? "text-destructive" : "text-warning"}`} />}
                <div className="flex-1 text-sm">{d.name}</div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{statusLabel[d.status]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl bg-gradient-ai text-ai-foreground p-5 shadow-ai sticky top-20">
          <AgentBadge name="Export Assistant" icon={FileCheck} />
          <h3 className="mt-3 text-base font-semibold">Action requise</h3>
          <ul className="mt-3 text-xs text-white/85 space-y-2">
            <li>• Certificat d'origine manquant sur AKW-2410-0185</li>
            <li>• La Mauritanie exige le code SH 2710 pour les lubrifiants</li>
            <li>• Le certificat d'assurance expire dans 12 jours</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
