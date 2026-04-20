import { createFileRoute } from "@tanstack/react-router";
import { products, formatCurrency } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/client/catalog")({
  component: Catalog,
});

function Catalog() {
  const [q, setQ] = useState("");
  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catalogue</h1>
        <p className="text-sm text-muted-foreground">Parcourez les produits exportables avec pricing en temps réel.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom ou SKU…" className="pl-9" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-elegant transition-smooth flex flex-col">
            <div className="flex items-start justify-between">
              <div className="text-4xl">{p.image}</div>
              <span className="text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{p.category}</span>
            </div>
            <h3 className="mt-3 font-semibold text-sm">{p.name}</h3>
            <div className="text-xs text-muted-foreground">SKU {p.sku}</div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-lg font-bold">{formatCurrency(p.unitPrice)}</div>
                <div className="text-[11px] text-muted-foreground">par unité · {p.unitWeightKg}kg</div>
              </div>
            </div>
            <Button size="sm" variant="outline" className="mt-4 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
