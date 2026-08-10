import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Save, Percent, TrendingUp, Truck, Factory, FileText, History, AlertTriangle, Plus, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Kpi, Panel, Field, Chip, Crumbs, Bar } from "@/components/admin/ui";
import {
  useBackoffice, boStore, eur2, pct, dShort, dTime, productMargin, productMarginPct, type Availability, type ProductStatus,
} from "@/lib/backoffice-store";

export const Route = createFileRoute("/admin/produits/$ref")({
  head: ({ params }) => ({
    meta: [
      { title: `Produit ${params.ref} — Back-office AKWA` },
      { name: "description", content: `Fiche interne du produit ${params.ref} : prix d'achat, marge, logistique, fournisseurs et historique.` },
      { property: "og:title", content: `Produit ${params.ref} — Back-office AKWA` },
      { property: "og:description", content: "Fiche produit interne AKWA avec pilotage prix, marges et fournisseurs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { ref } = Route.useParams();
  const navigate = useNavigate();
  useBackoffice();
  const p = boStore.getProduct(ref);
  const [draft, setDraft] = useState<Record<string, string | number>>({});

  if (!p) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <Package className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold">Produit introuvable</h1>
        <Button className="mt-4" onClick={() => navigate({ to: "/admin/produits" })}>Retour au catalogue</Button>
      </div>
    );
  }

  const val = (k: string, fallback: string | number) => (draft[k] !== undefined ? draft[k] : fallback);
  const set = (k: string, v: string | number) => setDraft((d) => ({ ...d, [k]: v }));
  const marginPct = productMarginPct({ ...p, purchasePrice: Number(val("purchasePrice", p.purchasePrice)), salePrice: Number(val("salePrice", p.salePrice)) });
  const dirty = Object.keys(draft).length > 0;

  const save = () => {
    boStore.updateProduct(p.ref, {
      name: String(val("name", p.name)),
      description: String(val("description", p.description)),
      brand: String(val("brand", p.brand)),
      category: String(val("category", p.category)),
      subCategory: String(val("subCategory", p.subCategory)),
      origin: String(val("origin", p.origin)),
      saleUnit: String(val("saleUnit", p.saleUnit)),
      packaging: String(val("packaging", p.packaging)),
      barcode: String(val("barcode", p.barcode)),
      supplierSku: String(val("supplierSku", p.supplierSku)),
      status: String(val("status", p.status)) as ProductStatus,
      availability: String(val("availability", p.availability)) as Availability,
      purchasePrice: Number(val("purchasePrice", p.purchasePrice)),
      salePrice: Number(val("salePrice", p.salePrice)),
      minPrice: Number(val("minPrice", p.minPrice)),
      priceToCheck: false,
    });
    setDraft({});
    toast.success("Fiche produit enregistrée", { description: `${p.ref} mis à jour.` });
  };

  const maxPrice = Math.max(...p.priceHistory.map((h) => h.price), p.purchasePrice) * 1.15;

  return (
    <div className="max-w-[1500px] space-y-5">
      <Crumbs items={[{ label: "Back-office", to: "/admin" }, { label: "Produits", to: "/admin/produits" }, { label: p.ref }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-xl bg-muted text-3xl">{p.emoji}</span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{p.name}</h1>
              <Chip tone={p.status === "Actif" ? "success" : "muted"}>{p.status}</Chip>
              <Chip tone={p.availability === "Disponible" ? "success" : p.availability === "Rupture" ? "danger" : "warning"}>{p.availability}</Chip>
              {p.priceToCheck && <Chip tone="warning"><AlertTriangle className="h-3 w-3" /> Prix à vérifier</Chip>}
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{p.ref} · {p.brand} · {p.category} / {p.subCategory}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="gap-1.5"><Link to="/admin/produits"><ArrowLeft className="h-4 w-4" /> Catalogue</Link></Button>
          <Button onClick={save} disabled={!dirty} className="gap-1.5"><Save className="h-4 w-4" /> Enregistrer</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Prix d'achat" value={eur2(Number(val("purchasePrice", p.purchasePrice)))} sub={`Précédent ${eur2(p.previousPurchasePrice)}`} icon={Factory} />
        <Kpi label="Prix de vente" value={eur2(Number(val("salePrice", p.salePrice)))} sub={`Recommandé ${eur2(p.recommendedPrice)}`} icon={TrendingUp} />
        <Kpi label="Marge unitaire" value={eur2(Number(val("salePrice", p.salePrice)) - Number(val("purchasePrice", p.purchasePrice)))} icon={Percent} tone="bg-ai/15 text-ai" />
        <Kpi label="Taux de marge" value={pct(marginPct)} sub={marginPct < 25 ? "Sous l'objectif 25 %" : "Conforme à l'objectif"} icon={Percent}
          tone={marginPct < 25 ? "bg-warning/15 text-warning" : "bg-success/15 text-success"} />
        <Kpi label="Poids / volume" value={`${p.logistics.weightKg} kg`} sub={`${p.logistics.volumeM3} m³ par unité`} icon={Truck} />
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">Vue générale</TabsTrigger>
          <TabsTrigger value="prix">Prix & marges</TabsTrigger>
          <TabsTrigger value="logistique">Logistique</TabsTrigger>
          <TabsTrigger value="fournisseurs">Fournisseurs</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <Panel title="Informations générales">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Nom du produit</Label><Input value={String(val("name", p.name))} onChange={(e) => set("name", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Marque</Label><Input value={String(val("brand", p.brand))} onChange={(e) => set("brand", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Catégorie</Label><Input value={String(val("category", p.category))} onChange={(e) => set("category", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Sous-catégorie</Label><Input value={String(val("subCategory", p.subCategory))} onChange={(e) => set("subCategory", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Origine</Label><Input value={String(val("origin", p.origin))} onChange={(e) => set("origin", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Unité de vente</Label><Input value={String(val("saleUnit", p.saleUnit))} onChange={(e) => set("saleUnit", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Conditionnement</Label><Input value={String(val("packaging", p.packaging))} onChange={(e) => set("packaging", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Code-barres</Label><Input value={String(val("barcode", p.barcode))} onChange={(e) => set("barcode", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Référence fournisseur</Label><Input value={String(val("supplierSku", p.supplierSku))} onChange={(e) => set("supplierSku", e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={String(val("status", p.status))} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Actif", "Inactif", "Brouillon"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Disponibilité</Label>
                <Select value={String(val("availability", p.availability))} onValueChange={(v) => set("availability", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Disponible", "Stock limité", "Rupture", "Sur commande"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Description commerciale</Label>
                <Textarea rows={3} value={String(val("description", p.description))} onChange={(e) => set("description", e.target.value)} />
              </div>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="prix" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Prix & marges" description="Les prix d'achat ne sont jamais visibles côté client.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Prix d'achat (€)</Label><Input type="number" step="0.01" value={Number(val("purchasePrice", p.purchasePrice))} onChange={(e) => set("purchasePrice", Number(e.target.value))} /></div>
                <div className="space-y-1.5"><Label>Prix de vente (€)</Label><Input type="number" step="0.01" value={Number(val("salePrice", p.salePrice))} onChange={(e) => set("salePrice", Number(e.target.value))} /></div>
                <div className="space-y-1.5"><Label>Prix minimum autorisé (€)</Label><Input type="number" step="0.01" value={Number(val("minPrice", p.minPrice))} onChange={(e) => set("minPrice", Number(e.target.value))} /></div>
                <div className="space-y-1.5"><Label>Prix recommandé IA (€)</Label><Input readOnly value={p.recommendedPrice} className="bg-muted/40" /></div>
              </div>
              <div className={cn("mt-4 rounded-lg border p-3 text-sm", marginPct < 25 ? "border-warning/40 bg-warning/5" : "border-success/40 bg-success/5")}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Marge calculée</span>
                  <span className="font-bold">{pct(marginPct)} · {eur2(Number(val("salePrice", p.salePrice)) - Number(val("purchasePrice", p.purchasePrice)))}</span>
                </div>
                <div className="mt-2"><Bar value={marginPct * 2} tone={marginPct < 25 ? "bg-warning" : "bg-success"} /></div>
                {marginPct < 25 && <p className="mt-2 text-xs text-warning">Marge inférieure au seuil commercial AKWA (25 %). Une validation responsable est requise.</p>}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Dernière modification de prix : {dShort(p.priceUpdatedAt)} par {p.priceUpdatedBy}.
              </p>
            </Panel>

            <Panel title="Évolution du prix d'achat">
              <div className="flex h-44 items-end gap-2">
                {p.priceHistory.map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{h.price.toFixed(2)}</span>
                    <div className="w-full rounded-t bg-primary/70" style={{ height: `${(h.price / maxPrice) * 130}px` }} />
                    <span className="text-[10px] text-muted-foreground">{new Date(h.date).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="logistique" className="mt-4">
          <Panel title="Données logistiques" description="Utilisées par l'optimisation conteneur et le calcul du fret.">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <Field label="Poids net" value={`${p.logistics.netWeightKg} kg`} />
              <Field label="Poids brut" value={`${p.logistics.weightKg} kg`} />
              <Field label="Volume unitaire" value={`${p.logistics.volumeM3} m³`} />
              <Field label="Dimensions" value={p.logistics.dimensions} />
              <Field label="Unités par carton" value={p.logistics.unitsPerCarton} />
              <Field label="Cartons par palette" value={p.logistics.cartonsPerPallet} />
              <Field label="Unités par palette" value={p.logistics.unitsPerPallet} />
              <Field label="Palettes par 40' HC" value={p.logistics.palletsPer40HC} />
              <Field label="Type de stockage" value={p.logistics.storage} />
              <Field label="Température" value={p.logistics.temperature} />
              <Field label="Durée de conservation" value={p.logistics.shelfLife} />
              <Field label="Délai de préparation" value={p.logistics.prepDelay} />
              <Field label="Code HS douane" value={p.logistics.hsCode} mono />
              <Field label="Certifications" value={p.logistics.certifications.join(", ")} />
              <Field label="Restrictions export" value={p.logistics.restrictions || "Aucune"} />
              <Field label="Quantité min. commande" value={`${p.logistics.moq} ${p.saleUnit}`} />
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="fournisseurs" className="mt-4">
          <Panel title="Fournisseurs liés" action={<Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-4 w-4" /> Associer un fournisseur</Button>}>
            <div className="space-y-3">
              {p.suppliers.map((s) => {
                const sup = boStore.getSupplier(s.supplierId);
                if (!sup) return null;
                return (
                  <div key={s.supplierId} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{sup.name}</span>
                        {s.primary && <Chip tone="info">Fournisseur principal</Chip>}
                      </div>
                      <span className="text-sm font-semibold">{eur2(s.price)} / {p.saleUnit}</span>
                    </div>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
                      <Field label="Contact" value={`${sup.contact} · ${sup.phone}`} />
                      <Field label="Pays" value={sup.country} />
                      <Field label="Délai" value={s.leadTime} />
                      <Field label="Conditions" value={sup.paymentTerms} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Panel title="Documents produit" action={<Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-4 w-4" /> Ajouter</Button>}>
            <div className="divide-y divide-border">
              {p.documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-[11px] text-muted-foreground">{d.type} · ajouté le {dShort(d.addedAt)} par {d.addedBy}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">Télécharger</Button>
                </div>
              ))}
              {p.documents.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Aucun document.</p>}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="historique" className="mt-4">
          <Panel title="Historique des modifications">
            <ol className="space-y-3">
              {p.history.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted"><History className="h-3 w-3" /></span>
                  <div>
                    <div className="text-sm font-medium">{h.action}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {dTime(h.at)} · {h.user}{h.from ? ` · ${h.from} → ${h.to}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
