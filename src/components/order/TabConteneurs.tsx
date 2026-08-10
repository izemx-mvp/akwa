import { useState } from "react";
import { Container, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SectionCard, Chip, MiniBar } from "./shared";
import { cn } from "@/lib/utils";
import { num, type ExportOrder } from "@/lib/export-order-store";

export function TabConteneurs({ order }: { order: ExportOrder }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <SectionCard
        title="Optimisation conteneurs"
        subtitle={`${order.containers.length} conteneurs planifiés • ${order.volumeM3} m³ • ${num(order.weightKg)} kg`}
        icon={Container}
        action={
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <LayoutGrid className="h-3.5 w-3.5" /> Voir la répartition des produits
          </Button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {order.containers.map((c) => (
            <div key={c.id} className="rounded-xl border border-border p-4 transition-smooth hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">Conteneur {c.index} — {c.type}</div>
                  <div className="font-mono text-xs text-muted-foreground">{c.reference}</div>
                </div>
                <Chip tone={c.status === "Planifié" ? "info" : "success"}>{c.status}</Chip>
              </div>

              {/* Visualisation remplissage */}
              <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex h-20 items-end gap-[3px] overflow-hidden rounded-md border border-border bg-card p-1.5">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const filled = i < Math.round((c.fillPct / 100) * 24);
                    return (
                      <span
                        key={i}
                        className={cn(
                          "flex-1 rounded-sm transition-all",
                          filled ? "bg-gradient-to-t from-primary to-primary-glow" : "bg-muted",
                        )}
                        style={{ height: filled ? `${55 + ((i * 37) % 45)}%` : "18%" }}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">Occupation volume</span>
                  <span className="font-semibold text-primary">{c.fillPct} %</span>
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Poids</span>
                    <span>{num(c.weightKg)} / {num(c.maxWeightKg)} kg</span>
                  </div>
                  <MiniBar pct={(c.weightKg / c.maxWeightKg) * 100} tone="info" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Volume</span>
                    <span>{c.volumeM3} / {c.maxVolumeM3} m³</span>
                  </div>
                  <MiniBar pct={(c.volumeM3 / c.maxVolumeM3) * 100} tone="success" />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Palettes</span>
                  <span className="font-semibold">{c.pallets}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Répartition des produits</SheetTitle>
            <SheetDescription>Affectation des références par conteneur</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-6">
            {order.containers.map((c) => {
              const items = order.lines.filter((l) => l.container === c.index);
              return (
                <div key={c.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">Conteneur {c.index} · {c.reference}</span>
                    <Chip tone="info">{items.length} réf.</Chip>
                  </div>
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {items.map((l) => (
                      <div key={l.ref} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{l.name}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{l.ref}</div>
                        </div>
                        <div className="shrink-0 text-right text-xs text-muted-foreground">
                          {num(l.qty)} {l.unit}
                          <div>{l.pallets} palette(s)</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
