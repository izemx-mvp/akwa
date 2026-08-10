import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck, Settings2 } from "lucide-react";
import { Chip, Panel } from "@/components/admin/ui";
import { AgentConfigPanel } from "@/components/admin/AgentConfigPanel";
import { PERMISSION_LABEL, ROLE_PERMISSIONS, pricingStore, usePricing, type Permission, type Role } from "@/lib/pricing-rules";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { AGENT_META, type AgentKey } from "@/lib/agent-hub";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/configuration-agents")({
  head: () => ({
    meta: [
      { title: "Configuration des agents — Back-office AKWA" },
      { name: "description", content: "Centralisez les règles, seuils et niveaux d'autonomie des cinq agents IA AKWA." },
      { property: "og:title", content: "Configuration des agents — Back-office AKWA" },
      { property: "og:description", content: "Paramétrage unique des agents Devis, Pricing, Marge, Export et Conteneur." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentsConfiguration,
});

const AGENTS: AgentKey[] = ["devis", "pricing", "marge", "export", "container"];
const ROLES: Role[] = ["Commercial", "Manager commercial", "Administrateur"];

function AgentsConfiguration() {
  const [agent, setAgent] = useState<AgentKey>("pricing");
  const { config, role } = usePricing();

  return (
    <div className="max-w-[1500px] space-y-6">
      <header className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Settings2 className="h-5 w-5 text-ai" /> Configuration des agents
            </h1>
            <p className="text-sm text-muted-foreground">
              Toutes les règles de fonctionnement des agents IA AKWA sont paramétrées ici, hors des espaces de travail des agents.
            </p>
          </div>
          <Chip tone="ai">5 agents configurables</Chip>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-card">
        {AGENTS.map((a) => (
          <button
            key={a}
            onClick={() => setAgent(a)}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium transition-smooth",
              agent === a ? "bg-ai text-ai-foreground shadow-sm" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {AGENT_META[a].emoji} {AGENT_META[a].name}
          </button>
        ))}
      </nav>

      <AgentConfigPanel agent={agent} />

      {agent === "pricing" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel title="Moteur de règles tarifaires" description="Seuils et politique d'arbitrage appliqués à toutes les règles.">
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <span>Marge minimale autorisée (%)</span>
                <Input className="h-8 w-24" type="number" value={config.minMargin} onChange={(e) => pricingStore.setConfig({ minMargin: Number(e.target.value) })} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <span>Marge cible (%)</span>
                <Input className="h-8 w-24" type="number" value={config.targetMargin} onChange={(e) => pricingStore.setConfig({ targetMargin: Number(e.target.value) })} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <span>Politique d'arbitrage des conflits</span>
                <select value={config.conflictPolicy} onChange={(e) => pricingStore.setConfig({ conflictPolicy: e.target.value as typeof config.conflictPolicy })}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                  <option value="priorite">Priorité numérique</option>
                  <option value="meilleur_client">Règle client spécifique prioritaire</option>
                  <option value="meilleure_marge">Meilleure marge</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <span>Arrondi des prix appliqués</span>
                <select value={config.roundingRule} onChange={(e) => pricingStore.setConfig({ roundingRule: e.target.value as typeof config.roundingRule })}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                  {["0.01", "0.05", "0.10"].map((o) => <option key={o} value={o}>{o.replace(".", ",")} €</option>)}
                </select>
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <span>Appliquer automatiquement les règles aux devis</span>
                <Switch checked={config.autoApply} onCheckedChange={(v) => pricingStore.setConfig({ autoApply: v })} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <span>Validation manager obligatoire pour activer une règle</span>
                <Switch checked={config.requireManagerApproval} onCheckedChange={(v) => pricingStore.setConfig({ requireManagerApproval: v })} />
              </label>
            </div>
          </Panel>

          <Panel
            title={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-ai" /> Permissions</span>}
            description="Le rôle actif détermine les actions autorisées sur les règles tarifaires."
            action={
              <select value={role} onChange={(e) => { pricingStore.setRole(e.target.value as Role); toast.success(`Rôle actif : ${e.target.value}`); }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            }
          >
            <div className="space-y-3">
              {ROLES.map((r) => (
                <div key={r} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{r}</span>
                    {r === role && <Chip tone="ai">Rôle actif</Chip>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(Object.keys(PERMISSION_LABEL) as Permission[]).map((p) => (
                      <Chip key={p} tone={ROLE_PERMISSIONS[r].includes(p) ? "success" : "muted"}>{PERMISSION_LABEL[p]}</Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
