import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { products, formatCurrency, type Country } from "@/lib/mock-data";
import { computeOrderInsights, generateOrderRecommendations, type CartLine } from "@/lib/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2, Sparkles, Package2 } from "lucide-react";
import { AgentBadge } from "@/components/AgentBadge";
import { RecommendationCard } from "@/components/RecommendationCard";
import { toast } from "sonner";

export const Route = createFileRoute("/client/new-order")({
  component: NewOrder,
});

const COUNTRIES: Country[] = ["Senegal", "Côte d'Ivoire", "Mauritania", "Mali", "Guinea"];

function NewOrder() {
  const [cart, setCart] = useState<CartLine[]>([
    { productId: "p1", quantity: 200 },
    { productId: "p4", quantity: 150 },
  ]);
  const [destination, setDestination] = useState<Country>("Senegal");

  const { fill, totalValue, totalWeight, totalVolume, totalMargin } = useMemo(
    () => computeOrderInsights(cart, destination),
    [cart, destination]
  );
  const recs = useMemo(() => generateOrderRecommendations(cart, destination), [cart, destination]);

  const setQty = (id: string, q: number) =>
    setCart((c) => {
      if (q <= 0) return c.filter((l) => l.productId !== id);
      const exists = c.find((l) => l.productId === id);
      if (exists) return c.map((l) => (l.productId === id ? { ...l, quantity: q } : l));
      return [...c, { productId: id, quantity: q }];
    });

  const addProduct = (id: string) => {
    const exists = cart.find((l) => l.productId === id);
    setQty(id, (exists?.quantity ?? 0) + 50);
  };

  const applyRec = (id: string) => {
    if (id === "fill-low") {
      addProduct("p4");
      setCart((c) => c.map((l) => (l.productId === "p4" ? { ...l, quantity: l.quantity + 200 } : l)));
      toast.success("AI suggestion applied: +200 units of Butane 6kg");
    } else if (id === "fill-mid") {
      setCart((c) => c.map((l) => ({ ...l, quantity: l.quantity + 30 })));
      toast.success("Order optimized");
    } else {
      toast.success("Suggestion applied");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 max-w-[1400px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create new order</h1>
          <p className="text-sm text-muted-foreground">Build your shipment — AKWA AI optimizes pricing and container loading in real time.</p>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold">Order details</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Destination</span>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value as Country)}
                className="text-sm rounded-md border border-input bg-background px-3 py-1.5"
              >
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p) => {
              const inCart = cart.find((l) => l.productId === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => addProduct(p.id)}
                  className="text-left rounded-lg border border-border p-3 hover:border-primary hover:shadow-elegant transition-smooth"
                >
                  <div className="text-2xl">{p.image}</div>
                  <div className="mt-2 text-xs font-medium line-clamp-2">{p.name}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatCurrency(p.unitPrice)}</span>
                    {inCart && <span className="text-[10px] font-semibold text-primary">×{inCart.quantity}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Order lines</h3>
            <span className="text-xs text-muted-foreground">{cart.length} items</span>
          </div>
          {cart.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Your cart is empty. Pick a product above.</div>
          ) : (
            <div className="divide-y divide-border">
              {cart.map((l) => {
                const p = products.find((p) => p.id === l.productId)!;
                return (
                  <div key={l.productId} className="px-5 py-3 flex items-center gap-3">
                    <div className="text-2xl">{p.image}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(p.unitPrice)} · {p.unitWeightKg}kg</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.productId, l.quantity - 50)}><Minus className="h-3 w-3" /></Button>
                      <Input type="number" value={l.quantity} onChange={(e) => setQty(l.productId, Number(e.target.value))} className="w-20 h-7 text-center text-xs" />
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.productId, l.quantity + 50)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <div className="w-24 text-right text-sm font-semibold">{formatCurrency(l.quantity * p.unitPrice)}</div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setQty(l.productId, 0)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="px-5 py-4 border-t border-border bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><div className="text-[10px] uppercase text-muted-foreground">Total</div><div className="text-lg font-bold">{formatCurrency(totalValue)}</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Margin</div><div className="text-lg font-bold text-success">{formatCurrency(totalMargin)}</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Weight</div><div className="text-lg font-bold">{totalWeight.toFixed(0)} kg</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Volume</div><div className="text-lg font-bold">{totalVolume.toFixed(2)} m³</div></div>
          </div>
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2">
            <Button variant="outline">Save draft</Button>
            <Button className="bg-gradient-primary shadow-elegant" onClick={() => toast.success("Order submitted to AKWA AI")}>Submit order</Button>
          </div>
        </div>
      </div>

      {/* AI Order Assistant — sticky right panel */}
      <aside className="space-y-4">
        <div className="rounded-xl bg-gradient-ai text-ai-foreground p-5 shadow-ai sticky top-20">
          <div className="flex items-center justify-between">
            <AgentBadge name="AI Order Assistant" pulse />
            <Sparkles className="h-4 w-4 text-white/80" />
          </div>
          <h3 className="mt-3 text-base font-semibold">Live optimization</h3>
          <p className="text-xs text-white/80 mt-1">I'm analyzing your order in real time.</p>

          <div className="mt-4 rounded-lg bg-white/10 backdrop-blur p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80 flex items-center gap-1.5"><Package2 className="h-3.5 w-3.5" /> Container fill</span>
              <span className="font-bold">{fill.toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${fill}%` }} />
            </div>
            <div className="mt-2 text-[10px] text-white/70">
              {fill < 60 ? "Under-utilized — adding more units saves cost." : fill < 90 ? "Good. Almost optimal." : "Optimized ✓"}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {recs.map((r) => (
            <RecommendationCard key={r.id} rec={r} onApply={() => applyRec(r.id)} />
          ))}
        </div>
      </aside>
    </div>
  );
}
