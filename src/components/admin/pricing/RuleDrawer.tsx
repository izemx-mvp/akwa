import { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Chip, Panel } from "@/components/admin/ui";
import { eur, eur2, pct, dShort, dTime, useBackoffice } from "@/lib/backoffice-store";
import {
  RULE_TYPE_LABEL, adjustmentLabel, audienceLabel, can, effectiveStatus, matchClients, matchProducts,
  pricingStore, resolvePrice, ruleStatusTone, scopeLabel, simulateRule, type PricingRule,
} from "@/lib/pricing-rules";
import { agentHub } from "@/lib/agent-hub";
import { Link } from "@tanstack/react-router";
import { Stat } from "./parts";

export function RuleDrawer({ rule, onClose, onEdit }: { rule: PricingRule | null; onClose: () => void; onEdit: (r: PricingRule) => void }) {
  const { products, clients } = useBackoffice();
  const [tab, setTab] = useState<"config" | "perf" | "conflits" | "audit">("config");
  if (!rule) return null;

  const status = effectiveStatus(rule);
  const sim = simulateRule(rule);
  const prods = matchProducts(rule.scope, products);
  const cls = matchClients(rule.audience, clients);
  const sampleProduct = prods[0];
  const sampleClient = cls[0];
  const resolution = sampleProduct ? resolvePrice({ product: sampleProduct, client: sampleClient, quantity: rule.conditions.minQty ?? 500, destination: rule.conditions.destinations[0] }) : null;

  const act = (fn: () => void, msg: string, perm: Parameters<typeof can>[0]) => {
    if (!can(perm)) { toast.error("Permission insuffisante pour cette action"); return; }
    fn(); toast.success(msg);
  };

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {rule.name} <Chip tone={ruleStatusTone(status)}>{status}</Chip>
            <Chip tone="ai">{RULE_TYPE_LABEL[rule.type]}</Chip>
          </SheetTitle>
        </SheetHeader>

        <p className="mt-2 text-sm text-muted-foreground">{rule.description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => onEdit(rule)}>Modifier</Button>
          {status !== "Active" && (
            <Button size="sm" onClick={() => act(() => pricingStore.setStatus(rule.id, "Active", "Règle activée"), "Règle activée", "activer_regle")}>Activer</Button>
          )}
          {status === "Active" && (
            <Button size="sm" variant="secondary" onClick={() => act(() => pricingStore.setStatus(rule.id, "Suspendue", "Règle suspendue"), "Règle suspendue", "suspendre_regle")}>Suspendre</Button>
          )}
          {status === "Suspendue" && (
            <Button size="sm" onClick={() => act(() => pricingStore.setStatus(rule.id, "Active", "Règle réactivée"), "Règle réactivée", "activer_regle")}>Réactiver</Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => { pricingStore.duplicate(rule.id); toast.success("Règle dupliquée en brouillon"); }}>Dupliquer</Button>
          <Button size="sm" variant="ghost" onClick={() => act(() => pricingStore.setStatus(rule.id, "Annulée", "Règle arrêtée"), "Règle arrêtée", "suspendre_regle")}>Arrêter</Button>
          <Link
            to="/admin/agents/marge"
            onClick={() => agentHub.logHandoff("pricing", "marge", `Analyse d'impact de la règle ${rule.name}`)}
            className="inline-flex items-center rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:border-ai/50 hover:text-ai"
          >
            📈 Analyser l'impact avec Agent Marge
          </Link>
        </div>

        <nav className="mt-4 flex gap-1 rounded-lg bg-muted p-1 text-xs">
          {([["config", "Configuration"], ["perf", "Performance"], ["conflits", "Conflits & prix"], ["audit", "Audit"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-smooth ${tab === k ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              {l}
            </button>
          ))}
        </nav>

        <div className="mt-4 space-y-4">
          {tab === "config" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Ajustement" value={adjustmentLabel(rule)} />
                <Stat label="Priorité" value={rule.priority} />
                <Stat label="Cumul" value={rule.cumulative ? "Autorisé" : "Non cumulable"} />
                <Stat label="Marge minimale" value={rule.minMargin != null ? `${rule.minMargin} %` : "Non définie"} />
                <Stat label="Début" value={rule.start ? dShort(rule.start) : "Immédiat"} />
                <Stat label="Fin" value={rule.end ? dShort(rule.end) : "Sans fin"} />
                <Stat label="Produits" value={`${prods.length} — ${scopeLabel(rule.scope)}`} />
                <Stat label="Clients" value={`${cls.length} — ${audienceLabel(rule.audience)}`} />
              </div>
              {rule.type === "volume" && (
                <Panel title="Barème volume">
                  <ul className="space-y-1 text-sm">
                    {rule.tiers.map((t, i) => (
                      <li key={i} className="flex justify-between"><span>{t.min}–{t.max ?? "∞"} unités</span><span className="font-medium">-{t.pct} %</span></li>
                    ))}
                  </ul>
                </Panel>
              )}
              <Panel title="Conditions d'application">
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>Quantité : {rule.conditions.minQty ?? "—"} → {rule.conditions.maxQty ?? "—"}</li>
                  <li>Montant minimum commande : {rule.conditions.minOrderAmount ? eur(rule.conditions.minOrderAmount) : "—"}</li>
                  <li>Destinations : {rule.conditions.destinations.join(", ") || "Toutes"}</li>
                  <li>Incoterm : {rule.conditions.incoterm ?? "Tous"} · Devise : {rule.conditions.currency ?? "EUR"} · Transport : {rule.conditions.transport ?? "Tous"}</li>
                </ul>
              </Panel>
              <div className="flex flex-wrap gap-1.5">{rule.tags.map((t) => <Chip key={t}>{t}</Chip>)}</div>
            </>
          )}

          {tab === "perf" && (
            rule.perf ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Stat label="CA généré" value={eur(rule.perf.revenue)} />
                  <Stat label="Commandes" value={rule.perf.orders} />
                  <Stat label="Clients ayant commandé" value={rule.perf.clients} />
                  <Stat label="Volume vendu" value={`${rule.perf.volume.toLocaleString("fr-FR")} u`} />
                  <Stat label="Remises accordées" value={eur(rule.perf.discounts)} />
                  <Stat label="Marge générée" value={pct(rule.perf.marginPct)} tone={rule.perf.marginPct < rule.perf.targetMarginPct ? "text-warning" : "text-success"} />
                  <Stat label="Panier moyen" value={eur(rule.perf.avgBasket)} />
                  <Stat label="Taux d'acceptation devis" value={`${rule.perf.quoteAcceptRate} %`} />
                  <Stat label="vs période précédente" value={`${(((rule.perf.revenue - rule.perf.previousRevenue) / rule.perf.previousRevenue) * 100).toFixed(1).replace(".", ",")} %`} />
                </div>
                <div className="rounded-lg border border-ai/30 bg-ai/5 p-3 text-sm">
                  Objectif de marge {rule.perf.targetMarginPct} % — performance atteinte :{" "}
                  <strong>{((rule.perf.marginPct / rule.perf.targetMarginPct) * 100).toFixed(0)} % de l'objectif</strong>.
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune performance mesurée : la règle n'a pas encore été appliquée à des commandes.</p>
            )
          )}

          {tab === "conflits" && resolution && (
            <>
              <div className="rounded-lg border border-border p-3 text-sm">
                <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Exemple — {sampleProduct.name} / {sampleClient?.name ?? "Tous clients"}
                </div>
                <ul className="space-y-1">
                  <li className="flex justify-between"><span>Prix catalogue</span><strong>{eur2(resolution.catalogPrice)}</strong></li>
                  {resolution.candidates.map((c) => (
                    <li key={c.rule.id} className="flex justify-between text-muted-foreground">
                      <span>{c.rule.name} (priorité {c.rule.priority})</span><span>{eur2(c.to)}</span>
                    </li>
                  ))}
                  <li className="mt-2 flex justify-between border-t border-border pt-2 text-base">
                    <span className="font-semibold">Prix final appliqué</span>
                    <strong className="text-ai">{eur2(resolution.applicablePrice)}</strong>
                  </li>
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">Motif : {resolution.reason}</p>
                {resolution.conflict && <Chip tone="warning">Conflit tarifaire détecté — arbitrage par priorité</Chip>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Marge catalogue" value={pct(resolution.catalogMarginPct)} />
                <Stat label="Marge après règles" value={pct(resolution.marginPct)} tone={resolution.marginPct < 15 ? "text-destructive" : "text-success"} />
                <Stat label="Impact CA simulé" value={eur(sim.revenueImpact)} tone={sim.revenueImpact < 0 ? "text-destructive" : "text-success"} />
                <Stat label="Impact marge" value={`${sim.marginPtsImpact.toFixed(1).replace(".", ",")} pts`} />
              </div>
            </>
          )}

          {tab === "audit" && (
            <ol className="space-y-2">
              {rule.audit.map((a, i) => (
                <li key={i} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex justify-between"><span className="font-medium">{a.action}</span><span className="text-[11px] text-muted-foreground">{dTime(a.at)}</span></div>
                  <div className="text-xs text-muted-foreground">
                    par {a.user}{a.from || a.to ? ` — ${a.from ?? "—"} → ${a.to ?? "—"}` : ""}
                  </div>
                </li>
              ))}
              <li className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                Créée par {rule.createdBy} le {dShort(rule.createdAt)} · Dernière modification {dShort(rule.updatedAt)}
                {rule.activatedBy ? ` · Activée par ${rule.activatedBy}` : ""}
              </li>
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
