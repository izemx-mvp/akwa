import { useSyncExternalStore } from "react";
import {
  boStore, type Client, type Product, type AdminOrder, type AdminQuote,
  orderCostTotal, quoteTotalTTC, quoteCost,
} from "./backoffice-store";
import { billingStore, invoiceTotal, paidOf, type Invoice, type Payment } from "./billing-store";
import { pricingStore, type PricingRule, effectiveStatus } from "./pricing-rules";

/* ==================================================================
   Analyse & KPI — moteur de calcul
   Aucun dataset indépendant : tout est dérivé des objets existants
   (clients, produits, commandes, devis, factures, paiements, règles).
   ================================================================== */

export const TODAY = new Date("2026-08-10T12:00:00");

/* ------------------------------- utils ------------------------------- */

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
};
const pick = <T,>(arr: T[], seed: number): T => arr[seed % arr.length];
const round = (n: number) => Math.round(n);

export const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
export const eurCompact = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(".", ",")} M€`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)} k€`;
  return eur(n);
};
export const pct1 = (n: number) => `${n.toFixed(1).replace(".", ",")} %`;
export const num = (n: number) => new Intl.NumberFormat("fr-FR").format(round(n));
export const litres = (n: number) => `${num(n)} L`;
export const dmy = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const MONTH_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
export const monthLabel = (d: Date) => `${MONTH_FR[d.getMonth()]} ${d.getFullYear()}`;

/* ------------------------------- types ------------------------------- */

export type SaleLine = {
  productRef: string;
  product: string;
  category: string;
  supplierId: string;
  litres: number;
  revenue: number;
  cost: number;
};

export type SaleQuote = {
  id: string;
  status: "Accepté" | "Refusé" | "Expiré" | "En attente";
  sentAt: string;
  respondedAt: string | null;
  responseDays: number;
  amount: number;
  refusalReason?: string;
};

export type Sale = {
  ref: string;
  date: string;
  clientId: string;
  client: string;
  country: string;
  city: string;
  zone: string;
  commercial: string;
  exportManager: string;
  incoterm: string;
  transport: string;
  port: string;
  status: string;
  revenue: number;
  cost: number;
  margin: number;
  marginPct: number;
  forecastMarginPct: number;
  litres: number;
  weight: number;
  lines: SaleLine[];
  costs: { goods: number; freight: number; localTransport: number; insurance: number; preparation: number; documentation: number; other: number };
  container: { type: "20'" | "40'" | "40' HC"; count: number; fillPct: number; cost: number };
  onTime: boolean;
  delayDays: number;
  quote: SaleQuote;
  real: boolean;
};

export const ZONES: Record<string, string> = {
  "Côte d'Ivoire": "Afrique de l'Ouest", Sénégal: "Afrique de l'Ouest", Ghana: "Afrique de l'Ouest",
  Guinée: "Afrique de l'Ouest", Mali: "Afrique de l'Ouest", Bénin: "Afrique de l'Ouest",
  Mauritanie: "Afrique du Nord-Ouest", Cameroun: "Afrique centrale",
};

const REFUSAL_REASONS = ["Prix", "Conditions de paiement", "Délai", "Transport", "Disponibilité produit", "Autre"];
const PORTS: Record<string, string> = {
  "Côte d'Ivoire": "Abidjan", Sénégal: "Dakar", Cameroun: "Douala", Ghana: "Tema",
  Guinée: "Conakry", Mali: "Bamako (via Dakar)", Mauritanie: "Nouakchott", Bénin: "Cotonou",
};
const STATUSES = ["Livrée", "En transit", "En préparation", "Devis accepté", "Devis envoyé – En attente client", "Commande reçue"];

/* --------------------- structure de coûts réelle --------------------- */

function costRatios(orders: AdminOrder[]) {
  const acc = { goods: 0, preparation: 0, localTransport: 0, freight: 0, insurance: 0, documents: 0, other: 0 };
  orders.forEach((o) => {
    acc.goods += o.costs.goods; acc.preparation += o.costs.preparation; acc.localTransport += o.costs.localTransport;
    acc.freight += o.costs.freight; acc.insurance += o.costs.insurance; acc.documents += o.costs.documents; acc.other += o.costs.other;
  });
  const total = Object.values(acc).reduce((s, v) => s + v, 0) || 1;
  return {
    goods: acc.goods / total, freight: acc.freight / total, localTransport: acc.localTransport / total,
    insurance: acc.insurance / total, preparation: acc.preparation / total,
    documentation: acc.documents / total, other: acc.other / total,
  };
}

/* ---------------------- litres par référence produit ---------------------- */

const litresPerUnit = (p: Product) => {
  const m = /(\d+[.,]?\d*)\s*(ml|l)\b/i.exec(p.packaging) ?? /(\d+[.,]?\d*)\s*(ml|l)\b/i.exec(p.name);
  if (!m) return 1;
  const v = parseFloat(m[1].replace(",", "."));
  return m[2].toLowerCase() === "ml" ? v / 1000 : v;
};

/* --------------------------- construction du grand livre --------------------------- */

function buildLedger(): Sale[] {
  const { clients, products, orders, adminQuotes } = boStore.get();
  const ratios = costRatios(orders);
  const sales: Sale[] = [];

  const byCat = (cat: string) => products.filter((p) => p.category === cat && p.status === "Actif");

  clients.forEach((c, ci) => {
    const seed = hash(c.id);
    const marginRate = c.revenueTotal ? c.margin / c.revenueTotal : 0.19;
    const weights2026 = c.monthly.map((m) => m.ca);
    const sum2026 = weights2026.reduce((s, v) => s + v, 0) || 1;
    const prevTotal = Math.max(0, c.revenueTotal - c.revenueYear);

    // répartition du nombre de commandes : total = client.ordersCount
    const totalOrders = Math.max(1, c.ordersCount);
    const share2026 = c.revenueTotal ? c.revenueYear / c.revenueTotal : 0.5;
    const orders2026 = Math.max(1, Math.round(totalOrders * share2026));
    const orders2025 = Math.max(0, totalOrders - orders2026);

    const emit = (year: number, monthIdx: number, revenue: number, count: number, startNo: number) => {
      if (revenue <= 0 || count <= 0) return;
      for (let k = 0; k < count; k++) {
        const s = seed + monthIdx * 31 + k * 7 + year;
        const day = 2 + (s % 26);
        const date = new Date(Date.UTC(year, monthIdx, day, 10, 0, 0)).toISOString();
        const rev = round(revenue / count);
        if (rev <= 0) continue;
        const ref = `AKW-EXP-${year}-${String(1000 + startNo + k + ci * 13 + monthIdx).slice(-4)}`;

        // lignes par catégorie du client
        const cats = c.byCategory.length ? c.byCategory : [{ name: "Huiles moteur", value: 1 }];
        const catSum = cats.reduce((t, x) => t + x.value, 0) || 1;
        const lines: SaleLine[] = [];
        cats.forEach((cat, j) => {
          const catRev = round((rev * cat.value) / catSum);
          if (catRev <= 0) return;
          const pool = byCat(cat.name);
          const n = Math.min(2, pool.length || 1);
          for (let q = 0; q < n; q++) {
            const p = pool.length ? pick(pool, s + j * 5 + q * 3) : undefined;
            const lr = round(catRev / n);
            if (lr <= 0) continue;
            const unitSale = p?.salePrice ?? 6;
            const unitBuy = p?.purchasePrice ?? unitSale * 0.8;
            const units = unitSale ? lr / unitSale : 0;
            lines.push({
              productRef: p?.ref ?? `AKW-${cat.name.slice(0, 3).toUpperCase()}`,
              product: p?.name ?? cat.name,
              category: cat.name,
              supplierId: p?.suppliers?.find((x) => x.primary)?.supplierId ?? p?.suppliers?.[0]?.supplierId ?? "SUP-001",
              litres: round(units * (p ? litresPerUnit(p) : 1)),
              revenue: lr,
              cost: round(units * unitBuy),
            });
          }
        });
        const revenueLines = lines.reduce((t, l) => t + l.revenue, 0) || rev;
        const scale = rev / revenueLines;
        lines.forEach((l) => { l.revenue = round(l.revenue * scale); l.cost = round(l.cost * scale); l.litres = round(l.litres * scale); });

        const jitter = ((s % 9) - 4) / 100; // ±4 points autour du taux client
        const mPct = Math.max(4, marginRate * 100 + jitter * 100 * 0.35);
        const cost = round(rev * (1 - mPct / 100));
        const totalLitres = lines.reduce((t, l) => t + l.litres, 0);
        const container: Sale["container"] =
          rev > 55000 ? { type: "40' HC", count: 1 + (s % 2), fillPct: 0, cost: 0 }
            : rev > 25000 ? { type: "40'", count: 1, fillPct: 0, cost: 0 }
              : { type: "20'", count: 1, fillPct: 0, cost: 0 };
        container.fillPct = 62 + (s % 36);
        container.cost = round((cost * ratios.freight) / container.count);

        const acceptRate = c.quoteAcceptRate;
        const roll = s % 100;
        const qStatus: SaleQuote["status"] =
          roll < acceptRate ? "Accepté" : roll < acceptRate + 14 ? "Refusé" : roll < acceptRate + 22 ? "Expiré" : "En attente";
        const responseDays = 1 + (s % 12);
        const sentAt = new Date(Date.UTC(year, monthIdx, Math.max(1, day - responseDays - 2), 9)).toISOString();

        const onTime = (s % 100) < 87;
        sales.push({
          ref, date,
          clientId: c.id, client: c.name, country: c.country, city: c.city,
          zone: ZONES[c.country] ?? "Autre",
          commercial: c.manager, exportManager: (s % 2) ? "Yassine Bennani" : "Nadia Cherkaoui",
          incoterm: c.incoterm, transport: c.transport, port: PORTS[c.country] ?? c.city,
          status: year === 2026 && monthIdx >= 6 ? pick(STATUSES, s) : "Livrée",
          revenue: rev, cost, margin: rev - cost, marginPct: ((rev - cost) / rev) * 100,
          forecastMarginPct: ((rev - cost) / rev) * 100 + ((s % 13) - 5) / 10,
          litres: totalLitres,
          weight: round(totalLitres * 0.89),
          lines,
          costs: {
            goods: round(cost * ratios.goods), freight: round(cost * ratios.freight),
            localTransport: round(cost * ratios.localTransport), insurance: round(cost * ratios.insurance),
            preparation: round(cost * ratios.preparation), documentation: round(cost * ratios.documentation),
            other: round(cost * ratios.other),
          },
          container,
          onTime, delayDays: onTime ? 0 : 2 + (s % 9),
          quote: {
            id: `DEV-${year}-${String(2000 + startNo + k + ci * 7).slice(-4)}`,
            status: qStatus, sentAt,
            respondedAt: qStatus === "En attente" ? null : date,
            responseDays, amount: rev,
            refusalReason: qStatus === "Refusé" ? pick(REFUSAL_REASONS, s + 3) : undefined,
          },
          real: false,
        });
      }
    };

    // 2026 : Jan → Août, calé sur client.monthly et client.revenueYear
    const per2026 = c.monthly.map((m) => (c.revenueYear * m.ca) / sum2026);
    const cnt2026 = c.monthly.map((_, i) => (i < orders2026 % 8 ? Math.ceil(orders2026 / 8) : Math.floor(orders2026 / 8)));
    per2026.forEach((rev, i) => emit(2026, i, rev, Math.max(1, cnt2026[i]), i * 4 + 1));

    // 2025 : historique pour la comparaison N-1
    if (prevTotal > 0) {
      for (let i = 0; i < 12; i++) {
        const w = 0.6 + ((hash(c.id + i) % 70) / 100);
        const rev = (prevTotal * w) / 12.6;
        const count = i % 2 === 0 ? Math.max(1, Math.round(orders2025 / 8)) : Math.max(0, Math.floor(orders2025 / 10));
        emit(2025, i, rev, count, 500 + i * 3);
      }
    }
  });

  // commandes réelles du back-office : marquées comme telles (référence exacte)
  orders.forEach((o) => {
    const c = clients.find((x) => x.id === o.clientId);
    const s = sales.find((x) => x.clientId === o.clientId && x.date.startsWith("2026-08")) ?? sales.find((x) => x.clientId === o.clientId);
    if (!s || !c) return;
    const q: AdminQuote | undefined = adminQuotes.find((x) => x.orderRef === o.reference);
    s.ref = o.reference;
    s.real = true;
    s.status = o.status;
    s.exportManager = o.exportManager;
    s.commercial = o.commercial;
    s.incoterm = o.incoterm;
    if (q) {
      s.quote.id = q.id;
      s.quote.amount = quoteTotalTTC(q);
      const cost = quoteCost(q);
      s.forecastMarginPct = quoteTotalTTC(q) ? ((quoteTotalTTC(q) - cost) / quoteTotalTTC(q)) * 100 : s.forecastMarginPct;
    }
    if (orderCostTotal(o.costs) > 0) s.container.cost = o.costs.freight;
  });

  return sales.sort((a, b) => (a.date < b.date ? 1 : -1));
}

let ledger: Sale[] | null = null;
export const getLedger = () => (ledger ??= buildLedger());

/* ============================== FILTRES ============================== */

export type PeriodKey =
  | "today" | "7d" | "month" | "prevMonth" | "quarter" | "year" | "prevYear" | "custom";

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "7d", label: "7 derniers jours" },
  { key: "month", label: "Ce mois" },
  { key: "prevMonth", label: "Mois précédent" },
  { key: "quarter", label: "Ce trimestre" },
  { key: "year", label: "Cette année" },
  { key: "prevYear", label: "Année précédente" },
  { key: "custom", label: "Période personnalisée" },
];

export type CompareKey = "prev" | "yoy" | "none";
export const COMPARES: { key: CompareKey; label: string }[] = [
  { key: "prev", label: "Période précédente" },
  { key: "yoy", label: "Même période N-1" },
  { key: "none", label: "Aucune comparaison" },
];

export type Filters = {
  period: PeriodKey;
  from: string;
  to: string;
  compare: CompareKey;
  clientId: string;
  country: string;
  zone: string;
  productRef: string;
  category: string;
  supplierId: string;
  commercial: string;
  exportManager: string;
  orderStatus: string;
  quoteStatus: string;
  currency: string;
  port: string;
  incoterm: string;
  transport: string;
};

export const ALL = "Tous";

export const defaultFilters: Filters = {
  period: "year", from: "2026-01-01", to: "2026-08-31", compare: "prev",
  clientId: ALL, country: ALL, zone: ALL, productRef: ALL, category: ALL, supplierId: ALL,
  commercial: ALL, exportManager: ALL, orderStatus: ALL, quoteStatus: ALL, currency: "EUR",
  port: ALL, incoterm: ALL, transport: ALL,
};

const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m, day)).toISOString().slice(0, 10);

export function rangeOf(f: Filters): { from: string; to: string; label: string } {
  const y = TODAY.getFullYear(), m = TODAY.getMonth(), day = TODAY.getDate();
  switch (f.period) {
    case "today": return { from: d(y, m, day), to: d(y, m, day), label: "Aujourd'hui" };
    case "7d": return { from: d(y, m, day - 6), to: d(y, m, day), label: "7 derniers jours" };
    case "month": return { from: d(y, m, 1), to: d(y, m, 31), label: monthLabel(TODAY) };
    case "prevMonth": return { from: d(y, m - 1, 1), to: d(y, m, 0), label: monthLabel(new Date(Date.UTC(y, m - 1, 1))) };
    case "quarter": {
      const q = Math.floor(m / 3) * 3;
      return { from: d(y, q, 1), to: d(y, q + 3, 0), label: `T${Math.floor(m / 3) + 1} ${y}` };
    }
    case "year": return { from: d(y, 0, 1), to: d(y, m, day), label: `Année ${y}` };
    case "prevYear": return { from: d(y - 1, 0, 1), to: d(y - 1, 11, 31), label: `Année ${y - 1}` };
    default: return { from: f.from, to: f.to, label: `${dmy(f.from)} → ${dmy(f.to)}` };
  }
}

export function compareRange(f: Filters): { from: string; to: string; label: string } | null {
  if (f.compare === "none") return null;
  const r = rangeOf(f);
  const a = new Date(r.from), b = new Date(r.to);
  if (f.compare === "yoy") {
    return {
      from: d(a.getUTCFullYear() - 1, a.getUTCMonth(), a.getUTCDate()),
      to: d(b.getUTCFullYear() - 1, b.getUTCMonth(), b.getUTCDate()),
      label: "N-1",
    };
  }
  const span = Math.max(1, Math.round((+b - +a) / 86400000) + 1);
  const pb = new Date(+a - 86400000);
  const pa = new Date(+pb - (span - 1) * 86400000);
  return { from: pa.toISOString().slice(0, 10), to: pb.toISOString().slice(0, 10), label: "période précédente" };
}

export function applyFilters(sales: Sale[], f: Filters, range?: { from: string; to: string }): Sale[] {
  const r = range ?? rangeOf(f);
  return sales.filter((s) => {
    const day = s.date.slice(0, 10);
    if (day < r.from || day > r.to) return false;
    if (f.clientId !== ALL && s.clientId !== f.clientId) return false;
    if (f.country !== ALL && s.country !== f.country) return false;
    if (f.zone !== ALL && s.zone !== f.zone) return false;
    if (f.commercial !== ALL && s.commercial !== f.commercial) return false;
    if (f.exportManager !== ALL && s.exportManager !== f.exportManager) return false;
    if (f.orderStatus !== ALL && s.status !== f.orderStatus) return false;
    if (f.quoteStatus !== ALL && s.quote.status !== f.quoteStatus) return false;
    if (f.port !== ALL && s.port !== f.port) return false;
    if (f.incoterm !== ALL && s.incoterm !== f.incoterm) return false;
    if (f.transport !== ALL && s.transport !== f.transport) return false;
    if (f.category !== ALL && !s.lines.some((l) => l.category === f.category)) return false;
    if (f.productRef !== ALL && !s.lines.some((l) => l.productRef === f.productRef)) return false;
    if (f.supplierId !== ALL && !s.lines.some((l) => l.supplierId === f.supplierId)) return false;
    return true;
  });
}

/* ============================== AGRÉGATS ============================== */

export type Totals = {
  revenue: number; cost: number; margin: number; marginPct: number;
  orders: number; avgBasket: number; litres: number; weight: number;
  clients: number; containers: number; avgFill: number; logisticsCost: number;
  onTimeRate: number; late: number;
};

export function totals(sales: Sale[]): Totals {
  const revenue = sales.reduce((s, x) => s + x.revenue, 0);
  const cost = sales.reduce((s, x) => s + x.cost, 0);
  const litresSum = sales.reduce((s, x) => s + x.litres, 0);
  const containers = sales.reduce((s, x) => s + x.container.count, 0);
  const fill = sales.length ? sales.reduce((s, x) => s + x.container.fillPct, 0) / sales.length : 0;
  const logistics = sales.reduce((s, x) => s + x.costs.freight + x.costs.localTransport + x.costs.insurance, 0);
  const onTime = sales.filter((s) => s.onTime).length;
  return {
    revenue, cost, margin: revenue - cost, marginPct: revenue ? ((revenue - cost) / revenue) * 100 : 0,
    orders: sales.length, avgBasket: sales.length ? revenue / sales.length : 0,
    litres: litresSum, weight: sales.reduce((s, x) => s + x.weight, 0),
    clients: new Set(sales.map((s) => s.clientId)).size,
    containers, avgFill: fill, logisticsCost: logistics,
    onTimeRate: sales.length ? (onTime / sales.length) * 100 : 0,
    late: sales.length - onTime,
  };
}

export const delta = (cur: number, prev: number) => (prev ? ((cur - prev) / Math.abs(prev)) * 100 : 0);

/* --------------------------- séries temporelles --------------------------- */

export type Granularity = "day" | "week" | "month" | "quarter";

const bucketKey = (iso: string, g: Granularity) => {
  const dt = new Date(iso);
  const y = dt.getUTCFullYear();
  if (g === "day") return iso.slice(0, 10);
  if (g === "month") return `${y}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
  if (g === "quarter") return `${y}-T${Math.floor(dt.getUTCMonth() / 3) + 1}`;
  const first = new Date(Date.UTC(y, 0, 1));
  const week = Math.ceil(((+dt - +first) / 86400000 + first.getUTCDay() + 1) / 7);
  return `${y}-S${String(week).padStart(2, "0")}`;
};

const bucketLabel = (key: string, g: Granularity) => {
  if (g === "day") return dmy(key);
  if (g === "month") { const [y, m] = key.split("-"); return `${MONTH_FR[Number(m) - 1]} ${y}`; }
  return key;
};

export type SeriesPoint = { key: string; label: string; ca: number; margin: number; marginPct: number; orders: number; litres: number };

export function series(sales: Sale[], g: Granularity): SeriesPoint[] {
  const map = new Map<string, SeriesPoint>();
  sales.forEach((s) => {
    const key = bucketKey(s.date, g);
    const p = map.get(key) ?? { key, label: bucketLabel(key, g), ca: 0, margin: 0, marginPct: 0, orders: 0, litres: 0 };
    p.ca += s.revenue; p.margin += s.margin; p.orders += 1; p.litres += s.litres;
    map.set(key, p);
  });
  return [...map.values()]
    .map((p) => ({ ...p, marginPct: p.ca ? (p.margin / p.ca) * 100 : 0 }))
    .sort((a, b) => (a.key < b.key ? -1 : 1));
}

/* ------------------------------ regroupements ------------------------------ */

export type Group = {
  key: string; label: string; revenue: number; cost: number; margin: number; marginPct: number;
  orders: number; litres: number; clients: number; logisticsCost: number;
};

function groupBy(sales: Sale[], keyFn: (s: Sale) => { key: string; label: string }): Group[] {
  const map = new Map<string, Group & { _clients: Set<string> }>();
  sales.forEach((s) => {
    const { key, label } = keyFn(s);
    const g = map.get(key) ?? { key, label, revenue: 0, cost: 0, margin: 0, marginPct: 0, orders: 0, litres: 0, clients: 0, logisticsCost: 0, _clients: new Set<string>() };
    g.revenue += s.revenue; g.cost += s.cost; g.margin += s.margin; g.orders += 1; g.litres += s.litres;
    g.logisticsCost += s.costs.freight + s.costs.localTransport + s.costs.insurance;
    g._clients.add(s.clientId);
    map.set(key, g);
  });
  return [...map.values()]
    .map(({ _clients, ...g }) => ({ ...g, clients: _clients.size, marginPct: g.revenue ? (g.margin / g.revenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue);
}

export const byClient = (s: Sale[]) => groupBy(s, (x) => ({ key: x.clientId, label: x.client }));
export const byCountry = (s: Sale[]) => groupBy(s, (x) => ({ key: x.country, label: x.country }));
export const byZone = (s: Sale[]) => groupBy(s, (x) => ({ key: x.zone, label: x.zone }));
export const byCommercial = (s: Sale[]) => groupBy(s, (x) => ({ key: x.commercial, label: x.commercial }));
export const byPort = (s: Sale[]) => groupBy(s, (x) => ({ key: x.port, label: x.port }));

function groupLines(sales: Sale[], keyFn: (l: SaleLine) => { key: string; label: string }): Group[] {
  const map = new Map<string, Group & { _clients: Set<string>; _orders: Set<string> }>();
  sales.forEach((s) =>
    s.lines.forEach((l) => {
      const { key, label } = keyFn(l);
      const g = map.get(key) ?? { key, label, revenue: 0, cost: 0, margin: 0, marginPct: 0, orders: 0, litres: 0, clients: 0, logisticsCost: 0, _clients: new Set<string>(), _orders: new Set<string>() };
      g.revenue += l.revenue; g.cost += l.cost; g.margin += l.revenue - l.cost; g.litres += l.litres;
      g._clients.add(s.clientId); g._orders.add(s.ref);
      map.set(key, g);
    }),
  );
  return [...map.values()]
    .map(({ _clients, _orders, ...g }) => ({ ...g, clients: _clients.size, orders: _orders.size, marginPct: g.revenue ? (g.margin / g.revenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue);
}

export const byProduct = (s: Sale[]) => groupLines(s, (l) => ({ key: l.productRef, label: l.product }));
export const byCategory = (s: Sale[]) => groupLines(s, (l) => ({ key: l.category, label: l.category }));
export const bySupplier = (s: Sale[]) => groupLines(s, (l) => ({ key: l.supplierId, label: l.supplierId }));

/* ------------------------------- waterfall ------------------------------- */

export type WaterfallStep = { label: string; value: number; type: "start" | "minus" | "total" };

export function waterfall(sales: Sale[]): WaterfallStep[] {
  const t = totals(sales);
  const c = sales.reduce(
    (a, s) => ({
      goods: a.goods + s.costs.goods, freight: a.freight + s.costs.freight,
      localTransport: a.localTransport + s.costs.localTransport, insurance: a.insurance + s.costs.insurance,
      preparation: a.preparation + s.costs.preparation, documentation: a.documentation + s.costs.documentation,
      other: a.other + s.costs.other,
    }),
    { goods: 0, freight: 0, localTransport: 0, insurance: 0, preparation: 0, documentation: 0, other: 0 },
  );
  return [
    { label: "Chiffre d'affaires", value: t.revenue, type: "start" },
    { label: "Coût marchandises", value: -c.goods, type: "minus" },
    { label: "Fret maritime", value: -c.freight, type: "minus" },
    { label: "Transport local", value: -c.localTransport, type: "minus" },
    { label: "Assurance", value: -c.insurance, type: "minus" },
    { label: "Préparation", value: -c.preparation, type: "minus" },
    { label: "Documentation", value: -c.documentation, type: "minus" },
    { label: "Autres coûts", value: -c.other, type: "minus" },
    { label: "Marge réelle", value: t.margin, type: "total" },
  ];
}

/* --------------------------------- devis --------------------------------- */

export type QuoteStats = {
  count: number; accepted: number; refused: number; expired: number; pending: number;
  acceptRate: number; refuseRate: number; expireRate: number; avgResponseDays: number;
  avgAmount: number; pendingValue: number; acceptedValue: number; lostValue: number;
  reasons: { label: string; count: number; value: number }[];
};

export function quoteStats(sales: Sale[]): QuoteStats {
  const qs = sales.map((s) => s.quote);
  const by = (st: SaleQuote["status"]) => qs.filter((q) => q.status === st);
  const acc = by("Accepté"), ref = by("Refusé"), exp = by("Expiré"), pen = by("En attente");
  const sum = (l: SaleQuote[]) => l.reduce((s, q) => s + q.amount, 0);
  const reasonsMap = new Map<string, { label: string; count: number; value: number }>();
  ref.forEach((q) => {
    const label = q.refusalReason ?? "Autre";
    const r = reasonsMap.get(label) ?? { label, count: 0, value: 0 };
    r.count += 1; r.value += q.amount;
    reasonsMap.set(label, r);
  });
  const n = qs.length || 1;
  return {
    count: qs.length, accepted: acc.length, refused: ref.length, expired: exp.length, pending: pen.length,
    acceptRate: (acc.length / n) * 100, refuseRate: (ref.length / n) * 100, expireRate: (exp.length / n) * 100,
    avgResponseDays: acc.length ? acc.reduce((s, q) => s + q.responseDays, 0) / acc.length : 0,
    avgAmount: qs.length ? sum(qs) / qs.length : 0,
    pendingValue: sum(pen), acceptedValue: sum(acc), lostValue: sum(ref),
    reasons: [...reasonsMap.values()].sort((a, b) => b.value - a.value),
  };
}

export type FunnelStep = { label: string; value: number; rate: number };

export function funnel(sales: Sale[]): FunnelStep[] {
  const received = sales.length;
  const validated = sales.filter((s) => s.status !== "Commande reçue").length;
  const quoted = sales.filter((s) => s.quote.status !== "En attente" || s.quote.sentAt).length;
  const sent = sales.filter((s) => s.quote.sentAt).length;
  const accepted = sales.filter((s) => s.quote.status === "Accepté").length;
  const executed = sales.filter((s) => s.status === "Livrée" || s.status === "En transit").length;
  const steps = [
    { label: "Commandes reçues", value: received },
    { label: "Commandes validées", value: validated },
    { label: "Devis générés", value: quoted },
    { label: "Devis envoyés", value: sent },
    { label: "Devis acceptés", value: accepted },
    { label: "Commandes exécutées", value: executed },
  ];
  return steps.map((s, i) => ({ ...s, rate: i === 0 ? 100 : steps[i - 1].value ? (s.value / steps[i - 1].value) * 100 : 0 }));
}

/* ----------------------------- clients & rétention ----------------------------- */

export type ClientInsight = Group & {
  country: string; avgBasket: number; lastOrder: string; daysSinceLast: number;
  balance: number; risk: string; frequencyDays: number; segment: "Stratégique" | "À optimiser" | "À développer" | "Faible priorité";
};

export function clientInsights(sales: Sale[], clients: Client[], avgRevenue: number, avgMarginPct: number): ClientInsight[] {
  return byClient(sales).map((g) => {
    const c = clients.find((x) => x.id === g.key);
    const dates = sales.filter((s) => s.clientId === g.key).map((s) => s.date).sort();
    const last = dates[dates.length - 1] ?? c?.lastOrder ?? TODAY.toISOString();
    const days = Math.round((+TODAY - +new Date(last)) / 86400000);
    const span = dates.length > 1 ? (+new Date(dates[dates.length - 1]) - +new Date(dates[0])) / 86400000 : 0;
    const segment: ClientInsight["segment"] =
      g.revenue >= avgRevenue && g.marginPct >= avgMarginPct ? "Stratégique"
        : g.revenue >= avgRevenue ? "À optimiser"
          : g.marginPct >= avgMarginPct ? "À développer" : "Faible priorité";
    return {
      ...g, country: c?.country ?? "—", avgBasket: g.orders ? g.revenue / g.orders : 0,
      lastOrder: last, daysSinceLast: days, balance: c?.balance ?? 0, risk: c?.paymentRisk ?? "Modéré",
      frequencyDays: dates.length > 1 ? Math.round(span / (dates.length - 1)) : 0,
      segment,
    };
  });
}

export function concentration(sales: Sale[]) {
  const g = byClient(sales);
  const total = g.reduce((s, x) => s + x.revenue, 0) || 1;
  const top = (n: number) => g.slice(0, n).reduce((s, x) => s + x.revenue, 0);
  return { top5: (top(5) / total) * 100, top10: (top(10) / total) * 100, others: ((total - top(10)) / total) * 100, top3: (top(3) / total) * 100, groups: g };
}

/* -------------------------- facturation & cash -------------------------- */

export type CashStats = {
  invoiced: number; collected: number; outstanding: number; late: number;
  collectRate: number; avgDelay: number; open: number; lateCount: number;
  aging: { label: string; amount: number; count: number }[];
  debtors: { clientId: string; client: string; invoiced: number; paid: number; balance: number; oldestDue: string; delay: number; risk: string }[];
  monthly: { label: string; invoiced: number; collected: number }[];
  variance: { label: string; amount: number; count: number }[];
  avgVariancePct: number;
};

export function cashStats(invoices: Invoice[], payments: Payment[], f: Filters): CashStats {
  const r = rangeOf(f);
  const inRange = (iso: string) => iso.slice(0, 10) >= r.from && iso.slice(0, 10) <= r.to;
  const finals = invoices.filter((i) => i.type === "Facture finale" && i.status !== "Annulée" && i.status !== "Remplacée");
  const scoped = finals.filter((i) => inRange(i.issuedAt) && (f.clientId === ALL || i.clientId === f.clientId) && (f.country === ALL || i.country === f.country));
  const invoiced = scoped.reduce((s, i) => s + invoiceTotal(i), 0);
  const collected = scoped.reduce((s, i) => s + paidOf(i.id, payments), 0);
  const today = TODAY.toISOString().slice(0, 10);

  const aging = [
    { label: "Non échues", amount: 0, count: 0 },
    { label: "1–30 jours", amount: 0, count: 0 },
    { label: "31–60 jours", amount: 0, count: 0 },
    { label: "61–90 jours", amount: 0, count: 0 },
    { label: "90+ jours", amount: 0, count: 0 },
  ];
  let late = 0, lateCount = 0;
  scoped.forEach((i) => {
    const bal = invoiceTotal(i) - paidOf(i.id, payments);
    if (bal <= 1) return;
    const due = i.dueAt.slice(0, 10);
    const days = Math.round((+new Date(today) - +new Date(due)) / 86400000);
    const idx = days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4;
    aging[idx].amount += bal; aging[idx].count += 1;
    if (idx > 0) { late += bal; lateCount += 1; }
  });

  const debtorMap = new Map<string, CashStats["debtors"][number]>();
  scoped.forEach((i) => {
    const paid = paidOf(i.id, payments);
    const dRow = debtorMap.get(i.clientId) ?? { clientId: i.clientId, client: i.client, invoiced: 0, paid: 0, balance: 0, oldestDue: i.dueAt, delay: 0, risk: "Modéré" };
    dRow.invoiced += invoiceTotal(i); dRow.paid += paid; dRow.balance += invoiceTotal(i) - paid;
    if (i.dueAt < dRow.oldestDue && invoiceTotal(i) - paid > 1) dRow.oldestDue = i.dueAt;
    debtorMap.set(i.clientId, dRow);
  });
  const debtors = [...debtorMap.values()]
    .map((x) => {
      const delay = Math.max(0, Math.round((+TODAY - +new Date(x.oldestDue)) / 86400000));
      return { ...x, delay, risk: x.balance > 60000 || delay > 60 ? "Élevé" : delay > 20 ? "Modéré" : "Faible" };
    })
    .filter((x) => x.balance > 1)
    .sort((a, b) => b.balance - a.balance);

  const mMap = new Map<string, { label: string; invoiced: number; collected: number }>();
  finals.forEach((i) => {
    const k = i.issuedAt.slice(0, 7);
    const row = mMap.get(k) ?? { label: `${MONTH_FR[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}`, invoiced: 0, collected: 0 };
    row.invoiced += invoiceTotal(i); row.collected += paidOf(i.id, payments);
    mMap.set(k, row);
  });

  const varMap = new Map<string, { label: string; amount: number; count: number }>();
  let vSum = 0, vCount = 0;
  finals.forEach((i) => {
    (i.variances ?? []).forEach((v) => {
      const row = varMap.get(v.label) ?? { label: v.label, amount: 0, count: 0 };
      row.amount += v.amount; row.count += 1;
      varMap.set(v.label, row);
    });
    if (i.proformaId) {
      const pro = invoices.find((x) => x.id === i.proformaId);
      if (pro) { const t = invoiceTotal(pro); if (t) { vSum += ((invoiceTotal(i) - t) / t) * 100; vCount += 1; } }
    }
  });

  const paidInvoices = scoped.filter((i) => invoiceTotal(i) - paidOf(i.id, payments) <= 1);
  const avgDelay = paidInvoices.length
    ? paidInvoices.reduce((s, i) => {
      const last = payments.filter((p) => p.invoiceId === i.id).map((p) => p.date).sort().pop();
      return s + (last ? Math.max(0, Math.round((+new Date(last) - +new Date(i.issuedAt)) / 86400000)) : 0);
    }, 0) / paidInvoices.length
    : 0;

  return {
    invoiced, collected, outstanding: invoiced - collected, late,
    collectRate: invoiced ? (collected / invoiced) * 100 : 0,
    avgDelay, open: scoped.filter((i) => invoiceTotal(i) - paidOf(i.id, payments) > 1).length, lateCount,
    aging, debtors,
    monthly: [...mMap.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, v]) => v),
    variance: [...varMap.values()].sort((a, b) => b.amount - a.amount),
    avgVariancePct: vCount ? vSum / vCount : 0,
  };
}

/* ------------------------------- conteneurs ------------------------------- */

export function containerStats(sales: Sale[]) {
  const buckets = [
    { label: "> 90 % — Très optimisé", min: 90, count: 0, tone: "success" as const },
    { label: "80–90 % — Correct", min: 80, count: 0, tone: "info" as const },
    { label: "70–80 % — À améliorer", min: 70, count: 0, tone: "warning" as const },
    { label: "< 70 % — Faible optimisation", min: 0, count: 0, tone: "danger" as const },
  ];
  let c20 = 0, c40 = 0, chc = 0, cost = 0, unused = 0;
  sales.forEach((s) => {
    const b = buckets.find((x) => s.container.fillPct >= x.min)!;
    b.count += 1;
    if (s.container.type === "20'") c20 += s.container.count;
    else if (s.container.type === "40'") c40 += s.container.count;
    else chc += s.container.count;
    cost += s.container.cost * s.container.count;
    const cap = s.container.type === "20'" ? 33 : s.container.type === "40'" ? 67 : 76;
    unused += cap * s.container.count * (1 - s.container.fillPct / 100);
  });
  const t = totals(sales);
  const savedContainers = Math.round(sales.filter((s) => s.container.fillPct >= 88).length * 0.4);
  return {
    buckets, c20, c40, chc, cost, unused,
    avgFill: t.avgFill,
    costPerContainer: t.containers ? cost / t.containers : 0,
    costPerLitre: t.litres ? cost / t.litres : 0,
    baselineCost: cost * 1.12,
    optimizedCost: cost,
    savings: cost * 0.12,
    savedContainers,
    underfilled: sales.filter((s) => s.container.fillPct < 75).length,
  };
}

/* ------------------------------ règles tarifaires ------------------------------ */

export function ruleImpact(sales: Sale[], rules: PricingRule[]) {
  const active = rules.filter((r) => effectiveStatus(r) === "Active" || effectiveStatus(r) === "Suspendue");
  const total = sales.reduce((s, x) => s + x.revenue, 0) || 1;
  return active.map((r, i) => {
    const seed = hash(r.id);
    const share = 0.06 + ((seed % 22) / 100);
    const revenue = round(total * share);
    const discounts = round(revenue * (0.03 + ((seed % 7) / 100) * 0.6));
    const marginPct = 15 + ((seed % 90) / 10);
    return {
      id: r.id, name: r.name, status: effectiveStatus(r),
      clients: 1 + (seed % 9), orders: 2 + (seed % 14),
      revenue, discounts, margin: round((revenue * marginPct) / 100), marginPct,
      impact: i % 3 === 0 ? "Positif" : i % 3 === 1 ? "Neutre" : "À surveiller",
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

/* --------------------------------- pricing --------------------------------- */

export function priceDrift(products: Product[]) {
  return products
    .filter((p) => p.previousPurchasePrice > 0 && p.status === "Actif")
    .map((p) => {
      const costVar = ((p.purchasePrice - p.previousPurchasePrice) / p.previousPurchasePrice) * 100;
      const first = p.priceHistory[0]?.price ?? p.salePrice;
      const saleVar = first ? ((p.salePrice - first) / first) * 100 : 0;
      const marginNow = p.salePrice ? ((p.salePrice - p.purchasePrice) / p.salePrice) * 100 : 0;
      const marginBefore = first ? ((first - p.previousPurchasePrice) / first) * 100 : marginNow;
      return { ref: p.ref, name: p.name, category: p.category, costVar, saleVar, marginNow, impact: marginNow - marginBefore };
    })
    .sort((a, b) => b.costVar - a.costVar);
}

/* ================================ ALERTES ================================ */

export type Alert = {
  id: string; title: string; detail: string; tone: "danger" | "warning" | "info" | "success";
  to?: string; amount?: number;
};

export function alerts(sales: Sale[], cash: CashStats, conc: ReturnType<typeof concentration>, cont: ReturnType<typeof containerStats>, threshold: number, drift: ReturnType<typeof priceDrift>): Alert[] {
  const list: Alert[] = [];
  if (cash.lateCount) list.push({ id: "late", title: `${cash.lateCount} factures en retard`, detail: `${eur(cash.late)} à risque sur les créances échues.`, tone: "danger", to: "/admin/facturation/paiements", amount: cash.late });
  const under = sales.filter((s) => s.marginPct < threshold);
  if (under.length) list.push({ id: "margin", title: `${under.length} commandes sous la marge minimale`, detail: `Seuil configuré à ${threshold} % — ${eur(under.reduce((s, x) => s + x.margin, 0))} de marge générée.`, tone: "warning", to: "/admin/analytics/rentabilite" });
  const bigPending = sales.filter((s) => s.quote.status === "En attente" && s.quote.amount > 50000);
  if (bigPending.length) list.push({ id: "quotes", title: `${bigPending.length} devis de plus de 50 000 € attendent une réponse`, detail: `${eur(bigPending.reduce((s, x) => s + x.quote.amount, 0))} en attente de décision client.`, tone: "warning", to: "/admin/analytics/commercial" });
  const late = sales.filter((s) => !s.onTime && (s.status === "En transit" || s.status === "En préparation"));
  if (late.length) list.push({ id: "delay", title: `${late.length} commandes présentent un risque de retard`, detail: `Retard moyen estimé de ${Math.round(late.reduce((s, x) => s + x.delayDays, 0) / late.length)} jours.`, tone: "danger", to: "/admin/analytics/export" });
  const hikes = drift.filter((p) => p.costVar > 3);
  if (hikes.length) list.push({ id: "hike", title: `${hikes.length} produits ont subi une hausse fournisseur`, detail: `Hausse moyenne de ${pct1(hikes.reduce((s, x) => s + x.costVar, 0) / hikes.length)} sur le prix d'achat.`, tone: "warning", to: "/admin/analytics/produits" });
  if (conc.top3 > 25) list.push({ id: "conc", title: `${conc.groups.slice(0, 3).length} clients représentent ${pct1(conc.top3)} du CA`, detail: "Dépendance commerciale à surveiller — diversifier le portefeuille.", tone: "info", to: "/admin/analytics/clients" });
  if (cont.underfilled) list.push({ id: "cont", title: `${cont.underfilled} conteneurs ont un taux de remplissage inférieur à 75 %`, detail: `Volume inutilisé estimé à ${num(cont.unused)} m³.`, tone: "warning", to: "/admin/analytics/export" });
  return list;
}

/* ================================ INSIGHTS ================================ */

export function insights(cur: Totals, prev: Totals | null, cats: Group[], clientsG: Group[], conc: ReturnType<typeof concentration>, cont: ReturnType<typeof containerStats>, inactive: number, cash: CashStats): string[] {
  const out: string[] = [];
  if (prev) {
    const dRev = delta(cur.revenue, prev.revenue);
    const dMar = cur.marginPct - prev.marginPct;
    out.push(`Le CA ${dRev >= 0 ? "progresse" : "recule"} de ${pct1(Math.abs(dRev))}, ${dMar >= 0 ? "et le taux de marge gagne" : "mais le taux de marge diminue de"} ${Math.abs(dMar).toFixed(1).replace(".", ",")} point${Math.abs(dMar) > 1 ? "s" : ""}.`);
  }
  const top = cats[0];
  if (top) {
    const shareCa = (top.revenue / (cur.revenue || 1)) * 100;
    const shareMa = (top.margin / (cur.margin || 1)) * 100;
    out.push(`Les ${top.label.toLowerCase()} représentent ${pct1(shareCa)} du CA et ${pct1(shareMa)} de la marge.`);
  }
  out.push(`${clientsG.slice(0, 3).length} clients représentent ${pct1(conc.top3)} du chiffre d'affaires de la période.`);
  if (cont.savings > 0) out.push(`L'optimisation des conteneurs a permis une économie estimée de ${eur(cont.savings)}.`);
  if (inactive > 0) out.push(`${inactive} clients actifs n'ont pas commandé depuis plus de 90 jours.`);
  if (cash.outstanding > 0) out.push(`${eurCompact(cash.outstanding)} restent à encaisser, dont ${eurCompact(cash.late)} actuellement en retard.`);
  const fill = cont.avgFill;
  out.push(`Le taux moyen de remplissage conteneur s'établit à ${pct1(fill)} sur la période sélectionnée.`);
  return out;
}

/* ============================ ÉTAT RÉACTIF ============================ */

export type SavedView = { id: string; name: string; createdAt: string; author: string; filters: Filters };
export type ReportKind =
  | "Rapport exécutif" | "Rapport commercial" | "Rapport rentabilité" | "Rapport clients"
  | "Rapport produits & pricing" | "Rapport export & logistique" | "Rapport facturation & cash" | "Rapport personnalisé";

export type SavedReport = {
  id: string; name: string; kind: ReportKind; period: string; author: string; createdAt: string;
  format: "PDF" | "Excel"; filters: Filters; sections: string[]; comment: string; summary: string;
};

export type Thresholds = { critical: number; watch: number; ok: number };

type State = {
  filters: Filters;
  views: SavedView[];
  reports: SavedReport[];
  thresholds: Thresholds;
  goals: { revenue: number; marginPct: number; orders: number };
};

const listeners = new Set<() => void>();
let state: State = {
  filters: { ...defaultFilters },
  thresholds: { critical: 10, watch: 15, ok: 20 },
  goals: { revenue: 4200000, marginPct: 20, orders: 200 },
  views: [
    { id: "v1", name: "Rentabilité Afrique de l'Ouest", createdAt: "2026-07-12T09:00:00.000Z", author: "Sofia El Mansouri", filters: { ...defaultFilters, zone: "Afrique de l'Ouest" } },
    { id: "v2", name: "Performance Huiles moteur", createdAt: "2026-07-20T14:30:00.000Z", author: "Sofia El Mansouri", filters: { ...defaultFilters, category: "Huiles moteur" } },
    { id: "v3", name: "Clients stratégiques", createdAt: "2026-08-01T08:15:00.000Z", author: "Yassine Bennani", filters: { ...defaultFilters, period: "quarter" } },
  ],
  reports: [
    {
      id: "RPT-2026-014", name: "Synthèse exécutive — Juillet 2026", kind: "Rapport exécutif", period: "Juil 2026",
      author: "Sofia El Mansouri", createdAt: "2026-08-01T08:40:00.000Z", format: "PDF",
      filters: { ...defaultFilters, period: "prevMonth" }, sections: ["KPI", "Graphiques", "Top clients", "Insights"],
      comment: "Revue mensuelle direction.", summary: "",
    },
    {
      id: "RPT-2026-013", name: "Rentabilité T2 2026", kind: "Rapport rentabilité", period: "T2 2026",
      author: "Yassine Bennani", createdAt: "2026-07-05T16:10:00.000Z", format: "Excel",
      filters: { ...defaultFilters }, sections: ["KPI", "Waterfall", "Top / Flop"],
      comment: "", summary: "",
    },
  ],
};

const emit = () => listeners.forEach((l) => l());

export const analyticsStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
  get: () => state,
  setFilters(patch: Partial<Filters>) { state = { ...state, filters: { ...state.filters, ...patch } }; emit(); },
  replaceFilters(f: Filters) { state = { ...state, filters: { ...f } }; emit(); },
  reset() { state = { ...state, filters: { ...defaultFilters } }; emit(); },
  setThresholds(t: Partial<Thresholds>) { state = { ...state, thresholds: { ...state.thresholds, ...t } }; emit(); },
  saveView(name: string) {
    const v: SavedView = { id: `v${Date.now()}`, name, createdAt: new Date().toISOString(), author: "Sofia El Mansouri", filters: { ...state.filters } };
    state = { ...state, views: [v, ...state.views] }; emit(); return v;
  },
  deleteView(id: string) { state = { ...state, views: state.views.filter((v) => v.id !== id) }; emit(); },
  applyView(id: string) {
    const v = state.views.find((x) => x.id === id);
    if (v) { state = { ...state, filters: { ...v.filters } }; emit(); }
  },
  saveReport(r: Omit<SavedReport, "id" | "createdAt" | "author">) {
    const rep: SavedReport = { ...r, id: `RPT-2026-${String(state.reports.length + 15).padStart(3, "0")}`, createdAt: new Date().toISOString(), author: "Sofia El Mansouri" };
    state = { ...state, reports: [rep, ...state.reports] }; emit(); return rep;
  },
  deleteReport(id: string) { state = { ...state, reports: state.reports.filter((r) => r.id !== id) }; emit(); },
  duplicateReport(id: string) {
    const r = state.reports.find((x) => x.id === id);
    if (!r) return;
    state = { ...state, reports: [{ ...r, id: `RPT-2026-${String(state.reports.length + 15).padStart(3, "0")}`, name: `${r.name} (copie)`, createdAt: new Date().toISOString() }, ...state.reports] };
    emit();
  },
};

export function useAnalyticsState() {
  return useSyncExternalStore(analyticsStore.subscribe, analyticsStore.get, analyticsStore.get);
}

/* ============================ SÉLECTEUR GLOBAL ============================ */

export type Dataset = ReturnType<typeof buildDataset>;

export function buildDataset(f: Filters, thresholds: Thresholds) {
  const bo = boStore.get();
  const billing = billingStore.get();
  const pricing = pricingStore.get();
  const all = getLedger();
  const range = rangeOf(f);
  const cmp = compareRange(f);
  const sales = applyFilters(all, f, range);
  const prevSales = cmp ? applyFilters(all, f, cmp) : [];
  const cur = totals(sales);
  const prev = cmp ? totals(prevSales) : null;
  const cash = cashStats(billing.invoices, billing.payments, f);
  const conc = concentration(sales);
  const cont = containerStats(sales);
  const cats = byCategory(sales);
  const drift = priceDrift(bo.products);
  const avgRev = conc.groups.length ? cur.revenue / conc.groups.length : 0;
  const cInsights = clientInsights(sales, bo.clients, avgRev, cur.marginPct);
  const inactive = cInsights.filter((c) => c.daysSinceLast > 90).length;
  return {
    filters: f, range, cmp, sales, prevSales, cur, prev, cash, conc, cont, cats, drift,
    clients: bo.clients, products: bo.products, suppliers: bo.suppliers,
    orders: bo.orders as AdminOrder[], quotes: bo.adminQuotes as AdminQuote[],
    invoices: billing.invoices, payments: billing.payments,
    rules: ruleImpact(sales, pricing.rules),
    clientInsights: cInsights, inactive,
    q: quoteStats(sales), funnel: funnel(sales), waterfall: waterfall(sales),
    alerts: alerts(sales, cash, conc, cont, thresholds.watch, drift),
    thresholds,
  };
}

export function useAnalytics() {
  const st = useAnalyticsState();
  useSyncExternalStore(boStore.subscribe, boStore.get, boStore.get);
  useSyncExternalStore(billingStore.subscribe, billingStore.get, billingStore.get);
  return buildDataset(st.filters, st.thresholds);
}

/* ------------------------- rapport exécutif auto ------------------------- */

export function executiveSummary(d: Dataset): string {
  const topCountry = byCountry(d.sales)[0];
  const topCat = d.cats[0];
  const dRev = d.prev ? delta(d.cur.revenue, d.prev.revenue) : 0;
  const under = d.sales.filter((s) => s.marginPct < d.thresholds.watch).length;
  return [
    `Sur la période sélectionnée (${d.range.label}), AKWA a généré un chiffre d'affaires de ${eurCompact(d.cur.revenue)}${d.prev ? `, ${dRev >= 0 ? "en progression" : "en recul"} de ${pct1(Math.abs(dRev))} par rapport à la ${d.cmp?.label ?? "période précédente"}` : ""}.`,
    `La marge brute atteint ${eurCompact(d.cur.margin)}, soit un taux de marge de ${pct1(d.cur.marginPct)}.`,
    `${num(d.cur.orders)} commandes ont été enregistrées avec un panier moyen de ${eurCompact(d.cur.avgBasket)}.`,
    topCountry ? `${topCountry.label} reste le premier marché en chiffre d'affaires avec ${eurCompact(topCountry.revenue)}.` : "",
    topCat ? `Les ${topCat.label.toLowerCase()} constituent la principale catégorie de revenus.` : "",
    `${eurCompact(d.cash.outstanding)} restent à encaisser, dont ${eurCompact(d.cash.late)} sont actuellement en retard.`,
    `${under} commandes présentent une marge inférieure au seuil défini de ${d.thresholds.watch} %.`,
  ].filter(Boolean).join("\n");
}

/* ------------------------------ export mock ------------------------------ */

export function toCsv(rows: Record<string, string | number>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(";"), ...rows.map((r) => headers.map((h) => String(r[h]).replace(/;/g, ",")).join(";"))].join("\n");
}

export function downloadCsv(name: string, rows: Record<string, string | number>[]) {
  const blob = new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
}
