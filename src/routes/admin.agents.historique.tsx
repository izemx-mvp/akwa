import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { History } from "lucide-react";
import { Chip, Kpi, Panel } from "@/components/admin/ui";
import { AGENT_META, useAgentHub, type AgentKey } from "@/lib/agent-hub";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/agents/historique")({
  head: () => ({
    meta: [
      { title: "Historique IA — Back-office AKWA" },
      { name: "description", content: "Journal des analyses, recommandations et décisions prises avec les agents AKWA." },
      { property: "og:title", content: "Historique IA — Back-office AKWA" },
      { property: "og:description", content: "Traçabilité complète des recommandations des agents intelligents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentHistory,
});

const keys = Object.keys(AGENT_META) as AgentKey[];

function AgentHistory() {
  const { logs } = useAgentHub();
  const [filter, setFilter] = useState<AgentKey | "all">("all");
  const rows = logs.filter((l) => filter === "all" || l.agent === filter);

  return (
    <div className="max-w-[1500px] space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-ai text-ai-foreground"><History className="h-5 w-5" /></span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historique des recommandations IA</h1>
          <p className="text-sm text-muted-foreground">Analyse, recommandation, décision humaine et résultat obtenu.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Actions enregistrées" value={String(logs.length)} />
        <Kpi label="Recommandations appliquées" value={String(logs.filter((l) => l.userAction.startsWith("Appliqué") || l.userAction.includes("validé")).length)} />
        <Kpi label="Ignorées" value={String(logs.filter((l) => l.userAction.includes("ignorée")).length)} />
        <Kpi label="Agents impliqués" value={String(new Set(logs.map((l) => l.agent)).size)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", ...keys] as (AgentKey | "all")[]).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-smooth",
              filter === k ? "border-ai bg-ai/10 text-ai" : "border-border hover:border-ai/40",
            )}
          >
            {k === "all" ? "Tous les agents" : AGENT_META[k].name}
          </button>
        ))}
      </div>

      <Panel title="Journal">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Agent</th>
                <th className="px-4 py-3 text-left font-medium">Commande</th>
                <th className="px-4 py-3 text-left font-medium">Analyse</th>
                <th className="px-4 py-3 text-left font-medium">Recommandation</th>
                <th className="px-4 py-3 text-left font-medium">Décision</th>
                <th className="px-4 py-3 text-left font-medium">Résultat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {new Date(l.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3"><Chip tone="ai">{AGENT_META[l.agent].name}</Chip></td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.orderRef}</div>
                    <div className="text-[11px] text-muted-foreground">{l.client}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{l.analysis}</td>
                  <td className="px-4 py-3 text-xs font-medium">{l.recommendation}</td>
                  <td className="px-4 py-3 text-xs">{l.userAction}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.result}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">Aucune action pour ce filtre.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
