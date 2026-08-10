import { createFileRoute } from "@tanstack/react-router";
import { Ship, AlertTriangle, FileCheck } from "lucide-react";
import { AgentHeader, OrderContextPanel, Explain, CrossLink } from "@/components/admin/AgentShell";
import { Chip, Kpi, Panel, Bar } from "@/components/admin/ui";
import { agentHub, exportRisks, exportTimeline, useAgentHub, orderContext } from "@/lib/agent-hub";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AgentConfigPanel } from "@/components/admin/AgentConfigPanel";

export const Route = createFileRoute("/admin/agents/export")({
  head: () => ({
    meta: [
      { title: "Agent Export — Back-office AKWA" },
      { name: "description", content: "Cockpit export : checklist documentaire, risques et timeline opérationnelle." },
      { property: "og:title", content: "Agent Export — Back-office AKWA" },
      { property: "og:description", content: "Préparez et sécurisez chaque expédition export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentExport,
});

const riskTone: Record<string, "success" | "warning" | "danger"> = {
  Faible: "success", Modéré: "warning", Élevé: "danger",
};

function AgentExport() {
  const { exportTasks } = useAgentHub();
  const ctx = orderContext();
  const done = exportTasks.filter((t) => t.done).length;
  const progress = Math.round((done / exportTasks.length) * 100);
  const currentStep = 4;

  return (
    <div className="max-w-[1500px] space-y-6">
      <AgentHeader agentKey="export" icon={Ship}>
        <Button size="sm" variant="secondary" onClick={() => toast.success("Rappel envoyé à l'équipe logistique")}>
          Relancer l'équipe
        </Button>
      </AgentHeader>

      <OrderContextPanel from="export" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Préparation export" value={`${progress} %`} />
        <Kpi label="Documents manquants" value={String(exportTasks.length - done)} />
        <Kpi label="Destination" value={ctx.destination} />
        <Kpi label="Risque global" value="Modéré" />
      </div>

      <Panel title="Timeline opérationnelle">
        <div className="flex flex-wrap gap-2 p-4">
          {exportTimeline.map((step, i) => (
            <div
              key={step}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs",
                i < currentStep ? "border-success/40 bg-success/10 text-success"
                  : i === currentStep ? "border-ai bg-ai/10 font-semibold text-ai"
                  : "border-border text-muted-foreground",
              )}
            >
              {i + 1}. {step}
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Checklist documentaire">
          <div className="p-4">
            <Bar value={progress} tone={progress === 100 ? "bg-success" : "bg-primary"} />
            <ul className="mt-4 space-y-2">
              {exportTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={t.done} onChange={() => agentHub.toggleExportTask(t.id)} className="h-4 w-4 accent-primary" />
                    {t.label}
                  </label>
                  <Chip tone={t.done ? "success" : "warning"}>{t.done ? "Conforme" : "À produire"}</Chip>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Analyse des risques">
            <div className="space-y-2 p-4">
              {exportRisks.map((r) => (
                <div key={r.area} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{r.area}</span>
                    <Chip tone={riskTone[r.level]}>{r.level}</Chip>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Explain>
            L'expédition est prête à <strong>{progress} %</strong>. Les points bloquants sont les fiches de données de sécurité (SDS) et le
            Bill of Lading, à obtenir avant le chargement. Le solde client non réglé constitue le risque le plus élevé :
            l'agent recommande de conditionner le départ à l'encaissement.
          </Explain>

          <Panel title="Actions croisées">
            <div className="flex flex-wrap gap-2 p-4">
              <CrossLink from="export" to="container" label="Optimiser le chargement" />
              <CrossLink from="export" to="marge" label="Impact sur la marge" />
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileCheck className="h-3.5 w-3.5" /> Documents synchronisés avec le portail client
              </span>
            </div>
          </Panel>

          <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm">
            <div className="mb-1 flex items-center gap-2 font-semibold text-warning">
              <AlertTriangle className="h-4 w-4" /> Alerte départ
            </div>
            Départ prévu dans 8 jours — 2 documents obligatoires manquants.
          </div>
        </div>
      </div>
      <AgentConfigPanel agent="export" />
    </div>
  );
}
