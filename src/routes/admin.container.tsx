import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { containerScenarios, formatCurrency } from "@/lib/mock-data";
import { AgentBadge } from "@/components/AgentBadge";
import { Button } from "@/components/ui/button";
import { Package, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/container")({
  component: Container,
});

function Container() {
  const [active, setActive] = useState(1);
  const sc = containerScenarios[active];

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">Container Optimization <AgentBadge name="Container Optimizer" icon={Package} /></h1>
        <p className="text-sm text-muted-foreground">Maximize fill, weight and profitability per shipment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {containerScenarios.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setActive(i)}
            className={cn(
              "text-left rounded-xl border-2 p-5 transition-smooth",
              active === i ? "border-ai bg-ai/5 shadow-ai" : "border-border bg-card hover:border-primary"
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{s.name}</h3>
              {i === 1 && <span className="text-[10px] uppercase tracking-wider bg-gradient-ai text-ai-foreground px-2 py-0.5 rounded">AI Pick</span>}
            </div>
            <div className="mt-4 text-3xl font-bold">{s.fill}%</div>
            <div className="text-xs text-muted-foreground">Container fill</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div><div className="text-muted-foreground">Units</div><div className="font-semibold text-foreground">{s.units}</div></div>
              <div><div className="text-muted-foreground">Margin</div><div className="font-semibold text-success">{formatCurrency(s.marginUSD)}</div></div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Visualization */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">3D loading preview — {sc.name}</h3>
            <span className="text-xs text-muted-foreground">20ft container</span>
          </div>
          <div className="relative h-[300px] rounded-lg bg-gradient-to-br from-muted to-secondary p-4 overflow-hidden">
            <div className="absolute inset-4 border-2 border-dashed border-primary/30 rounded-lg" />
            <div className="absolute inset-4 grid grid-cols-12 grid-rows-6 gap-1 p-2">
              {Array.from({ length: 72 }).map((_, i) => {
                const filled = i < (sc.fill / 100) * 72;
                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-sm transition-smooth",
                      filled ? (i % 3 === 0 ? "bg-gradient-primary" : i % 3 === 1 ? "bg-gradient-ai" : "bg-primary/70") : "bg-background/40"
                    )}
                    style={{ animationDelay: `${i * 15}ms` }}
                  />
                );
              })}
            </div>
            <div className="absolute bottom-4 right-4 rounded-lg bg-card/95 backdrop-blur p-3 border border-border shadow-elegant">
              <div className="text-[10px] uppercase text-muted-foreground">Fill</div>
              <div className="text-2xl font-bold text-gradient-primary">{sc.fill}%</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline">Export plan</Button>
            <Button className="bg-gradient-ai shadow-ai gap-1.5" onClick={() => toast.success(`Scenario "${sc.name}" applied`)}>
              <Sparkles className="h-4 w-4" /> Apply scenario
            </Button>
          </div>
        </div>

        <aside className="rounded-xl bg-gradient-ai text-ai-foreground p-5 shadow-ai">
          <AgentBadge name="Container Optimizer" icon={Package} />
          <h3 className="mt-3 text-base font-semibold">Recommendation</h3>
          <p className="text-xs text-white/80 mt-2 leading-relaxed">
            Switching to <strong>AI Optimized</strong> scenario raises fill from 78% to 94% and unlocks <strong>+{formatCurrency(3380)}</strong> of margin per shipment.
          </p>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between bg-white/10 rounded px-3 py-2"><span>Add Butane 6kg</span><span className="font-bold">+120 units</span></div>
            <div className="flex justify-between bg-white/10 rounded px-3 py-2"><span>Reduce Lubricant XL</span><span className="font-bold">−20 units</span></div>
            <div className="flex justify-between bg-white/10 rounded px-3 py-2"><span>Cost saving</span><span className="font-bold text-white">−14%/unit</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
