import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Container, Check } from "lucide-react";
import { toast } from "sonner";
import { AgentHeader, OrderContextPanel, Explain, CrossLink } from "@/components/admin/AgentShell";
import { Chip, Kpi, Panel, Bar } from "@/components/admin/ui";
import { agentHub, containerPlans, useAgentHub, orderContext } from "@/lib/agent-hub";
import { eur } from "@/lib/backoffice-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/agents/container-optimizer")({
  head: () => ({
    meta: [
      { title: "Agent Optimisation Conteneur — Back-office AKWA" },
      { name: "description", content: "Répartition des marchandises, taux de remplissage et scénarios multi-conteneurs." },
      { property: "og:title", content: "Agent Optimisation Conteneur — Back-office AKWA" },
      { property: "og:description", content: "Optimisez le chargement et réduisez le coût de fret par unité." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentContainer,
});

function AgentContainer() {
  const { validatedPlan } = useAgentHub();
  const ctx = orderContext();
  const plans = containerPlans();
  const [selected, setSelected] = useState(plans[0].id);
  const plan = plans.find((p) => p.id === selected)!;
  const best = plans.reduce((a, b) => (a.cost <= b.cost ? a : b));

  return (
    <div className="max-w-[1500px] space-y-6">
      <AgentHeader agentKey="container" icon={Container}>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => { agentHub.validatePlan(plan.id, plan.label, Math.max(0, plans[1].cost - plan.cost)); toast.success("Plan de chargement validé et rattaché à la commande"); }}
        >
          <Check className="mr-1.5 h-3.5 w-3.5" /> Valider ce plan
        </Button>
      </AgentHeader>

      <OrderContextPanel from="container" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Taux de remplissage" value={`${plan.fill} %`} />
        <Kpi label="Conteneurs" value={`${plan.boxes.length}`} />
        <Kpi label="Coût fret estimé" value={eur(plan.cost)} />
        <Kpi label="Économie vs alternative" value={eur(Math.max(0, plans[1].cost - plan.cost))} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title={`Visualisation du chargement — ${plan.label}`}>
          <div className="space-y-5 p-4">
            {plan.boxes.map((b) => {
              const fill = Math.round((b.usedM3 / b.capacityM3) * 100);
              return (
                <div key={b.id}>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold">{b.id} · {b.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {b.usedM3.toFixed(1)} / {b.capacityM3} m³ · {b.weightKg.toLocaleString("fr-FR")} kg · {b.pallets} palettes
                    </span>
                  </div>
                  <div className="relative flex h-24 overflow-hidden rounded-lg border-2 border-border bg-muted/40">
                    <div className="flex h-full" style={{ width: `${fill}%` }}>
                      {b.items.map((it, i) => (
                        <div
                          key={it}
                          title={it}
                          className={cn(
                            "grid h-full flex-1 place-items-center border-r border-white/20 px-1 text-center text-[10px] font-medium text-primary-foreground",
                            ["bg-primary/90", "bg-ai/90", "bg-success/80", "bg-warning/80"][i % 4],
                          )}
                        >
                          <span className="line-clamp-2">{it}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid flex-1 place-items-center text-[10px] text-muted-foreground">espace libre</div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <Bar value={fill} tone={fill >= 90 ? "bg-success" : "bg-warning"} />
                    <span className="w-10 text-right text-xs font-semibold">{fill} %</span>
                  </div>
                </div>
              );
            })}
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              Contraintes respectées : poids max 26 000 kg / conteneur, gerbage limité à 2 niveaux, produits alimentaires
              séparés des lubrifiants, palettes Europe 120 × 80.
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Scénarios comparés">
            <div className="space-y-3 p-4">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-smooth",
                    selected === p.id ? "border-ai bg-ai/5" : "border-border hover:border-ai/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{p.label}</span>
                    {validatedPlan === p.id && <Chip tone="success">validé</Chip>}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Remplissage {p.fill} %</span>
                    <span>{eur(p.cost)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{p.note}</p>
                  {p.risk && <p className="mt-1 text-[11px] text-warning">⚠ {p.risk}</p>}
                </button>
              ))}
            </div>
          </Panel>

          <Explain>
            Pour la commande {ctx.order?.reference} ({ctx.destination}), l'agent recommande{" "}
            <strong>{best.label}</strong> : le remplissage moyen de {best.fill} % offre le meilleur coût par m³ tout en
            gardant une marge de manœuvre au chargement. Les solutions plus denses saturent la hauteur utile et
            augmentent le risque de casse sur les produits alimentaires.
          </Explain>

          <Panel title="Actions croisées">
            <div className="flex flex-wrap gap-2 p-4">
              <CrossLink from="container" to="marge" label="Recalculer la marge" />
              <CrossLink from="container" to="devis" label="Mettre à jour le devis" />
              <CrossLink from="container" to="export" label="Planifier l'expédition" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
