import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Panel, Crumbs, Chip } from "@/components/admin/ui";
import { useBackoffice, boStore, eur2, pct } from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/produits/nouveau")({
  head: () => ({
    meta: [
      { title: "Ajouter un produit — Back-office AKWA" },
      { name: "description", content: "Assistant de création d'un produit export AKWA : informations, prix, logistique et fournisseur." },
      { property: "og:title", content: "Ajouter un produit — Back-office AKWA" },
      { property: "og:description", content: "Créez une fiche produit complète en quatre étapes guidées." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewProduct,
});

const STEPS = ["Informations", "Prix & marges", "Logistique", "Fournisseur"];

function NewProduct() {
  const { suppliers } = useBackoffice();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    ref: `AKW-NEW-${String(Math.floor(Math.random() * 900) + 100)}`,
    name: "", brand: "AKWA Selection", category: "Épicerie fine", subCategory: "", origin: "Maroc",
    saleUnit: "unité", packaging: "", description: "", emoji: "📦",
    purchasePrice: 0, salePrice: 0, minPrice: 0,
    unitWeight: 1, volume: 0.02, unitsPerCarton: 12, cartonsPerPallet: 60, hsCode: "",
    supplierId: suppliers[0]?.id ?? "", leadTime: "10 jours", active: true,
  });
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const marginPct = f.salePrice ? ((f.salePrice - f.purchasePrice) / f.salePrice) * 100 : 0;
  const canNext = step === 0 ? f.name.trim().length > 2 : step === 1 ? f.salePrice > 0 : true;

  const submit = () => {
    boStore.createProduct({
      ref: f.ref, name: f.name, brand: f.brand, category: f.category, subCategory: f.subCategory || "Divers",
      origin: f.origin, saleUnit: f.saleUnit, packaging: f.packaging, description: f.description, emoji: f.emoji,
      purchasePrice: f.purchasePrice, salePrice: f.salePrice, minPrice: f.minPrice || f.purchasePrice * 1.15,
      status: f.active ? "Actif" : "Brouillon",
    });
    toast.success("Produit créé", { description: `${f.ref} est disponible dans le catalogue.` });
    navigate({ to: "/admin/produits/$ref", params: { ref: f.ref } });
  };

  return (
    <div className="max-w-4xl space-y-5">
      <Crumbs items={[{ label: "Back-office", to: "/admin" }, { label: "Produits", to: "/admin/produits" }, { label: "Nouveau produit" }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ajouter un produit</h1>
          <p className="text-sm text-muted-foreground">Création guidée d'une fiche produit export complète.</p>
        </div>
        <Button variant="outline" asChild className="gap-1.5"><Link to="/admin/produits"><ArrowLeft className="h-4 w-4" /> Annuler</Link></Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i <= step && setStep(i)}
            className={cn("flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-smooth",
              i === step ? "border-primary bg-primary/10 text-primary" : i < step ? "border-success/40 bg-success/10 text-success" : "border-border text-muted-foreground")}>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-background text-[10px]">{i < step ? <Check className="h-3 w-3" /> : i + 1}</span>
            {s}
          </button>
        ))}
      </div>

      {step === 0 && (
        <Panel title="Informations générales">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5"><Label>Référence interne</Label><Input value={f.ref} onChange={(e) => set("ref", e.target.value.toUpperCase())} /></div>
            <div className="space-y-1.5"><Label>Nom du produit *</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Huile d'argan alimentaire 500 ml" /></div>
            <div className="space-y-1.5"><Label>Marque</Label><Input value={f.brand} onChange={(e) => set("brand", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Catégorie</Label><Input value={f.category} onChange={(e) => set("category", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Sous-catégorie</Label><Input value={f.subCategory} onChange={(e) => set("subCategory", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Origine</Label><Input value={f.origin} onChange={(e) => set("origin", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Unité de vente</Label><Input value={f.saleUnit} onChange={(e) => set("saleUnit", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Conditionnement</Label><Input value={f.packaging} onChange={(e) => set("packaging", e.target.value)} placeholder="Carton de 12" /></div>
            <div className="space-y-1.5"><Label>Emoji visuel</Label><Input value={f.emoji} onChange={(e) => set("emoji", e.target.value)} className="w-24" /></div>
            <div className="flex items-center gap-3 pt-6"><Switch checked={f.active} onCheckedChange={(v) => set("active", v)} /><Label>Produit actif immédiatement</Label></div>
            <div className="space-y-1.5 md:col-span-2"><Label>Description</Label><Textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
          </div>
        </Panel>
      )}

      {step === 1 && (
        <Panel title="Prix & marges" description="Le prix d'achat reste strictement interne.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5"><Label>Prix d'achat (€)</Label><Input type="number" step="0.01" value={f.purchasePrice} onChange={(e) => set("purchasePrice", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Prix de vente (€) *</Label><Input type="number" step="0.01" value={f.salePrice} onChange={(e) => set("salePrice", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Prix minimum autorisé (€)</Label><Input type="number" step="0.01" value={f.minPrice} onChange={(e) => set("minPrice", Number(e.target.value))} /></div>
          </div>
          <div className={cn("mt-4 flex items-center justify-between rounded-lg border p-3 text-sm", marginPct < 25 ? "border-warning/40 bg-warning/5" : "border-success/40 bg-success/5")}>
            <span className="font-medium">Marge calculée automatiquement</span>
            <span className="font-bold">{pct(marginPct)} · {eur2(f.salePrice - f.purchasePrice)}</span>
          </div>
          {f.purchasePrice > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-ai/40 bg-ai/5 p-3 text-xs">
              <Sparkles className="h-4 w-4 text-ai" />
              <span>Prix de vente recommandé par l'IA : <strong>{eur2(f.purchasePrice * 1.42)}</strong> (marge cible 30 %).</span>
              <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={() => set("salePrice", Number((f.purchasePrice * 1.42).toFixed(2)))}>Appliquer</Button>
            </div>
          )}
        </Panel>
      )}

      {step === 2 && (
        <Panel title="Données logistiques">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5"><Label>Poids unitaire (kg)</Label><Input type="number" step="0.01" value={f.unitWeight} onChange={(e) => set("unitWeight", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Volume carton (m³)</Label><Input type="number" step="0.001" value={f.volume} onChange={(e) => set("volume", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Unités par carton</Label><Input type="number" value={f.unitsPerCarton} onChange={(e) => set("unitsPerCarton", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Cartons par palette</Label><Input type="number" value={f.cartonsPerPallet} onChange={(e) => set("cartonsPerPallet", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Code HS douane</Label><Input value={f.hsCode} onChange={(e) => set("hsCode", e.target.value)} placeholder="2008.19.95" /></div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Estimation : {f.unitsPerCarton * f.cartonsPerPallet} unités par palette, soit environ {Math.round(f.unitsPerCarton * f.cartonsPerPallet * 20)} unités par conteneur 40' HC.
          </p>
        </Panel>
      )}

      {step === 3 && (
        <Panel title="Fournisseur principal">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Fournisseur</Label>
              <Select value={f.supplierId} onValueChange={(v) => set("supplierId", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.country}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Délai d'approvisionnement</Label><Input value={f.leadTime} onChange={(e) => set("leadTime", e.target.value)} /></div>
          </div>
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="mb-2 font-medium">Récapitulatif</div>
            <div className="flex flex-wrap gap-2">
              <Chip>{f.ref}</Chip><Chip>{f.name || "Sans nom"}</Chip><Chip>{f.category}</Chip>
              <Chip tone="info">Vente {eur2(f.salePrice)}</Chip><Chip tone={marginPct < 25 ? "warning" : "success"}>Marge {pct(marginPct)}</Chip>
            </div>
          </div>
        </Panel>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Précédent
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext} onClick={() => setStep(step + 1)} className="gap-1.5">Continuer <ArrowRight className="h-4 w-4" /></Button>
        ) : (
          <Button onClick={submit} className="gap-1.5"><Check className="h-4 w-4" /> Créer le produit</Button>
        )}
      </div>
    </div>
  );
}
