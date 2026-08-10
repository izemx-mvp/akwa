import { useSyncExternalStore } from "react";
import { quotesStore, type Quote as ClientQuote, type QuoteItem as ClientQuoteItem } from "./quotes-store";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Availability = "Disponible" | "Stock limité" | "Rupture" | "Sur commande";
export type ProductStatus = "Actif" | "Inactif" | "Brouillon";

export type SupplierLink = {
  supplierId: string;
  price: number;
  minOrder: number;
  leadTime: string;
  paymentTerms: string;
  primary: boolean;
  lastOrder: string;
  availability: Availability;
};

export type Supplier = {
  id: string;
  name: string;
  country: string;
  contact: string;
  email: string;
  phone: string;
};

export type ProductLogistics = {
  unitWeight: number; // kg
  grossWeight: number; // kg
  dimensions: string;
  volume: number; // m3 par carton
  unitsPerCarton: number;
  cartonsPerPallet: number;
  unitsPerPallet: number;
  palletType: string;
  storageTemp: string;
  storageConditions: string;
  shelfLife: string;
  hsCode: string;
  dangerous: boolean;
  sdsRequired: boolean;
  adrRegulated: boolean;
};

export type PricePoint = { date: string; price: number };

export type ProductDoc = { id: string; name: string; type: string; addedAt: string; addedBy: string };

export type Product = {
  ref: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  subCategory: string;
  barcode: string;
  supplierSku: string;
  origin: string;
  saleUnit: string;
  packaging: string;
  status: ProductStatus;
  availability: Availability;
  emoji: string;
  currency: "EUR";
  purchasePrice: number;
  previousPurchasePrice: number;
  salePrice: number;
  minPrice: number;
  recommendedPrice: number;
  priceUpdatedAt: string;
  priceUpdatedBy: string;
  priceToCheck: boolean;
  priceHistory: PricePoint[];
  logistics: ProductLogistics;
  suppliers: SupplierLink[];
  documents: ProductDoc[];
  updatedAt: string;
  history: { at: string; user: string; action: string; from?: string; to?: string }[];
};

export type ClientNote = {
  id: string;
  at: string;
  author: string;
  category: "Commercial" | "Logistique" | "Financier" | "Risque";
  text: string;
};

export type Client = {
  id: string;
  name: string;
  legalName: string;
  ice: string;
  country: string;
  city: string;
  address: string;
  zip: string;
  website: string;
  email: string;
  phone: string;
  contactMain: string;
  contactFinance: string;
  contactLogistics: string;
  language: string;
  currency: string;
  incoterm: string;
  paymentTerms: string;
  transport: string;
  since: string;
  manager: string;
  status: "Actif" | "Inactif" | "Prospect";
  priority: "Standard" | "Important" | "Stratégique" | "VIP";
  paymentRisk: "Faible" | "Modéré" | "Élevé";
  score: number;
  revenueTotal: number;
  revenueYear: number;
  ordersCount: number;
  activeOrders: number;
  margin: number;
  paid: number;
  balance: number;
  quoteAcceptRate: number;
  avgPaymentDelay: number;
  lastOrder: string;
  monthly: { month: string; ca: number; orders: number; margin: number; paid: number }[];
  byCategory: { name: string; value: number }[];
  topProducts: { name: string; value: number }[];
  destinations: { name: string; value: number }[];
  notes: ClientNote[];
};

export type OrderItem = {
  ref: string;
  label: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  purchasePrice: number;
};

export type OrderStatus =
  | "Commande reçue"
  | "En attente d'informations"
  | "En attente"
  | "Refusée"
  | "Commande validée par AKWA"
  | "Devis envoyé – En attente client"
  | "Devis accepté"
  | "Révision devis"
  | "En préparation"
  | "En transit"
  | "Livrée";

export type InternalNote = {
  id: string;
  at: string;
  author: string;
  text: string;
  tag: string;
  mentions: string[];
  attachment?: string;
};

export type OrderCosts = {
  goods: number;
  preparation: number;
  localTransport: number;
  freight: number;
  insurance: number;
  documents: number;
  other: number;
};

export type AdminOrder = {
  reference: string;
  clientId: string;
  destination: string;
  receivedAt: string;
  channel: "Portail client" | "Email" | "Téléphone" | "Commercial terrain";
  priority: "Basse" | "Normale" | "Haute" | "Critique";
  status: OrderStatus;
  commercial: string;
  exportManager: string;
  incoterm: string;
  currency: "EUR";
  portDeparture: string;
  portDestination: string;
  items: OrderItem[];
  costs: OrderCosts;
  quoteDeadline: string;
  shipDeadline: string;
  risk: "Faible" | "Modéré" | "Élevé";
  missingDocs: string[];
  internalNotes: InternalNote[];
  quoteFamily?: string;
  validatedAt?: string;
  validatedBy?: string;
};

export type FeeType =
  | "Fret maritime"
  | "Assurance"
  | "Frais de préparation"
  | "Transport local"
  | "Manutention"
  | "Frais portuaires"
  | "Documentation export"
  | "Certifications"
  | "Inspection"
  | "Emballage spécial"
  | "Palettisation"
  | "Commission"
  | "Frais bancaires"
  | "Douane"
  | "Autres frais";

export const FEE_TYPES: FeeType[] = [
  "Fret maritime", "Assurance", "Frais de préparation", "Transport local", "Manutention",
  "Frais portuaires", "Documentation export", "Certifications", "Inspection", "Emballage spécial",
  "Palettisation", "Commission", "Frais bancaires", "Douane", "Autres frais",
];

export type Fee = {
  id: string;
  type: FeeType;
  description: string;
  cost: number;
  price: number;
  quantity: number;
  vat: number;
  comment: string;
  createdBy: string;
  createdAt: string;
};

export type AdminQuoteStatus =
  | "Brouillon"
  | "Validé"
  | "Envoyé"
  | "À valider client"
  | "Accepté"
  | "Refusé"
  | "Expiré"
  | "Remplacé";

export type AdminQuote = {
  id: string;
  family: string;
  version: number;
  orderRef: string;
  clientId: string;
  status: AdminQuoteStatus;
  createdAt: string;
  createdBy: string;
  validatedBy?: string;
  sentAt?: string;
  respondedAt?: string;
  validUntil: string;
  updatedAt: string;
  items: OrderItem[];
  fees: Fee[];
  conditions: {
    incoterm: string;
    currency: string;
    paymentTerms: string;
    preparationDelay: string;
    etd: string;
    eta: string;
    portDeparture: string;
    portDestination: string;
    transportMode: string;
    notes: string;
    specialTerms: string;
  };
  history: { at: string; user: string; label: string; detail?: string }[];
  refusal?: { reason: string; message: string; at: string };
};

export type Activity = {
  id: string;
  at: string;
  user: string;
  action: string;
  object: string;
  from?: string;
  to?: string;
};

export type AdminNotification = {
  id: string;
  at: string;
  title: string;
  body: string;
  tone: "info" | "warning" | "success" | "danger";
  read: boolean;
  link?: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const CURRENT_USER = { name: "Sofia El Mansouri", role: "Responsable Commercial Export", initials: "SM" };

export const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
export const eur2 = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
export const pct = (n: number) => `${n.toFixed(1).replace(".", ",")} %`;
export const dShort = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
export const dLong = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
export const dTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const uid = () => Math.random().toString(36).slice(2, 10);
const iso = (s: string) => new Date(s).toISOString();
const now = () => new Date().toISOString();

export const goodsTotal = (items: OrderItem[]) => items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
export const goodsCost = (items: OrderItem[]) => items.reduce((s, i) => s + i.quantity * i.purchasePrice, 0);
export const feesPrice = (fees: Fee[]) => fees.reduce((s, f) => s + f.price * f.quantity, 0);
export const feesCost = (fees: Fee[]) => fees.reduce((s, f) => s + f.cost * f.quantity, 0);
export const quoteTotalTTC = (q: AdminQuote) => goodsTotal(q.items) + feesPrice(q.fees);
export const quoteCost = (q: AdminQuote) => goodsCost(q.items) + feesCost(q.fees);
export const quoteMargin = (q: AdminQuote) => quoteTotalTTC(q) - quoteCost(q);
export const quoteMarginPct = (q: AdminQuote) => {
  const t = quoteTotalTTC(q);
  return t ? (quoteMargin(q) / t) * 100 : 0;
};
export const orderCostTotal = (c: OrderCosts) =>
  c.goods + c.preparation + c.localTransport + c.freight + c.insurance + c.documents + c.other;

export const MARGIN_THRESHOLD = 15;

/* ------------------------------------------------------------------ */
/* Seeds — fournisseurs                                                */
/* ------------------------------------------------------------------ */

const suppliers: Supplier[] = [
  { id: "SUP-001", name: "Huileries du Souss", country: "Maroc", contact: "Rachid Amrani", email: "contact@huileries-souss.ma", phone: "+212 528 22 41 09" },
  { id: "SUP-002", name: "Conserveries Atlantique", country: "Maroc", contact: "Nadia Berrada", email: "achats@cons-atlantique.ma", phone: "+212 522 30 18 44" },
  { id: "SUP-003", name: "Palmeraie Tafilalet", country: "Maroc", contact: "Omar Sabri", email: "export@tafilalet-dattes.ma", phone: "+212 535 57 62 10" },
  { id: "SUP-004", name: "Épices du Sud SARL", country: "Maroc", contact: "Karima Idrissi", email: "commercial@epicesdusud.ma", phone: "+212 524 43 88 21" },
  { id: "SUP-005", name: "Semouleries Chaouia", country: "Maroc", contact: "Youssef Naciri", email: "ventes@chaouia-semoule.ma", phone: "+212 523 31 77 05" },
  { id: "SUP-006", name: "Thés & Infusions Maghreb", country: "Maroc", contact: "Salma Tazi", email: "info@the-maghreb.ma", phone: "+212 522 98 14 60" },
  { id: "SUP-007", name: "Agro Doukkala", country: "Maroc", contact: "Hicham Filali", email: "contact@agrodoukkala.ma", phone: "+212 523 34 20 90" },
];

const catalog: {
  ref: string; name: string; cat: string; sub: string; brand: string; origin: string; emoji: string;
  buy: number; prev: number; sell: number; sup: string; avail?: Availability; status?: ProductStatus; toCheck?: boolean;
}[] = [
  { ref: "AKW-OLV-001", name: "Huile d'olive extra vierge 1L", cat: "Huile & épicerie", sub: "Huile d'olive", brand: "Atlas Gold", origin: "Maroc", emoji: "🫒", buy: 4.65, prev: 4.4, sell: 6.4, sup: "SUP-001" },
  { ref: "AKW-OLV-002", name: "Huile d'olive vierge 5L", cat: "Huile & épicerie", sub: "Huile d'olive", brand: "Atlas Gold", origin: "Maroc", emoji: "🛢️", buy: 20.9, prev: 19.8, sell: 27.5, sup: "SUP-001" },
  { ref: "AKW-OLV-005", name: "Huile d'argan alimentaire 250ml", cat: "Huile & épicerie", sub: "Huile d'argan", brand: "Souss Nature", origin: "Maroc", emoji: "🍯", buy: 9.2, prev: 8.6, sell: 13.5, sup: "SUP-001", toCheck: true },
  { ref: "AKW-CNS-003", name: "Sardines à l'huile 125g", cat: "Conserves", sub: "Poisson", brand: "Océan Bleu", origin: "Maroc", emoji: "🐟", buy: 1.18, prev: 1.1, sell: 1.65, sup: "SUP-002" },
  { ref: "AKW-CNS-008", name: "Conserves de tomates pelées 400g", cat: "Conserves", sub: "Légumes", brand: "Doukkala Farm", origin: "Maroc", emoji: "🍅", buy: 0.71, prev: 0.71, sell: 0.98, sup: "SUP-007" },
  { ref: "AKW-CNS-012", name: "Maquereaux sauce tomate 200g", cat: "Conserves", sub: "Poisson", brand: "Océan Bleu", origin: "Maroc", emoji: "🥫", buy: 1.42, prev: 1.35, sell: 1.95, sup: "SUP-002", avail: "Stock limité" },
  { ref: "AKW-DAT-002", name: "Dattes Medjool premium 1kg", cat: "Fruits secs", sub: "Dattes", brand: "Palmeraie Royale", origin: "Maroc", emoji: "🌴", buy: 6.35, prev: 5.9, sell: 8.9, sup: "SUP-003" },
  { ref: "AKW-DAT-007", name: "Dattes Boufeggous 5kg", cat: "Fruits secs", sub: "Dattes", brand: "Palmeraie Royale", origin: "Maroc", emoji: "📦", buy: 22.4, prev: 21.9, sell: 29.9, sup: "SUP-003" },
  { ref: "AKW-CPR-004", name: "Câpres fines au vinaigre 500g", cat: "Épicerie fine", sub: "Condiments", brand: "Terroir Rif", origin: "Maroc", emoji: "🫙", buy: 2.7, prev: 2.55, sell: 3.75, sup: "SUP-007" },
  { ref: "AKW-EPC-011", name: "Épices ras el hanout 250g", cat: "Épices", sub: "Mélanges", brand: "Souk Épices", origin: "Maroc", emoji: "🌶️", buy: 1.62, prev: 1.5, sell: 2.4, sup: "SUP-004" },
  { ref: "AKW-EPC-015", name: "Cumin moulu 500g", cat: "Épices", sub: "Mono-épices", brand: "Souk Épices", origin: "Maroc", emoji: "🧂", buy: 2.05, prev: 2.2, sell: 2.85, sup: "SUP-004" },
  { ref: "AKW-EPC-018", name: "Safran pur filaments 2g", cat: "Épices", sub: "Épices rares", brand: "Taliouine Or", origin: "Maroc", emoji: "🌸", buy: 6.8, prev: 6.1, sell: 11.5, sup: "SUP-004", toCheck: true },
  { ref: "AKW-CSC-006", name: "Couscous moyen 5kg", cat: "Céréales", sub: "Semoule", brand: "Chaouia", origin: "Maroc", emoji: "🌾", buy: 4.4, prev: 4.25, sell: 6.2, sup: "SUP-005" },
  { ref: "AKW-CSC-010", name: "Couscous fin 1kg", cat: "Céréales", sub: "Semoule", brand: "Chaouia", origin: "Maroc", emoji: "🍚", buy: 0.95, prev: 0.92, sell: 1.35, sup: "SUP-005" },
  { ref: "AKW-THE-009", name: "Thé vert gunpowder 500g", cat: "Boissons", sub: "Thé", brand: "Menthe Royale", origin: "Chine / Maroc", emoji: "🍵", buy: 2.85, prev: 2.7, sell: 4.0, sup: "SUP-006" },
  { ref: "AKW-THE-016", name: "Thé à la menthe infusettes x100", cat: "Boissons", sub: "Thé", brand: "Menthe Royale", origin: "Maroc", emoji: "🌿", buy: 2.3, prev: 2.3, sell: 3.4, sup: "SUP-006", avail: "Rupture", status: "Inactif" },
  { ref: "AKW-CNF-014", name: "Confiture d'abricot 380g", cat: "Épicerie fine", sub: "Confitures", brand: "Terroir Rif", origin: "Maroc", emoji: "🍑", buy: 1.5, prev: 1.42, sell: 2.15, sup: "SUP-007" },
  { ref: "AKW-CNF-019", name: "Miel d'oranger 500g", cat: "Épicerie fine", sub: "Miel", brand: "Terroir Rif", origin: "Maroc", emoji: "🍯", buy: 5.4, prev: 5.0, sell: 7.9, sup: "SUP-007", avail: "Sur commande" },
  { ref: "AKW-OLI-020", name: "Olives vertes cassées 5kg", cat: "Conserves", sub: "Olives", brand: "Terroir Rif", origin: "Maroc", emoji: "🫒", buy: 8.9, prev: 8.4, sell: 12.4, sup: "SUP-007" },
  { ref: "AKW-HRS-021", name: "Harissa en tube 140g", cat: "Épices", sub: "Sauces", brand: "Souk Épices", origin: "Maroc", emoji: "🌶️", buy: 0.82, prev: 0.78, sell: 1.25, sup: "SUP-004" },
  { ref: "AKW-AMD-022", name: "Amandes décortiquées 1kg", cat: "Fruits secs", sub: "Amandes", brand: "Palmeraie Royale", origin: "Maroc", emoji: "🌰", buy: 9.6, prev: 9.1, sell: 13.2, sup: "SUP-003", avail: "Stock limité" },
  { ref: "AKW-PSS-023", name: "Pâtes couscous perlé 1kg", cat: "Céréales", sub: "Pâtes", brand: "Chaouia", origin: "Maroc", emoji: "🍝", buy: 1.15, prev: 1.15, sell: 1.65, sup: "SUP-005" },
  { ref: "AKW-EAU-024", name: "Eau de fleur d'oranger 250ml", cat: "Épicerie fine", sub: "Arômes", brand: "Souss Nature", origin: "Maroc", emoji: "💧", buy: 1.05, prev: 0.98, sell: 1.6, sup: "SUP-001" },
  { ref: "AKW-CNS-025", name: "Thon à l'huile d'olive 160g", cat: "Conserves", sub: "Poisson", brand: "Océan Bleu", origin: "Maroc", emoji: "🐠", buy: 1.95, prev: 1.8, sell: 2.75, sup: "SUP-002", toCheck: true },
];

function makeProduct(c: (typeof catalog)[number], i: number): Product {
  const margin = c.sell - c.buy;
  return {
    ref: c.ref,
    name: c.name,
    description: `${c.name} — qualité export AKWA, conditionnée selon les standards internationaux et destinée aux marchés d'Afrique de l'Ouest et d'Europe.`,
    brand: c.brand,
    category: c.cat,
    subCategory: c.sub,
    barcode: `611${(1000000 + i * 7331).toString().slice(0, 7)}${i}`,
    supplierSku: `${c.sup}-${c.ref.slice(-3)}`,
    origin: c.origin,
    saleUnit: "Unité",
    packaging: `Carton de ${12 + (i % 3) * 6} unités`,
    status: c.status ?? "Actif",
    availability: c.avail ?? "Disponible",
    emoji: c.emoji,
    currency: "EUR",
    purchasePrice: c.buy,
    previousPurchasePrice: c.prev,
    salePrice: c.sell,
    minPrice: Number((c.buy * 1.27).toFixed(2)),
    recommendedPrice: Number((c.sell * 1.04).toFixed(2)),
    priceUpdatedAt: iso("2026-08-01T09:00:00"),
    priceUpdatedBy: i % 3 === 0 ? "Yassine Bennani" : CURRENT_USER.name,
    priceToCheck: c.toCheck ?? false,
    priceHistory: [
      { date: iso("2026-04-01T00:00:00"), price: Number((c.prev * 0.96).toFixed(2)) },
      { date: iso("2026-06-15T00:00:00"), price: c.prev },
      { date: iso("2026-08-01T00:00:00"), price: c.buy },
    ],
    logistics: {
      unitWeight: Number((0.2 + (i % 7) * 0.35).toFixed(2)),
      grossWeight: Number((0.25 + (i % 7) * 0.37).toFixed(2)),
      dimensions: `${8 + (i % 4)} × ${8 + (i % 3)} × ${20 + (i % 5)} cm`,
      volume: Number((0.018 + (i % 5) * 0.004).toFixed(3)),
      unitsPerCarton: 12 + (i % 3) * 6,
      cartonsPerPallet: 60 + (i % 4) * 10,
      unitsPerPallet: (12 + (i % 3) * 6) * (60 + (i % 4) * 10),
      palletType: "Europe 120 × 80 (EUR1)",
      storageTemp: c.cat === "Conserves" ? "5 °C à 25 °C" : "15 °C à 22 °C",
      storageConditions: "À l'abri de la lumière et de l'humidité",
      shelfLife: `${12 + (i % 4) * 6} mois`,
      hsCode: `${1509 + (i % 9)}.${10 + (i % 8)}`,
      dangerous: false,
      healthCertificate: c.cat === "Conserves" || c.cat === "Épicerie fine",
      phytoCertificate: c.cat === "Fruits secs" || c.cat === "Céréales" || c.cat === "Épices",
    },
    suppliers: [
      {
        supplierId: c.sup,
        price: c.buy,
        minOrder: 500 + (i % 4) * 250,
        leadTime: `${7 + (i % 3) * 4} jours`,
        paymentTerms: i % 2 ? "30 jours fin de mois" : "50 % commande / 50 % livraison",
        primary: true,
        lastOrder: iso("2026-07-1" + (i % 9) + "T10:00:00"),
        availability: c.avail ?? "Disponible",
      },
      {
        supplierId: suppliers[(suppliers.findIndex((s) => s.id === c.sup) + 3) % suppliers.length].id,
        price: Number((c.buy * 1.06).toFixed(2)),
        minOrder: 1000,
        leadTime: "14 jours",
        paymentTerms: "30 jours",
        primary: false,
        lastOrder: iso("2026-05-20T10:00:00"),
        availability: "Sur commande",
      },
    ],
    documents: [
      { id: uid(), name: `Fiche technique ${c.ref}.pdf`, type: "Fiche technique", addedAt: iso("2026-03-12T10:00:00"), addedBy: CURRENT_USER.name },
      { id: uid(), name: `Certificat sanitaire ${c.ref}.pdf`, type: "Certificat", addedAt: iso("2026-05-04T10:00:00"), addedBy: "Yassine Bennani" },
    ],
    updatedAt: iso("2026-08-0" + (1 + (i % 8)) + "T14:20:00"),
    history: [
      { at: iso("2026-08-01T09:00:00"), user: CURRENT_USER.name, action: "Prix d'achat modifié", from: `${c.prev} €`, to: `${c.buy} €` },
      { at: iso("2026-06-15T11:30:00"), user: "Yassine Bennani", action: "Prix de vente indicatif modifié", from: `${(c.sell * 0.96).toFixed(2)} €`, to: `${c.sell} €` },
      { at: iso("2026-03-12T10:00:00"), user: CURRENT_USER.name, action: "Produit créé" },
    ],
  };
}

let products: Product[] = catalog.map(makeProduct);

export const productMargin = (p: Product) => p.salePrice - p.purchasePrice;
export const productMarginPct = (p: Product) => (p.salePrice ? (productMargin(p) / p.salePrice) * 100 : 0);

/* ------------------------------------------------------------------ */
/* Seeds — clients                                                     */
/* ------------------------------------------------------------------ */

const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août"];

function monthly(base: number, seed: number) {
  return months.map((m, i) => {
    const ca = Math.round(base * (0.7 + ((i * 13 + seed * 7) % 60) / 100));
    return { month: m, ca, orders: 1 + ((i + seed) % 4), margin: Math.round(ca * 0.19), paid: Math.round(ca * 0.82) };
  });
}

const clients: Client[] = [
  {
    id: "MAD-001", name: "Maison Atlas Distribution", legalName: "Maison Atlas Distribution SARL", ice: "CI-2024-8891234",
    country: "Côte d'Ivoire", city: "Abidjan", address: "Zone industrielle de Yopougon, Lot 42", zip: "01 BP 3345",
    website: "www.atlas-distribution.ci", email: "contact@atlas-distribution.ci", phone: "+225 27 21 45 88 10",
    contactMain: "Jean Kouassi", contactFinance: "Aïcha Traoré", contactLogistics: "Marc Adjé",
    language: "Français", currency: "EUR", incoterm: "CIF", paymentTerms: "50 % à la commande / 50 % avant embarquement",
    transport: "Maritime conteneur complet", since: iso("2024-03-04T00:00:00"), manager: CURRENT_USER.name,
    status: "Actif", priority: "Stratégique", paymentRisk: "Faible", score: 92,
    revenueTotal: 684500, revenueYear: 318900, ordersCount: 18, activeOrders: 3, margin: 118400,
    paid: 596200, balance: 88300, quoteAcceptRate: 87, avgPaymentDelay: 27, lastOrder: iso("2026-08-02T00:00:00"),
    monthly: monthly(42000, 1),
    byCategory: [
      { name: "Conserves", value: 214000 }, { name: "Huile & épicerie", value: 186000 },
      { name: "Fruits secs", value: 118000 }, { name: "Épices", value: 92500 }, { name: "Céréales", value: 74000 },
    ],
    topProducts: [
      { name: "Sardines à l'huile 125g", value: 96400 }, { name: "Huile d'olive extra vierge 1L", value: 88200 },
      { name: "Dattes Medjool premium 1kg", value: 61500 }, { name: "Couscous moyen 5kg", value: 42300 },
    ],
    destinations: [{ name: "Abidjan", value: 512000 }, { name: "Bouaké", value: 118500 }, { name: "San Pedro", value: 54000 }],
    notes: [
      { id: uid(), at: iso("2026-07-18T10:12:00"), author: CURRENT_USER.name, category: "Commercial", text: "Client stratégique Afrique de l'Ouest — prioriser les réponses sous 24 h." },
      { id: uid(), at: iso("2026-07-02T09:40:00"), author: "Yassine Bennani", category: "Logistique", text: "Très sensible aux délais de livraison, prévenir en cas de décalage d'ETD." },
      { id: uid(), at: iso("2026-06-11T15:05:00"), author: CURRENT_USER.name, category: "Financier", text: "Préférence pour des conditions de paiement 50/50." },
      { id: uid(), at: iso("2026-05-28T11:20:00"), author: CURRENT_USER.name, category: "Commercial", text: "Demande souvent une négociation du fret maritime." },
    ],
  },
  {
    id: "SDG-002", name: "Sénégal Import Négoce", legalName: "SIN SUARL", ice: "SN-2023-114455",
    country: "Sénégal", city: "Dakar", address: "Km 4,5 Boulevard du Centenaire", zip: "BP 21455",
    website: "www.sin-dakar.sn", email: "achats@sin-dakar.sn", phone: "+221 33 869 44 21",
    contactMain: "Fatou Ndiaye", contactFinance: "Cheikh Fall", contactLogistics: "Ibrahima Sow",
    language: "Français", currency: "EUR", incoterm: "FOB", paymentTerms: "30 % à la commande / 70 % à réception",
    transport: "Maritime groupage", since: iso("2023-09-15T00:00:00"), manager: "Yassine Bennani",
    status: "Actif", priority: "Important", paymentRisk: "Modéré", score: 78,
    revenueTotal: 512300, revenueYear: 241800, ordersCount: 14, activeOrders: 2, margin: 88600,
    paid: 448000, balance: 64300, quoteAcceptRate: 74, avgPaymentDelay: 41, lastOrder: iso("2026-07-28T00:00:00"),
    monthly: monthly(31000, 2),
    byCategory: [{ name: "Conserves", value: 188000 }, { name: "Céréales", value: 142000 }, { name: "Épices", value: 96000 }, { name: "Huile & épicerie", value: 86300 }],
    topProducts: [{ name: "Sardines à l'huile 125g", value: 121000 }, { name: "Couscous moyen 5kg", value: 78500 }, { name: "Épices ras el hanout 250g", value: 44000 }],
    destinations: [{ name: "Dakar", value: 452000 }, { name: "Thiès", value: 60300 }],
    notes: [{ id: uid(), at: iso("2026-06-20T14:00:00"), author: "Yassine Bennani", category: "Risque", text: "Retards de paiement récurrents de 10 à 15 jours — exiger un acompte." }],
  },
  {
    id: "CMR-003", name: "Douala Food Services", legalName: "DFS SA", ice: "CM-2025-778812",
    country: "Cameroun", city: "Douala", address: "Rue Njo-Njo, Bonapriso", zip: "BP 5521",
    website: "www.doualafood.cm", email: "info@doualafood.cm", phone: "+237 233 42 18 77",
    contactMain: "Paul Mbarga", contactFinance: "Estelle Ngo", contactLogistics: "Alain Etoa",
    language: "Français", currency: "EUR", incoterm: "CFR", paymentTerms: "Paiement à 45 jours",
    transport: "Maritime conteneur complet", since: iso("2025-01-22T00:00:00"), manager: CURRENT_USER.name,
    status: "Actif", priority: "Standard", paymentRisk: "Modéré", score: 71,
    revenueTotal: 296400, revenueYear: 164200, ordersCount: 9, activeOrders: 1, margin: 51200,
    paid: 254000, balance: 42400, quoteAcceptRate: 68, avgPaymentDelay: 52, lastOrder: iso("2026-07-15T00:00:00"),
    monthly: monthly(21000, 3),
    byCategory: [{ name: "Fruits secs", value: 118000 }, { name: "Épicerie fine", value: 96400 }, { name: "Boissons", value: 82000 }],
    topProducts: [{ name: "Dattes Medjool premium 1kg", value: 92000 }, { name: "Confiture d'abricot 380g", value: 51000 }],
    destinations: [{ name: "Douala", value: 296400 }],
    notes: [],
  },
  {
    id: "MLI-004", name: "Bamako Trading Group", legalName: "BTG SARL", ice: "ML-2022-330091",
    country: "Mali", city: "Bamako", address: "Quartier du Fleuve, Rue 312", zip: "BP 1180",
    website: "www.btg-mali.ml", email: "contact@btg-mali.ml", phone: "+223 20 22 66 41",
    contactMain: "Moussa Diarra", contactFinance: "Awa Coulibaly", contactLogistics: "Sekou Keita",
    language: "Français", currency: "EUR", incoterm: "DAP", paymentTerms: "Paiement comptant",
    transport: "Maritime + routier", since: iso("2022-11-08T00:00:00"), manager: "Yassine Bennani",
    status: "Actif", priority: "VIP", paymentRisk: "Faible", score: 88,
    revenueTotal: 731900, revenueYear: 288400, ordersCount: 22, activeOrders: 2, margin: 141300,
    paid: 705000, balance: 26900, quoteAcceptRate: 91, avgPaymentDelay: 18, lastOrder: iso("2026-08-05T00:00:00"),
    monthly: monthly(38000, 4),
    byCategory: [{ name: "Céréales", value: 264000 }, { name: "Épices", value: 188000 }, { name: "Conserves", value: 152000 }, { name: "Épicerie fine", value: 127900 }],
    topProducts: [{ name: "Couscous moyen 5kg", value: 164000 }, { name: "Épices ras el hanout 250g", value: 98000 }],
    destinations: [{ name: "Bamako", value: 640000 }, { name: "Sikasso", value: 91900 }],
    notes: [{ id: uid(), at: iso("2026-04-02T08:30:00"), author: CURRENT_USER.name, category: "Commercial", text: "Client VIP — remise fret négociée de 5 % sur les FCL." }],
  },
  {
    id: "GUI-005", name: "Conakry Distribution", legalName: "CD SARL", ice: "GN-2025-556677",
    country: "Guinée", city: "Conakry", address: "Kaloum, Avenue de la République", zip: "BP 890",
    website: "www.conakry-dist.gn", email: "achats@conakry-dist.gn", phone: "+224 622 45 11 09",
    contactMain: "Mariama Barry", contactFinance: "Ousmane Camara", contactLogistics: "Alpha Diallo",
    language: "Français", currency: "EUR", incoterm: "CIF", paymentTerms: "50 % / 50 %",
    transport: "Maritime groupage", since: iso("2025-06-12T00:00:00"), manager: CURRENT_USER.name,
    status: "Actif", priority: "Standard", paymentRisk: "Élevé", score: 58,
    revenueTotal: 148700, revenueYear: 98200, ordersCount: 6, activeOrders: 1, margin: 24100,
    paid: 108000, balance: 40700, quoteAcceptRate: 62, avgPaymentDelay: 64, lastOrder: iso("2026-06-30T00:00:00"),
    monthly: monthly(12000, 5),
    byCategory: [{ name: "Conserves", value: 78000 }, { name: "Huile & épicerie", value: 44700 }, { name: "Épices", value: 26000 }],
    topProducts: [{ name: "Sardines à l'huile 125g", value: 62000 }],
    destinations: [{ name: "Conakry", value: 148700 }],
    notes: [{ id: uid(), at: iso("2026-05-15T16:10:00"), author: "Yassine Bennani", category: "Risque", text: "Solde à recevoir élevé — bloquer toute nouvelle expédition sans acompte." }],
  },
  {
    id: "MRT-006", name: "Nouakchott Négoce", legalName: "NN SARL", ice: "MR-2026-112233",
    country: "Mauritanie", city: "Nouakchott", address: "Tevragh Zeina, Îlot K", zip: "BP 4412",
    website: "www.nn-negoce.mr", email: "contact@nn-negoce.mr", phone: "+222 45 29 88 41",
    contactMain: "Ahmed Ould Salem", contactFinance: "Leila Mint", contactLogistics: "Sidi Mohamed",
    language: "Français", currency: "EUR", incoterm: "FOB", paymentTerms: "Paiement comptant",
    transport: "Routier", since: iso("2026-07-02T00:00:00"), manager: CURRENT_USER.name,
    status: "Prospect", priority: "Standard", paymentRisk: "Modéré", score: 49,
    revenueTotal: 38200, revenueYear: 38200, ordersCount: 2, activeOrders: 1, margin: 6900,
    paid: 20000, balance: 18200, quoteAcceptRate: 50, avgPaymentDelay: 22, lastOrder: iso("2026-07-24T00:00:00"),
    monthly: monthly(5000, 6),
    byCategory: [{ name: "Céréales", value: 22000 }, { name: "Conserves", value: 16200 }],
    topProducts: [{ name: "Couscous fin 1kg", value: 18400 }],
    destinations: [{ name: "Nouakchott", value: 38200 }],
    notes: [],
  },
];

/* ------------------------------------------------------------------ */
/* Seeds — commandes                                                   */
/* ------------------------------------------------------------------ */

const p = (ref: string) => products.find((x) => x.ref === ref)!;
const item = (ref: string, quantity: number, unit: string, unitPrice?: number): OrderItem => {
  const pr = p(ref);
  return { ref, label: pr.name, quantity, unit, unitPrice: unitPrice ?? pr.salePrice, purchasePrice: pr.purchasePrice };
};

const atlasItems: OrderItem[] = [
  item("AKW-OLV-001", 2400, "bouteilles"),
  item("AKW-CNS-003", 4800, "boîtes"),
  item("AKW-CNS-008", 3000, "boîtes"),
  item("AKW-DAT-002", 900, "sachets"),
  item("AKW-CPR-004", 400, "bocaux"),
  item("AKW-EPC-011", 800, "sachets"),
  item("AKW-CSC-006", 400, "sacs"),
  item("AKW-THE-009", 280, "paquets"),
];

let orders: AdminOrder[] = [
  {
    reference: "AKW-EXP-2026-0187", clientId: "MAD-001", destination: "Abidjan, Côte d'Ivoire",
    receivedAt: iso("2026-08-10T09:12:00"), channel: "Portail client", priority: "Haute",
    status: "Commande reçue", commercial: CURRENT_USER.name, exportManager: "Yassine Bennani",
    incoterm: "CIF", currency: "EUR", portDeparture: "Casablanca", portDestination: "Abidjan",
    items: atlasItems,
    costs: { goods: 31400, preparation: 850, localTransport: 1100, freight: 3900, insurance: 650, documents: 300, other: 250 },
    quoteDeadline: iso("2026-08-12T18:00:00"), shipDeadline: iso("2026-08-26T00:00:00"),
    risk: "Faible", missingDocs: ["Certificat d'origine signé"],
    internalNotes: [
      { id: uid(), at: iso("2026-08-10T09:40:00"), author: CURRENT_USER.name, text: "Confirmer disponibilité sardines avant génération du devis.", tag: "Approvisionnement", mentions: ["Yassine Bennani"] },
      { id: uid(), at: iso("2026-08-10T09:52:00"), author: "Yassine Bennani", text: "Possibilité de négocier le fret jusqu'à 3 700 €.", tag: "Fret", mentions: [] },
      { id: uid(), at: iso("2026-08-10T10:05:00"), author: CURRENT_USER.name, text: "Client souhaite réception avant début septembre.", tag: "Délai", mentions: [] },
    ],
  },
  {
    reference: "AKW-EXP-2026-0193", clientId: "SDG-002", destination: "Dakar, Sénégal",
    receivedAt: iso("2026-08-05T11:00:00"), channel: "Portail client", priority: "Normale",
    status: "Devis envoyé – En attente client", commercial: "Yassine Bennani", exportManager: "Yassine Bennani",
    incoterm: "FOB", currency: "EUR", portDeparture: "Casablanca", portDestination: "Dakar",
    items: [item("AKW-OLV-002", 320, "bidons"), item("AKW-CNS-003", 6000, "boîtes", 1.62), item("AKW-CSC-006", 1200, "sacs", 6.1), item("AKW-EPC-011", 2200, "sachets", 2.3)],
    costs: { goods: 21800, preparation: 700, localTransport: 900, freight: 3100, insurance: 480, documents: 280, other: 200 },
    quoteDeadline: iso("2026-08-07T18:00:00"), shipDeadline: iso("2026-08-22T00:00:00"),
    risk: "Modéré", missingDocs: [], internalNotes: [], quoteFamily: "DEV-AKW-2026-0193", validatedAt: iso("2026-08-05T14:00:00"), validatedBy: CURRENT_USER.name,
  },
  {
    reference: "AKW-EXP-2026-0201", clientId: "CMR-003", destination: "Douala, Cameroun",
    receivedAt: iso("2026-08-08T15:30:00"), channel: "Email", priority: "Normale",
    status: "Commande reçue", commercial: CURRENT_USER.name, exportManager: "Yassine Bennani",
    incoterm: "CFR", currency: "EUR", portDeparture: "Casablanca", portDestination: "Douala",
    items: [item("AKW-DAT-002", 1500, "sachets", 8.7), item("AKW-CNF-014", 2000, "bocaux", 2.15), item("AKW-THE-009", 1000, "paquets", 4.2)],
    costs: { goods: 15900, preparation: 620, localTransport: 780, freight: 3400, insurance: 420, documents: 260, other: 180 },
    quoteDeadline: iso("2026-08-11T18:00:00"), shipDeadline: iso("2026-08-29T00:00:00"),
    risk: "Modéré", missingDocs: ["Fiche technique dattes"], internalNotes: [],
  },
  {
    reference: "AKW-EXP-2026-0176", clientId: "MLI-004", destination: "Bamako, Mali",
    receivedAt: iso("2026-06-02T08:45:00"), channel: "Commercial terrain", priority: "Haute",
    status: "Devis accepté", commercial: "Yassine Bennani", exportManager: "Yassine Bennani",
    incoterm: "DAP", currency: "EUR", portDeparture: "Casablanca", portDestination: "Abidjan (transit Bamako)",
    items: [item("AKW-EPC-011", 2200, "sachets", 2.35), item("AKW-CNF-014", 1800, "bocaux", 2.05), item("AKW-CPR-004", 900, "bocaux", 3.55)],
    costs: { goods: 9800, preparation: 640, localTransport: 1180, freight: 3200, insurance: 380, documents: 240, other: 160 },
    quoteDeadline: iso("2026-06-05T18:00:00"), shipDeadline: iso("2026-06-25T00:00:00"),
    risk: "Faible", missingDocs: [], internalNotes: [], quoteFamily: "DEV-AKW-2026-0176", validatedAt: iso("2026-06-02T12:00:00"), validatedBy: "Yassine Bennani",
  },
  {
    reference: "AKW-EXP-2026-0169", clientId: "GUI-005", destination: "Conakry, Guinée",
    receivedAt: iso("2026-06-25T10:10:00"), channel: "Portail client", priority: "Basse",
    status: "Révision devis", commercial: CURRENT_USER.name, exportManager: "Yassine Bennani",
    incoterm: "CIF", currency: "EUR", portDeparture: "Casablanca", portDestination: "Conakry",
    items: [item("AKW-CNS-003", 3200, "boîtes", 1.7), item("AKW-OLV-001", 800, "bouteilles", 6.6)],
    costs: { goods: 8600, preparation: 480, localTransport: 700, freight: 2900, insurance: 300, documents: 220, other: 140 },
    quoteDeadline: iso("2026-06-28T18:00:00"), shipDeadline: iso("2026-07-20T00:00:00"),
    risk: "Élevé", missingDocs: ["Acompte 50 %"], internalNotes: [], quoteFamily: "DEV-AKW-2026-0169",
  },
  {
    reference: "AKW-EXP-2026-0205", clientId: "MRT-006", destination: "Nouakchott, Mauritanie",
    receivedAt: iso("2026-08-09T17:05:00"), channel: "Téléphone", priority: "Normale",
    status: "Commande reçue", commercial: CURRENT_USER.name, exportManager: "Yassine Bennani",
    incoterm: "FOB", currency: "EUR", portDeparture: "Casablanca", portDestination: "Nouakchott",
    items: [item("AKW-CSC-010", 4000, "paquets"), item("AKW-CNS-012", 2500, "boîtes")],
    costs: { goods: 8400, preparation: 380, localTransport: 950, freight: 1800, insurance: 260, documents: 200, other: 120 },
    quoteDeadline: iso("2026-08-13T18:00:00"), shipDeadline: iso("2026-09-02T00:00:00"),
    risk: "Modéré", missingDocs: [], internalNotes: [],
  },
];

/* ------------------------------------------------------------------ */
/* Seeds — devis AKWA                                                  */
/* ------------------------------------------------------------------ */

const fee = (type: FeeType, description: string, cost: number, price: number, at: string, by = CURRENT_USER.name): Fee => ({
  id: uid(), type, description, cost, price, quantity: 1, vat: 0, comment: "", createdBy: by, createdAt: at,
});

function conditionsFor(o: AdminOrder, paymentTerms: string) {
  return {
    incoterm: o.incoterm, currency: "EUR", paymentTerms,
    preparationDelay: "12 jours ouvrés",
    etd: iso("2026-08-24T00:00:00"), eta: iso("2026-09-08T00:00:00"),
    portDeparture: o.portDeparture, portDestination: o.portDestination,
    transportMode: "Maritime — conteneur 40' HC",
    notes: "Marchandises conformes aux standards export AKWA.",
    specialTerms: "Prix fermes jusqu'à la date de validité indiquée.",
  };
}

let adminQuotes: AdminQuote[] = [
  {
    id: "DEV-AKW-2026-0187-V1", family: "DEV-AKW-2026-0187", version: 1, orderRef: "AKW-EXP-2026-0187", clientId: "MAD-001",
    status: "À valider client", createdAt: iso("2026-08-10T11:40:00"), createdBy: CURRENT_USER.name, validatedBy: "Yassine Bennani",
    sentAt: iso("2026-08-10T11:44:00"), validUntil: iso("2026-08-17T00:00:00"), updatedAt: iso("2026-08-10T11:44:00"),
    items: atlasItems,
    fees: [
      fee("Fret maritime", "Casablanca → Abidjan, 1 × 40' HC", 3900, 4350, iso("2026-08-10T11:31:00")),
      fee("Assurance", "Assurance marchandises 110 % valeur CIF", 650, 750, iso("2026-08-10T11:34:00")),
      fee("Frais de préparation", "Préparation, palettisation et contrôle qualité", 850, 1250, iso("2026-08-10T11:36:00")),
      fee("Transport local", "Pré-acheminement usine → port de Casablanca", 1100, 1650, iso("2026-08-10T11:37:00")),
      fee("Documentation export", "Certificat d'origine, EUR1, connaissement", 300, 750, iso("2026-08-10T11:38:00")),
    ],
    conditions: conditionsFor(orders[0], "50 % à la commande / 50 % avant embarquement"),
    history: [
      { at: iso("2026-08-10T11:20:00"), user: CURRENT_USER.name, label: "Commande validée" },
      { at: iso("2026-08-10T11:28:00"), user: CURRENT_USER.name, label: "Agent Devis lancé" },
      { at: iso("2026-08-10T11:31:00"), user: CURRENT_USER.name, label: "Fret ajouté", detail: "4 350 €" },
      { at: iso("2026-08-10T11:34:00"), user: CURRENT_USER.name, label: "Assurance ajoutée", detail: "750 €" },
      { at: iso("2026-08-10T11:40:00"), user: CURRENT_USER.name, label: "Devis généré", detail: "48 750 €" },
      { at: iso("2026-08-10T11:43:00"), user: "Yassine Bennani", label: "Devis validé" },
      { at: iso("2026-08-10T11:44:00"), user: "Système", label: "Devis envoyé au client" },
      { at: iso("2026-08-10T13:14:00"), user: "Maison Atlas Distribution", label: "Devis consulté par le client" },
    ],
  },
  {
    id: "DEV-AKW-2026-0193-V1", family: "DEV-AKW-2026-0193", version: 1, orderRef: "AKW-EXP-2026-0193", clientId: "SDG-002",
    status: "À valider client", createdAt: iso("2026-08-05T14:20:00"), createdBy: "Yassine Bennani", validatedBy: CURRENT_USER.name,
    sentAt: iso("2026-08-05T14:35:00"), validUntil: iso("2026-08-12T00:00:00"), updatedAt: iso("2026-08-05T14:35:00"),
    items: orders[1].items,
    fees: [
      fee("Fret maritime", "Casablanca → Dakar groupage", 3100, 3500, iso("2026-08-05T14:22:00"), "Yassine Bennani"),
      fee("Assurance", "Assurance marchandises", 480, 560, iso("2026-08-05T14:24:00"), "Yassine Bennani"),
      fee("Frais de préparation", "Préparation export", 700, 980, iso("2026-08-05T14:26:00"), "Yassine Bennani"),
    ],
    conditions: conditionsFor(orders[1], "30 % à la commande / 70 % à réception"),
    history: [
      { at: iso("2026-08-05T14:00:00"), user: "Yassine Bennani", label: "Commande validée" },
      { at: iso("2026-08-05T14:20:00"), user: "Yassine Bennani", label: "Devis généré" },
      { at: iso("2026-08-05T14:35:00"), user: "Système", label: "Devis envoyé au client" },
    ],
  },
  {
    id: "DEV-AKW-2026-0176-V1", family: "DEV-AKW-2026-0176", version: 1, orderRef: "AKW-EXP-2026-0176", clientId: "MLI-004",
    status: "Accepté", createdAt: iso("2026-06-02T12:30:00"), createdBy: "Yassine Bennani", validatedBy: CURRENT_USER.name,
    sentAt: iso("2026-06-02T13:00:00"), respondedAt: iso("2026-06-04T09:20:00"), validUntil: iso("2026-06-12T00:00:00"),
    updatedAt: iso("2026-06-04T09:20:00"),
    items: orders[3].items,
    fees: [
      fee("Fret maritime", "Casablanca → Abidjan puis routier Bamako", 3200, 3650, iso("2026-06-02T12:32:00"), "Yassine Bennani"),
      fee("Transport local", "Acheminement routier Abidjan – Bamako", 1180, 1600, iso("2026-06-02T12:34:00"), "Yassine Bennani"),
      fee("Assurance", "Assurance tous risques", 380, 460, iso("2026-06-02T12:36:00"), "Yassine Bennani"),
    ],
    conditions: conditionsFor(orders[3], "Paiement comptant"),
    history: [
      { at: iso("2026-06-02T12:30:00"), user: "Yassine Bennani", label: "Devis généré" },
      { at: iso("2026-06-02T13:00:00"), user: "Système", label: "Devis envoyé au client" },
      { at: iso("2026-06-04T09:20:00"), user: "Bamako Trading Group", label: "Devis accepté par le client" },
    ],
  },
  {
    id: "DEV-AKW-2026-0169-V1", family: "DEV-AKW-2026-0169", version: 1, orderRef: "AKW-EXP-2026-0169", clientId: "GUI-005",
    status: "Refusé", createdAt: iso("2026-06-25T15:00:00"), createdBy: CURRENT_USER.name, validatedBy: CURRENT_USER.name,
    sentAt: iso("2026-06-25T15:20:00"), respondedAt: iso("2026-06-27T10:05:00"), validUntil: iso("2026-07-05T00:00:00"),
    updatedAt: iso("2026-06-27T10:05:00"),
    items: orders[4].items,
    fees: [
      fee("Fret maritime", "Casablanca → Conakry", 2900, 3350, iso("2026-06-25T15:02:00")),
      fee("Assurance", "Assurance marchandises", 300, 380, iso("2026-06-25T15:04:00")),
    ],
    conditions: conditionsFor(orders[4], "100 % à la commande"),
    history: [
      { at: iso("2026-06-25T15:00:00"), user: CURRENT_USER.name, label: "Devis généré" },
      { at: iso("2026-06-25T15:20:00"), user: "Système", label: "Devis envoyé au client" },
      { at: iso("2026-06-27T10:05:00"), user: "Conakry Distribution", label: "Devis refusé", detail: "Conditions de paiement" },
    ],
    refusal: { reason: "Conditions de paiement", message: "Nous souhaitons passer sur un paiement 50/50.", at: iso("2026-06-27T10:05:00") },
  },
];

/* ------------------------------------------------------------------ */
/* Activity log & notifications                                        */
/* ------------------------------------------------------------------ */

let activities: Activity[] = [
  { id: uid(), at: iso("2026-08-10T13:14:00"), user: "Maison Atlas Distribution", action: "Devis consulté", object: "DEV-AKW-2026-0187-V1" },
  { id: uid(), at: iso("2026-08-10T11:44:00"), user: "Système", action: "Devis envoyé", object: "DEV-AKW-2026-0187-V1" },
  { id: uid(), at: iso("2026-08-10T11:40:00"), user: CURRENT_USER.name, action: "Devis généré", object: "DEV-AKW-2026-0187-V1", to: "48 750 €" },
  { id: uid(), at: iso("2026-08-10T09:12:00"), user: "Maison Atlas Distribution", action: "Commande créée par le client", object: "AKW-EXP-2026-0187", to: "41 250 €" },
  { id: uid(), at: iso("2026-08-09T17:05:00"), user: "Nouakchott Négoce", action: "Commande créée", object: "AKW-EXP-2026-0205" },
  { id: uid(), at: iso("2026-08-08T15:30:00"), user: "Douala Food Services", action: "Commande créée", object: "AKW-EXP-2026-0201" },
  { id: uid(), at: iso("2026-08-01T09:00:00"), user: CURRENT_USER.name, action: "Prix produit modifié", object: "AKW-OLV-001", from: "4,40 €", to: "4,65 €" },
  { id: uid(), at: iso("2026-06-27T10:05:00"), user: "Conakry Distribution", action: "Devis refusé", object: "DEV-AKW-2026-0169-V1", to: "Conditions de paiement" },
];

let notifications: AdminNotification[] = [
  { id: uid(), at: iso("2026-08-10T09:12:00"), title: "Nouvelle commande reçue", body: "AKW-EXP-2026-0187 — Maison Atlas Distribution (41 250 €). Validation requise.", tone: "warning", read: false, link: "/admin/commandes/AKW-EXP-2026-0187" },
  { id: uid(), at: iso("2026-08-09T17:05:00"), title: "Commande nécessitant validation", body: "AKW-EXP-2026-0205 — Nouakchott Négoce.", tone: "warning", read: false, link: "/admin/commandes/AKW-EXP-2026-0205" },
  { id: uid(), at: iso("2026-08-10T13:14:00"), title: "Client a consulté un devis", body: "Maison Atlas Distribution a ouvert DEV-AKW-2026-0187-V1.", tone: "info", read: false, link: "/admin/devis/DEV-AKW-2026-0187-V1" },
  { id: uid(), at: iso("2026-08-08T08:00:00"), title: "Devis expirant bientôt", body: "DEV-AKW-2026-0193-V1 expire le 12/08/2026.", tone: "warning", read: false, link: "/admin/devis/DEV-AKW-2026-0193-V1" },
  { id: uid(), at: iso("2026-06-27T10:05:00"), title: "Devis refusé", body: "Conakry Distribution — motif : conditions de paiement.", tone: "danger", read: true, link: "/admin/devis/DEV-AKW-2026-0169-V1" },
  { id: uid(), at: iso("2026-06-04T09:20:00"), title: "Devis accepté", body: "Bamako Trading Group a accepté DEV-AKW-2026-0176-V1.", tone: "success", read: true, link: "/admin/devis/DEV-AKW-2026-0176-V1" },
  { id: uid(), at: iso("2026-08-07T12:00:00"), title: "Produit indisponible", body: "AKW-THE-016 — Thé à la menthe infusettes x100 est en rupture.", tone: "danger", read: true, link: "/admin/produits/AKW-THE-016" },
  { id: uid(), at: iso("2026-08-01T09:05:00"), title: "Prix fournisseur modifié", body: "Huileries du Souss : +5,7 % sur AKW-OLV-001.", tone: "info", read: true, link: "/admin/produits/AKW-OLV-001" },
];

export type Email = { id: string; at: string; to: string; subject: string; body: string; quoteId: string; amount: number; validUntil: string };
let emails: Email[] = [];

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function log(action: string, object: string, extra?: { from?: string; to?: string; user?: string }) {
  activities = [{ id: uid(), at: now(), user: extra?.user ?? CURRENT_USER.name, action, object, from: extra?.from, to: extra?.to }, ...activities];
}

function notify(n: Omit<AdminNotification, "id" | "at" | "read">) {
  notifications = [{ id: uid(), at: now(), read: false, ...n }, ...notifications];
}

const snapshot = () => ({ products, clients, orders, adminQuotes, activities, notifications, emails, suppliers });
let cache = snapshot();
const refresh = () => { cache = snapshot(); emit(); };

function toClientQuote(q: AdminQuote): ClientQuote {
  const client = clients.find((c) => c.id === q.clientId)!;
  const order = orders.find((o) => o.reference === q.orderRef)!;
  const items: ClientQuoteItem[] = q.items.map((i) => ({ ref: i.ref, label: i.label, quantity: i.quantity, unit: i.unit, unitPrice: i.unitPrice }));
  const byType = (t: FeeType) => q.fees.filter((f) => f.type === t).reduce((s, f) => s + f.price * f.quantity, 0);
  const others = q.fees
    .filter((f) => !["Fret maritime", "Assurance", "Frais de préparation", "Transport local"].includes(f.type))
    .reduce((s, f) => s + f.price * f.quantity, 0);
  return {
    id: q.id, family: q.family, version: q.version, orderRef: q.orderRef, client: client.name,
    destination: order.destination, incoterm: q.conditions.incoterm,
    portDeparture: q.conditions.portDeparture, portDestination: q.conditions.portDestination,
    currency: "EUR", issuedAt: q.createdAt, validUntil: q.validUntil, status: "À valider",
    items,
    charges: {
      preparation: byType("Frais de préparation"),
      logistics: byType("Transport local") + others,
      freight: byType("Fret maritime"),
      insurance: byType("Assurance"),
    },
    paymentTerms: q.conditions.paymentTerms,
    preparationDelay: q.conditions.preparationDelay,
    etd: q.conditions.etd,
    notes: q.conditions.notes,
    timeline: [
      { id: uid(), at: q.createdAt, label: "Devis généré par AKWA", tone: "neutral" },
      { id: uid(), at: q.sentAt ?? now(), label: "Devis envoyé au client", tone: "info" },
    ],
    messages: [],
    audit: { sentAt: q.sentAt ?? now() },
  };
}

export const boStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
  get: () => cache,

  /* --- produits --- */
  getProduct: (ref: string) => products.find((x) => x.ref === ref),
  getSupplier: (id: string) => suppliers.find((s) => s.id === id),
  createProduct(input: Partial<Product> & { ref: string; name: string }) {
    const base = makeProduct(
      { ref: input.ref, name: input.name, cat: input.category ?? "Épicerie fine", sub: input.subCategory ?? "Divers", brand: input.brand ?? "AKWA", origin: input.origin ?? "Maroc", emoji: input.emoji ?? "📦", buy: input.purchasePrice ?? 1, prev: input.purchasePrice ?? 1, sell: input.salePrice ?? 1.5, sup: input.suppliers?.[0]?.supplierId ?? "SUP-001" },
      products.length,
    );
    const created: Product = { ...base, ...input, updatedAt: now(), history: [{ at: now(), user: CURRENT_USER.name, action: "Produit créé" }, ...base.history.slice(1)] };
    products = [created, ...products];
    log("Produit créé", created.ref, { to: created.name });
    notify({ title: "Produit créé", body: `${created.ref} — ${created.name}`, tone: "success", link: `/admin/produits/${created.ref}` });
    refresh();
    return created;
  },
  updateProduct(ref: string, patch: Partial<Product>, label = "Produit modifié") {
    products = products.map((x) => {
      if (x.ref !== ref) return x;
      const next: Product = { ...x, ...patch, updatedAt: now() };
      if (patch.purchasePrice !== undefined && patch.purchasePrice !== x.purchasePrice) {
        next.previousPurchasePrice = x.purchasePrice;
        next.priceHistory = [...x.priceHistory, { date: now(), price: patch.purchasePrice }];
        next.priceUpdatedAt = now();
        next.priceUpdatedBy = CURRENT_USER.name;
        log("Prix produit modifié", ref, { from: eur2(x.purchasePrice), to: eur2(patch.purchasePrice) });
      }
      next.history = [{ at: now(), user: CURRENT_USER.name, action: label }, ...x.history];
      return next;
    });
    refresh();
  },
  importProducts(rows: { ref: string; name: string; category: string; buy: number; sell: number }[], mode: "create" | "update" | "both") {
    let created = 0, updated = 0;
    rows.forEach((r) => {
      const existing = products.find((x) => x.ref === r.ref);
      if (existing) {
        if (mode === "create") return;
        boStore.updateProduct(r.ref, { purchasePrice: r.buy, salePrice: r.sell }, "Mise à jour par import");
        updated++;
      } else {
        if (mode === "update") return;
        boStore.createProduct({ ref: r.ref, name: r.name, category: r.category, purchasePrice: r.buy, salePrice: r.sell });
        created++;
      }
    });
    log("Import de produits", `${created + updated} lignes`, { to: `${created} créés / ${updated} mis à jour` });
    refresh();
    return { created, updated };
  },

  /* --- clients --- */
  getClient: (id: string) => clients.find((c) => c.id === id),
  clientOf: (order: AdminOrder) => clients.find((c) => c.id === order.clientId)!,
  addClientNote(id: string, note: Omit<ClientNote, "id" | "at" | "author">) {
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    c.notes = [{ id: uid(), at: now(), author: CURRENT_USER.name, ...note }, ...c.notes];
    log("Note interne ajoutée", id);
    refresh();
  },
  updateClient(id: string, patch: Partial<Client>) {
    const i = clients.findIndex((x) => x.id === id);
    if (i < 0) return;
    clients[i] = { ...clients[i], ...patch };
    log("Fiche client modifiée", id);
    refresh();
  },

  /* --- commandes --- */
  getOrder: (ref: string) => orders.find((o) => o.reference === ref),
  ordersOfClient: (clientId: string) => orders.filter((o) => o.clientId === clientId),
  setOrderStatus(ref: string, status: OrderStatus, detail?: string) {
    orders = orders.map((o) => (o.reference === ref ? { ...o, status } : o));
    log("Statut commande modifié", ref, { to: status, from: detail });
    refresh();
  },
  validateOrder(ref: string) {
    orders = orders.map((o) =>
      o.reference === ref ? { ...o, status: "Commande validée par AKWA" as OrderStatus, validatedAt: now(), validatedBy: CURRENT_USER.name } : o,
    );
    log("Commande validée", ref, { to: "Commande validée par AKWA" });
    notify({ title: "Commande validée", body: `${ref} est prête pour la génération du devis.`, tone: "success", link: `/admin/devis/generer/${ref}` });
    refresh();
  },
  addOrderNote(ref: string, note: Omit<InternalNote, "id" | "at" | "author">) {
    orders = orders.map((o) =>
      o.reference === ref ? { ...o, internalNotes: [{ id: uid(), at: now(), author: CURRENT_USER.name, ...note }, ...o.internalNotes] } : o,
    );
    log("Note interne commande", ref);
    refresh();
  },

  /* --- devis --- */
  getQuote: (id: string) => adminQuotes.find((q) => q.id === id),
  quotesOfOrder: (ref: string) => adminQuotes.filter((q) => q.orderRef === ref).sort((a, b) => b.version - a.version),
  quotesOfClient: (clientId: string) => adminQuotes.filter((q) => q.clientId === clientId),
  versionsOf: (family: string) => adminQuotes.filter((q) => q.family === family).sort((a, b) => a.version - b.version),

  /** Crée (ou récupère) le brouillon de devis pour une commande validée. */
  startDraft(ref: string): AdminQuote {
    const existing = adminQuotes.find((q) => q.orderRef === ref && q.status === "Brouillon");
    if (existing) return existing;
    const order = orders.find((o) => o.reference === ref)!;
    const client = clients.find((c) => c.id === order.clientId)!;
    const family = `DEV-${ref.replace("AKW-EXP-", "AKW-")}`;
    const version = adminQuotes.filter((q) => q.family === family).length + 1;
    const draft: AdminQuote = {
      id: `${family}-V${version}`, family, version, orderRef: ref, clientId: order.clientId,
      status: "Brouillon", createdAt: now(), createdBy: CURRENT_USER.name,
      validUntil: new Date(Date.now() + 7 * 86_400_000).toISOString(), updatedAt: now(),
      items: order.items.map((i) => ({ ...i })),
      fees: [],
      conditions: {
        incoterm: order.incoterm, currency: "EUR", paymentTerms: client.paymentTerms,
        preparationDelay: "12 jours ouvrés",
        etd: new Date(Date.now() + 14 * 86_400_000).toISOString(),
        eta: new Date(Date.now() + 29 * 86_400_000).toISOString(),
        portDeparture: order.portDeparture, portDestination: order.portDestination,
        transportMode: "Maritime — conteneur 40' HC",
        notes: "Marchandises conformes aux standards export AKWA.",
        specialTerms: "Prix fermes jusqu'à la date de validité indiquée.",
      },
      history: [{ at: now(), user: CURRENT_USER.name, label: "Agent Devis lancé", detail: `Reprise automatique de ${order.items.length} articles` }],
    };
    adminQuotes = [draft, ...adminQuotes];
    log("Agent Devis lancé", draft.id);
    refresh();
    return draft;
  },
  patchQuote(id: string, patch: Partial<AdminQuote>, historyLabel?: string, detail?: string) {
    adminQuotes = adminQuotes.map((q) =>
      q.id === id
        ? { ...q, ...patch, updatedAt: now(), history: historyLabel ? [...q.history, { at: now(), user: CURRENT_USER.name, label: historyLabel, detail }] : q.history }
        : q,
    );
    refresh();
  },
  addFee(id: string, f: Omit<Fee, "id" | "createdBy" | "createdAt">) {
    const q = adminQuotes.find((x) => x.id === id);
    if (!q) return;
    const nf: Fee = { id: uid(), createdBy: CURRENT_USER.name, createdAt: now(), ...f };
    boStore.patchQuote(id, { fees: [...q.fees, nf] }, `${f.type} ajouté`, eur(f.price * f.quantity));
    log("Frais ajouté", id, { to: `${f.type} ${eur(f.price * f.quantity)}` });
  },
  updateFee(id: string, feeId: string, patch: Partial<Fee>) {
    const q = adminQuotes.find((x) => x.id === id);
    if (!q) return;
    boStore.patchQuote(id, { fees: q.fees.map((f) => (f.id === feeId ? { ...f, ...patch } : f)) });
  },
  removeFee(id: string, feeId: string) {
    const q = adminQuotes.find((x) => x.id === id);
    if (!q) return;
    boStore.patchQuote(id, { fees: q.fees.filter((f) => f.id !== feeId) }, "Frais supprimé");
  },
  updateQuoteItem(id: string, ref: string, patch: Partial<OrderItem>) {
    const q = adminQuotes.find((x) => x.id === id);
    if (!q) return;
    boStore.patchQuote(id, { items: q.items.map((i) => (i.ref === ref ? { ...i, ...patch } : i)) });
  },
  saveDraft(id: string) {
    boStore.patchQuote(id, {}, "Brouillon enregistré");
    log("Brouillon de devis enregistré", id);
  },
  /** Valide, envoie au client, synchronise le portail client et simule l'email. */
  sendQuote(id: string) {
    const q = adminQuotes.find((x) => x.id === id);
    if (!q) return;
    const client = clients.find((c) => c.id === q.clientId)!;
    const total = quoteTotalTTC(q);
    const sentAt = now();
    boStore.patchQuote(id, { status: "À valider client", sentAt, validatedBy: CURRENT_USER.name }, "Devis validé et envoyé au client", eur(total));
    orders = orders.map((o) => (o.reference === q.orderRef ? { ...o, status: "Devis envoyé – En attente client" as OrderStatus, quoteFamily: q.family } : o));
    quotesStore.ingest(toClientQuote({ ...q, sentAt }));
    emails = [
      {
        id: uid(), at: sentAt, to: client.email,
        subject: `Votre devis AKWA – ${q.id}`,
        body: `Bonjour,\n\nVotre devis relatif à la commande ${q.orderRef} est maintenant disponible.\n\nMontant : ${eur(total)}\nValidité : ${dLong(q.validUntil)}\n\nVous pouvez le consulter depuis votre espace client.`,
        quoteId: q.id, amount: total, validUntil: q.validUntil,
      },
      ...emails,
    ];
    log("Devis envoyé", q.id, { to: eur(total) });
    notify({ title: "Devis envoyé au client", body: `${q.id} — ${client.name} (${eur(total)})`, tone: "success", link: `/admin/devis/${q.id}` });
    refresh();
  },
  createVersion(id: string): AdminQuote | undefined {
    const src = adminQuotes.find((x) => x.id === id);
    if (!src) return;
    const version = Math.max(...adminQuotes.filter((q) => q.family === src.family).map((q) => q.version)) + 1;
    const next: AdminQuote = {
      ...src,
      id: `${src.family}-V${version}`, version, status: "Brouillon", createdAt: now(), createdBy: CURRENT_USER.name,
      sentAt: undefined, respondedAt: undefined, refusal: undefined, updatedAt: now(),
      validUntil: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      items: src.items.map((i) => ({ ...i })),
      fees: src.fees.map((f) => ({ ...f, id: uid() })),
      history: [{ at: now(), user: CURRENT_USER.name, label: `Nouvelle version créée à partir de la V${src.version}` }],
    };
    adminQuotes = [next, ...adminQuotes.map((q) => (q.id === id ? { ...q, status: "Remplacé" as AdminQuoteStatus } : q))];
    orders = orders.map((o) => (o.reference === src.orderRef ? { ...o, status: "Révision devis" as OrderStatus } : o));
    log("Nouvelle version de devis créée", next.id, { from: src.id });
    refresh();
    return next;
  },

  /* --- notifications & activité --- */
  markNotificationsRead() { notifications = notifications.map((n) => ({ ...n, read: true })); refresh(); },
  getEmails: () => emails,
};

/* Synchronisation portail client → back-office */
quotesStore.subscribe(() => {
  let changed = false;
  adminQuotes = adminQuotes.map((q) => {
    const c = quotesStore.get(q.id);
    if (!c) return q;
    const map: Partial<Record<string, AdminQuoteStatus>> = {
      Accepté: "Accepté", Refusé: "Refusé", Expiré: "Expiré", Remplacé: "Remplacé",
    };
    const next = map[c.status];
    if (next && next !== q.status) {
      changed = true;
      const at = now();
      if (next === "Accepté") {
        orders = orders.map((o) => (o.reference === q.orderRef ? { ...o, status: "Devis accepté" as OrderStatus } : o));
        notify({ title: "Devis accepté", body: `${q.id} accepté par le client.`, tone: "success", link: `/admin/devis/${q.id}` });
        activities = [{ id: uid(), at, user: "Client", action: "Devis accepté", object: q.id }, ...activities];
      }
      if (next === "Refusé") {
        orders = orders.map((o) => (o.reference === q.orderRef ? { ...o, status: "Révision devis" as OrderStatus } : o));
        notify({ title: "Devis refusé", body: `${q.id} — motif : ${c.audit.refusalReason ?? "non précisé"}.`, tone: "danger", link: `/admin/devis/${q.id}` });
        activities = [{ id: uid(), at, user: "Client", action: "Devis refusé", object: q.id, to: c.audit.refusalReason }, ...activities];
      }
      return {
        ...q,
        status: next,
        respondedAt: at,
        refusal: next === "Refusé" ? { reason: c.audit.refusalReason ?? "", message: c.audit.refusalMessage ?? "", at } : q.refusal,
        history: [...q.history, { at, user: c.client, label: next === "Accepté" ? "Devis accepté par le client" : `Devis ${next.toLowerCase()}`, detail: c.audit.refusalReason }],
      };
    }
    return q;
  });
  if (changed) refresh();
});

export function useBackoffice() {
  return useSyncExternalStore(
    (cb) => boStore.subscribe(cb),
    () => cache,
    () => cache,
  );
}
