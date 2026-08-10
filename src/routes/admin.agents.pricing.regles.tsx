import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Layers, Sparkles, Filter } from "lucide-react";
import { toast } from "sonner";
import { Chip, Kpi, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RuleWizard } from "@/components/admin/pricing/RuleWizard";
import { RuleDrawer } from "@/components/admin/pricing/RuleDrawer";
import { BulkPriceDialog } from "@/components/admin/pricing/BulkPriceDialog";
import { eur, dShort, pct, useBackoffice } from "@/lib/backoffice-store";
import {
  RULE_TYPE_LABEL, adjustmentLabel, audienceLabel, can, effectiveStatus, matchClients, matchProducts,
  pricingStore, resolvePrice, ruleStatusTone, rulesDashboard, scopeLabel, simulateRule, usePricing,
  type PricingRule, type RuleStatus,
} from "@/lib/pricing-rules";

export const Route = createFileRoute("/admin/agents/pricing/regles")({
  head: () => ({
    meta: [
      { title: "Règles tarifaires — Agent Pricing AKWA" },
      { name: "description", content: "Créez, simulez et pilotez les règles tarifaires, campagnes commerciales et modifications de prix en masse." },
      { property: "og:title", content: "Règles tarifaires — Agent Pricing AKWA" },
      { property: "og:description", content: "Pricing Management System AKWA : remises, majorations, priorités et protection de marge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingRules,
});

const STATUSES: (RuleStatus | "Toutes")[] = ["Toutes", "Active", "Programmée", "Suspendue", "Brouillon", "Expirée", "Annulée"];

function PricingRules() {
  const { rules, campaigns, role } = usePricing();
  const { products, clients } = useBackoffice();
  const dash = rulesDashboard();
  const [wizard, setWizard] = useState(false);
  const [editing, setEditing] = useState<PricingRule | null>(null);
  const [drawer, setDrawer] = useState<PricingRule | null>(null);
  const [bulk, setBulk] = useState(false);
  const [status, setStatus] = useState<RuleStatus | "Toutes">("Toutes");
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () => rules.filter((r) => (status === "Toutes" || effectiveStatus(r) === status) && r.name.toLowerCase().includes(q.toLowerCase())),
    [rules, status, q],
  );

  // Détection de conflits : produits/clients couverts par plusieurs règles actives
  const conflicts = useMemo(() => {
    const active = rules.filter((r) => effectiveStatus(r) === "Active");
    const map = new Map<string, PricingRule[]>();
    active.forEach((r) => matchProducts(r.scope, products).forEach((p) => map.set(p.ref, [...(map.get(p.ref) ?? []), r])));
    return [...map.entries()].filter(([, rs]) => rs.length > 1).slice(0, 6);
  }, [rules, products]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <Kpi label="Règles actives" value={String(dash.active)} icon={Layers} tone="bg-success/10 text-success" />
        <Kpi label="Programmées" value={String(dash.scheduled)} />
        <Kpi label="Expirées" value={String(dash.expired)} />
        <Kpi label="Suspendues / brouillons" value={`${dash.suspended} / ${dash.drafts}`} />
        <Kpi label="Produits concernés" value={String(dash.products)} />
        <Kpi label="Clients concernés" value={String(dash.clients)} />
        <Kpi label="Impact CA estimé" value={eur(dash.revenueImpact)} />
        <Kpi label="Impact marge" value={`${dash.marginPts.toFixed(1).replace(".", ",")} pts`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded-full border px-3 py-1 text-xs transition-smooth ${status === s ? "border-ai bg-ai/10 font-medium text-ai" : "border-border hover:border-ai/40"}`}>
              {s}
            </button>
          ))}
          <Input className="h-8 w-56" placeholder="Rechercher une règle…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip tone="info">Rôle : {role}</Chip>
          <Button variant="secondary" size="sm" onClick={() => setBulk(true)}>Modifier les prix en masse</Button>
          <Button size="sm" onClick={() => { if (!can("creer_regle")) { toast.error("Permission insuffisante"); return; } setEditing(null); setWizard(true); }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Créer une règle tarifaire
          </Button>
        </div>
      </div>

      <Panel title="Liste des règles tarifaires" description={`${filtered.length} règle(s)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Règle</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Produits</th>
                <th className="px-3 py-2 text-left font-medium">Clients</th>
                <th className="px-3 py-2 text-right font-medium">Ajustement</th>
                <th className="px-3 py-2 text-left font-medium">Période</th>
                <th className="px-3 py-2 text-right font-medium">Priorité</th>
                <th className="px-3 py-2 text-right font-medium">Impact marge</th>
                <th className="px-3 py-2 text-left font-medium">Statut</th>
                <th className="px-3 py-2 text-left font-medium">Créé par</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => {
                const st = effectiveStatus(r);
                const sim = simulateRule(r);
                return (
                  <tr key={r.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDrawer(r)}>
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground">{r.id}{r.campaignId ? ` · ${r.campaignId}` : ""}</div>
                    </td>
                    <td className="px-3 py-2"><Chip tone="ai">{RULE_TYPE_LABEL[r.type]}</Chip></td>
                    <td className="px-3 py-2 text-xs">{matchProducts(r.scope, products).length} — {scopeLabel(r.scope)}</td>
                    <td className="px-3 py-2 text-xs">{matchClients(r.audience, clients).length} — {audienceLabel(r.audience)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{adjustmentLabel(r)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.start ? dShort(r.start) : "Immédiat"} → {r.end ? dShort(r.end) : "∞"}
                    </td>
                    <td className="px-3 py-2 text-right">{r.priority}</td>
                    <td className={`px-3 py-2 text-right ${sim.marginPtsImpact < 0 ? "text-destructive" : "text-success"}`}>
                      {sim.marginPtsImpact >= 0 ? "+" : ""}{sim.marginPtsImpact.toFixed(1).replace(".", ",")} pts
                    </td>
                    <td className="px-3 py-2"><Chip tone={ruleStatusTone(st)}>{st}</Chip></td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.createdBy}</td>
                    <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        {st === "Active" ? (
                          <Button size="sm" variant="ghost" onClick={() => { pricingStore.setStatus(r.id, "Suspendue", "Règle suspendue"); toast("Règle suspendue"); }}>Suspendre</Button>
                        ) : st !== "Annulée" && (
                          <Button size="sm" variant="ghost" onClick={() => {
                            if (!can("activer_regle")) { toast.error("Activation réservée au manager commercial"); return; }
                            pricingStore.setStatus(r.id, "Active", "Règle activée"); toast.success("Règle activée");
                          }}>Activer</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setWizard(true); }}>Modifier</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Conflits tarifaires détectés" description="Produits couverts par plusieurs règles actives — arbitrage par priorité.">
          {conflicts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun conflit détecté sur les règles actives.</p>
          ) : (
            <ul className="space-y-3">
              {conflicts.map(([ref, rs]) => {
                const product = products.find((p) => p.ref === ref)!;
                const res = resolvePrice({ product, client: clients[0], quantity: 500, destination: "Abidjan, Côte d'Ivoire" });
                return (
                  <li key={ref} className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{product.name}</span>
                      <Chip tone="warning">{rs.length} règles</Chip>
                    </div>
                    <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      <li className="flex justify-between"><span>Prix catalogue</span><span>{res.catalogPrice.toFixed(2).replace(".", ",")} €</span></li>
                      {res.candidates.map((c) => (
                        <li key={c.rule.id} className="flex justify-between"><span>{c.rule.name} (p.{c.rule.priority})</span><span>{c.to.toFixed(2).replace(".", ",")} €</span></li>
                      ))}
                    </ul>
                    <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm">
                      <span className="font-semibold">Prix final appliqué</span>
                      <strong className="text-ai">{res.applicablePrice.toFixed(2).replace(".", ",")} €</strong>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Motif : {res.reason}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Campagnes tarifaires" description="Regroupement de plusieurs règles dans un programme commercial.">
          <ul className="space-y-3">
            {campaigns.map((c) => {
              const rs = rules.filter((r) => c.ruleIds.includes(r.id));
              const perf = rs.filter((r) => r.perf);
              const revenue = perf.reduce((s, r) => s + (r.perf?.revenue ?? 0), 0);
              const discounts = perf.reduce((s, r) => s + (r.perf?.discounts ?? 0), 0);
              const margin = perf.length ? perf.reduce((s, r) => s + (r.perf?.marginPct ?? 0), 0) / perf.length : 0;
              return (
                <li key={c.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{dShort(c.start)} → {dShort(c.end)} · objectif marge {c.objectiveMarginPct} %</div>
                    </div>
                    <Chip tone="ai">{rs.length} règles</Chip>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{c.description}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div><div className="text-muted-foreground">CA généré</div><strong>{eur(revenue)}</strong></div>
                    <div><div className="text-muted-foreground">Remises</div><strong>{eur(discounts)}</strong></div>
                    <div><div className="text-muted-foreground">Marge</div><strong>{pct(margin)}</strong></div>
                    <div><div className="text-muted-foreground">Objectif atteint</div><strong>{margin ? ((margin / c.objectiveMarginPct) * 100).toFixed(0) : 0} %</strong></div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {rs.map((r) => (
                      <button key={r.id} onClick={() => setDrawer(r)} className="rounded-full border border-border px-2 py-0.5 text-[11px] hover:border-ai/50 hover:text-ai">
                        {r.name} · {adjustmentLabel(r)}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel title={<span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-ai" /> Règle fondamentale AKWA — 3 niveaux de prix</span>}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border p-3 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">1. Prix catalogue</div>
            <p className="mt-1 text-muted-foreground">Prix standard AKWA du produit, modifié uniquement par une modification massive permanente.</p>
          </div>
          <div className="rounded-lg border border-ai/30 bg-ai/5 p-3 text-sm">
            <div className="text-xs uppercase tracking-wider text-ai">2. Prix applicable</div>
            <p className="mt-1 text-muted-foreground">Calculé selon le client, la période, la quantité et les règles tarifaires actives.</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">3. Prix du devis</div>
            <p className="mt-1 text-muted-foreground">Prix finalement proposé par AKWA dans l'Agent Devis — toute différence est tracée.</p>
          </div>
        </div>
      </Panel>

      <RuleWizard open={wizard} onOpenChange={setWizard} initial={editing} />
      <BulkPriceDialog open={bulk} onOpenChange={setBulk} />
      <RuleDrawer rule={drawer} onClose={() => setDrawer(null)} onEdit={(r) => { setDrawer(null); setEditing(r); setWizard(true); }} />
    </div>
  );
}
