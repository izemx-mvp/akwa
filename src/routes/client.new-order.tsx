import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { products, formatCurrency, type Country } from "@/lib/mock-data";
import { ordersStore } from "@/lib/orders-store";
import { cartStore, useCart, cartTotals } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2, Sparkles, Package2, Send, ShoppingCart } from "lucide-react";
import { AgentBadge } from "@/components/AgentBadge";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/client/new-order")({
  head: () => ({
    meta: [
      { title: "Nouvelle commande export — Portail client AKWA" },
      { name: "description", content: "Composez votre commande export AKWA : produits, quantités, prix et estimation conteneur en temps réel." },
      { property: "og:title", content: "Nouvelle commande export — Portail client AKWA" },
      { property: "og:description", content: "Panier, quantités et remplissage conteneur calculés en direct." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewOrder,
});

const COUNTRIES: Country[] = ["Sénégal", "Côte d'Ivoire", "Mauritanie", "Mali", "Guinée"];

function NewOrder() {
  const navigate = useNavigate();
  const cart = useCart();
  const [destination, setDestination] = useState<Country>("Sénégal");

  const totals = useMemo(() => cartTotals(cart), [cart]);
  const { value, volume, weight, fill, containers } = totals;

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
    cartStore.clear();
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
            Ajustez vos quantités : la valeur indicative et le remplissage conteneur se recalculent en temps réel.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold">Ajouter depuis le catalogue</h3>
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
                  onClick={() => cartStore.add(p.id, 50)}
                  className="text-left rounded-lg border border-border p-3 hover:border-primary hover:shadow-elegant transition-smooth"
                >
                  <div className="text-2xl">{p.image}</div>
                  <div className="mt-2 text-xs font-medium line-clamp-2">{p.name}</div>
                  <div className="mt-1 text-xs font-semibold text-primary">{formatCurrency(p.unitPrice)}</div>
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
              Prix catalogue indicatifs — le pricing final est confirmé par AKWA AI dans le devis.
            </p>
          </div>
          {cart.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground space-y-3">
              <ShoppingCart className="mx-auto h-6 w-6" />
              <div>Votre panier est vide.</div>
              <Link to="/client/catalog">
                <Button variant="outline" size="sm">Parcourir le catalogue</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Produit</th>
                    <th className="text-right px-2 py-2 font-medium">PU</th>
                    <th className="text-center px-2 py-2 font-medium">Quantité</th>
                    <th className="text-right px-2 py-2 font-medium">Total</th>
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
                        <td className="px-2 py-3 text-right text-xs">{formatCurrency(p.unitPrice)}</td>
                        <td className="px-2 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => cartStore.setQty(l.productId, l.quantity - 50)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={l.quantity}
                              onChange={(e) => cartStore.setQty(l.productId, Number(e.target.value))}
                              className="w-16 h-7 text-center text-xs"
                            />
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => cartStore.add(l.productId, 50)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right font-semibold">{formatCurrency(p.unitPrice * l.quantity)}</td>
                        <td className="px-2 py-3 text-right text-xs text-muted-foreground">
                          {(p.unitVolumeM3 * l.quantity).toFixed(2)} m³
                        </td>
                        <td className="px-2 py-3 text-right text-xs text-muted-foreground">
                          {(p.unitWeightKg * l.quantity).toFixed(0)} kg
                        </td>
                        <td className="px-2 py-3 text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => cartStore.remove(l.productId)}>
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
          <div className="px-5 py-4 border-t border-border bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Valeur indicative</div>
              <div className="text-lg font-bold text-primary">{formatCurrency(value)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Volume total</div>
              <div className="text-lg font-bold">{volume.toFixed(2)} m³</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Poids total</div>
              <div className="text-lg font-bold">{weight.toFixed(0)} kg</div>
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
          <h3 className="mt-3 text-base font-semibold">Estimation conteneur — temps réel</h3>
          <div className="mt-4 rounded-lg bg-white/10 backdrop-blur p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80 flex items-center gap-1.5">
                <Package2 className="h-3.5 w-3.5" /> Remplissage estimé
              </span>
              <span className="font-bold">{fill.toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${fill}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/80">
              <div>
                <div className="text-white/60">Par volume</div>
                <div className="font-semibold text-white">{totals.fillVolume.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-white/60">Par poids</div>
                <div className="font-semibold text-white">{totals.fillWeight.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-white/60">Conteneurs 40'</div>
                <div className="font-semibold text-white">{cart.length ? containers : 0}</div>
              </div>
              <div>
                <div className="text-white/60">Unités</div>
                <div className="font-semibold text-white">{totals.units}</div>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-white/70">
              {fill < 60
                ? "Sous-utilisé — l'admin pourra suggérer un complément."
                : fill < 90
                  ? "Bon remplissage."
                  : "Conteneur optimisé ✓"}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-xs">
            <span className="text-white/80">Valeur panier</span>
            <span className="font-bold">{formatCurrency(value)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
