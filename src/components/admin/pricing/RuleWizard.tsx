import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Eye, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Chip } from "@/components/admin/ui";
import { Row, Stat, StepBar, TagPicker } from "./parts";
import { eur2, pct, useBackoffice } from "@/lib/backoffice-store";
import {
  RULE_TYPE_LABEL, SEGMENTS, adjustmentLabel, can, emptyRule, matchClients, matchProducts,
  maxDiscountPct, pricingStore, simulateRule, type PricingRule, type RuleType, usePricing,
} from "@/lib/pricing-rules";

const STEPS = ["Informations", "Produits", "Clients", "Ajustement", "Période & conditions", "Simulation"];

export function RuleWizard({
  open, onOpenChange, initial,
}: { open: boolean; onOpenChange: (v: boolean) => void; initial?: PricingRule | null }) {
  const { products, clients, suppliers } = useBackoffice();
  usePricing();
  const [step, setStep] = useState(0);
  const [rule, setRule] = useState<PricingRule>(initial ?? emptyRule());
  const [showProducts, setShowProducts] = useState(false);
  const [forced, setForced] = useState(false);

  const patch = (p: Partial<PricingRule>) => setRule((r) => ({ ...r, ...p }));
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const subCategories = useMemo(
    () => [...new Set(products.filter((p) => !rule.scope.categories.length || rule.scope.categories.includes(p.category)).map((p) => p.subCategory))].sort(),
    [products, rule.scope.categories],
  );
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);
  const countries = useMemo(() => [...new Set(clients.map((c) => c.country))].sort(), [clients]);

  const matchedProducts = matchProducts(rule.scope, products);
  const matchedClients = matchClients(rule.audience, clients);
  const sim = useMemo(() => simulateRule(rule), [rule]);
  const maxDisc = useMemo(() => maxDiscountPct(rule), [rule]);
  const blocking = sim.belowThreshold.length > 0 && !forced;

  const save = (status: PricingRule["status"]) => {
    if (!rule.name.trim()) { toast.error("Le nom de la règle est obligatoire"); setStep(0); return; }
    if (!matchedProducts.length) { toast.error("Aucun produit ne correspond à la sélection"); setStep(1); return; }
    if (status === "Active" && !can("activer_regle")) { toast.error("Permission requise : activation par un manager commercial"); return; }
    pricingStore.saveRule({ ...rule, status });
    toast.success(status === "Active" ? `Règle activée — ${rule.name}` : `Règle enregistrée (${status})`);
    onOpenChange(false);
    setStep(0);
    setRule(emptyRule());
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ai" /> {initial ? "Modifier la règle tarifaire" : "Créer une règle tarifaire"}
            </DialogTitle>
          </DialogHeader>

          <StepBar steps={STEPS} current={step} onGo={setStep} />

          <div className="mt-4 space-y-4">
            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Row label="Nom de la règle">
                  <Input value={rule.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Offre Huiles moteur – Clients stratégiques" />
                </Row>
                <Row label="Type de règle">
                  <select
                    value={rule.type}
                    onChange={(e) => patch({ type: e.target.value as RuleType })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {Object.entries(RULE_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Row>
                <div className="md:col-span-2">
                  <Row label="Description interne">
                    <Textarea rows={3} value={rule.description} onChange={(e) => patch({ description: e.target.value })}
                      placeholder="Remise commerciale temporaire pour renforcer les ventes…" />
                  </Row>
                </div>
                <div className="md:col-span-2">
                  <Row label="Tags" hint="Séparés par des virgules">
                    <Input value={rule.tags.join(", ")} onChange={(e) => patch({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                      placeholder="Promotion, Huiles moteur, Afrique de l'Ouest" />
                  </Row>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={rule.scope.allProducts} onCheckedChange={(v) => patch({ scope: { ...rule.scope, allProducts: v } })} />
                  Appliquer à tous les produits
                </label>
                {!rule.scope.allProducts && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Row label="Catégories">
                      <TagPicker options={categories} selected={rule.scope.categories}
                        onToggle={(v) => patch({ scope: { ...rule.scope, categories: toggle(rule.scope.categories, v) } })} />
                    </Row>
                    <Row label="Sous-catégories">
                      <TagPicker options={subCategories} selected={rule.scope.subCategories}
                        onToggle={(v) => patch({ scope: { ...rule.scope, subCategories: toggle(rule.scope.subCategories, v) } })} />
                    </Row>
                    <Row label="Marques">
                      <TagPicker options={brands} selected={rule.scope.brands}
                        onToggle={(v) => patch({ scope: { ...rule.scope, brands: toggle(rule.scope.brands, v) } })} />
                    </Row>
                    <Row label="Fournisseurs">
                      <TagPicker options={suppliers.map((s) => s.name)} selected={suppliers.filter((s) => rule.scope.suppliers.includes(s.id)).map((s) => s.name)}
                        onToggle={(name) => {
                          const id = suppliers.find((s) => s.name === name)!.id;
                          patch({ scope: { ...rule.scope, suppliers: toggle(rule.scope.suppliers, id) } });
                        }} />
                    </Row>
                    <div className="md:col-span-2">
                      <Row label="Sélection manuelle de produits" hint="Combinable avec les filtres ci-dessus">
                        <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2">
                          <TagPicker options={products.map((p) => p.ref)} selected={rule.scope.refs}
                            onToggle={(v) => patch({ scope: { ...rule.scope, refs: toggle(rule.scope.refs, v) } })} />
                        </div>
                      </Row>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg border border-ai/30 bg-ai/5 p-3 text-sm">
                  <span><strong>{matchedProducts.length} produits</strong> correspondent à cette sélection.</span>
                  <Button size="sm" variant="secondary" onClick={() => setShowProducts(true)}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Voir les produits concernés
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={rule.audience.allClients} onCheckedChange={(v) => patch({ audience: { ...rule.audience, allClients: v } })} />
                  Appliquer à tous les clients
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <Row label="Segments clients">
                    <TagPicker options={SEGMENTS as unknown as string[]} selected={rule.audience.segments}
                      onToggle={(v) => patch({ audience: { ...rule.audience, segments: toggle(rule.audience.segments, v) as never } })} />
                  </Row>
                  <Row label="Pays / région">
                    <TagPicker options={countries} selected={rule.audience.countries}
                      onToggle={(v) => patch({ audience: { ...rule.audience, countries: toggle(rule.audience.countries, v) } })} />
                  </Row>
                  <Row label="Clients spécifiques">
                    <TagPicker options={clients.map((c) => c.name)} selected={clients.filter((c) => rule.audience.clientIds.includes(c.id)).map((c) => c.name)}
                      onToggle={(name) => {
                        const id = clients.find((c) => c.name === name)!.id;
                        patch({ audience: { ...rule.audience, clientIds: toggle(rule.audience.clientIds, id) } });
                      }} />
                  </Row>
                  <Row label="Exclure certains clients">
                    <TagPicker options={clients.map((c) => c.name)} selected={clients.filter((c) => rule.audience.excludeClientIds.includes(c.id)).map((c) => c.name)}
                      onToggle={(name) => {
                        const id = clients.find((c) => c.name === name)!.id;
                        patch({ audience: { ...rule.audience, excludeClientIds: toggle(rule.audience.excludeClientIds, id) } });
                      }} />
                  </Row>
                </div>
                <div className="rounded-lg border border-ai/30 bg-ai/5 p-3 text-sm">
                  <strong>{matchedClients.length} clients</strong> concernés : {matchedClients.slice(0, 6).map((c) => c.name).join(", ") || "—"}
                  {matchedClients.length > 6 && ` +${matchedClients.length - 6}`}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Row label="Type d'ajustement">
                    <select value={rule.type} onChange={(e) => patch({ type: e.target.value as RuleType })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      {Object.entries(RULE_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </Row>
                  {rule.type !== "volume" && (
                    <Row label={rule.type === "prix_fixe" ? "Prix fixe (€)" : rule.type === "marge_cible" ? "Marge cible (%)" : "Valeur"}>
                      <Input type="number" step="0.01" value={rule.value} onChange={(e) => patch({ value: Number(e.target.value) })} />
                    </Row>
                  )}
                  <Row label="Marge minimale garantie (%)" hint="Laisser vide pour désactiver la protection">
                    <Input type="number" value={rule.minMargin ?? ""} onChange={(e) => patch({ minMargin: e.target.value === "" ? null : Number(e.target.value) })} />
                  </Row>
                </div>

                {rule.type === "volume" && (
                  <div className="rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                        <tr><th className="px-3 py-2 text-left">De</th><th className="px-3 py-2 text-left">À</th><th className="px-3 py-2 text-left">Remise %</th></tr>
                      </thead>
                      <tbody>
                        {rule.tiers.map((t, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-2"><Input className="h-8" type="number" value={t.min}
                              onChange={(e) => patch({ tiers: rule.tiers.map((x, j) => j === i ? { ...x, min: Number(e.target.value) } : x) })} /></td>
                            <td className="px-3 py-2"><Input className="h-8" type="number" value={t.max ?? ""} placeholder="∞"
                              onChange={(e) => patch({ tiers: rule.tiers.map((x, j) => j === i ? { ...x, max: e.target.value === "" ? null : Number(e.target.value) } : x) })} /></td>
                            <td className="px-3 py-2"><Input className="h-8" type="number" value={t.pct}
                              onChange={(e) => patch({ tiers: rule.tiers.map((x, j) => j === i ? { ...x, pct: Number(e.target.value) } : x) })} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <Row label="Priorité (100 = maximale)" hint="Règle client spécifique > Segment > Promotion générale > Prix catalogue">
                    <Input type="number" value={rule.priority} onChange={(e) => patch({ priority: Number(e.target.value) })} />
                  </Row>
                  <Row label="Cumul avec d'autres remises">
                    <label className="flex h-10 items-center gap-2 text-sm">
                      <Switch checked={rule.cumulative} onCheckedChange={(v) => patch({ cumulative: v })} />
                      {rule.cumulative ? "Cumulable" : "Non cumulable — seule la règle prioritaire s'applique"}
                    </label>
                  </Row>
                </div>

                {rule.minMargin != null && (
                  <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
                    Protection marge : réduction maximale possible <strong>-{maxDisc.pct.toFixed(1).replace(".", ",")} %</strong> — prix minimum{" "}
                    <strong>{eur2(maxDisc.minPrice)}</strong> pour conserver {rule.minMargin} % de marge.
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Row label="Date de début" hint="Vide = application immédiate">
                    <Input type="date" value={rule.start?.slice(0, 10) ?? ""} onChange={(e) => patch({ start: e.target.value ? `${e.target.value}T00:00:00` : null })} />
                  </Row>
                  <Row label="Date de fin" hint="Vide = sans date de fin">
                    <Input type="date" value={rule.end?.slice(0, 10) ?? ""} onChange={(e) => patch({ end: e.target.value ? `${e.target.value}T23:59:59` : null })} />
                  </Row>
                  <Row label="Devise">
                    <Input value={rule.conditions.currency ?? "EUR"} onChange={(e) => patch({ conditions: { ...rule.conditions, currency: e.target.value } })} />
                  </Row>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conditions d'application (optionnel)</div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Row label="Quantité minimale">
                      <Input type="number" value={rule.conditions.minQty ?? ""} onChange={(e) => patch({ conditions: { ...rule.conditions, minQty: e.target.value === "" ? null : Number(e.target.value) } })} />
                    </Row>
                    <Row label="Quantité maximale">
                      <Input type="number" value={rule.conditions.maxQty ?? ""} onChange={(e) => patch({ conditions: { ...rule.conditions, maxQty: e.target.value === "" ? null : Number(e.target.value) } })} />
                    </Row>
                    <Row label="Montant minimum commande (€)">
                      <Input type="number" value={rule.conditions.minOrderAmount ?? ""} onChange={(e) => patch({ conditions: { ...rule.conditions, minOrderAmount: e.target.value === "" ? null : Number(e.target.value) } })} />
                    </Row>
                    <Row label="Incoterm">
                      <select value={rule.conditions.incoterm ?? ""} onChange={(e) => patch({ conditions: { ...rule.conditions, incoterm: e.target.value || null } })}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Tous</option>{["EXW", "FOB", "CIF", "CFR", "DAP"].map((i) => <option key={i}>{i}</option>)}
                      </select>
                    </Row>
                    <Row label="Type de transport">
                      <select value={rule.conditions.transport ?? ""} onChange={(e) => patch({ conditions: { ...rule.conditions, transport: e.target.value || null } })}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Tous</option>{["Maritime", "Maritime groupage", "Aérien", "Routier"].map((i) => <option key={i}>{i}</option>)}
                      </select>
                    </Row>
                    <Row label="Pays / port destination">
                      <TagPicker options={countries.concat(["Abidjan", "Dakar", "Conakry"])} selected={rule.conditions.destinations}
                        onToggle={(v) => patch({ conditions: { ...rule.conditions, destinations: toggle(rule.conditions.destinations, v) } })} />
                    </Row>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-ai/30 bg-ai/5 p-4">
                  <div className="text-sm font-semibold">Simulation d'impact — {rule.name || "Nouvelle règle"} ({adjustmentLabel(rule)})</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <Stat label="Produits impactés" value={sim.products} />
                    <Stat label="Clients impactés" value={sim.clients} />
                    <Stat label="CA sans règle" value={eur2(sim.revenueBefore)} />
                    <Stat label="CA avec règle" value={eur2(sim.revenueAfter)} />
                    <Stat label="Impact CA" value={eur2(sim.revenueImpact)} tone={sim.revenueImpact < 0 ? "text-destructive" : "text-success"} />
                    <Stat label="Volume à compenser" value={`+${sim.volumeToCompensate.toFixed(1).replace(".", ",")} %`} />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Stat label="Marge moyenne avant" value={pct(sim.marginBefore)} />
                    <Stat label="Marge moyenne après" value={pct(sim.marginAfter)} tone={sim.marginAfter < sim.minMargin ? "text-destructive" : undefined} />
                    <Stat label="Impact marge" value={`${sim.marginPtsImpact >= 0 ? "+" : ""}${sim.marginPtsImpact.toFixed(1).replace(".", ",")} pts`} />
                  </div>
                </div>

                {sim.belowThreshold.length > 0 && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Attention : cette règle ferait passer {sim.belowThreshold.length} produit(s) sous la marge minimale de {sim.minMargin} %.
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setShowProducts(true)}>Voir les produits concernés</Button>
                      <Button size="sm" variant="ghost" onClick={() => setStep(3)}>Modifier la règle</Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => {
                          if (!can("contourner_marge")) { toast.error("Validation manager requise pour contourner la marge minimale"); return; }
                          setForced(true); toast("Alerte contournée — validation manager enregistrée");
                        }}>
                        Continuer malgré l'alerte
                      </Button>
                    </div>
                    <p className="mt-2 text-xs">
                      Recommandation Agent Pricing : réduction maximale possible <strong>-{maxDisc.pct.toFixed(1).replace(".", ",")} %</strong> (prix minimum {eur2(maxDisc.minPrice)}).
                    </p>
                  </div>
                )}

                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Produit</th>
                        <th className="px-3 py-2 text-right">Prix actuel</th>
                        <th className="px-3 py-2 text-right">Coût</th>
                        <th className="px-3 py-2 text-right">Ajustement</th>
                        <th className="px-3 py-2 text-right">Nouveau prix</th>
                        <th className="px-3 py-2 text-right">Marge avant</th>
                        <th className="px-3 py-2 text-right">Marge après</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sim.lines.slice(0, 25).map((l) => (
                        <tr key={l.ref} className={l.below ? "bg-destructive/5" : ""}>
                          <td className="px-3 py-2"><div className="font-medium">{l.name}</div><div className="text-[11px] text-muted-foreground">{l.ref}</div></td>
                          <td className="px-3 py-2 text-right">{eur2(l.price)}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{eur2(l.cost)}</td>
                          <td className="px-3 py-2 text-right">{l.delta >= 0 ? "+" : ""}{l.delta.toFixed(1).replace(".", ",")} %</td>
                          <td className="px-3 py-2 text-right font-semibold">{eur2(l.newPrice)}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{pct(l.marginBefore)}</td>
                          <td className={`px-3 py-2 text-right font-medium ${l.below ? "text-destructive" : "text-success"}`}>{pct(l.marginAfter)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex-wrap gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Retour
              </Button>
              {step < STEPS.length - 1 && (
                <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                  Suivant <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => save("Brouillon")}>Enregistrer en brouillon</Button>
              <Button variant="secondary" size="sm" onClick={() => save("Programmée")}>Programmer</Button>
              <Button size="sm" disabled={blocking} onClick={() => save("Active")}>
                <Check className="mr-1 h-3.5 w-3.5" /> Activer la règle
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={showProducts} onOpenChange={setShowProducts}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader><SheetTitle>{matchedProducts.length} produits concernés</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-2">
            {sim.lines.map((l) => (
              <div key={l.ref} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{l.name}</div>
                  <div className="text-[11px] text-muted-foreground">{l.ref} · {eur2(l.price)} → {eur2(l.newPrice)}</div>
                </div>
                <Chip tone={l.below ? "danger" : "success"}>{pct(l.marginAfter)}</Chip>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
