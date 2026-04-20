import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, MessageSquare } from "lucide-react";
import { AgentBadge } from "@/components/AgentBadge";

export const Route = createFileRoute("/admin/copilot")({
  component: Copilot,
});

type Msg = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "Meilleur client ce mois-ci",
  "Comment améliorer les marges au Mali",
  "Optimiser la prochaine expédition vers le Sénégal",
  "Montrer les anomalies de pricing",
  "Prévision revenu T3",
];

const replies: Record<string, string> = {
  default: "J'ai croisé vos données opérationnelles. Trois opportunités émergent cette semaine : sous-utilisation conteneur sur AKW-2410-0184 (78 % → 94 % possible), écart pricing sur le corridor Sénégal (+4,2k $/mois) et 2 documents manquants pour l'expédition Mauritanie.",
  best: "**Abidjan Logistics Co.** est votre meilleur performeur ce mois — 1,55 M$ de revenu, 19,2 % de marge, tendance +3,4 %. Ils ont consolidé 4 expéditions à 91 %+ de remplissage. Recommandation : proposer une montée de palier.",
  mali: "La marge Mali est forte (21,0 %) mais les volumes sont limités. Pour croître rentablement :\n• Augmenter l'allocation Lubrifiant Pack XL (+30 % suggéré)\n• Consolider les commandes en bi-mensuel pour maintenir 90 %+ de remplissage\n• Appliquer +1,5 % de pricing — l'élasticité le permet\nUplift projeté : **+8 400 $/trimestre**",
  optimize: "Prochaine expédition Sénégal (AKW-2410-0182) : actuellement 87 % de remplissage, 18,2 % de marge. Ajouter 80 unités de Butane 6kg porte le remplissage à 96 % avec +640 $ de marge. Container Optimizer prêt à appliquer.",
  pricing: "3 anomalies de pricing détectées :\n1. Butane 12kg sous-évalué de 2,5 % au Sénégal vs marché\n2. Pack Carburant Aviation : marge en baisse de 4,1 % — revoir les coûts\n3. Lubrifiant Pack XL accepte +6 % selon l'élasticité de la demande",
  forecast: "D'après la vélocité des commandes et les tendances saisonnières : **revenu T3 prévu 4,1 M$** (+14 % YoY), si les optimisations IA actuelles tiennent. Facteur de risque : volatilité du corridor Mauritanie (±8 %).",
};

function Copilot() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Bonjour — je suis votre Copilot interne. J'ai accès complet aux commandes, pricing, marges, expéditions et données douanières. Posez-moi n'importe quelle question." },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();
    let reply = replies.default;
    if (lower.includes("meilleur") || lower.includes("best")) reply = replies.best;
    else if (lower.includes("mali")) reply = replies.mali;
    else if (lower.includes("optimis") || lower.includes("expédition")) reply = replies.optimize;
    else if (lower.includes("pricing") || lower.includes("anomal") || lower.includes("prix")) reply = replies.pricing;
    else if (lower.includes("prévision") || lower.includes("t3") || lower.includes("forecast")) reply = replies.forecast;

    setMessages((m) => [...m, { role: "user", text }, { role: "ai", text: reply }]);
    setInput("");
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-9rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-11 w-11 rounded-xl bg-gradient-ai flex items-center justify-center shadow-glow">
          <MessageSquare className="h-5 w-5 text-ai-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">Copilot interne <AgentBadge name="Toujours actif" /></h1>
          <p className="text-xs text-muted-foreground">Interface conversationnelle vers toutes vos données opérationnelles.</p>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-border bg-card shadow-card overflow-y-auto p-5 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex gap-3"}>
            {m.role === "ai" && <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-ai flex items-center justify-center"><Sparkles className="h-4 w-4 text-ai-foreground" /></div>}
            <div className={m.role === "user" ? "max-w-[75%] rounded-2xl rounded-br-sm bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm shadow-elegant whitespace-pre-wrap" : "max-w-[75%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap"}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:border-ai hover:text-ai transition-smooth">
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez une question sur commandes, pricing, marges, expéditions…" className="flex-1" />
        <Button type="submit" className="bg-gradient-ai gap-1.5"><Send className="h-4 w-4" /> Envoyer</Button>
      </form>
    </div>
  );
}
