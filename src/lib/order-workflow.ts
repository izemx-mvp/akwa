import { useSyncExternalStore } from "react";
import {
  boStore, CURRENT_USER, eur, type AdminOrder, type AdminQuote, type OrderItem,
} from "./backoffice-store";
import { resolvePrice, type PriceResolution } from "./pricing-rules";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type LineMode = "actuel" | "recommande" | "manuel";

export type LineDecision = { mode: LineMode; price: number };

export type WorkflowEvent = { at: string; label: string; user: string; detail?: string };

export type OrderWorkflow = {
  ref: string;
  startedAt: string;
  pricingDoneAt?: string;
  marginDoneAt?: string;
  decisions: Record<string, LineDecision>;
  pricingValidated?: { at: string; by: string; total: number; manual: number; accepted: number };
  marginAccepted?: { at: string; by: string; pct: number };
  quoteViewedAt?: string;
  focusRefs: string[];
  timeline: WorkflowEvent[];
};

export type PricingLine = {
  item: OrderItem;
  catalogPrice: number;
  cost: number;
  applicablePrice: number;
  ruleLabel: string;
  ruleReason: string;
  recommended: number;
  currentPrice: number;
  delta: number;
  marginPct: number;
  mode: LineMode;
  toCheck: boolean;
  resolution?: PriceResolution;
};

export type PricingSummary = {
  lines: PricingLine[];
  initialTotal: number;
  rulesTotal: number;
  recommendedTotal: number;
  currentTotal: number;
  variation: number;
  rulesApplied: number;
  toCheck: number;
  conflicts: number;
  manualCount: number;
  acceptedCount: number;
};

export type MarginBreakdown = {
  revenue: number;
  goodsCost: number;
  freight: number;
  insurance: number;
  localTransport: number;
  preparation: number;
  documents: number;
  other: number;
  totalCost: number;
  margin: number;
  marginPct: number;
  target: number;
  gap: number;
  topDriver: string;
  suggestionPct: number;
};

export const MARGIN_TARGET = 18;

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

let flows: Record<string, OrderWorkflow> = {};
const listeners = new Set<() => void>();
const now = () => new Date().toISOString();
const emit = () => listeners.forEach((l) => l());
let cache = flows;
const refresh = () => { cache = { ...flows }; emit(); };

function ensure(ref: string): OrderWorkflow {
  const existing = flows[ref];
  if (existing) return existing;
  const order = boStore.getOrder(ref);
  const created: OrderWorkflow = {
    ref,
    startedAt: order?.receivedAt ?? now(),
    decisions: {},
    focusRefs: [],
    timeline: [{ at: order?.receivedAt ?? now(), label: "Commande reçue", user: order?.channel ?? "Portail client" }],
  };
  flows = { ...flows, [ref]: created };
  return created;
}

function patch(ref: string, p: Partial<OrderWorkflow>, event?: Omit<WorkflowEvent, "at" | "user"> & { user?: string }) {
  const f = ensure(ref);
  const next: OrderWorkflow = { ...f, ...p };
  if (event) {
    next.timeline = [...next.timeline, { at: now(), user: event.user ?? CURRENT_USER.name, label: event.label, detail: event.detail }];
  }
  flows = { ...flows, [ref]: next };
  refresh();
}

/* ------------------------------------------------------------------ */
/* Analyses                                                            */
/* ------------------------------------------------------------------ */

export function pricingSummary(order: AdminOrder, flow: OrderWorkflow): PricingSummary {
  const client = boStore.clientOf(order);
  const orderAmount = order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const lines: PricingLine[] = order.items.map((item) => {
    const product = boStore.getProduct(item.ref);
    const res = product
      ? resolvePrice({
          product, client, quantity: item.quantity, orderAmount,
          destination: order.destination, incoterm: order.incoterm,
        })
      : undefined;

    const catalogPrice = res?.catalogPrice ?? item.unitPrice;
    const cost = res?.cost ?? item.purchasePrice;
    const applicablePrice = res?.applicablePrice ?? item.unitPrice;
    const applied = res?.applied.filter((a) => !a.blocked) ?? [];

    // Recommandation Agent Pricing : viser la marge cible en tenant compte du coût réel.
    const target = cost / (1 - MARGIN_TARGET / 100);
    const catalogRef = product?.recommendedPrice || catalogPrice;
    const raw = Math.max(applicablePrice, Math.min(catalogRef, target));
    const recommended = Number(raw.toFixed(2));

    const decision = flow.decisions[item.ref];
    const currentPrice = decision ? decision.price : applicablePrice;
    const mode: LineMode = decision?.mode ?? "actuel";
    const marginPct = currentPrice ? ((currentPrice - cost) / currentPrice) * 100 : 0;

    return {
      item, catalogPrice, cost, applicablePrice,
      ruleLabel: applied.length ? applied.map((a) => a.rule.name).join(" + ") : "Aucune règle",
      ruleReason: res?.reason ?? "Prix commande — produit hors catalogue",
      recommended,
      currentPrice,
      delta: Number((recommended - applicablePrice).toFixed(2)),
      marginPct,
      mode,
      toCheck: !decision && Math.abs(recommended - applicablePrice) >= 0.01,
      resolution: res,
    };
  });

  const initialTotal = order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const rulesTotal = lines.reduce((s, l) => s + l.applicablePrice * l.item.quantity, 0);
  const recommendedTotal = lines.reduce((s, l) => s + l.recommended * l.item.quantity, 0);
  const currentTotal = lines.reduce((s, l) => s + l.currentPrice * l.item.quantity, 0);

  return {
    lines,
    initialTotal,
    rulesTotal,
    recommendedTotal,
    currentTotal,
    variation: currentTotal - rulesTotal,
    rulesApplied: lines.reduce((s, l) => s + (l.resolution?.applied.filter((a) => !a.blocked).length ?? 0), 0),
    toCheck: lines.filter((l) => l.toCheck).length,
    conflicts: lines.filter((l) => l.resolution?.conflict && (l.resolution?.applied.length ?? 0) > 1).length,
    manualCount: lines.filter((l) => l.mode === "manuel").length,
    acceptedCount: lines.filter((l) => l.mode === "recommande").length,
  };
}

export function marginBreakdown(order: AdminOrder, summary: PricingSummary): MarginBreakdown {
  const revenue = summary.currentTotal;
  const goodsCost = summary.lines.reduce((s, l) => s + l.cost * l.item.quantity, 0);
  const c = order.costs;
  const totalCost = goodsCost + c.freight + c.insurance + c.localTransport + c.preparation + c.documents + c.other;
  const margin = revenue - totalCost;
  const marginPct = revenue ? (margin / revenue) * 100 : 0;
  const gap = marginPct - MARGIN_TARGET;

  const drivers: { label: string; value: number }[] = [
    { label: "le coût du fret", value: c.freight },
    { label: "le transport local", value: c.localTransport },
    { label: "les frais de préparation", value: c.preparation },
    { label: "l'assurance", value: c.insurance },
    { label: "la documentation export", value: c.documents },
  ].sort((a, b) => b.value - a.value);

  const needed = gap < 0 && revenue ? (totalCost / (1 - MARGIN_TARGET / 100) / revenue - 1) * 100 : 0;

  return {
    revenue, goodsCost,
    freight: c.freight, insurance: c.insurance, localTransport: c.localTransport,
    preparation: c.preparation, documents: c.documents, other: c.other,
    totalCost, margin, marginPct, target: MARGIN_TARGET, gap,
    topDriver: drivers[0]?.label ?? "les coûts logistiques",
    suggestionPct: Number(Math.max(0, needed).toFixed(1)),
  };
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

export type StepState = "done" | "current" | "todo";
export type Step = { key: string; label: string; state: StepState };

export function steps(order: AdminOrder, flow: OrderWorkflow, quotes: AdminQuote[]): Step[] {
  const sent = quotes.find((q) => q.sentAt);
  const answered = quotes.find((q) => q.status === "Accepté" || q.status === "Refusé");
  const validated = Boolean(order.validatedAt) || ["Commande validée par AKWA", "Devis envoyé – En attente client", "Devis accepté", "Révision devis", "En préparation", "En transit", "Livrée"].includes(order.status);

  const flags = [
    true,
    Boolean(flow.pricingValidated),
    Boolean(flow.marginAccepted),
    validated,
    Boolean(sent),
    Boolean(answered),
  ];
  const labels = ["Commande reçue", "Analyse Pricing", "Analyse Marge", "Validation AKWA", "Devis", "Réponse client"];
  const firstTodo = flags.findIndex((f) => !f);
  return labels.map((label, i) => ({
    key: label,
    label,
    state: flags[i] ? "done" : i === firstTodo ? "current" : "todo",
  }));
}

/* ------------------------------------------------------------------ */
/* Store API                                                           */
/* ------------------------------------------------------------------ */

export const workflowStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
  get: () => cache,
  flow: (ref: string) => cache[ref] ?? ensure(ref),

  /** Lance automatiquement les analyses Pricing puis Marge à la réception. */
  runAnalyses(ref: string) {
    const f = ensure(ref);
    if (f.pricingDoneAt && f.marginDoneAt) return;
    patch(ref, { pricingDoneAt: now() }, { label: "Analyse Pricing terminée", user: "Agent Pricing" });
    setTimeout(() => {
      const cur = flows[ref];
      if (cur?.marginDoneAt) return;
      patch(ref, { marginDoneAt: now() }, { label: "Analyse Marge terminée", user: "Agent Marge" });
    }, 700);
  },

  setLinePrice(ref: string, itemRef: string, price: number, mode: LineMode) {
    const f = ensure(ref);
    patch(ref, { decisions: { ...f.decisions, [itemRef]: { mode, price: Number(price.toFixed(2)) } } });
  },
  resetLine(ref: string, itemRef: string) {
    const f = ensure(ref);
    const d = { ...f.decisions };
    delete d[itemRef];
    patch(ref, { decisions: d });
  },
  acceptAllRecommendations(ref: string, lines: PricingLine[]) {
    const f = ensure(ref);
    const d = { ...f.decisions };
    lines.forEach((l) => { d[l.item.ref] = { mode: "recommande", price: l.recommended }; });
    patch(ref, { decisions: d }, { label: "Recommandations Agent Pricing acceptées", detail: `${lines.length} ligne(s)` });
  },

  validatePricing(ref: string, summary: PricingSummary) {
    patch(ref, {
      pricingValidated: {
        at: now(), by: CURRENT_USER.name,
        total: summary.currentTotal, manual: summary.manualCount, accepted: summary.acceptedCount,
      },
      marginDoneAt: now(),
    }, { label: "Pricing validé", detail: `Prix retenu ${eur(summary.currentTotal)}` });
  },

  acceptMargin(ref: string, pct: number) {
    patch(ref, { marginAccepted: { at: now(), by: CURRENT_USER.name, pct } },
      { label: "Rentabilité acceptée", detail: `${pct.toFixed(1).replace(".", ",")} %` });
  },

  focusPricing(ref: string, refs: string[]) {
    patch(ref, { focusRefs: refs }, { label: "Retour vers Agent Pricing", detail: `${refs.length} ligne(s) à revoir` });
  },
  clearFocus(ref: string) { patch(ref, { focusRefs: [] }); },

  /** Verrouille le pricing, valide la commande et prépare le brouillon de devis. */
  validateOrder(ref: string, summary: PricingSummary, margin: MarginBreakdown) {
    boStore.applyPricing(ref, summary.lines.map((l) => ({ ref: l.item.ref, price: l.currentPrice })));
    boStore.validateOrder(ref);
    patch(ref, {}, { label: "Commande validée", detail: `Marge prévisionnelle ${margin.marginPct.toFixed(1).replace(".", ",")} %` });
    const draft = boStore.startDraft(ref);
    const order = boStore.getOrder(ref)!;
    if (draft.fees.length === 0) {
      const c = order.costs;
      const add = (type: Parameters<typeof boStore.addFee>[1]["type"], description: string, value: number) => {
        if (value > 0) boStore.addFee(draft.id, { type, description, cost: value, price: value, quantity: 1, vat: 0, comment: "Repris de l'analyse de coûts commande" });
      };
      add("Fret maritime", "Fret maritime conteneur 40' HC", c.freight);
      add("Assurance", "Assurance marchandises", c.insurance);
      add("Transport local", "Pré-acheminement port", c.localTransport);
      add("Frais de préparation", "Préparation & conditionnement", c.preparation);
      add("Documentation export", "Documentation export & SDS", c.documents);
      add("Autres frais", "Autres frais export", c.other);
    }
    patch(ref, {}, { label: `Devis ${draft.id} généré`, user: "Agent Devis" });
    return draft;
  },

  markQuoteSent(ref: string, quoteId: string, total: number) {
    patch(ref, { quoteViewedAt: undefined }, { label: `Devis ${quoteId} envoyé au client`, detail: eur(total) });
    setTimeout(() => {
      patch(ref, { quoteViewedAt: now() }, { label: "Devis consulté par le client", user: "Client" });
    }, 4000);
  },

  logEvent(ref: string, label: string, detail?: string, user?: string) {
    patch(ref, {}, { label, detail, user });
  },
};

export function useOrderWorkflow(ref: string): OrderWorkflow {
  const all = useSyncExternalStore(
    (cb) => workflowStore.subscribe(cb),
    () => cache,
    () => cache,
  );
  return all[ref] ?? ensure(ref);
}
