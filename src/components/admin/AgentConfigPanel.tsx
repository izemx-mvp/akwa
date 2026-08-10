import { useState } from "react";
import { toast } from "sonner";
import { Settings2, Plus, X } from "lucide-react";
import { Panel, Chip } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { agentConfigStore, useAgentConfig } from "@/lib/agent-config";
import { AGENT_META, type AgentKey } from "@/lib/agent-hub";

export function AgentConfigPanel({ agent }: { agent: AgentKey }) {
  const configs = useAgentConfig();
  const cfg = configs[agent];
  const [rule, setRule] = useState("");

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-ai" /> Configuration de {AGENT_META[agent].name}
        </span>
      }
      description="Paramètres, seuils et règles de fonctionnement de l'agent."
      action={<Chip tone="ai">{cfg.autonomy}</Chip>}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-medium">Niveau d'autonomie</span>
              <select
                value={cfg.autonomy}
                onChange={(e) => agentConfigStore.update(agent, { autonomy: e.target.value as typeof cfg.autonomy })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {["Suggestion", "Semi-automatique", "Automatique"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium">Responsable de l'agent</span>
              <Input value={cfg.owner} onChange={(e) => agentConfigStore.update(agent, { owner: e.target.value })} />
            </label>
          </div>

          {cfg.settings.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{s.label}</div>
                {s.hint && <div className="text-[11px] text-muted-foreground">{s.hint}</div>}
              </div>
              {s.type === "switch" && (
                <Switch checked={s.value} onCheckedChange={(v) => agentConfigStore.setSetting(agent, s.key, v)} />
              )}
              {s.type === "number" && (
                <div className="flex items-center gap-1.5">
                  <Input className="h-8 w-24" type="number" value={s.value} onChange={(e) => agentConfigStore.setSetting(agent, s.key, Number(e.target.value))} />
                  <span className="text-xs text-muted-foreground">{s.unit}</span>
                </div>
              )}
              {s.type === "select" && (
                <select value={s.value} onChange={(e) => agentConfigStore.setSetting(agent, s.key, e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                  {s.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              )}
              {s.type === "text" && (
                <Input className="h-8 w-48" value={s.value} onChange={(e) => agentConfigStore.setSetting(agent, s.key, e.target.value)} />
              )}
            </div>
          ))}

          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium">Notifier l'équipe à chaque recommandation</span>
            <Switch checked={cfg.notify} onCheckedChange={(v) => agentConfigStore.update(agent, { notify: v })} />
          </label>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Règles de fonctionnement</div>
          <ul className="space-y-2">
            {cfg.rules.map((r, i) => (
              <li key={i} className="flex items-start justify-between gap-2 rounded-lg border border-border bg-muted/20 p-2.5 text-sm">
                <span>{r}</span>
                <button onClick={() => agentConfigStore.removeRule(agent, i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input value={rule} onChange={(e) => setRule(e.target.value)} placeholder="Ajouter une règle de fonctionnement…" />
            <Button
              size="sm"
              onClick={() => { if (!rule.trim()) return; agentConfigStore.addRule(agent, rule.trim()); setRule(""); toast.success("Règle ajoutée à l'agent"); }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="rounded-lg border border-ai/30 bg-ai/5 p-3 text-xs text-muted-foreground">
            Ces paramètres pilotent les analyses et recommandations de l'agent : seuils, priorités et niveau d'automatisation.
          </div>
        </div>
      </div>
    </Panel>
  );
}
