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
  "What's my best margin product?",
  "When will my last order arrive?",
  "How can I reduce shipping cost to Mali?",
  "Show me alternatives for Butane 12kg",
];

const replies: Record<string, string> = {
  default: "Based on your account history, I'd recommend reviewing your last 3 shipments — average container fill was 64%. Combining Butane 12kg with Lubricant Pack XL on your next order would unlock optimal loading.",
  margin: "Your highest-margin product this quarter is **Lubricant Pack XL** (28.6%). Volumes are still low — increasing your order by 80 units would significantly improve overall account profitability.",
  arrive: "Your shipment **AKW-2410-0186** is currently in transit to Conakry — ETA April 26. Customs clearance is pre-validated by the Export Assistant.",
  mali: "To reduce shipping cost to Mali: combine smaller SKUs (Butane 6kg) with bulk lubricants in the same container. Estimated saving: **$1,180 per shipment** at 92% fill.",
};

function AskAkwa() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hi 👋 I'm AKWA AI, your personal export copilot. Ask me anything about your account, shipments, pricing or products." },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();
    let reply = replies.default;
    if (lower.includes("margin")) reply = replies.margin;
    else if (lower.includes("arrive") || lower.includes("when")) reply = replies.arrive;
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
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">Ask AKWA AI <AgentBadge name="Online" /></h1>
          <p className="text-xs text-muted-foreground">Conversational copilot — your data, your operations.</p>
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
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about your operations…" className="flex-1" />
        <Button type="submit" className="bg-gradient-ai gap-1.5"><Send className="h-4 w-4" /> Send</Button>
      </form>
    </div>
  );
}
