import { useMemo } from "react";
import { useExportOrder, type ExportOrder, type ExportStatus } from "./export-order-store";
import { ordersStore, type SubmittedOrder } from "./orders-store";
import { orders as seedOrders, clients, products, type Order } from "./mock-data";

const CITY: Record<string, string> = {
  "Sénégal": "Dakar",
  "Côte d'Ivoire": "Abidjan",
  Mauritanie: "Nouakchott",
  Mali: "Bamako",
  "Guinée": "Conakry",
};

const PORT: Record<string, string> = {
  "Sénégal": "Port Autonome de Dakar",
  "Côte d'Ivoire": "Port Autonome d'Abidjan",
  Mauritanie: "Port de Nouakchott",
  Mali: "Terminal de Bamako (via Dakar)",
  "Guinée": "Port de Conakry",
};

type StageInfo = { status: ExportStatus; progress: number; step: string };

const STAGE_MAP: Record<string, StageInfo> = {
  BC_Provisoire: { status: "Brouillon", progress: 8, step: "BC provisoire — en attente de pricing" },
  En_Pricing: { status: "En attente de confirmation", progress: 15, step: "Pricing en cours" },
  Devis_Envoye: { status: "En attente de confirmation", progress: 22, step: "Devis envoyé — en attente de réponse" },
  Accepte: { status: "Confirmée", progress: 35, step: "Commande confirmée" },
  Refuse: { status: "Annulée", progress: 0, step: "Devis refusé" },
  Draft: { status: "Brouillon", progress: 8, step: "Brouillon" },
  Pending: { status: "En attente de confirmation", progress: 20, step: "En attente de confirmation" },
  Validated: { status: "Confirmée", progress: 38, step: "Approvisionnement" },
  Shipped: { status: "Expédiée", progress: 78, step: "En transit maritime" },
  Delivered: { status: "Livrée", progress: 100, step: "Livrée au client" },
};

function findRaw(reference: string): (Order | SubmittedOrder) | undefined {
  return [...ordersStore.getAll(), ...seedOrders].find((o) => o.reference === reference);
}

export function buildOrderView(base: ExportOrder, reference: string): ExportOrder {
  if (reference === base.reference) return base;
  const raw = findRaw(reference);
  if (!raw) return { ...base, reference };

  const stageKey = "stage" in raw ? (raw as SubmittedOrder).stage : raw.status;
  const info = STAGE_MAP[stageKey] ?? STAGE_MAP.Pending;
  const client = clients.find((c) => c.id === raw.clientId);
  const country = raw.destination;

  const goods = raw.lines.reduce((s, l) => {
    const p = products.find((x) => x.id === l.productId);
    return s + (l.unitPrice || p?.unitPrice || 0) * l.quantity;
  }, 0);
  const logistics = Math.round(goods * 0.05);
  const insurance = Math.round(goods * 0.015);
  const freight = Math.round(goods * 0.09);
  const total = goods + logistics + insurance + freight;
  const paid = info.progress >= 100 ? total : info.progress >= 35 ? Math.round(total * 0.6) : 0;

  const weightKg = raw.lines.reduce((s, l) => {
    const p = products.find((x) => x.id === l.productId);
    return s + (p?.unitWeightKg ?? 0) * l.quantity;
  }, 0);
  const volumeM3 = raw.lines.reduce((s, l) => {
    const p = products.find((x) => x.id === l.productId);
    return s + (p?.unitVolumeM3 ?? 0) * l.quantity;
  }, 0);

  const lines: ExportOrder["lines"] = raw.lines.map((l, i) => {
    const p = products.find((x) => x.id === l.productId);
    return {
      ref: p?.sku ?? l.productId,
      name: p?.name ?? l.productId,
      category: p?.category ?? "Divers",
      qty: l.quantity,
      unit: "Unités",
      unitPrice: l.unitPrice || p?.unitPrice || 0,
      weightKg: Math.round((p?.unitWeightKg ?? 0) * l.quantity),
      volumeM3: Number(((p?.unitVolumeM3 ?? 0) * l.quantity).toFixed(2)),
      prep: info.progress >= 45 ? "Prêt" : info.progress >= 20 ? "En préparation" : "Attente fournisseur",
      container: (i % 2 === 0 ? 1 : 2) as 1 | 2,
      pallets: Math.max(1, Math.round(l.quantity / 300)),
    };
  });

  const fill = raw.containerFillPct;
  const containers = base.containers.map((c, i) => ({
    ...c,
    reference: `AKW-CNT-${reference.slice(-4)}-${i + 1}`,
    fillPct: Math.max(5, Math.min(100, i === 0 ? fill : Math.round(fill * 0.9))),
    weightKg: Math.round(weightKg / base.containers.length),
    volumeM3: Number((volumeM3 / base.containers.length).toFixed(1)),
    status: info.progress >= 60 ? "Chargé" : "Planifié",
  }));

  const cut = Math.round((info.progress / 100) * base.timeline.length);
  const timeline = base.timeline.map((e, i) => ({
    ...e,
    state: (i < cut ? "done" : i === cut ? "current" : "planned") as typeof e.state,
  }));

  const documents = base.documents.map((d) =>
    info.progress >= 100 ? { ...d, status: "Disponible" as const } : d,
  );

  const payments: ExportOrder["payments"] = [
    { id: "pay1", date: raw.createdAt, label: "Facture proforma émise", amount: total, state: "done" },
    ...(paid > 0
      ? [{ id: "pay2", date: raw.createdAt, label: "Acompte reçu", amount: paid, state: "done" as const }]
      : []),
    ...(total - paid > 0
      ? [
          {
            id: "pay3",
            date: "—",
            label: "Solde attendu",
            amount: total - paid,
            state: "pending" as const,
            meta: "Avant embarquement",
          },
        ]
      : []),
  ];

  return {
    ...base,
    reference,
    clientRef: `PO-${reference.slice(-6)}`,
    client: client?.name ?? base.client,
    city: CITY[country] ?? base.city,
    country,
    createdAt: raw.createdAt,
    status: info.status,
    progressPct: info.progress,
    currentStep: info.step,
    portArrival: PORT[country] ?? base.portArrival,
    totals: { goods, logistics, insurance, freight, other: 0, total, paid },
    weightKg: Math.round(weightKg),
    volumeM3: Number(volumeM3.toFixed(1)),
    lines,
    containers,
    timeline,
    documents,
    payments,
    health: {
      ...base.health,
      score: Math.max(55, Math.min(98, 60 + Math.round(info.progress / 3))),
      summary:
        info.status === "Annulée"
          ? "Cette commande a été refusée. Contactez votre commercial pour relancer un devis."
          : `Statut actuel : ${info.step}. Suivi mis à jour automatiquement par AKWA AI.`,
    },
  };
}

export function useExportOrderView(reference: string): ExportOrder {
  const base = useExportOrder();
  return useMemo(() => buildOrderView(base, reference), [base, reference]);
}
