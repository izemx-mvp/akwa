import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { products, formatCurrency, type Country } from "@/lib/mock-data";
import { computeOrderInsights, generateOrderRecommendations, type CartLine } from "@/lib/agents";
import { ordersStore } from "@/lib/orders-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2, Sparkles, Package2, Tag, MessageSquare } from "lucide-react";
import { AgentBadge } from "@/components/AgentBadge";
import { RecommendationCard } from "@/components/RecommendationCard";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

type LocalLine = CartLine & { proposedPrice?: number; priceNote?: string };

export const Route = createFileRoute("/client/new-order")({
  component: NewOrder,
});

const COUNTRIES: Country[] = ["Sénégal", "Côte d'Ivoire", "Mauritanie", "Mali", "Guinée"];

function NewOrder() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<LocalLine[]>([
    { productId: "p1", quantity: 200 },
    { productId: "p4", quantity: 150 },
  ]);
  const [destination, setDestination] = useState<Country>("Sénégal");

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

  const setProposedPrice = (id: string, price: number | undefined) =>
    setCart((c) => c.map((l) => (l.productId === id ? { ...l, proposedPrice: price } : l)));

  const setPriceNote = (id: string, note: string) =>
    setCart((c) => c.map((l) => (l.productId === id ? { ...l, priceNote: note } : l)));

  const addProduct = (id: string) => {
    const exists = cart.find((l) => l.productId === id);
    setQty(id, (exists?.quantity ?? 0) + 50);
  };

  const submitOrder = () => {
    if (cart.length === 0) {
      toast.error("Votre panier est vide");
      return;
    }
    const ref = `AKW-${new Date().getFullYear().toString().slice(2)}${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const lines = cart.map((l) => {
      const p = products.find((x) => x.id === l.productId)!;
      return {
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: p.unitPrice,
        proposedPrice: l.proposedPrice,
        priceNote: l.priceNote,
      };
    });
    const hasProposed = lines.some((l) => l.proposedPrice !== undefined);
    ordersStore.add({
      id: `o-${Date.now()}`,
      reference: ref,
      clientId: "c1", // client connecté simulé
      destination,
      createdAt: new Date().toISOString().slice(0, 10),
      status: "Pending",
      lines,
      containerFillPct: Math.round(fill),
      marginPct: Number(((totalMargin / Math.max(totalValue, 1)) * 100).toFixed(1)),
      submittedAt: new Date().toISOString(),
      source: "client",
    });
    toast.success(
      hasProposed
        ? `Commande ${ref} envoyée avec proposition de prix — en attente de validation admin`
        : `Commande ${ref} envoyée à AKWA AI`
    );
    navigate({ to: "/client/orders" });
  };


  const applyRec = (id: string) => {
    if (id === "fill-low") {
      setCart((c) => {
        const has = c.find((l) => l.productId === "p4");
        if (has) return c.map((l) => (l.productId === "p4" ? { ...l, quantity: l.quantity + 200 } : l));
        return [...c, { productId: "p4", quantity: 200 }];
      });
      toast.success("Suggestion IA appliquée : +200 unités de Butane 6kg");
    } else if (id === "fill-mid") {
      setCart((c) => c.map((l) => ({ ...l, quantity: l.quantity + 30 })));
      toast.success("Commande optimisée");
    } else {
      toast.success("Suggestion appliquée");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 max-w-[1400px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle commande</h1>
          <p className="text-sm text-muted-foreground">Construisez votre expédition — AKWA AI optimise pricing et chargement en temps réel.</p>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold">Détails de la commande</h3>
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

        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Lignes de commande</h3>
            <span className="text-xs text-muted-foreground">{cart.length} articles · proposez votre prix si besoin</span>
          </div>
          {cart.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Votre panier est vide. Choisissez un produit ci-dessus.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Produit</th>
                    <th className="text-center px-2 py-2 font-medium">Quantité</th>
                    <th className="text-right px-2 py-2 font-medium">Prix proposé</th>
                    <th className="text-left px-2 py-2 font-medium">Prix client (optionnel)</th>
                    <th className="text-right px-2 py-2 font-medium">Total ligne</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cart.map((l) => {
                    const p = products.find((p) => p.id === l.productId)!;
                    const effectivePrice = l.proposedPrice ?? p.unitPrice;
                    const diff = l.proposedPrice !== undefined ? l.proposedPrice - p.unitPrice : 0;
                    const diffPct = p.unitPrice ? (diff / p.unitPrice) * 100 : 0;
                    return (
                      <tr key={l.productId} className="align-middle">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{p.image}</div>
                            <div>
                              <div className="text-sm font-medium">{p.name}</div>
                              <div className="text-xs text-muted-foreground">{p.unitWeightKg}kg · {p.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.productId, l.quantity - 50)}><Minus className="h-3 w-3" /></Button>
                            <Input type="number" value={l.quantity} onChange={(e) => setQty(l.productId, Number(e.target.value))} className="w-16 h-7 text-center text-xs" />
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.productId, l.quantity + 50)}><Plus className="h-3 w-3" /></Button>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right text-xs text-muted-foreground">
                          <div className="flex items-center justify-end gap-1">
                            <Tag className="h-3 w-3" /> {formatCurrency(p.unitPrice)}
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder={`${p.unitPrice}`}
                                value={l.proposedPrice ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setProposedPrice(l.productId, v === "" ? undefined : Number(v));
                                }}
                                className="w-24 h-7 text-xs"
                              />
                              {l.proposedPrice !== undefined && (
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${diff < 0 ? "bg-warning/15 text-warning" : "bg-ai/15 text-ai"}`}>
                                  {diff > 0 ? "+" : ""}{diffPct.toFixed(1)}%
                                </span>
                              )}
                            </div>
                            {l.proposedPrice !== undefined && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                <Input
                                  placeholder="Justification (volume, accord…)"
                                  value={l.priceNote ?? ""}
                                  onChange={(e) => setPriceNote(l.productId, e.target.value)}
                                  className="h-6 text-[11px]"
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right text-sm font-semibold">
                          {formatCurrency(l.quantity * effectivePrice)}
                          {l.proposedPrice !== undefined && (
                            <div className="text-[10px] text-muted-foreground line-through">
                              {formatCurrency(l.quantity * p.unitPrice)}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-3 text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setQty(l.productId, 0)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-5 py-4 border-t border-border bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><div className="text-[10px] uppercase text-muted-foreground">Total</div><div className="text-lg font-bold">{formatCurrency(totalValue)}</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Marge</div><div className="text-lg font-bold text-success">{formatCurrency(totalMargin)}</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Poids</div><div className="text-lg font-bold">{totalWeight.toFixed(0)} kg</div></div>
            <div><div className="text-[10px] uppercase text-muted-foreground">Volume</div><div className="text-lg font-bold">{totalVolume.toFixed(2)} m³</div></div>
          </div>
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2">
            <Button variant="outline">Sauvegarder le brouillon</Button>
            <Button className="bg-gradient-primary shadow-elegant" onClick={submitOrder}>Soumettre la commande</Button>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl bg-gradient-ai text-ai-foreground p-5 shadow-ai sticky top-20">
          <div className="flex items-center justify-between">
            <AgentBadge name="AI Order Assistant" pulse />
            <Sparkles className="h-4 w-4 text-white/80" />
          </div>
          <h3 className="mt-3 text-base font-semibold">Optimisation en direct</h3>
          <p className="text-xs text-white/80 mt-1">J'analyse votre commande en temps réel.</p>

          <div className="mt-4 rounded-lg bg-white/10 backdrop-blur p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80 flex items-center gap-1.5"><Package2 className="h-3.5 w-3.5" /> Remplissage conteneur</span>
              <span className="font-bold">{fill.toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${fill}%` }} />
            </div>
            <div className="mt-2 text-[10px] text-white/70">
              {fill < 60 ? "Sous-utilisé — ajouter des unités réduit le coût." : fill < 90 ? "Bon. Presque optimal." : "Optimisé ✓"}
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
