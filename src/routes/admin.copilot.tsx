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
  "Best client this month",
  "How to improve margins in Mali",
  "Optimize next shipment to Senegal",
  "Show pricing anomalies",
  "Forecast Q3 revenue",
];

const replies: Record<string, string> = {
  default: "I've cross-referenced your operational data. Three opportunities surface this week: container under-utilization on AKW-2410-0184 (78% → 94% possible), pricing gap on Senegal corridor (+$4.2k/month), and 2 documents missing for Mauritania shipment.",
  best: "**Abidjan Logistics Co.** is your top performer this month — $1.55M revenue, 19.2% margin, +3.4% trend. They've consolidated 4 shipments at 91%+ container fill. Recommend offering tier upgrade.",
  mali: "Mali margin is strong (21.0%) but volume is limited. To grow profitably:\n• Increase Lubricant Pack XL allocation (+30% suggested)\n• Consolidate orders bi-weekly to maintain 90%+ container fill\n• Apply +1.5% pricing — elasticity allows it\nProjected uplift: **+$8,400/quarter**",
  optimize: "Next shipment to Senegal (AKW-2410-0182): currently 87% fill, 18.2% margin. Adding 80 units of Butane 6kg lifts fill to 96% with +$640 margin. Container Optimizer ready to apply.",
  pricing: "3 pricing anomalies detected:\n1. Butane 12kg in Senegal under-priced by 2.5% vs market\n2. Aviation Fuel Pack margin dropped 4.1% — review costs\n3. Lubricant Pack XL accepts +6% based on demand elasticity",
  forecast: "Based on order velocity and seasonal patterns: **Q3 revenue forecast $4.1M** (+14% YoY), assuming current AI optimizations hold. Risk factor: Mauritania corridor volatility (±8%).",
};

function Copilot() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hello — I'm your Internal Copilot. I have full access to orders, pricing, margins, shipments and customs data. Ask me anything." },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();
    let reply = replies.default;
    if (lower.includes("best")) reply = replies.best;
    else if (lower.includes("mali")) reply = replies.mali;
    else if (lower.includes("optimize") || lower.includes("shipment")) reply = replies.optimize;
    else if (lower.includes("pricing") || lower.includes("anomal")) reply = replies.pricing;
    else if (lower.includes("forecast") || lower.includes("q3")) reply = replies.forecast;

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
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">Internal Copilot <AgentBadge name="Always on" /></h1>
          <p className="text-xs text-muted-foreground">Conversational interface to all your operational data.</p>
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
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about orders, pricing, margins, shipments…" className="flex-1" />
        <Button type="submit" className="bg-gradient-ai gap-1.5"><Send className="h-4 w-4" /> Send</Button>
      </form>
    </div>
  );
}
