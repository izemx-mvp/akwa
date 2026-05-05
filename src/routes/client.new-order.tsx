import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { products, type Country } from "@/lib/mock-data";
import { ordersStore } from "@/lib/orders-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2, Sparkles, Package2, Send } from "lucide-react";
import { AgentBadge } from "@/components/AgentBadge";
import { toast } from "sonner";

type Line = { productId: string; quantity: number };

export const Route = createFileRoute("/client/new-order")({
  component: NewOrder,
});

const COUNTRIES: Country[] = ["Sénégal", "Côte d'Ivoire", "Mauritanie", "Mali", "Guinée"];

function NewOrder() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Line[]>([
    { productId: "p1", quantity: 200 },
    { productId: "p4", quantity: 150 },
  ]);
  const [destination, setDestination] = useState<Country>("Sénégal");

  const { totalVolume, totalWeight, fill } = useMemo(() => {
    const v = cart.reduce((s, l) => {
      const p = products.find((p) => p.id === l.productId);
      return s + (p?.unitVolumeM3 ?? 0) * l.quantity;
    }, 0);
    const w = cart.reduce((s, l) => {
      const p = products.find((p) => p.id === l.productId);
      return s + (p?.unitWeightKg ?? 0) * l.quantity;
    }, 0);
    const containerVolume = 67;
    const fillByVolume = (v / containerVolume) * 100;
    return { totalVolume: v, totalWeight: w, fill: Math.min(100, fillByVolume) };
  }, [cart]);

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

  const submit = () => {
    if (cart.length === 0) {
      toast.error("Votre panier est vide");
      return;
    }
    const ref = `AKW-${new Date().getFullYear().toString().slice(2)}${(new Date().getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    ordersStore.add({
      id: `o-${Date.now()}`,
      reference: ref,
      clientId: "c1",
      destination,
      createdAt: new Date().toISOString().slice(0, 10),
      status: "Pending",
      lines: cart.map((l) => {
        const p = products.find((x) => x.id === l.productId)!;
        return { productId: l.productId, quantity: l.quantity, unitPrice: p.unitPrice };
      }),
      containerFillPct: Math.round(fill),
      marginPct: 0,
      submittedAt: new Date().toISOString(),
      source: "client",
      stage: "BC_Provisoire",
      quotes: [],
    });
    toast.success(`BC provisoire ${ref} envoyé`, {
      description: "Vous recevrez un devis après validation par AKWA AI.",
    });
    navigate({ to: "/client/orders" });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 max-w-[1400px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle commande — BC provisoire</h1>
          <p className="text-sm text-muted-foreground">
            Sélectionnez vos produits et quantités. AKWA AI vous transmettra un devis optimisé.
          </p>
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
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
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
                    <span className="text-[10px] text-muted-foreground">{p.sku}</span>
                    {inCart && <span className="text-[10px] font-semibold text-primary">×{inCart.quantity}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold">Lignes de commande</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              ❌ Aucun prix affiché à ce stade — pricing déterminé par AKWA AI.
            </p>
          </div>
          {cart.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Votre panier est vide.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Produit</th>
                    <th className="text-center px-2 py-2 font-medium">Quantité</th>
                    <th className="text-right px-2 py-2 font-medium">Volume</th>
                    <th className="text-right px-2 py-2 font-medium">Poids</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cart.map((l) => {
                    const p = products.find((p) => p.id === l.productId)!;
                    return (
                      <tr key={l.productId}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{p.image}</div>
                            <div>
                              <div className="text-sm font-medium">{p.name}</div>
                              <div className="text-xs text-muted-foreground">{p.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.productId, l.quantity - 50)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={l.quantity}
                              onChange={(e) => setQty(l.productId, Number(e.target.value))}
                              className="w-16 h-7 text-center text-xs"
                            />
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.productId, l.quantity + 50)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right text-xs text-muted-foreground">
                          {(p.unitVolumeM3 * l.quantity).toFixed(2)} m³
                        </td>
                        <td className="px-2 py-3 text-right text-xs text-muted-foreground">
                          {(p.unitWeightKg * l.quantity).toFixed(0)} kg
                        </td>
                        <td className="px-2 py-3 text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setQty(l.productId, 0)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-5 py-4 border-t border-border bg-muted/30 grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Volume total</div>
              <div className="text-lg font-bold">{totalVolume.toFixed(2)} m³</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Poids total</div>
              <div className="text-lg font-bold">{totalWeight.toFixed(0)} kg</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Remplissage estimé</div>
              <div className="text-lg font-bold">{fill.toFixed(0)} %</div>
            </div>
          </div>
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2">
            <Button className="bg-gradient-primary shadow-elegant" onClick={submit}>
              <Send className="h-4 w-4" /> Soumettre la commande
            </Button>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl bg-gradient-ai text-ai-foreground p-5 shadow-ai sticky top-20">
          <div className="flex items-center justify-between">
            <AgentBadge name="AI Order Assistant" pulse />
            <Sparkles className="h-4 w-4 text-white/80" />
          </div>
          <h3 className="mt-3 text-base font-semibold">Estimation conteneur</h3>
          <div className="mt-4 rounded-lg bg-white/10 backdrop-blur p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80 flex items-center gap-1.5">
                <Package2 className="h-3.5 w-3.5" /> Remplissage estimé
              </span>
              <span className="font-bold">{fill.toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${fill}%` }} />
            </div>
            <div className="mt-2 text-[10px] text-white/70">
              {fill < 60
                ? "Sous-utilisé — l'admin pourra suggérer un complément."
                : fill < 90
                ? "Bon remplissage."
                : "Conteneur optimisé ✓"}
            </div>
          </div>
          <p className="mt-4 text-xs text-white/80">
            Une fois soumis, votre BC provisoire sera analysé par l'agent Pricing IA. Vous recevrez un devis détaillé.
          </p>
        </div>
      </aside>
    </div>
  );
}
