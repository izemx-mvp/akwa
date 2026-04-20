import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentBadge } from "@/components/AgentBadge";
import { Send, Sparkles, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/client/ask")({
  component: AskAkwa,
});

type Msg = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "Quel est mon produit à plus forte marge ?",
  "Quand ma dernière commande arrivera-t-elle ?",
  "Comment réduire le coût d'expédition vers le Mali ?",
  "Montre-moi des alternatives au Butane 12kg",
];

const replies: Record<string, string> = {
  default: "D'après votre historique, je recommande de revoir vos 3 dernières expéditions — remplissage moyen 64 %. Combiner Butane 12kg avec Lubrifiant Pack XL sur la prochaine commande débloquerait un chargement optimal.",
  margin: "Votre produit à plus forte marge ce trimestre est **Lubrifiant Pack XL** (28,6 %). Les volumes restent faibles — augmenter la commande de 80 unités améliorerait significativement la rentabilité globale.",
  arrive: "Votre expédition **AKW-2410-0186** est en transit vers Conakry — ETA 26 avril. Le dédouanement est pré-validé par l'Export Assistant.",
  mali: "Pour réduire le coût d'expédition vers le Mali : combinez petits SKUs (Butane 6kg) avec lubrifiants en vrac dans le même conteneur. Économie estimée : **1 180 $ par expédition** à 92 % de remplissage.",
};

function AskAkwa() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Bonjour 👋 Je suis AKWA AI, votre copilote export personnel. Posez-moi n'importe quelle question sur votre compte, vos expéditions, le pricing ou les produits." },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();
    let reply = replies.default;
    if (lower.includes("marge")) reply = replies.margin;
    else if (lower.includes("arriv") || lower.includes("quand")) reply = replies.arrive;
    else if (lower.includes("mali")) reply = replies.mali;

    setMessages((m) => [...m, { role: "user", text }, { role: "ai", text: reply }]);
    setInput("");
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-9rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-ai flex items-center justify-center shadow-glow">
          <MessageSquare className="h-5 w-5 text-ai-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">Demander à AKWA AI <AgentBadge name="En ligne" /></h1>
          <p className="text-xs text-muted-foreground">Copilote conversationnel — vos données, vos opérations.</p>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-border bg-card shadow-card overflow-y-auto p-5 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex gap-3"}>
            {m.role === "ai" && <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-ai flex items-center justify-center"><Sparkles className="h-4 w-4 text-ai-foreground" /></div>}
            <div className={m.role === "user" ? "max-w-[75%] rounded-2xl rounded-br-sm bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm shadow-elegant" : "max-w-[75%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm"}>
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
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez une question sur vos opérations…" className="flex-1" />
        <Button type="submit" className="bg-gradient-ai gap-1.5"><Send className="h-4 w-4" /> Envoyer</Button>
      </form>
    </div>
  );
}
