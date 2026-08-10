import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Container, FileText, Ship, Tag, TrendingUp, ArrowRight, History } from "lucide-react";
import { AGENT_META, useAgentHub, orderContext, type AgentKey } from "@/lib/agent-hub";
import { OrderContextPanel } from "@/components/admin/AgentShell";
import { Chip, Kpi } from "@/components/admin/ui";
import { eur, pct } from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/agents/")({
  head: () => ({
    meta: [
      { title: "Agents IA — Back-office AKWA" },
      { name: "description", content: "Hub des agents intelligents AKWA : devis, pricing, marge, export et optimisation conteneur." },
      { property: "og:title", content: "Agents IA — Back-office AKWA" },
      { property: "og:description", content: "Pilotez vos agents intelligents export : devis, pricing, marge, export, conteneur." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentsHub,
});

const cards: { key: AgentKey; icon: typeof Bot; missions: string[] }[] = [
  { key: "devis", icon: FileText, missions: ["Composer les devis", "Ajouter les frais export", "Envoyer au portail client"] },
  { key: "pricing", icon: Tag, missions: ["Détecter les hausses de coût", "Recommander un prix", "Comparer 3 scénarios"] },
  { key: "marge", icon: TrendingUp, missions: ["Suivre la rentabilité", "Décomposer la marge", "Alerter sous 15 %"] },
  { key: "export", icon: Ship, missions: ["Checklist documentaire", "Analyse des risques", "Timeline opérationnelle"] },
  { key: "container", icon: Container, missions: ["Répartir les marchandises", "Comparer les scénarios", "Réduire le coût fret"] },
];

function AgentsHub() {
  const { logs } = useAgentHub();
  const ctx = orderContext();

  return (
    <div className="max-w-[1500px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agents IA</h1>
        <p className="text-sm text-muted-foreground">
          Cinq agents spécialisés qui partagent le même contexte commande et s'appellent entre eux.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Agents actifs" value="5" />
        <Kpi label="Commande en contexte" value={ctx.order?.reference ?? "—"} />
        <Kpi label="Montant" value={eur(ctx.revenue)} />
        <Kpi label="Marge estimée" value={pct(ctx.marginPct)} />
      </div>

      <OrderContextPanel from="devis" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ key, icon: Icon, missions }) => {
          const meta = AGENT_META[key];
          const count = logs.filter((l) => l.agent === key).length;
          return (
            <Link
              key={key}
              to={meta.route}
              className="block overflow-hidden rounded-xl border border-border bg-card shadow-card transition-smooth hover:shadow-elegant"
            >
              <div className="relative overflow-hidden bg-gradient-ai p-5 text-ai-foreground">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded bg-success/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> actif
                  </span>
                </div>
                <h2 className="relative z-10 mt-4 text-lg font-bold">{meta.name}</h2>
                <p className="relative z-10 text-xs text-white/80">{meta.subtitle}</p>
              </div>
              <div className="space-y-3 p-5">
                <ul className="space-y-1.5">
                  {missions.map((m) => (
                    <li key={m} className="flex gap-2 text-xs text-foreground/80"><span className="text-ai">•</span>{m}</li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-1">
                  <Chip tone="ai">{count} action{count > 1 ? "s" : ""}</Chip>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Ouvrir l'agent <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        <Link
          to="/admin/agents/historique"
          className="flex flex-col items-start justify-center gap-2 rounded-xl border border-dashed border-border bg-card/60 p-6 transition-smooth hover:border-ai/50"
        >
          <History className="h-5 w-5 text-ai" />
          <div className="font-semibold">Historique des recommandations IA</div>
          <p className="text-xs text-muted-foreground">
            Toutes les analyses, recommandations, décisions humaines et résultats obtenus.
          </p>
        </Link>
      </div>
    </div>
  );
}
