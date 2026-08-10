import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2, Circle, Loader2, Tag, TrendingUp, FileText, Sparkles, AlertTriangle, Send, Save, Eye,
  RefreshCw, ArrowRight, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Panel, Chip, Field, Bar, quoteStatusTone } from "@/components/admin/ui";
import {
  boStore, eur, eur2, pct, dTime, dShort, quoteTotalTTC, quoteCost, quoteMarginPct,
  type AdminOrder, type AdminQuote,
} from "@/lib/backoffice-store";
import {
  workflowStore, MARGIN_TARGET,
  type OrderWorkflow, type PricingSummary, type MarginBreakdown, type PricingLine, type Step,
} from "@/lib/order-workflow";

/* ------------------------------------------------------------------ */
/* Step progress                                                       */
/* ------------------------------------------------------------------ */

export function StepBar({ steps }: { steps: Step[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-y-3">
        {steps.map((s, i) => (
          <div key={s.key} className="flex flex-1 min-w-[150px] items-center gap-2">
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                s.state === "done" && "bg-success/15 text-success",
                s.state === "current" && "bg-primary text-primary-foreground",
                s.state === "todo" && "bg-muted text-muted-foreground",
              )}
            >
              {s.state === "done" ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("text-xs", s.state === "todo" ? "text-muted-foreground" : "font-medium")}>{s.label}</span>
            {i < steps.length - 1 && <span className={cn("mx-1 hidden h-px flex-1 md:block", s.state === "done" ? "bg-success/50" : "bg-border")} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Analyse intelligente (vue générale)                                 */
/* ------------------------------------------------------------------ */

function AgentCard({
  title, icon: Icon, tone, status, rows, cta, onCta, disabled,
}: {
  title: string; icon: typeof Tag; tone: string; status: React.ReactNode;
  rows: { label: string; value: React.ReactNode }[]; cta: string; onCta: () => void; disabled?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("grid h-7 w-7 place-items-center rounded-lg", tone)}><Icon className="h-3.5 w-3.5" /></span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {status}
      </div>
      <div className="mt-3 flex-1 space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-medium">{r.value}</span>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={onCta} disabled={disabled}>
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function IntelligenceBlock({
  flow, summary, margin, onGo, quote,
}: {
  flow: OrderWorkflow; summary: PricingSummary; margin: MarginBreakdown;
  onGo: (tab: string) => void; quote?: AdminQuote;
}) {
  const pricingReady = Boolean(flow.pricingDoneAt);
  const marginReady = Boolean(flow.marginDoneAt);
  return (
    <Panel title="Analyse intelligente de la commande" description="Les agents analysent automatiquement — AKWA garde la décision finale.">
      <div className="grid gap-3 lg:grid-cols-3">
        <AgentCard
          title="Pricing" icon={Tag} tone="bg-primary/10 text-primary"
          status={pricingReady
            ? <Chip tone="success"><CheckCircle2 className="h-3 w-3" /> Analyse terminée</Chip>
            : <Chip tone="info"><Loader2 className="h-3 w-3 animate-spin" /> Analyse en cours</Chip>}
          rows={[
            { label: "Prix à vérifier", value: summary.toCheck },
            { label: "Impact potentiel", value: <span className={summary.recommendedTotal - summary.rulesTotal >= 0 ? "text-success" : "text-destructive"}>{summary.recommendedTotal - summary.rulesTotal >= 0 ? "+" : ""}{eur(summary.recommendedTotal - summary.rulesTotal)}</span> },
            { label: "Règles appliquées", value: summary.rulesApplied },
          ]}
          cta="Voir l'analyse" onCta={() => onGo("pricing")} disabled={!pricingReady}
        />
        <AgentCard
          title="Marge" icon={TrendingUp} tone="bg-ai/15 text-ai"
          status={!marginReady
            ? <Chip tone="info"><Loader2 className="h-3 w-3 animate-spin" /> Calcul en cours</Chip>
            : margin.gap < 0 ? <Chip tone="warning"><AlertTriangle className="h-3 w-3" /> À surveiller</Chip>
            : <Chip tone="success"><CheckCircle2 className="h-3 w-3" /> Objectif atteint</Chip>}
          rows={[
            { label: "Marge estimée", value: pct(margin.marginPct) },
            { label: "Objectif AKWA", value: pct(margin.target) },
            { label: "Écart", value: <span className={margin.gap < 0 ? "text-destructive" : "text-success"}>{margin.gap >= 0 ? "+" : ""}{margin.gap.toFixed(1).replace(".", ",")} pts</span> },
          ]}
          cta="Voir la rentabilité" onCta={() => onGo("rentabilite")} disabled={!marginReady}
        />
        <AgentCard
          title="Devis" icon={FileText} tone="bg-success/15 text-success"
          status={quote
            ? <Chip tone={quoteStatusTone[quote.status] ?? "muted"}>{quote.status}</Chip>
            : <Chip tone="muted">En attente de validation commande</Chip>}
          rows={[
            { label: "Version", value: quote ? `V${quote.version}` : "—" },
            { label: "Montant", value: quote ? eur(quoteTotalTTC(quote)) : "—" },
            { label: "Envoyé le", value: quote?.sentAt ? dShort(quote.sentAt) : "—" },
          ]}
          cta="Préparer le devis" onCta={() => onGo("devis")}
        />
      </div>
      {pricingReady && marginReady && !flow.pricingValidated && (
        <p className="mt-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <Sparkles className="mr-1.5 inline h-4 w-4 text-primary" />
          Cette commande est prête à être vérifiée.
        </p>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Section Pricing                                                     */
/* ------------------------------------------------------------------ */

function LineRow({ orderRef, line, focused }: { orderRef: string; line: PricingLine; focused: boolean }) {
  const [manual, setManual] = useState(String(line.currentPrice));
  const delta = line.currentPrice - line.applicablePrice;
  return (
    <tr className={cn("align-top hover:bg-muted/30", focused && "bg-warning/5")}>
      <td className="px-3 py-2">
        <div className="font-medium">{line.item.label}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{line.item.ref}</div>
      </td>
      <td className="px-3 py-2 text-right">{line.item.quantity.toLocaleString("fr-FR")} {line.item.unit}</td>
      <td className="px-3 py-2 text-right text-muted-foreground">{eur2(line.catalogPrice)}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{line.ruleLabel}</td>
      <td className="px-3 py-2 text-right">{eur2(line.applicablePrice)}</td>
      <td className="px-3 py-2 text-right font-semibold text-ai">{eur2(line.recommended)}</td>
      <td className={cn("px-3 py-2 text-right", delta >= 0 ? "text-success" : "text-destructive")}>
        {delta >= 0 ? "+" : ""}{eur2(delta)}
      </td>
      <td className={cn("px-3 py-2 text-right", line.marginPct < MARGIN_TARGET ? "text-warning" : "text-success")}>{pct(line.marginPct)}</td>
      <td className="px-3 py-2">
        {line.mode === "recommande" ? <Chip tone="success">Recommandation acceptée</Chip>
          : line.mode === "manuel" ? <Chip tone="info">Prix manuel</Chip>
          : line.toCheck ? <Chip tone="warning">À vérifier</Chip> : <Chip tone="muted">Conforme</Chip>}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap justify-end gap-1.5">
          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]"
            onClick={() => workflowStore.setLinePrice(orderRef, line.item.ref, line.recommended, "recommande")}>
            Accepter
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]"
            onClick={() => workflowStore.setLinePrice(orderRef, line.item.ref, line.applicablePrice, "actuel")}>
            Conserver
          </Button>
          <Dialog>
            <DialogTrigger asChild><Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]">Modifier</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Modifier le prix — {line.item.label}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Catalogue" value={eur2(line.catalogPrice)} />
                  <Field label="Applicable" value={eur2(line.applicablePrice)} />
                  <Field label="Recommandé" value={eur2(line.recommended)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Prix unitaire retenu (€)</Label>
                  <Input type="number" step="0.01" value={manual} onChange={(e) => setManual(e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground">Coût unitaire {eur2(line.cost)} — la marge de la commande sera recalculée immédiatement.</p>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  const v = Number(manual);
                  if (!Number.isFinite(v) || v <= 0) return toast.error("Prix invalide");
                  workflowStore.setLinePrice(orderRef, line.item.ref, v, "manuel");
                  toast.success("Prix modifié", { description: "Agent Marge a recalculé la rentabilité." });
                }}>Appliquer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </td>
    </tr>
  );
}

export function PricingSection({
  order, flow, summary, onGo,
}: { order: AdminOrder; flow: OrderWorkflow; summary: PricingSummary; onGo: (t: string) => void }) {
  const locked = Boolean(flow.pricingValidated);
  return (
    <div className="space-y-4">
      <Panel title="Synthèse Agent Pricing" description="Analyse automatique déclenchée à la réception de la commande.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Prix initial commande" value={eur(summary.initialTotal)} />
          <Field label="Après règles tarifaires" value={eur(summary.rulesTotal)} />
          <Field label="Prix recommandé" value={<span className="text-ai">{eur(summary.recommendedTotal)}</span>} />
          <Field label="Variation retenue" value={
            <span className={summary.variation >= 0 ? "text-success" : "text-destructive"}>
              {summary.variation >= 0 ? "+" : ""}{eur(summary.variation)}
            </span>} />
        </div>
        <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
          L'Agent Pricing recommande un ajustement sur {summary.toCheck} produit(s) afin de tenir compte des coûts fournisseurs,
          du volume commandé et des conditions tarifaires de ce client.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Chip tone="success"><CheckCircle2 className="h-3 w-3" /> {summary.rulesApplied} règles tarifaires appliquées</Chip>
          <Chip tone={summary.toCheck ? "warning" : "success"}>
            {summary.toCheck ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />} {summary.toCheck} prix nécessitent une validation
          </Chip>
          <Chip tone={summary.conflicts ? "warning" : "success"}>
            <CheckCircle2 className="h-3 w-3" /> {summary.conflicts ? `${summary.conflicts} conflit(s) tarifaire(s)` : "Aucun conflit tarifaire"}
          </Chip>
        </div>
      </Panel>

      {flow.focusRefs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-4 py-2.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Lignes identifiées par l'Agent Marge comme responsables de la sous-performance :
          {flow.focusRefs.map((r) => <Chip key={r} tone="warning">{r}</Chip>)}
          <Button size="sm" variant="ghost" className="h-7" onClick={() => workflowStore.clearFocus(order.reference)}>Effacer</Button>
        </div>
      )}

      <Panel
        title="Lignes produits"
        description="Prix catalogue, règle tarifaire, prix applicable et recommandation de l'Agent Pricing."
        action={!locked ? (
          <Button size="sm" variant="outline" className="gap-1.5"
            onClick={() => { workflowStore.acceptAllRecommendations(order.reference, summary.lines); toast.success("Recommandations acceptées"); }}>
            <Sparkles className="h-3.5 w-3.5" /> Tout accepter
          </Button>
        ) : <Chip tone="success"><Lock className="h-3 w-3" /> Pricing verrouillé</Chip>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Produit</th>
                <th className="px-3 py-2 text-right font-medium">Quantité</th>
                <th className="px-3 py-2 text-right font-medium">Prix catalogue</th>
                <th className="px-3 py-2 text-left font-medium">Règle tarifaire</th>
                <th className="px-3 py-2 text-right font-medium">Prix actuel</th>
                <th className="px-3 py-2 text-right font-medium">Recommandé</th>
                <th className="px-3 py-2 text-right font-medium">Écart</th>
                <th className="px-3 py-2 text-right font-medium">Marge</th>
                <th className="px-3 py-2 text-left font-medium">Statut</th>
                <th className="px-3 py-2 text-right font-medium">Décision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summary.lines.map((l) => (
                <LineRow key={l.item.ref} orderRef={order.reference} line={l} focused={flow.focusRefs.includes(l.item.ref)} />
              ))}
            </tbody>
            <tfoot className="bg-muted/30 text-sm font-semibold">
              <tr>
                <td colSpan={4} className="px-3 py-2 text-right">Total retenu</td>
                <td className="px-3 py-2 text-right">{eur(summary.rulesTotal)}</td>
                <td className="px-3 py-2 text-right text-ai">{eur(summary.recommendedTotal)}</td>
                <td colSpan={4} className="px-3 py-2 text-right">{eur(summary.currentTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="text-sm">
          {locked ? (
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />
              Pricing validé par {flow.pricingValidated!.by} le {dTime(flow.pricingValidated!.at)} — {eur(flow.pricingValidated!.total)}
            </span>
          ) : "Validez le pricing pour lancer automatiquement l'analyse de rentabilité définitive."}
        </div>
        {!locked && (
          <Dialog>
            <DialogTrigger asChild><Button className="gap-1.5"><CheckCircle2 className="h-4 w-4" /> Valider le pricing</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Résumé avant validation</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <Field label="Prix final retenu" value={eur(summary.currentTotal)} />
                <Field label="Modifications manuelles" value={summary.manualCount} />
                <Field label="Recommandations acceptées" value={summary.acceptedCount} />
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  workflowStore.validatePricing(order.reference, summary);
                  toast.success("Pricing validé", { description: "L'Agent Marge a recalculé la rentabilité." });
                  onGo("rentabilite");
                }}>Confirmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section Rentabilité                                                 */
/* ------------------------------------------------------------------ */

export function MarginSection({
  order, flow, summary, margin, onGo,
}: {
  order: AdminOrder; flow: OrderWorkflow; summary: PricingSummary; margin: MarginBreakdown; onGo: (t: string) => void;
}) {
  const rows = [
    { label: "Coût marchandises", value: margin.goodsCost },
    { label: "Fret estimé", value: margin.freight },
    { label: "Assurance", value: margin.insurance },
    { label: "Transport local", value: margin.localTransport },
    { label: "Préparation", value: margin.preparation },
    { label: "Documentation", value: margin.documents },
    { label: "Autres coûts", value: margin.other },
  ];
  const weakest = [...summary.lines].sort((a, b) => a.marginPct - b.marginPct).slice(0, 3).map((l) => l.item.ref);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Décomposition de la rentabilité" description="Recalculée en temps réel à partir des prix retenus.">
          <div className="flex items-center justify-between border-b border-border pb-2 text-sm font-semibold">
            <span>CA estimé</span><span>{eur(margin.revenue)}</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-44 shrink-0 text-sm">{r.label}</span>
                <Bar value={(r.value / (margin.totalCost || 1)) * 100} />
                <span className="w-24 text-right text-sm font-medium">{eur(r.value)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><span>Coût total estimé</span><span className="font-semibold">{eur(margin.totalCost)}</span></div>
            <div className="flex justify-between"><span>Marge estimée</span><span className="font-semibold">{eur(margin.margin)}</span></div>
            <div className="flex justify-between"><span>Taux de marge</span>
              <span className={cn("font-semibold", margin.gap < 0 ? "text-destructive" : "text-success")}>{pct(margin.marginPct)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Objectif AKWA</span><span>{pct(margin.target)}</span></div>
          </div>
        </Panel>

        <Panel title="Analyse Agent Marge">
          <div className={cn("rounded-lg border px-4 py-3", margin.gap < 0 ? "border-warning/40 bg-warning/5" : "border-success/40 bg-success/5")}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              {margin.gap < 0 ? <><AlertTriangle className="h-4 w-4 text-warning" /> Marge sous objectif</> : <><CheckCircle2 className="h-4 w-4 text-success" /> Objectif de marge atteint</>}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Field label="Marge" value={pct(margin.marginPct)} />
              <Field label="Objectif" value={pct(margin.target)} />
              <Field label="Écart" value={`${margin.gap >= 0 ? "+" : ""}${margin.gap.toFixed(1).replace(".", ",")} points`} />
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {margin.gap < 0
              ? `Le principal facteur réduisant la rentabilité est ${margin.topDriver}. Une augmentation moyenne de ${margin.suggestionPct.toFixed(1).replace(".", ",")} % des prix sur certaines lignes permettrait de rapprocher la commande de l'objectif de marge.`
              : `La structure de coûts est maîtrisée : ${margin.topDriver} reste le poste principal mais la marge dépasse l'objectif AKWA.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onGo("rentabilite")} className="gap-1.5"><Eye className="h-3.5 w-3.5" /> Détail des coûts</Button>
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={() => { workflowStore.focusPricing(order.reference, weakest); onGo("pricing"); toast.info("Lignes à revoir identifiées"); }}>
              <RefreshCw className="h-3.5 w-3.5" /> Revoir avec Agent Pricing
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={() => {
                workflowStore.acceptAllRecommendations(order.reference, summary.lines);
                toast.success("Optimisation appliquée", { description: "Recommandations Agent Pricing reportées." });
              }}>
              <Sparkles className="h-3.5 w-3.5" /> Demander optimisation
            </Button>
            <Button size="sm" className="gap-1.5"
              onClick={() => { workflowStore.acceptMargin(order.reference, margin.marginPct); toast.success("Marge acceptée"); }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Accepter cette marge
            </Button>
          </div>
          {flow.marginAccepted && (
            <p className="mt-3 text-xs text-muted-foreground">
              Marge acceptée par {flow.marginAccepted.by} le {dTime(flow.marginAccepted.at)} ({pct(flow.marginAccepted.pct)}).
            </p>
          )}
        </Panel>
      </div>

      <ValidationBlock order={order} flow={flow} summary={summary} margin={margin} onGo={onGo} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Validation de la commande                                           */
/* ------------------------------------------------------------------ */

export function ValidationBlock({
  order, flow, summary, margin, onGo,
}: {
  order: AdminOrder; flow: OrderWorkflow; summary: PricingSummary; margin: MarginBreakdown; onGo: (t: string) => void;
}) {
  const validated = Boolean(order.validatedAt);
  const checks = [
    { label: "Produits vérifiés", ok: summary.lines.length > 0 },
    { label: "Pricing validé", ok: Boolean(flow.pricingValidated) },
    { label: "Rentabilité analysée", ok: Boolean(flow.marginDoneAt) },
    { label: "Client vérifié", ok: order.missingDocs.length === 0 },
  ];
  const ready = checks.every((c) => c.ok);

  if (validated) {
    return (
      <Panel title="Commande validée">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Chip tone="success"><CheckCircle2 className="h-3 w-3" /> Validée le {dTime(order.validatedAt!)} par {order.validatedBy}</Chip>
          <span className="text-muted-foreground">Prix verrouillé {eur(summary.currentTotal)} · marge prévisionnelle {pct(margin.marginPct)}</span>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onGo("devis")}><FileText className="h-3.5 w-3.5" /> Ouvrir le devis</Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Prêt pour validation">
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid gap-1.5 sm:grid-cols-2">
          {checks.map((c) => (
            <span key={c.label} className="flex items-center gap-1.5 text-sm">
              {c.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              {c.label}
            </span>
          ))}
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Field label="Prix retenu" value={eur(summary.currentTotal)} />
          <Field label="Marge estimée" value={pct(margin.marginPct)} />
        </div>
        <Button
          className="gap-1.5 bg-gradient-primary"
          disabled={!ready}
          onClick={() => {
            const draft = workflowStore.validateOrder(order.reference, summary, margin);
            toast.success("Commande validée avec succès.", { description: `Le devis ${draft.id} a été préparé et attend votre validation.` });
            onGo("devis");
          }}
        >
          <CheckCircle2 className="h-4 w-4" /> Valider la commande
        </Button>
      </div>
      {!ready && <p className="mt-2 text-xs text-muted-foreground">Validez le pricing et vérifiez les informations manquantes avant de valider la commande.</p>}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Section Devis                                                       */
/* ------------------------------------------------------------------ */

function QuoteEditor({ quote, orderRef }: { quote: AdminQuote; orderRef: string }) {
  const goods = quote.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = quoteTotalTTC(quote);
  const marginPct = quoteMarginPct(quote);
  const before = goods ? ((goods - quoteCost({ ...quote, fees: [] })) / goods) * 100 : 0;

  return (
    <Panel
      title={<span className="flex items-center gap-2">{quote.id} <Chip tone={quoteStatusTone[quote.status] ?? "muted"}>{quote.status}</Chip></span>}
      description="Devis préparé automatiquement par l'Agent Devis à partir des prix validés."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <span>Marchandises ({quote.items.length} références)</span><span className="font-semibold">{eur(goods)}</span>
          </div>
          {quote.fees.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="min-w-40 flex-1">{f.type}<span className="block text-[11px] text-muted-foreground">{f.description}</span></span>
              <Input
                type="number" step="10" className="h-8 w-32 text-right" defaultValue={f.price}
                disabled={quote.status !== "Brouillon"}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v) && v !== f.price) {
                    boStore.updateFee(quote.id, f.id, { price: v });
                    toast.info("Frais mis à jour", { description: "Marge recalculée par l'Agent Marge." });
                  }
                }}
              />
              {quote.status === "Brouillon" && (
                <Button size="sm" variant="ghost" className="h-8" onClick={() => boStore.removeFee(quote.id, f.id)}>Retirer</Button>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold">
            <span>Total devis</span><span>{eur(total)}</span>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Contrôle de marge du devis</div>
          <Field label="Marge prévisionnelle (marchandises)" value={pct(before)} />
          <Field label="Après frais du devis" value={<span className={marginPct < MARGIN_TARGET ? "text-warning" : "text-success"}>{pct(marginPct)}</span>} />
          <Bar value={marginPct * (100 / 30)} tone={marginPct < MARGIN_TARGET ? "bg-warning" : "bg-success"} />
          <Field label="Validité" value={dShort(quote.validUntil)} />
          <Field label="Incoterm" value={quote.conditions.incoterm} />
        </div>
      </div>

      {quote.status === "Brouillon" && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Dialog>
            <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-1.5"><Eye className="h-3.5 w-3.5" /> Prévisualiser</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Aperçu — {quote.id}</DialogTitle></DialogHeader>
              <div className="max-h-[60vh] space-y-2 overflow-y-auto text-sm">
                {quote.items.map((i) => (
                  <div key={i.ref} className="flex justify-between border-b border-border py-1">
                    <span>{i.label} — {i.quantity.toLocaleString("fr-FR")} {i.unit}</span><span>{eur(i.quantity * i.unitPrice)}</span>
                  </div>
                ))}
                {quote.fees.map((f) => (
                  <div key={f.id} className="flex justify-between py-1 text-muted-foreground">
                    <span>{f.type}</span><span>{eur(f.price * f.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 font-bold"><span>Total</span><span>{eur(total)}</span></div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { boStore.saveDraft(quote.id); toast.success("Brouillon enregistré"); }}>
            <Save className="h-3.5 w-3.5" /> Enregistrer brouillon
          </Button>
          <Button size="sm" className="gap-1.5 bg-gradient-primary" onClick={() => {
            boStore.sendQuote(quote.id);
            workflowStore.markQuoteSent(orderRef, quote.id, total);
            toast.success("Devis envoyé au client", { description: `${quote.id} — ${eur(total)}` });
          }}>
            <Send className="h-3.5 w-3.5" /> Valider et envoyer au client
          </Button>
        </div>
      )}
    </Panel>
  );
}

export function QuoteSection({
  order, flow, quotes, onGo,
}: { order: AdminOrder; flow: OrderWorkflow; quotes: AdminQuote[]; onGo: (t: string) => void }) {
  const draft = quotes.find((q) => q.status === "Brouillon");
  const sent = quotes.find((q) => q.sentAt && q.status !== "Brouillon");
  const refused = quotes.find((q) => q.status === "Refusé");
  const accepted = quotes.find((q) => q.status === "Accepté");

  if (quotes.length === 0) {
    return (
      <Panel title="Devis">
        <div className="py-8 text-center text-sm text-muted-foreground">
          <FileText className="mx-auto mb-2 h-8 w-8" />
          En attente de validation de la commande — l'Agent Devis préparera automatiquement le brouillon.
          <div className="mt-3"><Button size="sm" variant="outline" onClick={() => onGo("rentabilite")}>Aller à la validation</Button></div>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {draft && <QuoteEditor quote={draft} orderRef={order.reference} />}

      {!draft && sent && sent.status === "À valider client" && (
        <Panel title="En attente du client">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Devis" value={sent.id} />
            <Field label="Montant" value={eur(quoteTotalTTC(sent))} />
            <Field label="Envoyé" value={sent.sentAt ? dTime(sent.sentAt) : "—"} />
            <Field label="Consulté par le client" value={flow.quoteViewedAt ? "Oui" : "Pas encore"} />
            <Field label="Réponse" value={<Chip tone="warning">En attente</Chip>} />
          </div>
        </Panel>
      )}

      {accepted && (
        <Panel title="Devis accepté">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Chip tone="success"><CheckCircle2 className="h-3 w-3" /> {accepted.id} accepté</Chip>
            <Chip tone="success">Document signé reçu</Chip>
            <span className="text-muted-foreground">Prochaine phase : Facturation / Proforma → Paiement → Préparation export.</span>
            <Button size="sm" variant="outline" asChild><Link to="/admin/facturation/factures">Ouvrir la facturation</Link></Button>
          </div>
        </Panel>
      )}

      {refused && !draft && (
        <Panel title="Devis refusé">
          <div className="space-y-2 text-sm">
            <Chip tone="danger">{refused.id} refusé</Chip>
            <p>Motif client : « {refused.refusal?.reason || "non précisé"} »{refused.refusal?.message ? ` — ${refused.refusal.message}` : ""}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" className="gap-1.5" onClick={() => {
                const next = boStore.createVersion(refused.id);
                if (next) { workflowStore.logEvent(order.reference, `Nouvelle version ${next.id} créée`); toast.success(`${next.id} créé`); }
              }}><RefreshCw className="h-3.5 w-3.5" /> Réviser le devis</Button>
              <Button size="sm" variant="outline" onClick={() => onGo("pricing")}>Revoir le pricing</Button>
              <Button size="sm" variant="outline" onClick={() => onGo("devis")}>Réviser les frais</Button>
              <Button size="sm" variant="outline" onClick={() => toast.info("Relance client envoyée")}>Contacter le client</Button>
            </div>
          </div>
        </Panel>
      )}

      <Panel title="Versions du devis">
        <div className="divide-y divide-border">
          {quotes.map((q) => (
            <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{q.id}</span>
                <Chip tone={quoteStatusTone[q.status] ?? "muted"}>{q.status}</Chip>
                <span className="text-[11px] text-muted-foreground">créé le {dShort(q.createdAt)} par {q.createdBy}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{eur(quoteTotalTTC(q))}</span>
                <Button asChild size="sm" variant="outline"><Link to="/admin/devis/$quoteId" params={{ quoteId: q.id }}>Ouvrir</Link></Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline métier                                                     */
/* ------------------------------------------------------------------ */

export function WorkflowTimeline({ flow, quotes }: { flow: OrderWorkflow; quotes: AdminQuote[] }) {
  const events = useMemo(() => {
    const extra = quotes.flatMap((q) => q.history.map((h) => ({ at: h.at, label: h.label, user: h.user, detail: h.detail })));
    return [...flow.timeline, ...extra].sort((a, b) => a.at.localeCompare(b.at));
  }, [flow.timeline, quotes]);

  return (
    <Panel title="Historique métier de la commande">
      <ol className="relative space-y-4 border-l border-border pl-5">
        {events.map((e, i) => (
          <li key={`${e.at}-${i}`} className="relative">
            <span className="absolute -left-[26px] top-1 grid h-3 w-3 place-items-center rounded-full bg-primary" />
            <div className="text-xs text-muted-foreground">{dTime(e.at)} · {e.user}</div>
            <div className="text-sm font-medium">{e.label}</div>
            {e.detail && <div className="text-xs text-muted-foreground">{e.detail}</div>}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

export function DocumentsSection({ order }: { order: AdminOrder }) {
  const docs = [
    { name: "Bon de commande client", status: "Reçu" },
    { name: "Facture proforma", status: order.validatedAt ? "À générer" : "En attente" },
    { name: "Fiches de données de sécurité (SDS)", status: "Disponibles" },
    { name: "Fiches techniques (TDS)", status: "Disponibles" },
    { name: "Certificat d'origine", status: "À produire" },
    { name: "Packing list", status: "À produire" },
    { name: "Déclaration ADR / matières réglementées", status: "À vérifier" },
  ];
  return (
    <Panel title="Documents de la commande" description="Documents export requis pour les lubrifiants et fluides techniques.">
      <div className="divide-y divide-border">
        {docs.map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {d.name}</span>
            <Chip tone={d.status === "Reçu" || d.status === "Disponibles" ? "success" : d.status === "À vérifier" ? "warning" : "muted"}>{d.status}</Chip>
          </div>
        ))}
      </div>
      {order.missingDocs.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <Label className="text-xs">Informations manquantes signalées</Label>
          <Textarea readOnly rows={2} value={order.missingDocs.join(" · ")} />
        </div>
      )}
    </Panel>
  );
}
