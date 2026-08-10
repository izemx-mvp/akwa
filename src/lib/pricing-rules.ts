import { useSyncExternalStore } from "react";
import { boStore, CURRENT_USER, type Client, type Product } from "./backoffice-store";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type RuleType =
  | "remise_pct"
  | "majoration_pct"
  | "remise_fixe"
  | "majoration_fixe"
  | "prix_fixe"
  | "marge_cible"
  | "volume";

export const RULE_TYPE_LABEL: Record<RuleType, string> = {
  remise_pct: "Réduction %",
  majoration_pct: "Majoration %",
  remise_fixe: "Réduction fixe (€/u)",
  majoration_fixe: "Majoration fixe (€/u)",
  prix_fixe: "Prix fixe",
  marge_cible: "Marge cible",
  volume: "Remise par volume",
};

export type RuleStatus = "Brouillon" | "Programmée" | "Active" | "Suspendue" | "Expirée" | "Annulée";

export type ClientSegment = "Standard" | "Premium" | "VIP" | "Stratégique" | "Nouveau client" | "Grand compte";

export const SEGMENTS: ClientSegment[] = ["Standard", "Premium", "VIP", "Stratégique", "Nouveau client", "Grand compte"];

export type VolumeTier = { min: number; max: number | null; pct: number };

export type RuleScope = {
  allProducts: boolean;
  categories: string[];
  subCategories: string[];
  brands: string[];
  suppliers: string[];
  refs: string[];
};

export type RuleAudience = {
  allClients: boolean;
  clientIds: string[];
  segments: ClientSegment[];
  countries: string[];
  excludeClientIds: string[];
};

export type RuleConditions = {
  minQty?: number | null;
  maxQty?: number | null;
  minOrderAmount?: number | null;
  destinations: string[];
  incoterm?: string | null;
  currency?: string | null;
  transport?: string | null;
};

export type RuleAudit = { at: string; user: string; action: string; from?: string; to?: string };

export type RulePerf = {
  orders: number;
  clients: number;
  revenue: number;
  volume: number;
  discounts: number;
  marginPct: number;
  targetMarginPct: number;
  avgBasket: number;
  quoteAcceptRate: number;
  previousRevenue: number;
};

export type PricingRule = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  type: RuleType;
  value: number;
  tiers: VolumeTier[];
  scope: RuleScope;
  audience: RuleAudience;
  conditions: RuleConditions;
  start: string | null;
  end: string | null;
  priority: number;
  cumulative: boolean;
  minMargin: number | null;
  status: RuleStatus;
  campaignId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  activatedBy?: string;
  activatedAt?: string;
  audit: RuleAudit[];
  perf?: RulePerf;
};

export type Campaign = {
  id: string;
  name: string;
  description: string;
  start: string;
  end: string;
  objectiveMarginPct: number;
  ruleIds: string[];
};

export type PriceBatch = {
  id: string;
  at: string;
  by: string;
  reason: string;
  scopeLabel: string;
  entries: { ref: string; name: string; from: number; to: number }[];
  restored: boolean;
};

export type Permission =
  | "voir_regles"
  | "creer_regle"
  | "modifier_regle"
  | "activer_regle"
  | "suspendre_regle"
  | "modifier_prix_masse"
  | "contourner_marge"
  | "valider_remise_exceptionnelle";

export const PERMISSION_LABEL: Record<Permission, string> = {
  voir_regles: "Voir les règles",
  creer_regle: "Créer une règle",
  modifier_regle: "Modifier une règle",
  activer_regle: "Activer une règle",
  suspendre_regle: "Suspendre une règle",
  modifier_prix_masse: "Modifier les prix en masse",
  contourner_marge: "Contourner la marge minimale",
  valider_remise_exceptionnelle: "Valider une remise exceptionnelle",
};

export type Role = "Commercial" | "Manager commercial" | "Administrateur";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Commercial: ["voir_regles", "creer_regle", "modifier_regle"],
  "Manager commercial": [
    "voir_regles", "creer_regle", "modifier_regle", "activer_regle", "suspendre_regle",
    "modifier_prix_masse", "valider_remise_exceptionnelle",
  ],
  Administrateur: Object.keys(PERMISSION_LABEL) as Permission[],
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const uid = () => Math.random().toString(36).slice(2, 9);
const nowIso = () => new Date().toISOString();
export const MIN_MARGIN_DEFAULT = 15;

export const segmentsOf = (c: Client): ClientSegment[] => {
  const out: ClientSegment[] = [];
  if (c.priority === "VIP") out.push("VIP", "Premium");
  else if (c.priority === "Stratégique") out.push("Stratégique", "Premium");
  else if (c.priority === "Important") out.push("Premium");
  else out.push("Standard");
  if (new Date(c.since).getFullYear() >= 2026) out.push("Nouveau client");
  if (c.revenueTotal >= 500000) out.push("Grand compte");
  return out;
};

export const effectiveStatus = (r: PricingRule, at: Date = new Date()): RuleStatus => {
  if (r.status === "Brouillon" || r.status === "Suspendue" || r.status === "Annulée") return r.status;
  if (r.end && at > new Date(r.end)) return "Expirée";
  if (r.start && at < new Date(r.start)) return "Programmée";
  return "Active";
};

export const ruleStatusTone = (s: RuleStatus): "muted" | "success" | "warning" | "danger" | "info" | "ai" =>
  s === "Active" ? "success" : s === "Programmée" ? "info" : s === "Suspendue" ? "warning" : s === "Brouillon" ? "muted" : s === "Annulée" ? "danger" : "muted";

export function adjustmentLabel(r: PricingRule): string {
  const v = r.value;
  switch (r.type) {
    case "remise_pct": return `-${v.toFixed(1).replace(".", ",")} %`;
    case "majoration_pct": return `+${v.toFixed(1).replace(".", ",")} %`;
    case "remise_fixe": return `-${v.toFixed(2).replace(".", ",")} €/u`;
    case "majoration_fixe": return `+${v.toFixed(2).replace(".", ",")} €/u`;
    case "prix_fixe": return `${v.toFixed(2).replace(".", ",")} €`;
    case "marge_cible": return `marge ≥ ${v.toFixed(1).replace(".", ",")} %`;
    case "volume": return `paliers ${r.tiers.length}`;
  }
}

export function scopeLabel(s: RuleScope): string {
  if (s.allProducts) return "Tous les produits";
  const parts: string[] = [];
  if (s.categories.length) parts.push(`${s.categories.length} catégorie(s)`);
  if (s.subCategories.length) parts.push(`${s.subCategories.length} sous-catégorie(s)`);
  if (s.brands.length) parts.push(`${s.brands.length} marque(s)`);
  if (s.suppliers.length) parts.push(`${s.suppliers.length} fournisseur(s)`);
  if (s.refs.length) parts.push(`${s.refs.length} produit(s)`);
  return parts.join(" · ") || "Aucune sélection";
}

export function audienceLabel(a: RuleAudience): string {
  if (a.allClients && !a.excludeClientIds.length) return "Tous les clients";
  const parts: string[] = [];
  if (a.allClients) parts.push("Tous les clients");
  if (a.segments.length) parts.push(a.segments.join(", "));
  if (a.countries.length) parts.push(a.countries.join(", "));
  if (a.clientIds.length) parts.push(`${a.clientIds.length} client(s)`);
  if (a.excludeClientIds.length) parts.push(`sauf ${a.excludeClientIds.length}`);
  return parts.join(" · ") || "Aucune sélection";
}

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

export function matchProducts(scope: RuleScope, products?: Product[]): Product[] {
  const all = products ?? boStore.get().products;
  if (scope.allProducts) return all;
  const empty =
    !scope.categories.length && !scope.subCategories.length && !scope.brands.length && !scope.suppliers.length && !scope.refs.length;
  if (empty) return [];
  return all.filter((p) => {
    if (scope.refs.includes(p.ref)) return true;
    const catOk = !scope.categories.length || scope.categories.includes(p.category);
    const subOk = !scope.subCategories.length || scope.subCategories.includes(p.subCategory);
    const brandOk = !scope.brands.length || scope.brands.includes(p.brand);
    const supOk = !scope.suppliers.length || p.suppliers.some((s) => scope.suppliers.includes(s.supplierId));
    const anyFilter = scope.categories.length || scope.subCategories.length || scope.brands.length || scope.suppliers.length;
    return Boolean(anyFilter) && catOk && subOk && brandOk && supOk;
  });
}

export function matchClients(audience: RuleAudience, clients?: Client[]): Client[] {
  const all = clients ?? boStore.get().clients;
  const base = all.filter((c) => {
    if (audience.excludeClientIds.includes(c.id)) return false;
    if (audience.allClients) return true;
    if (audience.clientIds.includes(c.id)) return true;
    if (audience.countries.includes(c.country)) return true;
    const segs = segmentsOf(c);
    if (audience.segments.some((s) => segs.includes(s))) return true;
    return false;
  });
  return base;
}

export const ruleMatchesProduct = (r: PricingRule, p: Product) => matchProducts(r.scope).some((x) => x.ref === p.ref);
export const ruleMatchesClient = (r: PricingRule, c: Client) => matchClients(r.audience).some((x) => x.id === c.id);

/* ------------------------------------------------------------------ */
/* Price engine                                                        */
/* ------------------------------------------------------------------ */

export type PriceContext = {
  product: Product;
  client?: Client;
  quantity?: number;
  orderAmount?: number;
  destination?: string;
  incoterm?: string;
  date?: Date;
};

export type RuleApplication = {
  rule: PricingRule;
  from: number;
  to: number;
  blocked?: boolean;
  blockReason?: string;
  maxAllowedPct?: number;
  minPrice?: number;
};

export type PriceResolution = {
  catalogPrice: number;
  cost: number;
  applicablePrice: number;
  applied: RuleApplication[];
  candidates: RuleApplication[];
  conflict: boolean;
  reason: string;
  marginPct: number;
  catalogMarginPct: number;
};

function conditionsOk(r: PricingRule, ctx: PriceContext) {
  const c = r.conditions;
  if (c.minQty != null && (ctx.quantity ?? 0) < c.minQty) return false;
  if (c.maxQty != null && (ctx.quantity ?? 0) > c.maxQty) return false;
  if (c.minOrderAmount != null && (ctx.orderAmount ?? 0) < c.minOrderAmount) return false;
  if (c.destinations.length && ctx.destination && !c.destinations.some((d) => ctx.destination!.toLowerCase().includes(d.toLowerCase()))) return false;
  if (c.incoterm && ctx.incoterm && c.incoterm !== ctx.incoterm) return false;
  return true;
}

function applyRule(r: PricingRule, price: number, cost: number, qty: number): number {
  switch (r.type) {
    case "remise_pct": return price * (1 - r.value / 100);
    case "majoration_pct": return price * (1 + r.value / 100);
    case "remise_fixe": return price - r.value;
    case "majoration_fixe": return price + r.value;
    case "prix_fixe": return r.value;
    case "marge_cible": return Math.max(price, cost / (1 - r.value / 100));
    case "volume": {
      const tier = r.tiers.find((t) => qty >= t.min && (t.max == null || qty <= t.max));
      return tier ? price * (1 - tier.pct / 100) : price;
    }
  }
}

const round2 = (n: number) => Number(n.toFixed(2));

export function resolvePrice(ctx: PriceContext, rules?: PricingRule[]): PriceResolution {
  const list = (rules ?? state.rules).filter((r) => effectiveStatus(r, ctx.date) === "Active");
  const catalogPrice = ctx.product.salePrice;
  const cost = ctx.product.purchasePrice;
  const qty = ctx.quantity ?? 1;

  const eligible = list.filter((r) => {
    if (!matchProducts(r.scope).some((p) => p.ref === ctx.product.ref)) return false;
    if (ctx.client && !matchClients(r.audience).some((c) => c.id === ctx.client!.id)) return false;
    if (!ctx.client && !r.audience.allClients) return false;
    return conditionsOk(r, ctx);
  });

  const sorted = [...eligible].sort((a, b) => b.priority - a.priority);
  const candidates: RuleApplication[] = sorted.map((r) => {
    const to = round2(applyRule(r, catalogPrice, cost, qty));
    return { rule: r, from: catalogPrice, to };
  });

  const applied: RuleApplication[] = [];
  let price = catalogPrice;
  for (const r of sorted) {
    if (applied.length && !(r.cumulative && applied.every((a) => a.rule.cumulative))) continue;
    const from = price;
    let to = round2(applyRule(r, price, cost, qty));
    const guard = r.minMargin ?? null;
    let blocked = false;
    let blockReason: string | undefined;
    let maxAllowedPct: number | undefined;
    let minPrice: number | undefined;
    if (guard != null) {
      const floor = round2(cost / (1 - guard / 100));
      if (to < floor) {
        blocked = true;
        minPrice = floor;
        maxAllowedPct = Number((((from - floor) / from) * 100).toFixed(1));
        blockReason = `Règle non applicable – marge minimale de ${guard} % non respectée.`;
        to = from;
      }
    }
    applied.push({ rule: r, from, to, blocked, blockReason, maxAllowedPct, minPrice });
    price = to;
    if (!r.cumulative) break;
  }

  const applicablePrice = round2(price);
  const marginPct = applicablePrice ? ((applicablePrice - cost) / applicablePrice) * 100 : 0;
  const catalogMarginPct = catalogPrice ? ((catalogPrice - cost) / catalogPrice) * 100 : 0;
  const winner = applied[0]?.rule;
  return {
    catalogPrice,
    cost,
    applicablePrice,
    applied,
    candidates,
    conflict: candidates.length > 1,
    reason: winner
      ? applied[0].blocked
        ? applied[0].blockReason!
        : `${winner.name} — priorité ${winner.priority}${candidates.length > 1 ? ` (prioritaire sur ${candidates.length - 1} autre(s) règle(s))` : ""}`
      : "Prix catalogue — aucune règle tarifaire applicable",
    marginPct,
    catalogMarginPct,
  };
}

/* ------------------------------------------------------------------ */
/* Simulation                                                          */
/* ------------------------------------------------------------------ */

export type SimulationLine = {
  ref: string; name: string; price: number; cost: number; newPrice: number;
  marginBefore: number; marginAfter: number; delta: number; below: boolean;
};

export type Simulation = {
  products: number;
  clients: number;
  lines: SimulationLine[];
  revenueBefore: number;
  revenueAfter: number;
  revenueImpact: number;
  marginBefore: number;
  marginAfter: number;
  marginPtsImpact: number;
  volumeToCompensate: number;
  belowThreshold: SimulationLine[];
  minMargin: number;
};

export function simulateRule(rule: PricingRule): Simulation {
  const prods = matchProducts(rule.scope);
  const clients = matchClients(rule.audience);
  const minMargin = rule.minMargin ?? MIN_MARGIN_DEFAULT;
  const qty = rule.conditions.minQty ?? 500;

  const lines: SimulationLine[] = prods.map((p) => {
    const newPrice = round2(applyRule(rule, p.salePrice, p.purchasePrice, qty));
    const mb = p.salePrice ? ((p.salePrice - p.purchasePrice) / p.salePrice) * 100 : 0;
    const ma = newPrice ? ((newPrice - p.purchasePrice) / newPrice) * 100 : 0;
    return {
      ref: p.ref, name: p.name, price: p.salePrice, cost: p.purchasePrice, newPrice,
      marginBefore: mb, marginAfter: ma, delta: p.salePrice ? ((newPrice - p.salePrice) / p.salePrice) * 100 : 0,
      below: ma < minMargin,
    };
  });

  // Volumes historiques simulés à partir des commandes existantes
  const orders = boStore.get().orders;
  const volumeOf = (ref: string) => {
    const v = orders.reduce((s, o) => s + (o.items.find((i) => i.ref === ref)?.quantity ?? 0), 0);
    return v || 800;
  };

  let revenueBefore = 0, revenueAfter = 0, costTotal = 0;
  lines.forEach((l) => {
    const v = volumeOf(l.ref) * Math.max(1, clients.length / 3);
    revenueBefore += l.price * v;
    revenueAfter += l.newPrice * v;
    costTotal += l.cost * v;
  });

  const marginBefore = revenueBefore ? ((revenueBefore - costTotal) / revenueBefore) * 100 : 0;
  const marginAfter = revenueAfter ? ((revenueAfter - costTotal) / revenueAfter) * 100 : 0;
  const marginEurBefore = revenueBefore - costTotal;
  const marginEurAfter = revenueAfter - costTotal;

  return {
    products: prods.length,
    clients: clients.length,
    lines,
    revenueBefore,
    revenueAfter,
    revenueImpact: revenueAfter - revenueBefore,
    marginBefore,
    marginAfter,
    marginPtsImpact: marginAfter - marginBefore,
    volumeToCompensate: marginEurAfter > 0 ? Math.max(0, (marginEurBefore / marginEurAfter - 1) * 100) : 0,
    belowThreshold: lines.filter((l) => l.below),
    minMargin,
  };
}

/** Remise maximale possible en respectant la marge minimale */
export function maxDiscountPct(rule: PricingRule): { pct: number; minPrice: number } {
  const prods = matchProducts(rule.scope);
  const minMargin = rule.minMargin ?? MIN_MARGIN_DEFAULT;
  let worst = 100;
  let minPrice = 0;
  prods.forEach((p) => {
    const floor = p.purchasePrice / (1 - minMargin / 100);
    const allowed = p.salePrice ? ((p.salePrice - floor) / p.salePrice) * 100 : 0;
    if (allowed < worst) { worst = allowed; minPrice = round2(floor); }
  });
  return { pct: Math.max(0, Number(worst.toFixed(1))), minPrice };
}

/* ------------------------------------------------------------------ */
/* State + seeds                                                       */
/* ------------------------------------------------------------------ */

const emptyScope = (): RuleScope => ({ allProducts: false, categories: [], subCategories: [], brands: [], suppliers: [], refs: [] });
const emptyAudience = (): RuleAudience => ({ allClients: false, clientIds: [], segments: [], countries: [], excludeClientIds: [] });
const emptyConditions = (): RuleConditions => ({ minQty: null, maxQty: null, minOrderAmount: null, destinations: [], incoterm: null, currency: "EUR", transport: null });

export const emptyRule = (): PricingRule => ({
  id: `PR-${uid().toUpperCase()}`,
  name: "",
  description: "",
  tags: [],
  type: "remise_pct",
  value: 5,
  tiers: [
    { min: 1, max: 99, pct: 0 },
    { min: 100, max: 499, pct: 3 },
    { min: 500, max: 999, pct: 5 },
    { min: 1000, max: null, pct: 8 },
  ],
  scope: emptyScope(),
  audience: emptyAudience(),
  conditions: emptyConditions(),
  start: null,
  end: null,
  priority: 50,
  cumulative: false,
  minMargin: MIN_MARGIN_DEFAULT,
  status: "Brouillon",
  createdBy: CURRENT_USER.name,
  createdAt: nowIso(),
  updatedAt: nowIso(),
  audit: [{ at: nowIso(), user: CURRENT_USER.name, action: "Règle créée" }],
});

const mk = (o: Partial<PricingRule> & { name: string }): PricingRule => ({ ...emptyRule(), ...o, id: o.id ?? `PR-2026-${uid().slice(0, 4).toUpperCase()}` });

const seedRules: PricingRule[] = [
  mk({
    id: "PR-2026-001",
    name: "Offre Conserves Afrique de l'Ouest",
    description: "Remise commerciale temporaire pour renforcer les ventes de conserves auprès de clients stratégiques Afrique de l'Ouest.",
    tags: ["Promotion", "Conserves", "Afrique de l'Ouest"],
    type: "remise_pct", value: 7, priority: 50, cumulative: false, minMargin: 15,
    scope: { ...emptyScope(), categories: ["Conserves"] },
    audience: { ...emptyAudience(), clientIds: ["MAD-001", "SEN-002", "CIV-003", "GUI-005"], segments: ["Stratégique"] },
    start: "2026-08-15T00:00:00", end: "2026-09-30T23:59:59",
    status: "Programmée", campaignId: "CMP-2026-01",
    createdBy: "Sofia El Mansouri", createdAt: "2026-08-05T09:30:00",
    audit: [
      { at: "2026-08-05T09:30:00", user: "Sofia El Mansouri", action: "Règle créée" },
      { at: "2026-08-06T11:02:00", user: "Yassine Bennani", action: "Programmation validée", from: "Brouillon", to: "Programmée" },
    ],
  }),
  mk({
    id: "PR-2026-002",
    name: "Tarif VIP Côte d'Ivoire – Septembre",
    description: "Remise fidélité 5 % pour les clients VIP livrés en Côte d'Ivoire.",
    tags: ["VIP", "Fidélité"],
    type: "remise_pct", value: 5, priority: 80, cumulative: false, minMargin: 15,
    scope: { ...emptyScope(), allProducts: true },
    audience: { ...emptyAudience(), segments: ["VIP", "Premium"] },
    conditions: { ...emptyConditions(), destinations: ["Côte d'Ivoire", "Abidjan"] },
    start: "2026-08-01T00:00:00", end: "2026-09-30T23:59:59",
    status: "Active", activatedBy: "Yassine Bennani", activatedAt: "2026-08-01T08:00:00",
    createdBy: "Sofia El Mansouri", createdAt: "2026-07-28T14:20:00",
    perf: { orders: 17, clients: 6, revenue: 284600, volume: 41200, discounts: 19420, marginPct: 18.9, targetMarginPct: 20, avgBasket: 16741, quoteAcceptRate: 78, previousRevenue: 246300 },
    audit: [
      { at: "2026-07-28T14:20:00", user: "Sofia El Mansouri", action: "Règle créée" },
      { at: "2026-08-01T08:00:00", user: "Yassine Bennani", action: "Règle activée", from: "Programmée", to: "Active" },
    ],
  }),
  mk({
    id: "PR-2026-003",
    name: "Tarif spécifique Maison Atlas Distribution",
    description: "Accord commercial annuel : -8 % sur l'ensemble du catalogue pour Maison Atlas Distribution.",
    tags: ["Accord annuel", "Client clé"],
    type: "remise_pct", value: 8, priority: 100, cumulative: false, minMargin: 15,
    scope: { ...emptyScope(), allProducts: true },
    audience: { ...emptyAudience(), clientIds: ["MAD-001"] },
    start: "2026-01-01T00:00:00", end: null,
    status: "Active", activatedBy: "Direction", activatedAt: "2026-01-01T00:00:00",
    createdBy: "Direction commerciale", createdAt: "2025-12-18T10:00:00",
    perf: { orders: 24, clients: 1, revenue: 412800, volume: 68900, discounts: 35890, marginPct: 19.4, targetMarginPct: 20, avgBasket: 17200, quoteAcceptRate: 86, previousRevenue: 388000 },
    audit: [{ at: "2025-12-18T10:00:00", user: "Direction commerciale", action: "Règle créée" }],
  }),
  mk({
    id: "PR-2026-004",
    name: "Majoration Huiles petites quantités",
    description: "Majoration de 4 % sur les huiles pour les commandes destinées à la Côte d'Ivoire lorsque la quantité est inférieure à 200 unités.",
    tags: ["Majoration", "Huile"],
    type: "majoration_pct", value: 4, priority: 60, cumulative: true, minMargin: null,
    scope: { ...emptyScope(), categories: ["Huile & épicerie"] },
    audience: { ...emptyAudience(), allClients: true },
    conditions: { ...emptyConditions(), maxQty: 199, destinations: ["Côte d'Ivoire"] },
    start: "2026-07-01T00:00:00", end: null,
    status: "Active", activatedBy: "Sofia El Mansouri", activatedAt: "2026-07-01T09:00:00",
    createdBy: "Sofia El Mansouri", createdAt: "2026-06-25T15:40:00",
    perf: { orders: 9, clients: 4, revenue: 68400, volume: 9800, discounts: -2620, marginPct: 26.1, targetMarginPct: 20, avgBasket: 7600, quoteAcceptRate: 71, previousRevenue: 61100 },
    audit: [{ at: "2026-06-25T15:40:00", user: "Sofia El Mansouri", action: "Règle créée" }],
  }),
  mk({
    id: "PR-2026-005",
    name: "Prix spécial Huile d'olive 1L – VIP",
    description: "Prix fixe négocié de 5,90 € sur AKW-OLV-001 pour les clients VIP pendant septembre 2026.",
    tags: ["Prix fixe", "VIP"],
    type: "prix_fixe", value: 5.9, priority: 90, cumulative: false, minMargin: 15,
    scope: { ...emptyScope(), refs: ["AKW-OLV-001"] },
    audience: { ...emptyAudience(), segments: ["VIP"] },
    start: "2026-09-01T00:00:00", end: "2026-09-30T23:59:59",
    status: "Programmée",
    createdBy: "Sofia El Mansouri", createdAt: "2026-08-08T16:12:00",
    audit: [{ at: "2026-08-08T16:12:00", user: "Sofia El Mansouri", action: "Règle créée" }],
  }),
  mk({
    id: "PR-2026-006",
    name: "Remise par volume – Couscous & céréales",
    description: "Barème de remise progressive par volume sur les céréales.",
    tags: ["Volume", "Céréales"],
    type: "volume", value: 0, priority: 40, cumulative: true, minMargin: 15,
    scope: { ...emptyScope(), categories: ["Céréales"] },
    audience: { ...emptyAudience(), allClients: true },
    start: "2026-05-01T00:00:00", end: null,
    status: "Active", activatedBy: "Yassine Bennani", activatedAt: "2026-05-01T08:30:00",
    createdBy: "Yassine Bennani", createdAt: "2026-04-22T11:00:00",
    perf: { orders: 12, clients: 7, revenue: 96400, volume: 24500, discounts: 4820, marginPct: 21.6, targetMarginPct: 20, avgBasket: 8033, quoteAcceptRate: 74, previousRevenue: 88700 },
    audit: [{ at: "2026-04-22T11:00:00", user: "Yassine Bennani", action: "Règle créée" }],
  }),
  mk({
    id: "PR-2026-007",
    name: "Promotion Épices été 2026",
    description: "Remise de 6 % sur les épices — campagne estivale terminée.",
    tags: ["Promotion", "Épices"],
    type: "remise_pct", value: 6, priority: 45, cumulative: true, minMargin: 15,
    scope: { ...emptyScope(), categories: ["Épices"] },
    audience: { ...emptyAudience(), allClients: true },
    start: "2026-06-01T00:00:00", end: "2026-07-31T23:59:59",
    status: "Active",
    createdBy: "Sofia El Mansouri", createdAt: "2026-05-20T09:00:00",
    perf: { orders: 14, clients: 9, revenue: 74200, volume: 31000, discounts: 4740, marginPct: 20.4, targetMarginPct: 20, avgBasket: 5300, quoteAcceptRate: 69, previousRevenue: 70800 },
    audit: [{ at: "2026-05-20T09:00:00", user: "Sofia El Mansouri", action: "Règle créée" }],
  }),
  mk({
    id: "PR-2026-008",
    name: "Marge plancher Fruits secs",
    description: "Garantir une marge minimale de 20 % sur les fruits secs quelles que soient les négociations.",
    tags: ["Protection marge"],
    type: "marge_cible", value: 20, priority: 95, cumulative: true, minMargin: 20,
    scope: { ...emptyScope(), categories: ["Fruits secs"] },
    audience: { ...emptyAudience(), allClients: true },
    start: "2026-03-01T00:00:00", end: null,
    status: "Active", activatedBy: "Direction", activatedAt: "2026-03-01T00:00:00",
    createdBy: "Direction commerciale", createdAt: "2026-02-20T10:00:00",
    audit: [{ at: "2026-02-20T10:00:00", user: "Direction commerciale", action: "Règle créée" }],
  }),
  mk({
    id: "PR-2026-009",
    name: "Remise exceptionnelle Dakar (suspendue)",
    description: "Remise de 10 % suspendue suite à dégradation de la marge.",
    tags: ["Exception"],
    type: "remise_pct", value: 10, priority: 70, cumulative: false, minMargin: 15,
    scope: { ...emptyScope(), categories: ["Conserves", "Céréales"] },
    audience: { ...emptyAudience(), countries: ["Sénégal"] },
    start: "2026-07-01T00:00:00", end: "2026-12-31T23:59:59",
    status: "Suspendue",
    createdBy: "Sofia El Mansouri", createdAt: "2026-06-28T13:10:00",
    audit: [
      { at: "2026-06-28T13:10:00", user: "Sofia El Mansouri", action: "Règle créée" },
      { at: "2026-07-22T09:45:00", user: "Yassine Bennani", action: "Règle suspendue", from: "Active", to: "Suspendue" },
    ],
  }),
  mk({
    id: "PR-2026-010",
    name: "Brouillon – Remise Thé grands comptes",
    description: "Projet de remise 4 % sur le thé pour les grands comptes.",
    tags: ["Brouillon"],
    type: "remise_pct", value: 4, priority: 35, cumulative: true, minMargin: 15,
    scope: { ...emptyScope(), categories: ["Boissons"] },
    audience: { ...emptyAudience(), segments: ["Grand compte"] },
    status: "Brouillon",
    createdBy: "Sofia El Mansouri", createdAt: "2026-08-09T18:05:00",
    audit: [{ at: "2026-08-09T18:05:00", user: "Sofia El Mansouri", action: "Règle créée" }],
  }),
];

const seedCampaigns: Campaign[] = [
  {
    id: "CMP-2026-01",
    name: "Campagne Conserves Afrique de l'Ouest",
    description: "Renforcer la part de marché sur les conserves auprès des distributeurs stratégiques.",
    start: "2026-08-15T00:00:00", end: "2026-09-30T23:59:59",
    objectiveMarginPct: 20,
    ruleIds: ["PR-2026-001", "PR-2026-006"],
  },
  {
    id: "CMP-2027-RAM",
    name: "Campagne Ramadan Afrique de l'Ouest 2027",
    description: "Programme commercial Ramadan : conserves, huiles et couscous.",
    start: "2027-02-01T00:00:00", end: "2027-03-15T23:59:59",
    objectiveMarginPct: 19,
    ruleIds: ["PR-2026-005"],
  },
];

const seedBatches: PriceBatch[] = [
  {
    id: "PRICE-BATCH-2026-008",
    at: "2026-08-10T09:20:00",
    by: "Sofia El Mansouri",
    reason: "Hausse fournisseurs",
    scopeLabel: "Catégorie Huile & épicerie",
    restored: false,
    entries: [
      { ref: "AKW-OLV-001", name: "Huile d'olive extra vierge 1L", from: 6.15, to: 6.4 },
      { ref: "AKW-OLV-002", name: "Huile d'olive vierge 5L", from: 26.45, to: 27.5 },
    ],
  },
];

type State = {
  rules: PricingRule[];
  campaigns: Campaign[];
  batches: PriceBatch[];
  role: Role;
  config: {
    minMargin: number;
    targetMargin: number;
    autoApply: boolean;
    requireManagerApproval: boolean;
    conflictPolicy: "priorite" | "meilleur_client" | "meilleure_marge";
    roundingRule: "0.01" | "0.05" | "0.10";
  };
};

let state: State = {
  rules: seedRules,
  campaigns: seedCampaigns,
  batches: seedBatches,
  role: "Manager commercial",
  config: {
    minMargin: 15,
    targetMargin: 20,
    autoApply: true,
    requireManagerApproval: true,
    conflictPolicy: "priorite",
    roundingRule: "0.01",
  },
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; emit(); };

export const can = (p: Permission, role: Role = state.role) => ROLE_PERMISSIONS[role].includes(p);

const touch = (r: PricingRule, action: string, from?: string, to?: string): PricingRule => ({
  ...r,
  updatedAt: nowIso(),
  audit: [{ at: nowIso(), user: CURRENT_USER.name, action, from, to }, ...r.audit],
});

export const pricingStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
  get: () => state,

  getRule: (id: string) => state.rules.find((r) => r.id === id),

  saveRule(rule: PricingRule) {
    const exists = state.rules.some((r) => r.id === rule.id);
    set({
      rules: exists
        ? state.rules.map((r) => (r.id === rule.id ? touch({ ...rule }, "Règle modifiée") : r))
        : [touch(rule, "Règle créée"), ...state.rules],
    });
  },

  setStatus(id: string, status: RuleStatus, action: string) {
    set({
      rules: state.rules.map((r) =>
        r.id === id
          ? touch(
              { ...r, status, activatedBy: status === "Active" ? CURRENT_USER.name : r.activatedBy, activatedAt: status === "Active" ? nowIso() : r.activatedAt },
              action, effectiveStatus(r), status,
            )
          : r,
      ),
    });
  },

  duplicate(id: string) {
    const r = state.rules.find((x) => x.id === id);
    if (!r) return;
    const copy: PricingRule = {
      ...r,
      id: `PR-${uid().toUpperCase()}`,
      name: `${r.name} (copie)`,
      status: "Brouillon",
      createdBy: CURRENT_USER.name,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      perf: undefined,
      audit: [{ at: nowIso(), user: CURRENT_USER.name, action: `Dupliquée depuis ${r.id}` }],
    };
    set({ rules: [copy, ...state.rules] });
    return copy;
  },

  setRole(role: Role) { set({ role }); },
  setConfig(patch: Partial<State["config"]>) { set({ config: { ...state.config, ...patch } }); },

  /* --- modification massive permanente --- */
  bulkUpdate(refs: string[], mode: "pct" | "fixed" | "set", value: number, reason: string, scopeText: string) {
    const products = boStore.get().products.filter((p) => refs.includes(p.ref));
    const entries = products.map((p) => {
      const to =
        mode === "pct" ? round2(p.salePrice * (1 + value / 100)) : mode === "fixed" ? round2(p.salePrice + value) : round2(value);
      return { ref: p.ref, name: p.name, from: p.salePrice, to };
    });
    entries.forEach((e) => boStore.updateProduct(e.ref, { salePrice: e.to }, `Modification massive — ${reason}`));
    const batch: PriceBatch = {
      id: `PRICE-BATCH-2026-${String(state.batches.length + 9).padStart(3, "0")}`,
      at: nowIso(), by: CURRENT_USER.name, reason, scopeLabel: scopeText, entries, restored: false,
    };
    set({ batches: [batch, ...state.batches] });
    return batch;
  },

  rollback(batchId: string) {
    const batch = state.batches.find((b) => b.id === batchId);
    if (!batch || batch.restored) return;
    batch.entries.forEach((e) => boStore.updateProduct(e.ref, { salePrice: e.from }, `Rollback ${batch.id}`));
    set({ batches: state.batches.map((b) => (b.id === batchId ? { ...b, restored: true } : b)) });
  },
};

export function usePricing() {
  return useSyncExternalStore(
    (cb) => pricingStore.subscribe(cb),
    () => state,
    () => state,
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard aggregates                                                */
/* ------------------------------------------------------------------ */

export function rulesDashboard() {
  const rules = state.rules;
  const byStatus = (s: RuleStatus) => rules.filter((r) => effectiveStatus(r) === s);
  const active = byStatus("Active");
  const impactedProducts = new Set<string>();
  const impactedClients = new Set<string>();
  let revenueImpact = 0;
  let marginPts = 0;
  active.forEach((r) => {
    matchProducts(r.scope).forEach((p) => impactedProducts.add(p.ref));
    matchClients(r.audience).forEach((c) => impactedClients.add(c.id));
    const sim = simulateRule(r);
    revenueImpact += sim.revenueImpact;
    marginPts += sim.marginPtsImpact;
  });
  return {
    active: active.length,
    scheduled: byStatus("Programmée").length,
    expired: byStatus("Expirée").length,
    suspended: byStatus("Suspendue").length,
    drafts: byStatus("Brouillon").length,
    products: impactedProducts.size,
    clients: impactedClients.size,
    orders: boStore.get().orders.length,
    revenueImpact,
    marginPts: active.length ? marginPts / active.length : 0,
  };
}
