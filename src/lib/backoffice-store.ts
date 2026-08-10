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
  viscosity: string;
  standard: string;
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
  { id: "SUP-001", name: "Atlas Lubricants Industries", country: "Maroc", contact: "Rachid Amrani", email: "contact@atlas-lubricants.ma", phone: "+212 522 66 41 09" },
  { id: "SUP-002", name: "Maghreb Petrochem", country: "Maroc", contact: "Nadia Berrada", email: "achats@maghreb-petrochem.ma", phone: "+212 522 30 18 44" },
  { id: "SUP-003", name: "North Africa Lubes", country: "Maroc", contact: "Omar Sabri", email: "export@na-lubes.ma", phone: "+212 539 57 62 10" },
  { id: "SUP-004", name: "Casablanca Industrial Oils", country: "Maroc", contact: "Karima Idrissi", email: "commercial@casa-industrial-oils.ma", phone: "+212 522 43 88 21" },
  { id: "SUP-005", name: "Sahara Automotive Fluids", country: "Maroc", contact: "Youssef Naciri", email: "ventes@sahara-fluids.ma", phone: "+212 528 31 77 05" },
  { id: "SUP-006", name: "MediLube Manufacturing", country: "Maroc", contact: "Salma Tazi", email: "info@medilube.ma", phone: "+212 522 98 14 60" },
  { id: "SUP-007", name: "Tanger Additives Lab", country: "Maroc", contact: "Hicham Filali", email: "contact@tanger-additives.ma", phone: "+212 539 34 20 90" },
  { id: "SUP-008", name: "Atlantic Base Oils", country: "Maroc", contact: "Sanaa Lahlou", email: "sales@atlantic-baseoils.ma", phone: "+212 522 27 19 33" },
  { id: "SUP-009", name: "Souss Grease Works", country: "Maroc", contact: "Mehdi Chraibi", email: "contact@souss-grease.ma", phone: "+212 528 84 55 12" },
  { id: "SUP-010", name: "Rabat Chemical Solutions", country: "Maroc", contact: "Imane Alaoui", email: "export@rabat-chem.ma", phone: "+212 537 71 40 28" },
];

const catalog: {
  ref: string; name: string; cat: string; sub: string; brand: string; origin: string; emoji: string;
  visc: string; norm: string; pack: string;
  buy: number; prev: number; sell: number; sup: string; avail?: Availability; status?: ProductStatus; toCheck?: boolean;
}[] = [
  /* --- Huiles moteur --- */
  { ref: "AKW-ENG-5W30-001", name: "Huile moteur synthétique 5W-30 – 1L", cat: "Huiles moteur", sub: "Synthétique", brand: "AKWA Motion", origin: "Maroc", emoji: "🛢️", visc: "SAE 5W-30", norm: "API SP / ACEA C3", pack: "Bidon 1 L", buy: 3.85, prev: 3.62, sell: 5.2, sup: "SUP-001", toCheck: true },
  { ref: "AKW-ENG-5W30-002", name: "Huile moteur synthétique 5W-30 – 4L", cat: "Huiles moteur", sub: "Synthétique", brand: "AKWA Motion", origin: "Maroc", emoji: "🛢️", visc: "SAE 5W-30", norm: "API SP / ACEA C3", pack: "Bidon 4 L", buy: 14.6, prev: 13.9, sell: 19.8, sup: "SUP-001" },
  { ref: "AKW-ENG-5W30-003", name: "Huile moteur synthétique 5W-30 – 20L", cat: "Huiles moteur", sub: "Synthétique", brand: "AKWA Motion", origin: "Maroc", emoji: "🛢️", visc: "SAE 5W-30", norm: "API SP / ACEA C3", pack: "Fût 20 L", buy: 68.4, prev: 65.2, sell: 92.5, sup: "SUP-001" },
  { ref: "AKW-ENG-5W40-004", name: "Huile moteur synthétique 5W-40 – 5L", cat: "Huiles moteur", sub: "Synthétique", brand: "AKWA Motion", origin: "Maroc", emoji: "🛢️", visc: "SAE 5W-40", norm: "API SN / ACEA A3/B4", pack: "Bidon 5 L", buy: 17.9, prev: 16.8, sell: 24.4, sup: "SUP-001" },
  { ref: "AKW-ENG-5W40-005", name: "Huile moteur synthétique 5W-40 – 1L", cat: "Huiles moteur", sub: "Synthétique", brand: "AKWA Motion", origin: "Maroc", emoji: "🧴", visc: "SAE 5W-40", norm: "API SN / ACEA A3/B4", pack: "Bidon 1 L", buy: 3.95, prev: 3.7, sell: 5.35, sup: "SUP-002" },
  { ref: "AKW-ENG-10W40-006", name: "Huile moteur semi-synthétique 10W-40 – 5L", cat: "Huiles moteur", sub: "Semi-synthétique", brand: "AKWA Motion", origin: "Maroc", emoji: "🛢️", visc: "SAE 10W-40", norm: "API SN / ACEA A3/B4", pack: "Bidon 5 L", buy: 13.2, prev: 12.4, sell: 18.1, sup: "SUP-002" },
  { ref: "AKW-ENG-10W40-007", name: "Huile moteur semi-synthétique 10W-40 – 20L", cat: "Huiles moteur", sub: "Semi-synthétique", brand: "AKWA Motion", origin: "Maroc", emoji: "🛢️", visc: "SAE 10W-40", norm: "API SN", pack: "Fût 20 L", buy: 49.8, prev: 47.5, sell: 68.9, sup: "SUP-002" },
  { ref: "AKW-ENG-15W40-010", name: "Huile moteur diesel 15W-40 – 20L", cat: "Huiles moteur", sub: "Diesel HD", brand: "AKWA Heavy Duty", origin: "Maroc", emoji: "🚛", visc: "SAE 15W-40", norm: "API CI-4 / ACEA E7", pack: "Fût 20 L", buy: 41.5, prev: 38.9, sell: 57.4, sup: "SUP-003", toCheck: true },
  { ref: "AKW-ENG-15W40-011", name: "Huile moteur diesel 15W-40 – 208L", cat: "Huiles moteur", sub: "Diesel HD", brand: "AKWA Heavy Duty", origin: "Maroc", emoji: "🛢️", visc: "SAE 15W-40", norm: "API CI-4", pack: "Fût 208 L", buy: 398, prev: 372, sell: 545, sup: "SUP-003" },
  { ref: "AKW-ENG-15W40-012", name: "Huile moteur diesel 15W-40 – 5L", cat: "Huiles moteur", sub: "Diesel HD", brand: "AKWA Heavy Duty", origin: "Maroc", emoji: "🧴", visc: "SAE 15W-40", norm: "API CI-4", pack: "Bidon 5 L", buy: 11.4, prev: 10.9, sell: 15.8, sup: "SUP-003" },
  { ref: "AKW-ENG-20W50-013", name: "Huile moteur minérale 20W-50 – 5L", cat: "Huiles moteur", sub: "Minérale", brand: "AKWA Classic", origin: "Maroc", emoji: "🧴", visc: "SAE 20W-50", norm: "API SL", pack: "Bidon 5 L", buy: 9.85, prev: 9.4, sell: 13.6, sup: "SUP-004" },
  { ref: "AKW-ENG-20W50-014", name: "Huile moteur minérale 20W-50 – 20L", cat: "Huiles moteur", sub: "Minérale", brand: "AKWA Classic", origin: "Maroc", emoji: "🛢️", visc: "SAE 20W-50", norm: "API SL", pack: "Fût 20 L", buy: 36.9, prev: 35.2, sell: 50.4, sup: "SUP-004" },
  { ref: "AKW-ENG-MOTO-015", name: "Huile moteur moto 4T 10W-40 – 1L", cat: "Huiles moteur", sub: "Motocycle", brand: "AKWA Motion", origin: "Maroc", emoji: "🏍️", visc: "SAE 10W-40", norm: "API SN / JASO MA2", pack: "Bidon 1 L", buy: 4.35, prev: 4.1, sell: 6.1, sup: "SUP-006", avail: "Stock limité" },

  /* --- Huiles transmission --- */
  { ref: "AKW-ATF-D3-021", name: "ATF Dexron III – 1L", cat: "Huiles transmission", sub: "ATF", brand: "AKWA Drive", origin: "Maroc", emoji: "⚙️", visc: "ATF", norm: "Dexron III", pack: "Bidon 1 L", buy: 3.15, prev: 2.95, sell: 4.45, sup: "SUP-005" },
  { ref: "AKW-ATF-D3-022", name: "ATF Dexron III – 20L", cat: "Huiles transmission", sub: "ATF", brand: "AKWA Drive", origin: "Maroc", emoji: "🛢️", visc: "ATF", norm: "Dexron III", pack: "Fût 20 L", buy: 56.2, prev: 53.4, sell: 78.5, sup: "SUP-005" },
  { ref: "AKW-ATF-D6-023", name: "ATF Dexron VI – 1L", cat: "Huiles transmission", sub: "ATF", brand: "AKWA Drive", origin: "Maroc", emoji: "⚙️", visc: "ATF", norm: "Dexron VI", pack: "Bidon 1 L", buy: 4.25, prev: 3.95, sell: 5.95, sup: "SUP-005", toCheck: true },
  { ref: "AKW-GEAR-75W90-030", name: "Gear Oil synthétique 75W-90 – 1L", cat: "Huiles transmission", sub: "Gear Oil", brand: "AKWA Drive", origin: "Maroc", emoji: "⚙️", visc: "SAE 75W-90", norm: "API GL-5", pack: "Bidon 1 L", buy: 5.6, prev: 5.25, sell: 7.85, sup: "SUP-003" },
  { ref: "AKW-GEAR-80W90-031", name: "Gear Oil 80W-90 – 4L", cat: "Huiles transmission", sub: "Gear Oil", brand: "AKWA Drive", origin: "Maroc", emoji: "🛢️", visc: "SAE 80W-90", norm: "API GL-5", pack: "Bidon 4 L", buy: 12.8, prev: 12.1, sell: 17.6, sup: "SUP-003" },
  { ref: "AKW-GEAR-85W140-032", name: "Gear Oil 85W-140 – 20L", cat: "Huiles transmission", sub: "Gear Oil", brand: "AKWA Heavy Duty", origin: "Maroc", emoji: "🛢️", visc: "SAE 85W-140", norm: "API GL-5", pack: "Fût 20 L", buy: 62.5, prev: 59.8, sell: 85.9, sup: "SUP-003" },
  { ref: "AKW-GEAR-IND-033", name: "Huile transmission industrielle ISO VG 220 – 20L", cat: "Lubrifiants industriels", sub: "Transmission industrielle", brand: "AKWA Industrial", origin: "Maroc", emoji: "🏭", visc: "ISO VG 220", norm: "DIN 51517-3 CLP", pack: "Fût 20 L", buy: 58.4, prev: 56.1, sell: 79.9, sup: "SUP-004" },

  /* --- Fluides automobiles --- */
  { ref: "AKW-COOL-005", name: "Liquide de refroidissement -35 °C – 5L", cat: "Fluides automobiles", sub: "Refroidissement", brand: "AKWA Cool", origin: "Maroc", emoji: "❄️", visc: "—", norm: "ASTM D3306", pack: "Bidon 5 L", buy: 4.9, prev: 4.55, sell: 6.9, sup: "SUP-005" },
  { ref: "AKW-COOL-006", name: "Antigel concentré G12+ – 20L", cat: "Fluides automobiles", sub: "Antigel", brand: "AKWA Cool", origin: "Maroc", emoji: "🧊", visc: "—", norm: "ASTM D3306 / G12+", pack: "Fût 20 L", buy: 27.8, prev: 26.4, sell: 38.5, sup: "SUP-005" },
  { ref: "AKW-BRK-DOT3-010", name: "Liquide de frein DOT 3 – 500 ml", cat: "Fluides automobiles", sub: "Freinage", brand: "AKWA Safety", origin: "Maroc", emoji: "🛑", visc: "—", norm: "DOT 3 / FMVSS 116", pack: "Flacon 500 ml", buy: 1.55, prev: 1.45, sell: 2.35, sup: "SUP-006" },
  { ref: "AKW-BRK-DOT4-011", name: "Liquide de frein DOT 4 – 500 ml", cat: "Fluides automobiles", sub: "Freinage", brand: "AKWA Safety", origin: "Maroc", emoji: "🛑", visc: "—", norm: "DOT 4 / FMVSS 116", pack: "Flacon 500 ml", buy: 1.85, prev: 1.72, sell: 2.75, sup: "SUP-006" },
  { ref: "AKW-BRK-DOT51-012", name: "Liquide de frein DOT 5.1 – 1L", cat: "Fluides automobiles", sub: "Freinage", brand: "AKWA Safety", origin: "Maroc", emoji: "🛑", visc: "—", norm: "DOT 5.1", pack: "Flacon 1 L", buy: 4.6, prev: 4.35, sell: 6.6, sup: "SUP-006", avail: "Stock limité" },
  { ref: "AKW-PSF-013", name: "Fluide direction assistée – 1L", cat: "Fluides automobiles", sub: "Direction assistée", brand: "AKWA Drive", origin: "Maroc", emoji: "🚗", visc: "—", norm: "Dexron III", pack: "Bidon 1 L", buy: 3.05, prev: 2.9, sell: 4.35, sup: "SUP-005" },
  { ref: "AKW-ADB-014", name: "AdBlue 10L", cat: "Fluides automobiles", sub: "AdBlue", brand: "AKWA Clean", origin: "Maroc", emoji: "🫙", visc: "—", norm: "ISO 22241", pack: "Bidon 10 L", buy: 5.2, prev: 4.85, sell: 7.4, sup: "SUP-010" },
  { ref: "AKW-ADB-015", name: "AdBlue 1000L IBC", cat: "Fluides automobiles", sub: "AdBlue", brand: "AKWA Clean", origin: "Maroc", emoji: "🫙", visc: "—", norm: "ISO 22241", pack: "IBC 1000 L", buy: 352, prev: 338, sell: 478, sup: "SUP-010", avail: "Sur commande" },
  { ref: "AKW-WSH-016", name: "Liquide lave-glace -20 °C – 5L", cat: "Fluides automobiles", sub: "Lave-glace", brand: "AKWA Clean", origin: "Maroc", emoji: "💧", visc: "—", norm: "—", pack: "Bidon 5 L", buy: 1.95, prev: 1.85, sell: 2.95, sup: "SUP-010" },

  /* --- Lubrifiants industriels & hydrauliques --- */
  { ref: "AKW-HYD-46-018", name: "Huile hydraulique ISO VG 46 – 20L", cat: "Lubrifiants industriels", sub: "Hydraulique", brand: "AKWA Industrial", origin: "Maroc", emoji: "🏭", visc: "ISO VG 46", norm: "DIN 51524-2 HLP", pack: "Fût 20 L", buy: 44.2, prev: 41.8, sell: 61.5, sup: "SUP-004", toCheck: true },
  { ref: "AKW-HYD-46-019", name: "Huile hydraulique ISO VG 46 – 208L", cat: "Lubrifiants industriels", sub: "Hydraulique", brand: "AKWA Industrial", origin: "Maroc", emoji: "🛢️", visc: "ISO VG 46", norm: "DIN 51524-2 HLP", pack: "Fût 208 L", buy: 425, prev: 402, sell: 589, sup: "SUP-004" },
  { ref: "AKW-HYD-68-020", name: "Huile hydraulique ISO VG 68 – 20L", cat: "Lubrifiants industriels", sub: "Hydraulique", brand: "AKWA Industrial", origin: "Maroc", emoji: "🏭", visc: "ISO VG 68", norm: "DIN 51524-2 HLP", pack: "Fût 20 L", buy: 45.8, prev: 44.1, sell: 63.2, sup: "SUP-004" },
  { ref: "AKW-CMP-024", name: "Huile compresseur ISO VG 100 – 20L", cat: "Lubrifiants industriels", sub: "Compresseur", brand: "AKWA Industrial", origin: "Maroc", emoji: "🏭", visc: "ISO VG 100", norm: "DIN 51506 VDL", pack: "Fût 20 L", buy: 52.4, prev: 50.2, sell: 72.8, sup: "SUP-008" },
  { ref: "AKW-GREASE-LT-007", name: "Graisse lithium multiusage – 5 kg", cat: "Graisses", sub: "Lithium", brand: "AKWA Grease", origin: "Maroc", emoji: "🧈", visc: "NLGI 2", norm: "DIN 51825 KP2K-30", pack: "Seau 5 kg", buy: 14.9, prev: 14.1, sell: 20.9, sup: "SUP-009" },
  { ref: "AKW-GREASE-LT-008", name: "Graisse lithium multiusage – 18 kg", cat: "Graisses", sub: "Lithium", brand: "AKWA Grease", origin: "Maroc", emoji: "🧈", visc: "NLGI 2", norm: "DIN 51825 KP2K-30", pack: "Seau 18 kg", buy: 48.6, prev: 46.9, sell: 68.4, sup: "SUP-009" },
  { ref: "AKW-GREASE-HT-009", name: "Graisse haute température complexe – 5 kg", cat: "Graisses", sub: "Haute température", brand: "AKWA Grease", origin: "Maroc", emoji: "🔥", visc: "NLGI 2", norm: "DIN 51825 KP2P-30", pack: "Seau 5 kg", buy: 21.4, prev: 20.2, sell: 29.9, sup: "SUP-009", avail: "Stock limité" },

  /* --- Additifs, nettoyants & entretien --- */
  { ref: "AKW-ADD-INJ-040", name: "Nettoyant injecteur diesel – 300 ml", cat: "Additifs & nettoyants", sub: "Additifs carburant", brand: "AKWA Care", origin: "Maroc", emoji: "🧪", visc: "—", norm: "—", pack: "Flacon 300 ml", buy: 1.45, prev: 1.35, sell: 2.35, sup: "SUP-007" },
  { ref: "AKW-ADD-FUEL-041", name: "Additif carburant essence – 250 ml", cat: "Additifs & nettoyants", sub: "Additifs carburant", brand: "AKWA Care", origin: "Maroc", emoji: "⚗️", visc: "—", norm: "—", pack: "Flacon 250 ml", buy: 1.28, prev: 1.22, sell: 2.1, sup: "SUP-007" },
  { ref: "AKW-ADD-ENG-042", name: "Nettoyant moteur avant vidange – 400 ml", cat: "Additifs & nettoyants", sub: "Nettoyants moteur", brand: "AKWA Care", origin: "Maroc", emoji: "🧴", visc: "—", norm: "—", pack: "Flacon 400 ml", buy: 1.62, prev: 1.55, sell: 2.6, sup: "SUP-007" },
  { ref: "AKW-ADD-OIL-043", name: "Additif huile anti-friction – 300 ml", cat: "Additifs & nettoyants", sub: "Additifs huile", brand: "AKWA Care", origin: "Maroc", emoji: "🧪", visc: "—", norm: "—", pack: "Flacon 300 ml", buy: 2.1, prev: 2.0, sell: 3.35, sup: "SUP-007" },
  { ref: "AKW-CLN-BRK-044", name: "Nettoyant frein aérosol – 500 ml", cat: "Additifs & nettoyants", sub: "Aérosols", brand: "AKWA Care", origin: "Maroc", emoji: "🧯", visc: "—", norm: "ADR 2.1", pack: "Aérosol 500 ml", buy: 1.35, prev: 1.28, sell: 2.25, sup: "SUP-010" },
  { ref: "AKW-CLN-DEG-045", name: "Dégrippant multifonction – 400 ml", cat: "Additifs & nettoyants", sub: "Aérosols", brand: "AKWA Care", origin: "Maroc", emoji: "🧯", visc: "—", norm: "ADR 2.1", pack: "Aérosol 400 ml", buy: 1.18, prev: 1.12, sell: 1.95, sup: "SUP-010" },
  { ref: "AKW-ACC-FLT-046", name: "Filtre à huile universel (carton 24)", cat: "Entretien & accessoires", sub: "Filtration", brand: "AKWA Parts", origin: "Maroc", emoji: "🔧", visc: "—", norm: "—", pack: "Carton de 24", buy: 42.5, prev: 41.0, sell: 59.9, sup: "SUP-008", avail: "Sur commande" },
  { ref: "AKW-ACC-PMP-047", name: "Pompe de transvasement manuelle fût 208L", cat: "Entretien & accessoires", sub: "Équipements", brand: "AKWA Parts", origin: "Maroc", emoji: "🔩", visc: "—", norm: "—", pack: "Unité", buy: 18.4, prev: 18.4, sell: 26.9, sup: "SUP-008", status: "Inactif", avail: "Rupture" },
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
    viscosity: c.visc,
    standard: c.norm,
    barcode: `611${(1000000 + i * 7331).toString().slice(0, 7)}${i}`,
    supplierSku: `${c.sup}-${c.ref.slice(-3)}`,
    origin: c.origin,
    saleUnit: "Unité",
    packaging: c.pack,
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
      storageTemp: "5 °C à 40 °C",
      storageConditions: "Local ventilé, à l'abri du gel, de la chaleur et des sources d'ignition",
      shelfLife: `${36 + (i % 3) * 12} mois`,
      hsCode: c.cat === "Fluides automobiles" ? "3820.00" : c.cat === "Graisses" ? "2710.19.99" : c.cat === "Additifs & nettoyants" ? "3811.21" : "2710.19.81",
      dangerous: c.norm.includes("ADR") || c.sub === "Freinage",
      sdsRequired: true,
      adrRegulated: c.norm.includes("ADR"),
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
      { id: uid(), name: `SDS – Fiche de données de sécurité ${c.ref}.pdf`, type: "SDS", addedAt: iso("2026-05-04T10:00:00"), addedBy: "Yassine Bennani" },
      { id: uid(), name: `Certificate of Analysis ${c.ref}.pdf`, type: "Certificat", addedAt: iso("2026-05-06T10:00:00"), addedBy: "Yassine Bennani" },
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

const CATS = ["Huiles moteur", "Huiles transmission", "Fluides automobiles", "Lubrifiants industriels", "Graisses", "Additifs & nettoyants"];

const clients: Client[] = [
  {
    id: "MAD-001", name: "Abidjan Lubricants Group", legalName: "Abidjan Lubricants Group SA", ice: "CI-2024-8891234",
    country: "Côte d'Ivoire", city: "Abidjan", address: "Zone industrielle de Yopougon, Lot 42", zip: "01 BP 3345",
    website: "www.abidjan-lubricants.ci", email: "contact@abidjan-lubricants.ci", phone: "+225 27 21 45 88 10",
    contactMain: "Jean Kouassi", contactFinance: "Aïcha Traoré", contactLogistics: "Marc Adjé",
    language: "Français", currency: "EUR", incoterm: "CIF", paymentTerms: "50 % à la commande / 50 % avant embarquement",
    transport: "Maritime conteneur complet", since: iso("2024-03-04T00:00:00"), manager: CURRENT_USER.name,
    status: "Actif", priority: "Stratégique", paymentRisk: "Faible", score: 92,
    revenueTotal: 684500, revenueYear: 318900, ordersCount: 18, activeOrders: 3, margin: 118400,
    paid: 596200, balance: 88300, quoteAcceptRate: 87, avgPaymentDelay: 27, lastOrder: iso("2026-08-02T00:00:00"),
    monthly: monthly(42000, 1),
    byCategory: [
      { name: "Huiles moteur", value: 314000 }, { name: "Huiles transmission", value: 126000 },
      { name: "Fluides automobiles", value: 118000 }, { name: "Lubrifiants industriels", value: 72500 }, { name: "Additifs & nettoyants", value: 54000 },
    ],
    topProducts: [
      { name: "Huile moteur synthétique 5W-30 – 1L", value: 96400 }, { name: "Huile moteur diesel 15W-40 – 20L", value: 88200 },
      { name: "ATF Dexron III – 1L", value: 61500 }, { name: "Liquide de refroidissement -35 °C – 5L", value: 42300 },
    ],
    destinations: [{ name: "Abidjan", value: 512000 }, { name: "Bouaké", value: 118500 }, { name: "San Pedro", value: 54000 }],
    notes: [
      { id: uid(), at: iso("2026-07-18T10:12:00"), author: CURRENT_USER.name, category: "Commercial", text: "Distributeur stratégique Afrique de l'Ouest — prioriser les réponses sous 24 h." },
      { id: uid(), at: iso("2026-07-02T09:40:00"), author: "Yassine Bennani", category: "Logistique", text: "Exige les SDS à jour pour chaque référence avant embarquement." },
      { id: uid(), at: iso("2026-06-11T15:05:00"), author: CURRENT_USER.name, category: "Financier", text: "Préférence pour des conditions de paiement 50/50." },
      { id: uid(), at: iso("2026-05-28T11:20:00"), author: CURRENT_USER.name, category: "Commercial", text: "Négocie systématiquement le fret maritime sur les FCL 40' HC." },
    ],
  },
  {
    id: "SDG-002", name: "Dakar Auto Services", legalName: "Dakar Auto Services SUARL", ice: "SN-2023-114455",
    country: "Sénégal", city: "Dakar", address: "Km 4,5 Boulevard du Centenaire", zip: "BP 21455",
    website: "www.dakar-auto-services.sn", email: "achats@dakar-auto-services.sn", phone: "+221 33 869 44 21",
    contactMain: "Fatou Ndiaye", contactFinance: "Cheikh Fall", contactLogistics: "Ibrahima Sow",
    language: "Français", currency: "EUR", incoterm: "FOB", paymentTerms: "30 % à la commande / 70 % à réception",
    transport: "Maritime groupage", since: iso("2023-09-15T00:00:00"), manager: "Yassine Bennani",
    status: "Actif", priority: "Important", paymentRisk: "Modéré", score: 78,
    revenueTotal: 512300, revenueYear: 241800, ordersCount: 14, activeOrders: 2, margin: 88600,
    paid: 448000, balance: 64300, quoteAcceptRate: 74, avgPaymentDelay: 41, lastOrder: iso("2026-07-28T00:00:00"),
    monthly: monthly(31000, 2),
    byCategory: [{ name: "Huiles moteur", value: 246000 }, { name: "Fluides automobiles", value: 142000 }, { name: "Additifs & nettoyants", value: 66000 }, { name: "Graisses", value: 58300 }],
    topProducts: [{ name: "Huile moteur semi-synthétique 10W-40 – 5L", value: 121000 }, { name: "Liquide de frein DOT 4 – 500 ml", value: 78500 }, { name: "AdBlue 10L", value: 44000 }],
    destinations: [{ name: "Dakar", value: 452000 }, { name: "Thiès", value: 60300 }],
    notes: [{ id: uid(), at: iso("2026-06-20T14:00:00"), author: "Yassine Bennani", category: "Risque", text: "Retards de paiement récurrents de 10 à 15 jours — exiger un acompte." }],
  },
  {
    id: "CMR-003", name: "Douala Automotive Distribution", legalName: "DAD SA", ice: "CM-2025-778812",
    country: "Cameroun", city: "Douala", address: "Rue Njo-Njo, Bonapriso", zip: "BP 5521",
    website: "www.douala-automotive.cm", email: "info@douala-automotive.cm", phone: "+237 233 42 18 77",
    contactMain: "Paul Mbarga", contactFinance: "Estelle Ngo", contactLogistics: "Alain Etoa",
    language: "Français", currency: "EUR", incoterm: "CFR", paymentTerms: "Paiement à 45 jours",
    transport: "Maritime conteneur complet", since: iso("2025-01-22T00:00:00"), manager: CURRENT_USER.name,
    status: "Actif", priority: "Standard", paymentRisk: "Modéré", score: 71,
    revenueTotal: 296400, revenueYear: 164200, ordersCount: 9, activeOrders: 1, margin: 51200,
    paid: 254000, balance: 42400, quoteAcceptRate: 68, avgPaymentDelay: 52, lastOrder: iso("2026-07-15T00:00:00"),
    monthly: monthly(21000, 3),
    byCategory: [{ name: "Huiles moteur", value: 148000 }, { name: "Huiles transmission", value: 86400 }, { name: "Graisses", value: 62000 }],
    topProducts: [{ name: "Huile moteur diesel 15W-40 – 208L", value: 92000 }, { name: "Graisse lithium multiusage – 18 kg", value: 51000 }],
    destinations: [{ name: "Douala", value: 296400 }],
    notes: [],
  },
  {
    id: "MLI-004", name: "Bamako Automotive Supply", legalName: "BAS SARL", ice: "ML-2022-330091",
    country: "Mali", city: "Bamako", address: "Quartier du Fleuve, Rue 312", zip: "BP 1180",
    website: "www.bamako-auto-supply.ml", email: "contact@bamako-auto-supply.ml", phone: "+223 20 22 66 41",
    contactMain: "Moussa Diarra", contactFinance: "Awa Coulibaly", contactLogistics: "Sekou Keita",
    language: "Français", currency: "EUR", incoterm: "DAP", paymentTerms: "Paiement comptant",
    transport: "Maritime + routier", since: iso("2022-11-08T00:00:00"), manager: "Yassine Bennani",
    status: "Actif", priority: "VIP", paymentRisk: "Faible", score: 88,
    revenueTotal: 731900, revenueYear: 288400, ordersCount: 22, activeOrders: 2, margin: 141300,
    paid: 705000, balance: 26900, quoteAcceptRate: 91, avgPaymentDelay: 18, lastOrder: iso("2026-08-05T00:00:00"),
    monthly: monthly(38000, 4),
    byCategory: [{ name: "Huiles moteur", value: 324000 }, { name: "Lubrifiants industriels", value: 188000 }, { name: "Fluides automobiles", value: 132000 }, { name: "Graisses", value: 87900 }],
    topProducts: [{ name: "Huile moteur diesel 15W-40 – 20L", value: 164000 }, { name: "Huile hydraulique ISO VG 46 – 20L", value: 98000 }],
    destinations: [{ name: "Bamako", value: 640000 }, { name: "Sikasso", value: 91900 }],
    notes: [{ id: uid(), at: iso("2026-04-02T08:30:00"), author: CURRENT_USER.name, category: "Commercial", text: "Client VIP — remise fret négociée de 5 % sur les FCL." }],
  },
  {
    id: "GUI-005", name: "Conakry Motors Distribution", legalName: "CMD SARL", ice: "GN-2025-556677",
    country: "Guinée", city: "Conakry", address: "Kaloum, Avenue de la République", zip: "BP 890",
    website: "www.conakry-motors.gn", email: "achats@conakry-motors.gn", phone: "+224 622 45 11 09",
    contactMain: "Mariama Barry", contactFinance: "Ousmane Camara", contactLogistics: "Alpha Diallo",
    language: "Français", currency: "EUR", incoterm: "CIF", paymentTerms: "50 % / 50 %",
    transport: "Maritime groupage", since: iso("2025-06-12T00:00:00"), manager: CURRENT_USER.name,
    status: "Actif", priority: "Standard", paymentRisk: "Élevé", score: 58,
    revenueTotal: 148700, revenueYear: 98200, ordersCount: 6, activeOrders: 1, margin: 24100,
    paid: 108000, balance: 40700, quoteAcceptRate: 62, avgPaymentDelay: 64, lastOrder: iso("2026-06-30T00:00:00"),
    monthly: monthly(12000, 5),
    byCategory: [{ name: "Huiles moteur", value: 78000 }, { name: "Fluides automobiles", value: 44700 }, { name: "Additifs & nettoyants", value: 26000 }],
    topProducts: [{ name: "Huile moteur minérale 20W-50 – 5L", value: 62000 }],
    destinations: [{ name: "Conakry", value: 148700 }],
    notes: [{ id: uid(), at: iso("2026-05-15T16:10:00"), author: "Yassine Bennani", category: "Risque", text: "Solde à recevoir élevé — bloquer toute nouvelle expédition sans acompte." }],
  },
  {
    id: "MRT-006", name: "Nouakchott Fleet Parts", legalName: "NFP SARL", ice: "MR-2026-112233",
    country: "Mauritanie", city: "Nouakchott", address: "Tevragh Zeina, Îlot K", zip: "BP 4412",
    website: "www.nfp-parts.mr", email: "contact@nfp-parts.mr", phone: "+222 45 29 88 41",
    contactMain: "Ahmed Ould Salem", contactFinance: "Leila Mint", contactLogistics: "Sidi Mohamed",
    language: "Français", currency: "EUR", incoterm: "FOB", paymentTerms: "Paiement comptant",
    transport: "Routier", since: iso("2026-07-02T00:00:00"), manager: CURRENT_USER.name,
    status: "Prospect", priority: "Standard", paymentRisk: "Modéré", score: 49,
    revenueTotal: 38200, revenueYear: 38200, ordersCount: 2, activeOrders: 1, margin: 6900,
    paid: 20000, balance: 18200, quoteAcceptRate: 50, avgPaymentDelay: 22, lastOrder: iso("2026-07-24T00:00:00"),
    monthly: monthly(5000, 6),
    byCategory: [{ name: "Huiles moteur", value: 22000 }, { name: "Fluides automobiles", value: 16200 }],
    topProducts: [{ name: "Liquide lave-glace -20 °C – 5L", value: 18400 }],
    destinations: [{ name: "Nouakchott", value: 38200 }],
    notes: [],
  },
];

/* Portefeuille B2B complémentaire — distributeurs, grossistes, réseaux de garages et flottes. */
const extraClients: {
  id: string; name: string; country: string; city: string; segment: string; priority: Client["priority"];
  risk: Client["paymentRisk"]; score: number; rev: number; incoterm: string; top: string;
}[] = [
  { id: "CIV-007", name: "AutoParts Distribution Côte d'Ivoire", country: "Côte d'Ivoire", city: "Abidjan", segment: "Distributeur pièces détachées", priority: "Important", risk: "Faible", score: 84, rev: 421000, incoterm: "CIF", top: "Huile moteur synthétique 5W-40 – 5L" },
  { id: "CIV-008", name: "Ivoire Heavy Duty Parts", country: "Côte d'Ivoire", city: "San Pedro", segment: "Grossiste poids lourd", priority: "Standard", risk: "Modéré", score: 69, rev: 187500, incoterm: "CFR", top: "Huile moteur diesel 15W-40 – 208L" },
  { id: "SEN-009", name: "West Africa Motors Supply", country: "Sénégal", city: "Dakar", segment: "Importateur automobile", priority: "Stratégique", risk: "Faible", score: 90, rev: 552000, incoterm: "CIF", top: "Huile moteur synthétique 5W-30 – 4L" },
  { id: "SEN-010", name: "Senegal Fleet Solutions", country: "Sénégal", city: "Thiès", segment: "Gestionnaire de flotte", priority: "Important", risk: "Modéré", score: 73, rev: 264000, incoterm: "DAP", top: "AdBlue 1000L IBC" },
  { id: "GHA-011", name: "Ghana Auto Trade", country: "Ghana", city: "Tema", segment: "Distributeur", priority: "Important", risk: "Faible", score: 81, rev: 338000, incoterm: "FOB", top: "ATF Dexron VI – 1L" },
  { id: "GHA-012", name: "Accra Lubricants Wholesale", country: "Ghana", city: "Accra", segment: "Grossiste lubrifiants", priority: "Standard", risk: "Modéré", score: 66, rev: 152000, incoterm: "CIF", top: "Graisse lithium multiusage – 5 kg" },
  { id: "CMR-013", name: "Yaoundé Garage Network", country: "Cameroun", city: "Yaoundé", segment: "Réseau de garages", priority: "Standard", risk: "Modéré", score: 64, rev: 118400, incoterm: "CFR", top: "Nettoyant injecteur diesel – 300 ml" },
  { id: "BEN-014", name: "Cotonou Motors Distribution", country: "Bénin", city: "Cotonou", segment: "Distributeur", priority: "Standard", risk: "Modéré", score: 62, rev: 96500, incoterm: "CIF", top: "Huile moteur semi-synthétique 10W-40 – 20L" },
  { id: "MLI-015", name: "Sikasso Transport Lubrifiants", country: "Mali", city: "Sikasso", segment: "Société de transport", priority: "Important", risk: "Faible", score: 79, rev: 214000, incoterm: "DAP", top: "Huile moteur diesel 15W-40 – 20L" },
  { id: "GUI-016", name: "Kankan Auto Négoce", country: "Guinée", city: "Kankan", segment: "Grossiste", priority: "Standard", risk: "Élevé", score: 54, rev: 74000, incoterm: "CIF", top: "Liquide de frein DOT 3 – 500 ml" },
  { id: "MRT-017", name: "Nouadhibou Marine & Fleet", country: "Mauritanie", city: "Nouadhibou", segment: "Gestionnaire de flotte", priority: "Standard", risk: "Modéré", score: 61, rev: 88000, incoterm: "FOB", top: "Huile hydraulique ISO VG 68 – 20L" },
  { id: "CIV-018", name: "Bouaké Fleet Services", country: "Côte d'Ivoire", city: "Bouaké", segment: "Société de transport", priority: "Important", risk: "Faible", score: 77, rev: 196000, incoterm: "DAP", top: "Huile moteur diesel 15W-40 – 5L" },
  { id: "GHA-019", name: "Takoradi Industrial Lubes", country: "Ghana", city: "Takoradi", segment: "Distributeur industriel", priority: "Standard", risk: "Modéré", score: 68, rev: 143000, incoterm: "CFR", top: "Huile hydraulique ISO VG 46 – 208L" },
  { id: "BEN-020", name: "Porto-Novo Auto Import", country: "Bénin", city: "Porto-Novo", segment: "Importateur automobile", priority: "Standard", risk: "Modéré", score: 60, rev: 68000, incoterm: "CIF", top: "Liquide de refroidissement -35 °C – 5L" },
];

extraClients.forEach((e, k) => {
  const slug = e.name.toLowerCase().replace(/[^a-z]+/g, "-").slice(0, 24);
  clients.push({
    id: e.id, name: e.name, legalName: `${e.name} SARL`, ice: `${e.id}-${2020 + (k % 6)}`,
    country: e.country, city: e.city, address: `Zone industrielle ${e.city}, Lot ${12 + k}`, zip: `BP ${1000 + k * 37}`,
    website: `www.${slug}.com`, email: `achats@${slug}.com`, phone: `+2${20 + k} ${20 + k} ${30 + k} ${40 + k} ${50 + k}`,
    contactMain: ["Kwame Mensah", "Ibrahim Touré", "Aminata Cissé", "Yao N'Guessan", "Serge Dossou"][k % 5],
    contactFinance: ["Rose Adjovi", "Salif Konaté", "Nana Owusu"][k % 3],
    contactLogistics: ["Boubacar Sy", "Eric Kodjo", "Fanta Camara"][k % 3],
    language: "Français", currency: "EUR", incoterm: e.incoterm,
    paymentTerms: k % 3 === 0 ? "50 % à la commande / 50 % avant embarquement" : k % 3 === 1 ? "30 % / 70 % à réception" : "Paiement à 45 jours",
    transport: k % 2 ? "Maritime conteneur complet" : "Maritime groupage",
    since: iso(`202${3 + (k % 3)}-0${1 + (k % 8)}-1${k % 9}T00:00:00`), manager: k % 2 ? CURRENT_USER.name : "Yassine Bennani",
    status: "Actif", priority: e.priority, paymentRisk: e.risk, score: e.score,
    revenueTotal: e.rev, revenueYear: Math.round(e.rev * 0.46), ordersCount: 4 + (k % 12), activeOrders: k % 3,
    margin: Math.round(e.rev * 0.19), paid: Math.round(e.rev * 0.88), balance: Math.round(e.rev * 0.12),
    quoteAcceptRate: 55 + ((k * 7) % 40), avgPaymentDelay: 18 + ((k * 5) % 45),
    lastOrder: iso(`2026-0${5 + (k % 4)}-1${k % 9}T00:00:00`),
    monthly: monthly(Math.round(e.rev / 14), 7 + k),
    byCategory: CATS.slice(0, 4).map((c, j) => ({ name: c, value: Math.round((e.rev * (4 - j)) / 12) })),
    topProducts: [{ name: e.top, value: Math.round(e.rev * 0.31) }],
    destinations: [{ name: e.city, value: e.rev }],
    notes: [{ id: uid(), at: iso("2026-06-05T09:00:00"), author: CURRENT_USER.name, category: "Commercial", text: `Segment : ${e.segment}. Demande régulière de fiches techniques et SDS produits.` }],
  });
});

/* ------------------------------------------------------------------ */
/* Seeds — commandes                                                   */
/* ------------------------------------------------------------------ */

const p = (ref: string) => products.find((x) => x.ref === ref)!;
const item = (ref: string, quantity: number, unit: string, unitPrice?: number): OrderItem => {
  const pr = p(ref);
  return { ref, label: pr.name, quantity, unit, unitPrice: unitPrice ?? pr.salePrice, purchasePrice: pr.purchasePrice };
};

const atlasItems: OrderItem[] = [
  item("AKW-ENG-5W30-001", 2400, "bidons 1L", 5.5),
  item("AKW-ENG-10W40-006", 800, "bidons 5L", 21),
  item("AKW-ATF-D3-021", 1200, "bidons 1L", 4.75),
  item("AKW-GEAR-80W90-031", 500, "bidons 4L", 18),
  item("AKW-COOL-005", 600, "bidons 5L", 7),
  item("AKW-BRK-DOT4-011", 1000, "flacons 500ml", 3.9),
];

let orders: AdminOrder[] = [
  {
    reference: "AKW-EXP-2026-0187", clientId: "MAD-001", destination: "Abidjan, Côte d'Ivoire",
    receivedAt: iso("2026-08-10T09:12:00"), channel: "Portail client", priority: "Haute",
    status: "Commande reçue", commercial: CURRENT_USER.name, exportManager: "Yassine Bennani",
    incoterm: "CIF", currency: "EUR", portDeparture: "Casablanca", portDestination: "Abidjan",
    items: atlasItems,
    costs: { goods: 34770, preparation: 1250, localTransport: 1100, freight: 4100, insurance: 650, documents: 450, other: 250 },
    quoteDeadline: iso("2026-08-12T18:00:00"), shipDeadline: iso("2026-08-26T00:00:00"),
    risk: "Faible", missingDocs: ["Certificat d'origine signé", "SDS liquide de frein DOT 4"],
    internalNotes: [
      { id: uid(), at: iso("2026-08-10T09:40:00"), author: CURRENT_USER.name, text: "Confirmer le stock 5W-30 1L avant génération du devis.", tag: "Approvisionnement", mentions: ["Yassine Bennani"] },
      { id: uid(), at: iso("2026-08-10T09:52:00"), author: "Yassine Bennani", text: "Fret Casablanca → Abidjan négociable jusqu'à 4 350 € pour 2 × 40' HC.", tag: "Fret", mentions: [] },
      { id: uid(), at: iso("2026-08-10T10:05:00"), author: CURRENT_USER.name, text: "Séparer le DOT 4 (ADR classe 3 exclue) des palettes d'huile moteur.", tag: "Conformité", mentions: [] },
    ],
  },
  {
    reference: "AKW-EXP-2026-0193", clientId: "SDG-002", destination: "Dakar, Sénégal",
    receivedAt: iso("2026-08-05T11:00:00"), channel: "Portail client", priority: "Normale",
    status: "Devis envoyé – En attente client", commercial: "Yassine Bennani", exportManager: "Yassine Bennani",
    incoterm: "FOB", currency: "EUR", portDeparture: "Casablanca", portDestination: "Dakar",
    items: [item("AKW-ENG-10W40-006", 1200, "bidons 5L", 17.9), item("AKW-ENG-15W40-010", 400, "fûts 20L", 56.5), item("AKW-COOL-005", 900, "bidons 5L", 6.8), item("AKW-BRK-DOT4-011", 1500, "flacons 500ml", 2.7)],
    costs: { goods: 21800, preparation: 700, localTransport: 900, freight: 3100, insurance: 480, documents: 280, other: 200 },
    quoteDeadline: iso("2026-08-07T18:00:00"), shipDeadline: iso("2026-08-22T00:00:00"),
    risk: "Modéré", missingDocs: [], internalNotes: [], quoteFamily: "DEV-AKW-2026-0193", validatedAt: iso("2026-08-05T14:00:00"), validatedBy: CURRENT_USER.name,
  },
  {
    reference: "AKW-EXP-2026-0201", clientId: "CMR-003", destination: "Douala, Cameroun",
    receivedAt: iso("2026-08-08T15:30:00"), channel: "Email", priority: "Normale",
    status: "Commande reçue", commercial: CURRENT_USER.name, exportManager: "Yassine Bennani",
    incoterm: "CFR", currency: "EUR", portDeparture: "Tanger Med", portDestination: "Douala",
    items: [item("AKW-ENG-15W40-011", 60, "fûts 208L", 540), item("AKW-GREASE-LT-008", 220, "seaux 18kg", 67.5), item("AKW-GEAR-85W140-032", 120, "fûts 20L", 84)],
    costs: { goods: 32800, preparation: 620, localTransport: 780, freight: 3400, insurance: 420, documents: 260, other: 180 },
    quoteDeadline: iso("2026-08-11T18:00:00"), shipDeadline: iso("2026-08-29T00:00:00"),
    risk: "Modéré", missingDocs: ["Fiche technique 15W-40"], internalNotes: [],
  },
  {
    reference: "AKW-EXP-2026-0176", clientId: "MLI-004", destination: "Bamako, Mali",
    receivedAt: iso("2026-06-02T08:45:00"), channel: "Commercial terrain", priority: "Haute",
    status: "Devis accepté", commercial: "Yassine Bennani", exportManager: "Yassine Bennani",
    incoterm: "DAP", currency: "EUR", portDeparture: "Casablanca", portDestination: "Abidjan (transit Bamako)",
    items: [item("AKW-ENG-15W40-010", 600, "fûts 20L", 56), item("AKW-HYD-46-018", 300, "fûts 20L", 60.5), item("AKW-GREASE-LT-007", 400, "seaux 5kg", 20.4)],
    costs: { goods: 39800, preparation: 640, localTransport: 1180, freight: 3200, insurance: 380, documents: 240, other: 160 },
    quoteDeadline: iso("2026-06-05T18:00:00"), shipDeadline: iso("2026-06-25T00:00:00"),
    risk: "Faible", missingDocs: [], internalNotes: [], quoteFamily: "DEV-AKW-2026-0176", validatedAt: iso("2026-06-02T12:00:00"), validatedBy: "Yassine Bennani",
  },
  {
    reference: "AKW-EXP-2026-0169", clientId: "GUI-005", destination: "Conakry, Guinée",
    receivedAt: iso("2026-06-25T10:10:00"), channel: "Portail client", priority: "Basse",
    status: "Révision devis", commercial: CURRENT_USER.name, exportManager: "Yassine Bennani",
    incoterm: "CIF", currency: "EUR", portDeparture: "Casablanca", portDestination: "Conakry",
    items: [item("AKW-ENG-20W50-013", 1800, "bidons 5L", 13.9), item("AKW-BRK-DOT3-010", 2400, "flacons 500ml", 2.4)],
    costs: { goods: 21500, preparation: 480, localTransport: 700, freight: 2900, insurance: 300, documents: 220, other: 140 },
    quoteDeadline: iso("2026-06-28T18:00:00"), shipDeadline: iso("2026-07-20T00:00:00"),
    risk: "Élevé", missingDocs: ["Acompte 50 %"], internalNotes: [], quoteFamily: "DEV-AKW-2026-0169",
  },
  {
    reference: "AKW-EXP-2026-0205", clientId: "MRT-006", destination: "Nouakchott, Mauritanie",
    receivedAt: iso("2026-08-09T17:05:00"), channel: "Téléphone", priority: "Normale",
    status: "Commande reçue", commercial: CURRENT_USER.name, exportManager: "Yassine Bennani",
    incoterm: "FOB", currency: "EUR", portDeparture: "Casablanca", portDestination: "Nouakchott",
    items: [item("AKW-WSH-016", 3000, "bidons 5L"), item("AKW-ADB-014", 1500, "bidons 10L")],
    costs: { goods: 13600, preparation: 380, localTransport: 950, freight: 1800, insurance: 260, documents: 200, other: 120 },
    quoteDeadline: iso("2026-08-13T18:00:00"), shipDeadline: iso("2026-09-02T00:00:00"),
    risk: "Modéré", missingDocs: [], internalNotes: [],
  },
];

/* Historique de commandes export supplémentaires (lubrifiants & fluides). */
const extraOrders: { ref: string; client: string; dest: string; port: string; status: OrderStatus; refs: [string, number, string][]; date: string }[] = [
  { ref: "AKW-EXP-2026-0142", client: "CIV-007", dest: "Abidjan, Côte d'Ivoire", port: "Abidjan", status: "Livrée", refs: [["AKW-ENG-5W40-004", 1400, "bidons 5L"], ["AKW-ATF-D6-023", 900, "bidons 1L"]], date: "2026-03-11" },
  { ref: "AKW-EXP-2026-0148", client: "CIV-008", dest: "San Pedro, Côte d'Ivoire", port: "San Pedro", status: "Livrée", refs: [["AKW-ENG-15W40-011", 45, "fûts 208L"], ["AKW-GEAR-85W140-032", 90, "fûts 20L"]], date: "2026-03-24" },
  { ref: "AKW-EXP-2026-0153", client: "SEN-009", dest: "Dakar, Sénégal", port: "Dakar", status: "Livrée", refs: [["AKW-ENG-5W30-002", 2200, "bidons 4L"], ["AKW-COOL-006", 300, "fûts 20L"]], date: "2026-04-08" },
  { ref: "AKW-EXP-2026-0158", client: "SEN-010", dest: "Dakar, Sénégal", port: "Dakar", status: "Livrée", refs: [["AKW-ADB-015", 24, "IBC 1000L"], ["AKW-ENG-15W40-010", 380, "fûts 20L"]], date: "2026-04-27" },
  { ref: "AKW-EXP-2026-0161", client: "GHA-011", dest: "Tema, Ghana", port: "Tema", status: "En transit", refs: [["AKW-ATF-D6-023", 1800, "bidons 1L"], ["AKW-PSF-013", 1200, "bidons 1L"]], date: "2026-05-14" },
  { ref: "AKW-EXP-2026-0164", client: "GHA-012", dest: "Accra, Ghana", port: "Tema", status: "En transit", refs: [["AKW-GREASE-LT-007", 700, "seaux 5kg"], ["AKW-GREASE-HT-009", 250, "seaux 5kg"]], date: "2026-05-29" },
  { ref: "AKW-EXP-2026-0172", client: "CMR-013", dest: "Yaoundé, Cameroun", port: "Douala", status: "En préparation", refs: [["AKW-ADD-INJ-040", 4800, "flacons"], ["AKW-CLN-BRK-044", 3600, "aérosols"]], date: "2026-06-16" },
  { ref: "AKW-EXP-2026-0180", client: "BEN-014", dest: "Cotonou, Bénin", port: "Cotonou", status: "En préparation", refs: [["AKW-ENG-10W40-007", 420, "fûts 20L"], ["AKW-WSH-016", 1500, "bidons 5L"]], date: "2026-07-03" },
  { ref: "AKW-EXP-2026-0184", client: "MLI-015", dest: "Sikasso, Mali", port: "Abidjan (transit)", status: "Devis accepté", refs: [["AKW-ENG-15W40-010", 520, "fûts 20L"], ["AKW-HYD-68-020", 260, "fûts 20L"]], date: "2026-07-21" },
  { ref: "AKW-EXP-2026-0189", client: "CIV-018", dest: "Bouaké, Côte d'Ivoire", port: "Abidjan", status: "Devis envoyé – En attente client", refs: [["AKW-ENG-15W40-012", 2600, "bidons 5L"], ["AKW-ADD-OIL-043", 1800, "flacons"]], date: "2026-08-03" },
  { ref: "AKW-EXP-2026-0196", client: "GHA-019", dest: "Takoradi, Ghana", port: "Tema", status: "Commande validée par AKWA", refs: [["AKW-HYD-46-019", 48, "fûts 208L"], ["AKW-CMP-024", 180, "fûts 20L"]], date: "2026-08-06" },
  { ref: "AKW-EXP-2026-0203", client: "BEN-020", dest: "Porto-Novo, Bénin", port: "Cotonou", status: "En attente", refs: [["AKW-COOL-005", 2200, "bidons 5L"], ["AKW-BRK-DOT51-012", 800, "flacons 1L"]], date: "2026-08-09" },
];

extraOrders.forEach((o, k) => {
  const items = o.refs.map(([r, q, u]) => item(r, q, u));
  const goods = goodsCost(items);
  orders.push({
    reference: o.ref, clientId: o.client, destination: o.dest,
    receivedAt: iso(`${o.date}T${9 + (k % 8)}:15:00`), channel: k % 3 === 0 ? "Email" : "Portail client",
    priority: k % 4 === 0 ? "Haute" : "Normale", status: o.status,
    commercial: k % 2 ? CURRENT_USER.name : "Yassine Bennani", exportManager: "Yassine Bennani",
    incoterm: ["CIF", "FOB", "CFR", "DAP"][k % 4], currency: "EUR",
    portDeparture: k % 3 === 0 ? "Tanger Med" : "Casablanca", portDestination: o.port,
    items,
    costs: {
      goods: Math.round(goods), preparation: 420 + k * 30, localTransport: 620 + k * 25,
      freight: 2600 + k * 120, insurance: 280 + k * 15, documents: 220, other: 120,
    },
    quoteDeadline: iso(`${o.date}T18:00:00`), shipDeadline: iso(`${o.date}T00:00:00`),
    risk: k % 5 === 0 ? "Élevé" : k % 2 ? "Faible" : "Modéré",
    missingDocs: k % 4 === 0 ? ["SDS produit"] : [],
    internalNotes: [],
  });
});

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
    notes: "Lubrifiants et fluides conformes aux normes API / ACEA, SDS fournies pour chaque référence.",
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
      fee("Fret maritime", "Casablanca → Abidjan, 2 × 40' HC", 4100, 4600, iso("2026-08-10T11:31:00")),
      fee("Assurance", "Assurance marchandises 110 % valeur CIF", 650, 850, iso("2026-08-10T11:34:00")),
      fee("Frais de préparation", "Palettisation, filmage et contrôle étanchéité des bidons", 1250, 1250, iso("2026-08-10T11:36:00")),
      fee("Transport local", "Pré-acheminement dépôt → port de Casablanca", 1100, 1100, iso("2026-08-10T11:37:00")),
      fee("Documentation export", "Certificat d'origine, SDS, connaissement", 450, 450, iso("2026-08-10T11:38:00")),
    ],
    conditions: conditionsFor(orders[0], "50 % à la commande / 50 % avant embarquement"),
    history: [
      { at: iso("2026-08-10T11:20:00"), user: CURRENT_USER.name, label: "Commande validée" },
      { at: iso("2026-08-10T11:28:00"), user: CURRENT_USER.name, label: "Agent Devis lancé" },
      { at: iso("2026-08-10T11:31:00"), user: CURRENT_USER.name, label: "Fret ajouté", detail: "4 600 €" },
      { at: iso("2026-08-10T11:34:00"), user: CURRENT_USER.name, label: "Assurance ajoutée", detail: "850 €" },
      { at: iso("2026-08-10T11:40:00"), user: CURRENT_USER.name, label: "Devis généré", detail: "61 050 €" },
      { at: iso("2026-08-10T11:43:00"), user: "Yassine Bennani", label: "Devis validé" },
      { at: iso("2026-08-10T11:44:00"), user: "Système", label: "Devis envoyé au client" },
      { at: iso("2026-08-10T13:14:00"), user: "Abidjan Lubricants Group", label: "Devis consulté par le client" },
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
      { at: iso("2026-06-04T09:20:00"), user: "Bamako Automotive Supply", label: "Devis accepté par le client" },
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
      { at: iso("2026-06-27T10:05:00"), user: "Conakry Motors Distribution", label: "Devis refusé", detail: "Conditions de paiement" },
    ],
    refusal: { reason: "Conditions de paiement", message: "Nous souhaitons passer sur un paiement 50/50.", at: iso("2026-06-27T10:05:00") },
  },
];

/* ------------------------------------------------------------------ */
/* Activity log & notifications                                        */
/* ------------------------------------------------------------------ */

let activities: Activity[] = [
  { id: uid(), at: iso("2026-08-10T13:14:00"), user: "Abidjan Lubricants Group", action: "Devis consulté", object: "DEV-AKW-2026-0187-V1" },
  { id: uid(), at: iso("2026-08-10T11:44:00"), user: "Système", action: "Devis envoyé", object: "DEV-AKW-2026-0187-V1" },
  { id: uid(), at: iso("2026-08-10T11:40:00"), user: CURRENT_USER.name, action: "Devis généré", object: "DEV-AKW-2026-0187-V1", to: "61 050 €" },
  { id: uid(), at: iso("2026-08-10T09:12:00"), user: "Abidjan Lubricants Group", action: "Commande créée par le client", object: "AKW-EXP-2026-0187", to: "52 800 €" },
  { id: uid(), at: iso("2026-08-09T17:05:00"), user: "Nouakchott Fleet Parts", action: "Commande créée", object: "AKW-EXP-2026-0205" },
  { id: uid(), at: iso("2026-08-08T15:30:00"), user: "Douala Automotive Distribution", action: "Commande créée", object: "AKW-EXP-2026-0201" },
  { id: uid(), at: iso("2026-08-01T09:00:00"), user: CURRENT_USER.name, action: "Prix produit modifié", object: "AKW-ENG-5W30-001", from: "3,62 €", to: "3,85 €" },
  { id: uid(), at: iso("2026-06-27T10:05:00"), user: "Conakry Motors Distribution", action: "Devis refusé", object: "DEV-AKW-2026-0169-V1", to: "Conditions de paiement" },
];

let notifications: AdminNotification[] = [
  { id: uid(), at: iso("2026-08-10T09:12:00"), title: "Nouvelle commande reçue", body: "AKW-EXP-2026-0187 — Abidjan Lubricants Group (52 800 €). Validation requise.", tone: "warning", read: false, link: "/admin/commandes/AKW-EXP-2026-0187" },
  { id: uid(), at: iso("2026-08-09T17:05:00"), title: "Commande nécessitant validation", body: "AKW-EXP-2026-0205 — Nouakchott Fleet Parts.", tone: "warning", read: false, link: "/admin/commandes/AKW-EXP-2026-0205" },
  { id: uid(), at: iso("2026-08-10T13:14:00"), title: "Client a consulté un devis", body: "Abidjan Lubricants Group a ouvert DEV-AKW-2026-0187-V1.", tone: "info", read: false, link: "/admin/devis/DEV-AKW-2026-0187-V1" },
  { id: uid(), at: iso("2026-08-08T08:00:00"), title: "Devis expirant bientôt", body: "DEV-AKW-2026-0193-V1 expire le 12/08/2026.", tone: "warning", read: false, link: "/admin/devis/DEV-AKW-2026-0193-V1" },
  { id: uid(), at: iso("2026-06-27T10:05:00"), title: "Devis refusé", body: "Conakry Motors Distribution — motif : conditions de paiement.", tone: "danger", read: true, link: "/admin/devis/DEV-AKW-2026-0169-V1" },
  { id: uid(), at: iso("2026-06-04T09:20:00"), title: "Devis accepté", body: "Bamako Automotive Supply a accepté DEV-AKW-2026-0176-V1.", tone: "success", read: true, link: "/admin/devis/DEV-AKW-2026-0176-V1" },
  { id: uid(), at: iso("2026-08-07T12:00:00"), title: "Produit indisponible", body: "AKW-ACC-PMP-047 — Pompe de transvasement fût 208L est en rupture.", tone: "danger", read: true, link: "/admin/produits/AKW-ACC-PMP-047" },
  { id: uid(), at: iso("2026-08-01T09:05:00"), title: "Prix fournisseur modifié", body: "Atlas Lubricants Industries : +6,4 % sur AKW-ENG-5W30-001 (huile moteur 5W-30 1L).", tone: "info", read: true, link: "/admin/produits/AKW-ENG-5W30-001" },
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
      { ref: input.ref, name: input.name, cat: input.category ?? "Huiles moteur", sub: input.subCategory ?? "Divers", brand: input.brand ?? "AKWA Motion", origin: input.origin ?? "Maroc", emoji: input.emoji ?? "🛢️", visc: input.viscosity ?? "—", norm: input.standard ?? "—", pack: input.packaging ?? "Bidon 1 L", buy: input.purchasePrice ?? 1, prev: input.purchasePrice ?? 1, sell: input.salePrice ?? 1.5, sup: input.suppliers?.[0]?.supplierId ?? "SUP-001" },
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
        notes: "Lubrifiants et fluides conformes aux normes API / ACEA, SDS fournies pour chaque référence.",
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
