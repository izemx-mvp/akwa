import { useState, useRef, useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS_ADMIN = [
  "Quelles commandes sont en attente de validation ?",
  "Marges du mois sur la BU lubrifiants ?",
  "Y a-t-il des documents export manquants ?",
];
const SUGGESTIONS_CLIENT = [
  "Suivi de ma dernière commande ?",
  "Quels produits sont disponibles en stock ?",
  "Comment passer une nouvelle commande ?",
];

function generateAnswer(question: string, scope: "admin" | "client"): string {
  const q = question.toLowerCase();
  if (q.includes("commande") && scope === "admin")
    return "📦 3 commandes sont en attente de validation. La commande #CMD-2841 présente une marge de 9% à revoir.";
  if (q.includes("marge"))
    return "📊 Marge moyenne actuelle : 16,4%. Tendance +2,1 pts vs mois dernier. La BU lubrifiants performe à 22%.";
  if (q.includes("document") || q.includes("export"))
    return "📄 2 expéditions ont des documents manquants : Certificat d'origine pour EXP-1042 et BL pour EXP-1048.";
  if (q.includes("conteneur"))
    return "🚛 Recommandation IA : utiliser un conteneur 40' (taux de remplissage estimé 87%).";
  if (q.includes("stock") || q.includes("produit"))
    return "✅ Catalogue à jour : Butane 12kg (en stock), Lubricant Pack XL (stock limité), Fuel Additive Drum (disponible).";
  if (q.includes("suivi") || q.includes("commande"))
    return "🚢 Votre dernière commande est en cours de chargement. ETA estimée : 12 jours.";
  return "Je suis l'assistant AKWA AI. Je peux vous aider sur les commandes, le pricing, les marges, le conteneur et l'export. Que souhaitez-vous savoir ?";
}

export function FloatingAssistant() {
  const location = useLocation();
  const scope: "admin" | "client" = location.pathname.startsWith("/admin") ? "admin" : "client";

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "👋 Bonjour, je suis votre assistant AKWA AI. Comment puis-je vous aider ?" },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value) return;
    setMessages((m) => [...m, { role: "user", content: value }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: generateAnswer(value, scope) }]);
    }, 450);
  };

  const suggestions = scope === "admin" ? SUGGESTIONS_ADMIN : SUGGESTIONS_CLIENT;

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground shadow-elegant flex items-center justify-center hover:scale-105 transition-transform",
          open && "scale-95"
        )}
        aria-label="Assistant AKWA AI"
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Panneau */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-8rem)] rounded-xl border border-border bg-card shadow-elegant flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="px-4 py-3 border-b border-border bg-gradient-primary text-primary-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Assistant AKWA AI</div>
              <div className="text-[10px] opacity-80">{scope === "admin" ? "Mode Admin" : "Mode Client"} · En ligne</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          {messages.length <= 1 && (
            <div className="px-3 pb-2 space-y-1">
              <div className="text-[10px] uppercase text-muted-foreground">Suggestions</div>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-md border border-border hover:bg-muted/60"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
              placeholder="Posez votre question..."
            />
            <Button size="icon" onClick={() => send(input)}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </>
  );
}
