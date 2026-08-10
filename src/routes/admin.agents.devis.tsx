import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Sparkles } from "lucide-react";
import { AgentHeader, OrderContextPanel, Explain, CrossLink } from "@/components/admin/AgentShell";
import { Chip, Kpi, Panel, quoteStatusTone } from "@/components/admin/ui";

import { eur, goodsTotal, useBackoffice } from "@/lib/backoffice-store";
import { useAgentHub } from "@/lib/agent-hub";

export const Route = createFileRoute("/admin/agents/devis")({
  head: () => ({
    meta: [
      { title: "Agent Devis — Back-office AKWA" },
      { name: "description", content: "Génération assistée des devis export à partir des commandes validées." },
      { property: "og:title", content: "Agent Devis — Back-office AKWA" },
      { property: "og:description", content: "Composez, chiffrez et envoyez vos devis export en quelques clics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentDevis,
});

function AgentDevis() {
  useAgentHub();
  const { orders, clients, adminQuotes } = useBackoffice();
  const toQuote = orders.filter((o) => !adminQuotes.some((q) => q.orderRef === o.reference));

  return (
    <div className="max-w-[1500px] space-y-6">
      <AgentHeader agentKey="devis" icon={FileText} />
      <OrderContextPanel from="devis" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Commandes sans devis" value={String(toQuote.length)} />
        <Kpi label="Devis générés" value={String(adminQuotes.length)} />
        <Kpi label="Acceptés" value={String(adminQuotes.filter((q) => q.status === "Accepté").length)} />
        <Kpi label="En attente client" value={String(adminQuotes.filter((q) => q.status === "À valider client").length)} />
      </div>

      <Panel title="Commandes à chiffrer">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Commande</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Destination</th>
                <th className="px-4 py-3 text-right font-medium">Marchandises</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {toQuote.map((o) => (
                <tr key={o.reference} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{o.reference}</td>
                  <td className="px-4 py-3 text-muted-foreground">{clients.find((c) => c.id === o.clientId)?.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.destination}</td>
                  <td className="px-4 py-3 text-right">{eur(goodsTotal(o.items))}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/admin/devis/generer/$reference"
                      params={{ reference: o.reference }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-ai px-2.5 py-1.5 text-xs font-medium text-ai-foreground"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Générer le devis
                    </Link>
                  </td>
                </tr>
              ))}
              {toQuote.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">Toutes les commandes disposent d'un devis.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Devis générés par l'agent">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Devis</th>
                  <th className="px-4 py-3 text-left font-medium">Commande</th>
                  <th className="px-4 py-3 text-left font-medium">Version</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {adminQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      <Link to="/admin/devis/$quoteId" params={{ quoteId: q.id }} className="hover:underline">{q.id}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{q.orderRef}</td>
                    <td className="px-4 py-3">V{q.version}</td>
                    <td className="px-4 py-3"><Chip tone={quoteStatusTone[q.status] ?? "muted"}>{q.status}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Explain>
            L'agent reprend les articles de la commande validée, applique les prix catalogue à jour (Agent Pricing),
            ajoute les frais export calculés à partir du plan de chargement retenu (Agent Conteneur) et vérifie que la
            marge finale reste au-dessus du seuil interne (Agent Marge) avant l'envoi au portail client.
          </Explain>
          <Panel title="Actions croisées">
            <div className="flex flex-wrap gap-2 p-4">
              <CrossLink from="devis" to="pricing" label="Vérifier les prix" />
              <CrossLink from="devis" to="marge" label="Contrôler la marge" />
              <CrossLink from="devis" to="container" label="Chiffrer le fret" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
