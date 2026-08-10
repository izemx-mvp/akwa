import { useSyncExternalStore } from "react";
import { boStore, CURRENT_USER, orderCostTotal, goodsTotal, type AdminOrder } from "./backoffice-store";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type AgentKey = "devis" | "pricing" | "marge" | "export" | "container";

export const AGENT_META: Record<AgentKey, { name: string; route: string; subtitle: string; emoji: string }> = {
  devis: {
    name: "Agent Devis",
    route: "/admin/agents/devis",
    subtitle: "Créer et préparer les devis à partir des commandes validées.",
    emoji: "🧾",
  },
  pricing: {
    name: "Agent Pricing",
    route: "/admin/agents/pricing",
    subtitle: "Analyser et recommander les meilleurs prix de vente.",
    emoji: "🏷️",
  },
  marge: {
    name: "Agent Marge",
    route: "/admin/agents/marge",
    subtitle: "Piloter la rentabilité des produits, devis, commandes et clients.",
    emoji: "📈",
  },
  export: {
    name: "Agent Export",
    route: "/admin/agents/export",
    subtitle: "Assister les équipes dans la préparation et le suivi des opérations export.",
    emoji: "🚢",
  },
  container: {
    name: "Agent Optimisation Conteneur",
    route: "/admin/agents/container-optimizer",
    subtitle: "Optimiser la répartition des marchandises et le remplissage des conteneurs.",
    emoji: "📦",
  },
};

export type AgentLog = {
  id: string;
  at: string;
  agent: AgentKey;
  orderRef: string;
  client: string;
  analysis: string;
  recommendation: string;
  userAction: string;
  result: string;
};

export type PriceScenario = {
  key: "competitif" | "recommande" | "premium";
  label: string;
  price: number;
  marginPct: number;
  goal: string;
};

export type PricingAlert = {
  ref: string;
  name: string;
  oldCost: number;
  newCost: number;
  salePrice: number;
  recommended: number;
};

export type ContainerPlan = {
  id: string;
  label: string;
  boxes: { id: string; type: string; usedM3: number; capacityM3: number; weightKg: number; pallets: number; items: string[] }[];
  fill: number;
  cost: number;
  note: string;
  risk?: string;
};

export type ExportTask = { id: string; label: string; done: boolean };

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

const uid = () => Math.random().toString(36).slice(2, 9);
const nowIso = () => new Date().toISOString();

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

type State = {
  orderRef: string;
  appliedPrices: Record<string, number>;
  validatedPlan: string | null;
  exportTasks: ExportTask[];
  freightSaving: number;
  logs: AgentLog[];
};

const defaultTasks: ExportTask[] = [
  { id: "t1", label: "Facture commerciale", done: true },
  { id: "t2", label: "Packing List", done: true },
  { id: "t3", label: "Réservation transport", done: true },
  { id: "t4", label: "Assurance", done: true },
  { id: "t5", label: "Certificat d'origine", done: false },
  { id: "t6", label: "Certificat sanitaire", done: false },
  { id: "t7", label: "Bill of Lading", done: false },
  { id: "t8", label: "Étiquetage conforme", done: true },
  { id: "t9", label: "Destination vérifiée", done: true },
];

let state: State = {
  orderRef: "AKW-EXP-2026-0187",
  appliedPrices: {},
  validatedPlan: null,
  exportTasks: defaultTasks,
  freightSaving: 0,
  logs: [
    {
      id: uid(), at: "2026-08-10T10:42:00", agent: "pricing", orderRef: "AKW-EXP-2026-0187", client: "Maison Atlas Distribution",
      analysis: "Hausse coût fournisseur +5,7 % sur AKW-OLV-001",
      recommendation: "Prix de vente recommandé : 6,40 €",
      userAction: "Appliqué par Sofia", result: "Marge produit portée à 27,3 %",
    },
    {
      id: uid(), at: "2026-08-10T10:48:00", agent: "marge", orderRef: "AKW-EXP-2026-0187", client: "Maison Atlas Distribution",
      analysis: "Recalcul de la rentabilité commande après application prix",
      recommendation: "Marge nette 21,1 % — au-dessus du seuil de 15 %",
      userAction: "Validé par Sofia", result: "Statut : bonne rentabilité",
    },
    {
      id: uid(), at: "2026-08-10T11:03:00", agent: "container", orderRef: "AKW-EXP-2026-0187", client: "Maison Atlas Distribution",
      analysis: "61,4 m³ / 23 840 kg à répartir",
      recommendation: "2 × 40' High Cube — remplissage moyen 90 %",
      userAction: "Plan validé", result: "Économie fret estimée 350 €",
    },
  ],
};

const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  emit();
};

/* ------------------------------------------------------------------ */
/* Derived business data                                               */
/* ------------------------------------------------------------------ */

export function currentOrder(): AdminOrder | undefined {
  const { orders } = boStore.get();
  return orders.find((o) => o.reference === state.orderRef) ?? orders[0];
}

export function orderContext() {
  const order = currentOrder();
  const { clients } = boStore.get();
  const client = clients.find((c) => c.id === order?.clientId);
  const revenue = order ? goodsTotal(order.items) : 0;
  const costs = order ? orderCostTotal(order.costs) : 0;
  const margin = revenue - costs;
  const marginPct = revenue ? (margin / revenue) * 100 : 0;
  return {
    order,
    clientName: client?.name ?? "—",
    revenue,
    costs,
    margin,
    marginPct,
    destination: order?.destination ?? "—",
    status: order?.status ?? "—",
    containers: "2 × 40 HC",
  };
}

export const priceScenarios = (recommended: number, cost: number): PriceScenario[] => {
  const mk = (key: PriceScenario["key"], label: string, price: number, goal: string): PriceScenario => ({
    key, label, price, marginPct: price ? ((price - cost) / price) * 100 : 0, goal,
  });
  return [
    mk("competitif", "Prix compétitif", Number((recommended * 0.922).toFixed(2)), "Favoriser l'acceptation du devis"),
    mk("recommande", "Prix recommandé", recommended, "Équilibre prix / rentabilité"),
    mk("premium", "Prix premium", Number((recommended * 1.047).toFixed(2)), "Maximiser la marge"),
  ];
};

export function pricingAlerts(): PricingAlert[] {
  const { products } = boStore.get();
  return products
    .filter((p) => p.purchasePrice > p.previousPurchasePrice)
    .slice(0, 8)
    .map((p) => ({
      ref: p.ref,
      name: p.name,
      oldCost: p.previousPurchasePrice,
      newCost: p.purchasePrice,
      salePrice: state.appliedPrices[p.ref] ?? p.salePrice,
      recommended: Number(Math.max(p.recommendedPrice, p.purchasePrice / 0.727).toFixed(2)),
    }));
}

export function containerPlans(): ContainerPlan[] {
  return [
    {
      id: "plan-a",
      label: "Solution recommandée — 2 × 40' High Cube",
      fill: 90,
      cost: 7800,
      note: "Meilleur équilibre coût / efficacité volumétrique.",
      boxes: [
        { id: "AKW-CNT-2026-041", type: "40 HC", usedM3: 35.1, capacityM3: 38.1, weightKg: 12180, pallets: 18, items: ["Huile d'olive", "Sardines", "Couscous", "Concentré de tomate"] },
        { id: "AKW-CNT-2026-042", type: "40 HC", usedM3: 26.3, capacityM3: 38.1, weightKg: 11660, pallets: 15, items: ["Dattes Medjool", "Épices", "Thé vert", "Confitures"] },
      ],
    },
    {
      id: "plan-b",
      label: "Alternative — 1 × 40 HC + 1 × 20'",
      fill: 84,
      cost: 8150,
      note: "Coût supérieur de 350 € pour une efficacité volumétrique moindre.",
      boxes: [
        { id: "ALT-40HC", type: "40 HC", usedM3: 36.4, capacityM3: 38.1, weightKg: 13400, pallets: 19, items: ["Huile d'olive", "Conserves", "Couscous"] },
        { id: "ALT-20DV", type: "20'", usedM3: 22.1, capacityM3: 28.3, weightKg: 10440, pallets: 12, items: ["Dattes", "Épices", "Thé"] },
      ],
    },
    {
      id: "plan-c",
      label: "Alternative 2 — 2 × 40' Standard",
      fill: 94,
      cost: 7650,
      risk: "Contraintes volume / hauteur sur palettes gerbées",
      note: "Remplissage maximal mais marges de manœuvre réduites au chargement.",
      boxes: [
        { id: "STD-1", type: "40 STD", usedM3: 31.9, capacityM3: 33.2, weightKg: 12180, pallets: 18, items: ["Huile d'olive", "Sardines", "Couscous"] },
        { id: "STD-2", type: "40 STD", usedM3: 30.5, capacityM3: 33.2, weightKg: 11660, pallets: 17, items: ["Dattes", "Épices", "Thé", "Confitures"] },
      ],
    },
  ];
}

export const exportRisks = [
  { area: "Documentation", level: "Modéré", detail: "Certificat sanitaire non disponible pour 3 références alimentaires." },
  { area: "Planning", level: "Faible", detail: "Consolidation prévue 2 jours avant chargement." },
  { area: "Transport", level: "Faible", detail: "Booking maritime confirmé pour le 18 août." },
  { area: "Paiement", level: "Élevé", detail: "Solde client non reçu à J-8 du départ." },
];

export const exportTimeline = [
  "Commande validée", "Devis accepté", "Approvisionnement", "Préparation", "Consolidation", "Chargement",
  "Documents finaux", "Départ", "Transit", "Arrivée", "Dédouanement", "Livraison",
];

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export const agentHub = {
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
  get: () => state,

  selectOrder(ref: string) { set({ orderRef: ref }); },

  log(entry: Omit<AgentLog, "id" | "at" | "client" | "orderRef"> & { orderRef?: string; client?: string }) {
    const ctx = orderContext();
    const item: AgentLog = {
      id: uid(),
      at: nowIso(),
      orderRef: entry.orderRef ?? ctx.order?.reference ?? "—",
      client: entry.client ?? ctx.clientName,
      agent: entry.agent,
      analysis: entry.analysis,
      recommendation: entry.recommendation,
      userAction: entry.userAction,
      result: entry.result,
    };
    set({ logs: [item, ...state.logs] });
    return item;
  },

  applyPrice(ref: string, price: number, name: string) {
    set({ appliedPrices: { ...state.appliedPrices, [ref]: price } });
    boStore.updateProduct(ref, { salePrice: price, priceToCheck: false }, "Prix appliqué depuis l'Agent Pricing");
    agentHub.log({
      agent: "pricing",
      analysis: `Analyse tarifaire de ${name} (${ref})`,
      recommendation: `Prix de vente ${price.toFixed(2).replace(".", ",")} €`,
      userAction: `Appliqué par ${CURRENT_USER.name}`,
      result: "Prix catalogue mis à jour, impact marge recalculé",
    });
  },

  ignorePrice(ref: string, name: string) {
    agentHub.log({
      agent: "pricing",
      analysis: `Analyse tarifaire de ${name} (${ref})`,
      recommendation: "Révision de prix proposée",
      userAction: `Recommandation ignorée par ${CURRENT_USER.name}`,
      result: "Prix actuel conservé",
    });
  },

  validatePlan(planId: string, label: string, saving: number) {
    set({ validatedPlan: planId, freightSaving: saving });
    agentHub.log({
      agent: "container",
      analysis: "Optimisation du chargement de la commande",
      recommendation: label,
      userAction: `Plan validé par ${CURRENT_USER.name}`,
      result: `Plan rattaché à la commande — ${saving} € de fret économisés`,
    });
  },

  toggleExportTask(id: string) {
    set({ exportTasks: state.exportTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  },

  logHandoff(from: AgentKey, to: AgentKey, reason: string) {
    agentHub.log({
      agent: from,
      analysis: reason,
      recommendation: `Transmis à ${AGENT_META[to].name}`,
      userAction: `Ouvert par ${CURRENT_USER.name}`,
      result: "Contexte de commande partagé entre agents",
    });
  },
};

export function useAgentHub() {
  return useSyncExternalStore(
    (cb) => agentHub.subscribe(cb),
    () => state,
    () => state,
  );
}
