import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Row, Stat, TagPicker } from "./parts";
import { eur2, pct, useBackoffice } from "@/lib/backoffice-store";
import { can, pricingStore } from "@/lib/pricing-rules";

export function BulkPriceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { products } = useBackoffice();
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const [cats, setCats] = useState<string[]>([]);
  const [mode, setMode] = useState<"pct" | "fixed" | "set">("pct");
  const [value, setValue] = useState(4);
  const [reason, setReason] = useState("Hausse fournisseurs");
  const [confirm, setConfirm] = useState(false);

  const selected = products.filter((p) => cats.includes(p.category));
  const preview = selected.map((p) => ({
    p, to: mode === "pct" ? p.salePrice * (1 + value / 100) : mode === "fixed" ? p.salePrice + value : value,
  }));
  const avg = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0);
  const before = avg(preview.map((x) => x.p.salePrice));
  const after = avg(preview.map((x) => x.to));
  const mBefore = avg(preview.map((x) => (x.p.salePrice ? ((x.p.salePrice - x.p.purchasePrice) / x.p.salePrice) * 100 : 0)));
  const mAfter = avg(preview.map((x) => (x.to ? ((x.to - x.p.purchasePrice) / x.to) * 100 : 0)));

  const apply = () => {
    if (!can("modifier_prix_masse")) { toast.error("Permission requise : modification des prix en masse"); return; }
    const batch = pricingStore.bulkUpdate(selected.map((p) => p.ref), mode, value, reason, cats.join(", "));
    toast.success(`${batch.entries.length} produits modifiés — ${batch.id}`);
    onOpenChange(false); setConfirm(false); setCats([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les prix en masse (modification permanente du prix catalogue)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
            Cette action écrase définitivement le prix catalogue. Pour une remise temporaire ou conditionnelle, créez plutôt une <strong>règle tarifaire</strong>.
          </div>
          <Row label="Catégories concernées">
            <TagPicker options={categories} selected={cats} onToggle={(v) => setCats((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]))} />
          </Row>
          <div className="grid gap-4 md:grid-cols-3">
            <Row label="Action">
              <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="pct">Variation en %</option>
                <option value="fixed">Variation fixe (€)</option>
                <option value="set">Fixer un prix</option>
              </select>
            </Row>
            <Row label="Valeur"><Input type="number" step="0.01" value={value} onChange={(e) => setValue(Number(e.target.value))} /></Row>
            <Row label="Motif"><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Row>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            <Stat label="Produits" value={selected.length} />
            <Stat label="Prix moyen avant" value={eur2(before)} />
            <Stat label="Prix moyen après" value={eur2(after)} />
            <Stat label="Marge avant" value={pct(mBefore)} />
            <Stat label="Marge après" value={pct(mAfter)} tone={mAfter < 15 ? "text-destructive" : "text-success"} />
          </div>

          <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">Produit</th><th className="px-3 py-2 text-right">Avant</th><th className="px-3 py-2 text-right">Après</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map((x) => (
                  <tr key={x.p.ref}><td className="px-3 py-2">{x.p.name}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{eur2(x.p.salePrice)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{eur2(x.to)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          {!confirm ? (
            <Button disabled={!selected.length} onClick={() => setConfirm(true)}>Valider ({selected.length} produits)</Button>
          ) : (
            <Button variant="destructive" onClick={apply}>Confirmer la modification permanente</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
