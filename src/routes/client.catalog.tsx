import { createFileRoute, Link } from "@tanstack/react-router";
import { products, formatCurrency } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Minus, ShoppingCart, Trash2, ArrowRight, Package2 } from "lucide-react";
import { useState } from "react";
import { cartStore, useCart, cartTotals } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/client/catalog")({
  head: () => ({
    meta: [
      { title: "Catalogue produits export — Portail client AKWA" },
      { name: "description", content: "Parcourez le catalogue AKWA : gaz, lubrifiants, additifs et carburants avec prix unitaires et ajout au panier." },
      { property: "og:title", content: "Catalogue produits export — Portail client AKWA" },
      { property: "og:description", content: "Prix unitaires, panier et estimation conteneur en temps réel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Catalog,
});

const CATEGORIES = ["Tous", "Gas", "Lubricants", "Additives", "Fuel"] as const;

function Catalog() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Tous");
  const [open, setOpen] = useState(false);
  const cart = useCart();
  const totals = cartTotals(cart);

  const filtered = products.filter(
    (p) =>
      (cat === "Tous" || p.category === cat) &&
      (p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-5 max-w-7xl pb-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catalogue</h1>
          <p className="text-sm text-muted-foreground">Parcourez les produits exportables avec pricing en temps réel.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setOpen((v) => !v)}>
          <ShoppingCart className="h-4 w-4" /> Panier
          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
            {cart.length}
          </span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom ou SKU…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary",
              )}
            >
              {c === "Tous" ? "Tous" : c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p) => {
          const line = cart.find((l) => l.productId === p.id);
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-elegant transition-smooth flex flex-col">
              <div className="flex items-start justify-between">
                <div className="text-4xl">{p.image}</div>
                <span className="text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{p.category}</span>
              </div>
              <h3 className="mt-3 font-semibold text-sm">{p.name}</h3>
              <div className="text-xs text-muted-foreground">SKU {p.sku}</div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground">Prix unitaire</div>
                  <div className="text-lg font-bold text-primary">{formatCurrency(p.unitPrice)}</div>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  <div>{p.unitWeightKg} kg / unité</div>
                  <div>{p.unitVolumeM3} m³ / unité</div>
                </div>
              </div>
              {line ? (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-2 py-1.5">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => cartStore.setQty(p.id, line.quantity - 50)}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-sm font-semibold">{line.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => cartStore.add(p.id, 50)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 gap-1.5"
                  onClick={() => {
                    cartStore.add(p.id, 50);
                    setOpen(true);
                    toast.success(`${p.name} ajouté au panier`);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur shadow-elegant md:left-64">
          <div className="mx-auto max-w-7xl px-5 py-3">
            {open && (
              <div className="mb-3 max-h-64 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {cart.map((l) => {
                      const p = products.find((x) => x.id === l.productId)!;
                      return (
                        <tr key={l.productId}>
                          <td className="px-3 py-2">
                            <span className="mr-2">{p.image}</span>
                            <span className="font-medium">{p.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{formatCurrency(p.unitPrice)}</span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => cartStore.setQty(l.productId, l.quantity - 50)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={l.quantity}
                                onChange={(e) => cartStore.setQty(l.productId, Number(e.target.value))}
                                className="h-7 w-16 text-center text-xs"
                              />
                              <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => cartStore.add(l.productId, 50)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">{formatCurrency(p.unitPrice * l.quantity)}</td>
                          <td className="px-2 py-2 text-right">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => cartStore.remove(l.productId)}>
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-3 text-left">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ShoppingCart className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {cart.length} produit(s) · {formatCurrency(totals.value)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    <Package2 className="mr-1 inline h-3 w-3" />
                    Remplissage estimé {totals.fill.toFixed(0)}% · {totals.volume.toFixed(2)} m³
                  </span>
                </span>
              </button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => cartStore.clear()}>Vider</Button>
                <Link to="/client/new-order">
                  <Button className="bg-gradient-primary shadow-elegant gap-2">
                    Suivre ma commande <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
