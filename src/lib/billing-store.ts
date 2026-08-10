import { useSyncExternalStore } from "react";

/* ============================ Types ============================ */

export type InvoiceType = "Proforma" | "Facture finale";

export type InvoiceStatus =
  | "Brouillon"
  | "Émise"
  | "Envoyée"
  | "Partiellement payée"
  | "Payée"
  | "En retard"
  | "Annulée"
  | "Remplacée"
  | "Échue";

export type InvoiceLine = {
  ref: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  unitPrice: number;
};

export type InvoiceFees = {
  freight: number;
  insurance: number;
  localTransport: number;
  documentation: number;
  preparation: number;
  portFees: number;
  other: number;
};

export type InvoiceEvent = { at: string; user: string; label: string; detail?: string };

export type Invoice = {
  id: string;
  type: InvoiceType;
  orderRef: string;
  quoteId: string | null;
  clientId: string;
  client: string;
  country: string;
  destination: string;
  incoterm: string;
  issuedAt: string;
  dueAt: string;
  sentAt: string | null;
  currency: "EUR";
  status: InvoiceStatus;
  owner: string;
  lines: InvoiceLine[];
  fees: InvoiceFees;
  paymentTerms: string;
  notes: string;
  internalNotes: { id: string; at: string; author: string; text: string }[];
  history: InvoiceEvent[];
  proformaId?: string;
  finalId?: string;
  variances?: { label: string; amount: number; reason: string }[];
  visibleToClient: boolean;
};

export type PaymentStatus =
  | "Attendu"
  | "Reçu"
  | "À vérifier"
  | "Confirmé"
  | "Partiel"
  | "Rejeté"
  | "Remboursé"
  | "Annulé";

export type PaymentKind = "Acompte" | "Solde" | "Paiement partiel" | "Autre";

export type PaymentMethod =
  | "Virement bancaire"
  | "SWIFT"
  | "Crédit documentaire"
  | "Chèque"
  | "Espèces"
  | "Autre";

export type Payment = {
  id: string;
  clientId: string;
  client: string;
  orderRef: string;
  invoiceId: string | null;
  date: string;
  amount: number;
  currency: "EUR";
  method: PaymentMethod;
  kind: PaymentKind;
  bank: string;
  bankRef: string;
  status: PaymentStatus;
  owner: string;
  proof?: string;
  comment?: string;
};

export type UnmatchedPayment = {
  id: string;
  date: string;
  amount: number;
  bankRef: string;
  bank: string;
  detectedClient: string;
  detectedClientId: string;
  suggestedInvoiceId: string;
  confidence: number;
  method: PaymentMethod;
};

export type BillingState = {
  invoices: Invoice[];
  payments: Payment[];
  unmatched: UnmatchedPayment[];
  log: InvoiceEvent[];
};

/* ============================ Helpers ============================ */

export const CURRENT_BILLING_USER = "Sofia El Mansouri";

const uid = () => Math.random().toString(36).slice(2, 9);
const nowIso = () => new Date("2026-08-14T10:00:00").toISOString();

export const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
export const eur2 = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
export const fdate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
export const fdatetime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const goodsTotal = (inv: Invoice) => inv.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
export const feesTotal = (f: InvoiceFees) =>
  f.freight + f.insurance + f.localTransport + f.documentation + f.preparation + f.portFees + f.other;
export const invoiceTotal = (inv: Invoice) => goodsTotal(inv) + feesTotal(inv.fees);

const emptyFees = (): InvoiceFees => ({
  freight: 0, insurance: 0, localTransport: 0, documentation: 0, preparation: 0, portFees: 0, other: 0,
});

export const FEE_LABELS: { key: keyof InvoiceFees; label: string }[] = [
  { key: "freight", label: "Fret maritime" },
  { key: "insurance", label: "Assurance" },
  { key: "localTransport", label: "Transport local" },
  { key: "documentation", label: "Documentation" },
  { key: "preparation", label: "Préparation export" },
  { key: "portFees", label: "Frais portuaires" },
  { key: "other", label: "Autres frais" },
];

/* ============================ Seed data ============================ */

const atlasLines: InvoiceLine[] = [
  { ref: "AKW-ENG-5W30-001", name: "Huile moteur synthétique 5W-30 – 1L", category: "Huiles moteur", qty: 2400, unit: "bidons 1L", unitPrice: 5.45 },
  { ref: "AKW-ENG-10W40-006", name: "Huile moteur semi-synthétique 10W-40 – 5L", category: "Huiles moteur", qty: 800, unit: "bidons 5L", unitPrice: 21 },
  { ref: "AKW-ATF-D3-021", name: "ATF Dexron III – 1L", category: "Huiles transmission", qty: 1200, unit: "bidons 1L", unitPrice: 4.2 },
  { ref: "AKW-GEAR-80W90-031", name: "Gear Oil 80W-90 API GL-5 – 4L", category: "Huiles transmission", qty: 500, unit: "bidons 4L", unitPrice: 18 },
  { ref: "AKW-COOL-005", name: "Liquide de refroidissement -35 °C – 5L", category: "Fluides automobiles", qty: 600, unit: "bidons 5L", unitPrice: 7 },
  { ref: "AKW-BRK-DOT4-011", name: "Liquide de frein DOT 4 – 500 ml", category: "Fluides automobiles", qty: 1000, unit: "flacons 500ml", unitPrice: 3.9 },
];
// 13 080 + 16 800 + 5 040 + 9 000 + 4 200 + 3 900 = 52 020 ; ajustement pour atteindre 52 800 €
atlasLines.push({
  ref: "AKW-WSH-016", name: "Liquide lave-glace -20 °C – 5L", category: "Fluides automobiles",
  qty: 260, unit: "bidons 5L", unitPrice: 3,
});

const mk = (
  p: {
    id: string; type: InvoiceType; orderRef: string; quoteId: string | null; clientId: string; client: string;
    country: string; destination: string; incoterm: string; issuedAt: string; dueAt: string; sentAt?: string | null;
    status: InvoiceStatus; owner?: string; lines: InvoiceLine[]; fees: Partial<InvoiceFees>;
    paymentTerms?: string; notes?: string; proformaId?: string; finalId?: string;
    variances?: { label: string; amount: number; reason: string }[]; visibleToClient?: boolean;
    history?: InvoiceEvent[];
  },
): Invoice => ({
  id: p.id, type: p.type, orderRef: p.orderRef, quoteId: p.quoteId, clientId: p.clientId, client: p.client,
  country: p.country, destination: p.destination, incoterm: p.incoterm,
  issuedAt: p.issuedAt, dueAt: p.dueAt, sentAt: p.sentAt ?? null, currency: "EUR",
  status: p.status, owner: p.owner ?? CURRENT_BILLING_USER, lines: p.lines,
  fees: { ...emptyFees(), ...p.fees },
  paymentTerms: p.paymentTerms ?? "50 % à validation / 50 % avant embarquement",
  notes: p.notes ?? "Marchandises conformes aux normes API / ACEA. SDS et fiches techniques jointes.",
  internalNotes: [],
  history: p.history ?? [{ at: p.issuedAt, user: CURRENT_BILLING_USER, label: "Facture créée" }],
  proformaId: p.proformaId, finalId: p.finalId, variances: p.variances,
  visibleToClient: p.visibleToClient ?? p.status !== "Brouillon",
});

const simple = (
  ref: string, name: string, category: string, qty: number, unit: string, unitPrice: number,
): InvoiceLine => ({ ref, name, category, qty, unit, unitPrice });

let invoices: Invoice[] = [
  mk({
    id: "PF-AKW-2026-0187", type: "Proforma", orderRef: "AKW-EXP-2026-0187", quoteId: "DEV-AKW-2026-0187-V1",
    clientId: "MAD-001", client: "Abidjan Lubricants Group", country: "Côte d'Ivoire", destination: "Abidjan, Côte d'Ivoire",
    incoterm: "CIF Abidjan", issuedAt: "2026-08-10T09:00:00", dueAt: "2026-08-16T00:00:00", sentAt: "2026-08-10T11:20:00",
    status: "Partiellement payée", lines: atlasLines,
    fees: { freight: 4600, insurance: 850, localTransport: 1100, documentation: 450, preparation: 1250 },
    history: [
      { at: "2026-08-10T09:00:00", user: CURRENT_BILLING_USER, label: "Facture proforma créée depuis DEV-AKW-2026-0187-V1" },
      { at: "2026-08-10T10:40:00", user: CURRENT_BILLING_USER, label: "Facture validée" },
      { at: "2026-08-10T11:20:00", user: CURRENT_BILLING_USER, label: "Facture envoyée au client", detail: "achats@abidjan-lubricants.ci" },
      { at: "2026-08-11T08:12:00", user: "Abidjan Lubricants Group", label: "Facture consultée par le client" },
      { at: "2026-08-12T14:05:00", user: "Comptabilité AKWA", label: "Acompte reçu", detail: "30 525 € — PAY-AKW-2026-0834" },
    ],
  }),
  mk({
    id: "FAC-AKW-2026-0172", type: "Facture finale", orderRef: "AKW-EXP-2026-0172", quoteId: "DEV-AKW-2026-0172-V2",
    clientId: "SDG-002", client: "Dakar Auto Services", country: "Sénégal", destination: "Dakar, Sénégal",
    incoterm: "CIF Dakar", issuedAt: "2026-07-18T09:00:00", dueAt: "2026-07-31T00:00:00", sentAt: "2026-07-18T10:10:00",
    status: "Payée", proformaId: "PF-AKW-2026-0172",
    lines: [
      simple("AKW-ENG-5W30-002", "Huile moteur synthétique 5W-30 – 4L", "Huiles moteur", 1600, "bidons 4L", 19.4),
      simple("AKW-ENG-15W40-010", "Huile moteur diesel 15W-40 – 20L", "Huiles moteur", 300, "fûts 20L", 56.5),
      simple("AKW-ADB-014", "AdBlue – bidon 10L", "Fluides automobiles", 900, "bidons 10L", 7.2),
    ],
    fees: { freight: 3400, insurance: 620, localTransport: 850, documentation: 380, preparation: 900, portFees: 210 },
  }),
  mk({
    id: "PF-AKW-2026-0172", type: "Proforma", orderRef: "AKW-EXP-2026-0172", quoteId: "DEV-AKW-2026-0172-V2",
    clientId: "SDG-002", client: "Dakar Auto Services", country: "Sénégal", destination: "Dakar, Sénégal",
    incoterm: "CIF Dakar", issuedAt: "2026-06-28T09:00:00", dueAt: "2026-07-05T00:00:00", sentAt: "2026-06-28T09:30:00",
    status: "Remplacée", finalId: "FAC-AKW-2026-0172",
    lines: [
      simple("AKW-ENG-5W30-002", "Huile moteur synthétique 5W-30 – 4L", "Huiles moteur", 1600, "bidons 4L", 19.4),
      simple("AKW-ENG-15W40-010", "Huile moteur diesel 15W-40 – 20L", "Huiles moteur", 300, "fûts 20L", 56.5),
      simple("AKW-ADB-014", "AdBlue – bidon 10L", "Fluides automobiles", 900, "bidons 10L", 7.2),
    ],
    fees: { freight: 3400, insurance: 620, localTransport: 850, documentation: 380, preparation: 900 },
  }),
  mk({
    id: "PF-AKW-2026-0193", type: "Proforma", orderRef: "AKW-EXP-2026-0193", quoteId: "DEV-AKW-2026-0193-V1",
    clientId: "SDG-002", client: "Dakar Auto Services", country: "Sénégal", destination: "Dakar, Sénégal",
    incoterm: "FOB Casablanca", issuedAt: "2026-08-06T09:00:00", dueAt: "2026-08-20T00:00:00", sentAt: "2026-08-06T10:00:00",
    status: "Envoyée",
    lines: [
      simple("AKW-ENG-10W40-006", "Huile moteur semi-synthétique 10W-40 – 5L", "Huiles moteur", 1200, "bidons 5L", 17.9),
      simple("AKW-ENG-15W40-010", "Huile moteur diesel 15W-40 – 20L", "Huiles moteur", 400, "fûts 20L", 56.5),
      simple("AKW-COOL-005", "Liquide de refroidissement -35 °C – 5L", "Fluides automobiles", 900, "bidons 5L", 6.8),
      simple("AKW-BRK-DOT4-011", "Liquide de frein DOT 4 – 500 ml", "Fluides automobiles", 1500, "flacons 500ml", 2.7),
    ],
    fees: { freight: 3100, insurance: 480, localTransport: 900, documentation: 280, preparation: 700 },
  }),
  mk({
    id: "PF-AKW-2026-0201", type: "Proforma", orderRef: "AKW-EXP-2026-0201", quoteId: "DEV-AKW-2026-0201-V1",
    clientId: "CMR-003", client: "Douala Automotive Distribution", country: "Cameroun", destination: "Douala, Cameroun",
    incoterm: "CFR Douala", issuedAt: "2026-08-09T09:00:00", dueAt: "2026-08-23T00:00:00", sentAt: "2026-08-09T15:40:00",
    status: "Envoyée",
    lines: [
      simple("AKW-ENG-15W40-011", "Huile moteur diesel 15W-40 – fût 208L", "Huiles moteur", 60, "fûts 208L", 540),
      simple("AKW-GREASE-LT-008", "Graisse lithium multiusage NLGI 2 – 18 kg", "Graisses", 220, "seaux 18kg", 67.5),
      simple("AKW-GEAR-85W140-032", "Gear Oil 85W-140 – 20L", "Huiles transmission", 120, "fûts 20L", 84),
    ],
    fees: { freight: 3900, insurance: 700, localTransport: 950, documentation: 380, preparation: 1050 },
  }),
  mk({
    id: "FAC-AKW-2026-0169", type: "Facture finale", orderRef: "AKW-EXP-2026-0169", quoteId: "DEV-AKW-2026-0169-V1",
    clientId: "GUI-005", client: "Conakry Motors Distribution", country: "Guinée", destination: "Conakry, Guinée",
    incoterm: "CIF Conakry", issuedAt: "2026-07-05T09:00:00", dueAt: "2026-07-20T00:00:00", sentAt: "2026-07-05T09:45:00",
    status: "En retard",
    lines: [
      simple("AKW-ENG-20W50-013", "Huile moteur minérale 20W-50 – 5L", "Huiles moteur", 2400, "bidons 5L", 13.4),
      simple("AKW-BRK-DOT3-010", "Liquide de frein DOT 3 – 500 ml", "Fluides automobiles", 1600, "flacons 500ml", 2.3),
    ],
    fees: { freight: 2900, insurance: 430, localTransport: 720, documentation: 260, preparation: 640, portFees: 180 },
  }),
  mk({
    id: "FAC-AKW-2026-0176", type: "Facture finale", orderRef: "AKW-EXP-2026-0176", quoteId: "DEV-AKW-2026-0176-V1",
    clientId: "MLI-004", client: "Bamako Automotive Supply", country: "Mali", destination: "Bamako, Mali",
    incoterm: "DAP Bamako", issuedAt: "2026-07-22T09:00:00", dueAt: "2026-08-18T00:00:00", sentAt: "2026-07-22T11:00:00",
    status: "Partiellement payée",
    lines: [
      simple("AKW-HYD-46-018", "Huile hydraulique ISO VG 46 – 20L", "Huiles industrielles", 280, "fûts 20L", 60.5),
      simple("AKW-ENG-15W40-010", "Huile moteur diesel 15W-40 – 20L", "Huiles moteur", 520, "fûts 20L", 56),
      simple("AKW-GREASE-LT-007", "Graisse lithium multiusage NLGI 2 – 5 kg", "Graisses", 400, "seaux 5kg", 20.4),
    ],
    fees: { freight: 3600, insurance: 540, localTransport: 1400, documentation: 320, preparation: 780, portFees: 260 },
  }),
  mk({
    id: "PF-AKW-2026-0205", type: "Proforma", orderRef: "AKW-EXP-2026-0205", quoteId: null,
    clientId: "MRT-006", client: "Nouakchott Fleet Parts", country: "Mauritanie", destination: "Nouakchott, Mauritanie",
    incoterm: "CIF Nouakchott", issuedAt: "2026-08-13T09:00:00", dueAt: "2026-08-28T00:00:00",
    status: "Brouillon",
    lines: [
      simple("AKW-ATF-D6-023", "ATF Dexron VI – 1L", "Huiles transmission", 900, "bidons 1L", 5.85),
      simple("AKW-WSH-016", "Liquide lave-glace -20 °C – 5L", "Fluides automobiles", 1400, "bidons 5L", 2.9),
    ],
    fees: { freight: 2100, insurance: 320, localTransport: 600, documentation: 240, preparation: 480 },
  }),
  mk({
    id: "FAC-AKW-2026-0158", type: "Facture finale", orderRef: "AKW-EXP-2026-0158", quoteId: "DEV-AKW-2026-0158-V1",
    clientId: "CIV-007", client: "AutoParts Distribution Côte d'Ivoire", country: "Côte d'Ivoire", destination: "Abidjan, Côte d'Ivoire",
    incoterm: "CIF Abidjan", issuedAt: "2026-06-14T09:00:00", dueAt: "2026-06-30T00:00:00", sentAt: "2026-06-14T10:00:00",
    status: "Payée",
    lines: [
      simple("AKW-ENG-5W40-004", "Huile moteur synthétique 5W-40 – 5L", "Huiles moteur", 1400, "bidons 5L", 24.1),
      simple("AKW-ATF-D6-023", "ATF Dexron VI – 1L", "Huiles transmission", 900, "bidons 1L", 5.85),
    ],
    fees: { freight: 3200, insurance: 520, localTransport: 780, documentation: 300, preparation: 700, portFees: 190 },
  }),
  mk({
    id: "FAC-AKW-2026-0151", type: "Facture finale", orderRef: "AKW-EXP-2026-0151", quoteId: "DEV-AKW-2026-0151-V1",
    clientId: "SEN-009", client: "West Africa Motors Supply", country: "Sénégal", destination: "Dakar, Sénégal",
    incoterm: "CIF Dakar", issuedAt: "2026-05-30T09:00:00", dueAt: "2026-06-20T00:00:00", sentAt: "2026-05-30T09:30:00",
    status: "Payée",
    lines: [
      simple("AKW-ENG-5W30-002", "Huile moteur synthétique 5W-30 – 4L", "Huiles moteur", 2200, "bidons 4L", 19.2),
      simple("AKW-COOL-006", "Antigel concentré G12+ – 20L", "Fluides automobiles", 260, "fûts 20L", 37.8),
    ],
    fees: { freight: 3500, insurance: 610, localTransport: 820, documentation: 300, preparation: 860, portFees: 220 },
  }),
  mk({
    id: "FAC-AKW-2026-0163", type: "Facture finale", orderRef: "AKW-EXP-2026-0163", quoteId: "DEV-AKW-2026-0163-V1",
    clientId: "GHA-011", client: "Ghana Auto Trade", country: "Ghana", destination: "Tema, Ghana",
    incoterm: "FOB Casablanca", issuedAt: "2026-06-25T09:00:00", dueAt: "2026-07-15T00:00:00", sentAt: "2026-06-25T10:20:00",
    status: "Partiellement payée",
    lines: [
      simple("AKW-ATF-D6-023", "ATF Dexron VI – 1L", "Huiles transmission", 3000, "bidons 1L", 5.6),
      simple("AKW-ADD-INJ-040", "Nettoyant injecteur diesel – 300 ml", "Additifs & nettoyants", 2400, "flacons", 2.25),
    ],
    fees: { freight: 2600, insurance: 400, localTransport: 700, documentation: 260, preparation: 620 },
  }),
  mk({
    id: "PF-AKW-2026-0208", type: "Proforma", orderRef: "AKW-EXP-2026-0208", quoteId: "DEV-AKW-2026-0208-V1",
    clientId: "MLI-015", client: "Sikasso Transport Lubrifiants", country: "Mali", destination: "Sikasso, Mali",
    incoterm: "DAP Sikasso", issuedAt: "2026-08-12T09:00:00", dueAt: "2026-08-26T00:00:00", sentAt: "2026-08-12T12:00:00",
    status: "Envoyée",
    lines: [
      simple("AKW-ENG-15W40-010", "Huile moteur diesel 15W-40 – 20L", "Huiles moteur", 640, "fûts 20L", 56.5),
      simple("AKW-GREASE-LT-007", "Graisse lithium multiusage NLGI 2 – 5 kg", "Graisses", 300, "seaux 5kg", 20.9),
    ],
    fees: { freight: 2800, insurance: 460, localTransport: 1500, documentation: 280, preparation: 640 },
  }),
  mk({
    id: "FAC-AKW-2026-0144", type: "Facture finale", orderRef: "AKW-EXP-2026-0144", quoteId: "DEV-AKW-2026-0144-V1",
    clientId: "GHA-012", client: "Accra Lubricants Wholesale", country: "Ghana", destination: "Accra, Ghana",
    incoterm: "CIF Tema", issuedAt: "2026-05-12T09:00:00", dueAt: "2026-06-01T00:00:00", sentAt: "2026-05-12T09:40:00",
    status: "En retard",
    lines: [
      simple("AKW-GREASE-LT-008", "Graisse lithium multiusage NLGI 2 – 18 kg", "Graisses", 180, "seaux 18kg", 67.5),
      simple("AKW-PSF-013", "Fluide de direction assistée – 1L", "Fluides automobiles", 1200, "bidons 1L", 4.35),
    ],
    fees: { freight: 2400, insurance: 380, localTransport: 640, documentation: 240, preparation: 520 },
  }),
  mk({
    id: "PF-AKW-2026-0211", type: "Proforma", orderRef: "AKW-EXP-2026-0211", quoteId: "DEV-AKW-2026-0211-V1",
    clientId: "BEN-014", client: "Cotonou Motors Distribution", country: "Bénin", destination: "Cotonou, Bénin",
    incoterm: "CIF Cotonou", issuedAt: "2026-08-11T09:00:00", dueAt: "2026-08-25T00:00:00", sentAt: "2026-08-11T14:00:00",
    status: "Partiellement payée",
    lines: [
      simple("AKW-ENG-10W40-006", "Huile moteur semi-synthétique 10W-40 – 5L", "Huiles moteur", 900, "bidons 5L", 20.6),
      simple("AKW-WSH-016", "Liquide lave-glace -20 °C – 5L", "Fluides automobiles", 800, "bidons 5L", 2.9),
    ],
    fees: { freight: 2200, insurance: 340, localTransport: 620, documentation: 240, preparation: 500 },
  }),
  mk({
    id: "FAC-AKW-2026-0136", type: "Facture finale", orderRef: "AKW-EXP-2026-0136", quoteId: "DEV-AKW-2026-0136-V1",
    clientId: "CIV-008", client: "Ivoire Heavy Duty Parts", country: "Côte d'Ivoire", destination: "San Pedro, Côte d'Ivoire",
    incoterm: "CFR San Pedro", issuedAt: "2026-04-28T09:00:00", dueAt: "2026-05-20T00:00:00", sentAt: "2026-04-28T10:00:00",
    status: "Payée",
    lines: [
      simple("AKW-ENG-15W40-011", "Huile moteur diesel 15W-40 – fût 208L", "Huiles moteur", 45, "fûts 208L", 540),
      simple("AKW-HYD-46-018", "Huile hydraulique ISO VG 46 – 20L", "Huiles industrielles", 200, "fûts 20L", 60.5),
    ],
    fees: { freight: 2700, insurance: 420, localTransport: 700, documentation: 260, preparation: 580, portFees: 160 },
  }),
  mk({
    id: "FAC-AKW-2026-0129", type: "Facture finale", orderRef: "AKW-EXP-2026-0129", quoteId: "DEV-AKW-2026-0129-V1",
    clientId: "MRT-017", client: "Nouadhibou Marine & Fleet", country: "Mauritanie", destination: "Nouadhibou, Mauritanie",
    incoterm: "FOB Casablanca", issuedAt: "2026-04-10T09:00:00", dueAt: "2026-05-02T00:00:00", sentAt: "2026-04-10T11:30:00",
    status: "Payée",
    lines: [
      simple("AKW-HYD-46-018", "Huile hydraulique ISO VG 46 – 20L", "Huiles industrielles", 320, "fûts 20L", 60.5),
      simple("AKW-GEAR-80W90-031", "Gear Oil 80W-90 API GL-5 – 4L", "Huiles transmission", 400, "bidons 4L", 18 ),
    ],
    fees: { freight: 2300, insurance: 360, localTransport: 560, documentation: 220, preparation: 480 },
  }),
  mk({
    id: "FAC-AKW-2026-0118", type: "Facture finale", orderRef: "AKW-EXP-2026-0118", quoteId: "DEV-AKW-2026-0118-V1",
    clientId: "CMR-013", client: "Yaoundé Garage Network", country: "Cameroun", destination: "Yaoundé, Cameroun",
    incoterm: "DAP Yaoundé", issuedAt: "2026-03-20T09:00:00", dueAt: "2026-04-15T00:00:00", sentAt: "2026-03-20T09:50:00",
    status: "Annulée",
    lines: [
      simple("AKW-ADD-OIL-041", "Additif anti-friction moteur – 400 ml", "Additifs & nettoyants", 2000, "flacons", 3.6),
    ],
    fees: { freight: 1800, insurance: 260, localTransport: 900, documentation: 200, preparation: 360 },
  }),
  mk({
    id: "PF-AKW-2026-0214", type: "Proforma", orderRef: "AKW-EXP-2026-0214", quoteId: "DEV-AKW-2026-0214-V1",
    clientId: "GUI-016", client: "Kankan Auto Négoce", country: "Guinée", destination: "Kankan, Guinée",
    incoterm: "CIF Conakry", issuedAt: "2026-08-13T09:00:00", dueAt: "2026-08-27T00:00:00", sentAt: "2026-08-13T16:10:00",
    status: "Envoyée",
    lines: [
      simple("AKW-BRK-DOT3-010", "Liquide de frein DOT 3 – 500 ml", "Fluides automobiles", 2000, "flacons 500ml", 2.3),
      simple("AKW-ADD-INJ-040", "Nettoyant injecteur diesel – 300 ml", "Additifs & nettoyants", 1500, "flacons", 2.35),
    ],
    fees: { freight: 1900, insurance: 300, localTransport: 540, documentation: 220, preparation: 420 },
  }),
  mk({
    id: "FAC-AKW-2026-0165", type: "Facture finale", orderRef: "AKW-EXP-2026-0165", quoteId: "DEV-AKW-2026-0165-V1",
    clientId: "SEN-010", client: "Senegal Fleet Solutions", country: "Sénégal", destination: "Thiès, Sénégal",
    incoterm: "DAP Thiès", issuedAt: "2026-07-01T09:00:00", dueAt: "2026-07-25T00:00:00", sentAt: "2026-07-01T10:15:00",
    status: "Payée",
    lines: [
      simple("AKW-ADB-014", "AdBlue – bidon 10L", "Fluides automobiles", 2400, "bidons 10L", 7.2),
      simple("AKW-COOL-005", "Liquide de refroidissement -35 °C – 5L", "Fluides automobiles", 1200, "bidons 5L", 6.9),
    ],
    fees: { freight: 2500, insurance: 390, localTransport: 1100, documentation: 240, preparation: 560 },
  }),
];

let payments: Payment[] = [
  {
    id: "PAY-AKW-2026-0834", clientId: "MAD-001", client: "Abidjan Lubricants Group", orderRef: "AKW-EXP-2026-0187",
    invoiceId: "PF-AKW-2026-0187", date: "2026-08-12T14:05:00", amount: 30525, currency: "EUR",
    method: "Virement bancaire", kind: "Acompte", bank: "Attijariwafa Bank", bankRef: "SWIFT-ABJ-778411",
    status: "Confirmé", owner: "Comptabilité AKWA", comment: "Acompte 50 % conforme aux conditions de la proforma.",
  },
  {
    id: "PAY-AKW-2026-0790", clientId: "SDG-002", client: "Dakar Auto Services", orderRef: "AKW-EXP-2026-0172",
    invoiceId: "FAC-AKW-2026-0172", date: "2026-07-02T10:30:00", amount: 24210, currency: "EUR",
    method: "SWIFT", kind: "Acompte", bank: "BMCE Bank", bankRef: "SWIFT-DKR-551208", status: "Confirmé", owner: "Comptabilité AKWA",
  },
  {
    id: "PAY-AKW-2026-0812", clientId: "SDG-002", client: "Dakar Auto Services", orderRef: "AKW-EXP-2026-0172",
    invoiceId: "FAC-AKW-2026-0172", date: "2026-07-28T09:15:00", amount: 24210, currency: "EUR",
    method: "SWIFT", kind: "Solde", bank: "BMCE Bank", bankRef: "SWIFT-DKR-561944", status: "Confirmé", owner: "Comptabilité AKWA",
  },
  {
    id: "PAY-AKW-2026-0745", clientId: "CIV-007", client: "AutoParts Distribution Côte d'Ivoire", orderRef: "AKW-EXP-2026-0158",
    invoiceId: "FAC-AKW-2026-0158", date: "2026-06-24T11:00:00", amount: 44045, currency: "EUR",
    method: "Virement bancaire", kind: "Solde", bank: "Société Générale CI", bankRef: "VIR-ABJ-330912", status: "Confirmé", owner: "Comptabilité AKWA",
  },
  {
    id: "PAY-AKW-2026-0702", clientId: "SEN-009", client: "West Africa Motors Supply", orderRef: "AKW-EXP-2026-0151",
    invoiceId: "FAC-AKW-2026-0151", date: "2026-06-18T15:20:00", amount: 58138, currency: "EUR",
    method: "Crédit documentaire", kind: "Solde", bank: "CBAO", bankRef: "LC-DKR-118844", status: "Confirmé", owner: "Comptabilité AKWA",
  },
  {
    id: "PAY-AKW-2026-0768", clientId: "GHA-011", client: "Ghana Auto Trade", orderRef: "AKW-EXP-2026-0163",
    invoiceId: "FAC-AKW-2026-0163", date: "2026-07-08T09:40:00", amount: 12000, currency: "EUR",
    method: "SWIFT", kind: "Paiement partiel", bank: "Ecobank Ghana", bankRef: "SWIFT-TEM-224417", status: "Confirmé", owner: "Comptabilité AKWA",
  },
  {
    id: "PAY-AKW-2026-0821", clientId: "MLI-004", client: "Bamako Automotive Supply", orderRef: "AKW-EXP-2026-0176",
    invoiceId: "FAC-AKW-2026-0176", date: "2026-08-01T13:00:00", amount: 30000, currency: "EUR",
    method: "Virement bancaire", kind: "Acompte", bank: "Bank of Africa Mali", bankRef: "VIR-BKO-772100", status: "Confirmé", owner: "Comptabilité AKWA",
  },
  {
    id: "PAY-AKW-2026-0840", clientId: "BEN-014", client: "Cotonou Motors Distribution", orderRef: "AKW-EXP-2026-0211",
    invoiceId: "PF-AKW-2026-0211", date: "2026-08-13T10:20:00", amount: 10000, currency: "EUR",
    method: "Virement bancaire", kind: "Acompte", bank: "Bank of Africa Bénin", bankRef: "VIR-COO-990233", status: "À vérifier", owner: "Comptabilité AKWA",
  },
  {
    id: "PAY-AKW-2026-0736", clientId: "MRT-017", client: "Nouadhibou Marine & Fleet", orderRef: "AKW-EXP-2026-0129",
    invoiceId: "FAC-AKW-2026-0129", date: "2026-04-30T09:10:00", amount: 30260, currency: "EUR",
    method: "Virement bancaire", kind: "Solde", bank: "BNM Mauritanie", bankRef: "VIR-NDB-448120", status: "Confirmé", owner: "Comptabilité AKWA",
  },
  {
    id: "PAY-AKW-2026-0758", clientId: "SEN-010", client: "Senegal Fleet Solutions", orderRef: "AKW-EXP-2026-0165",
    invoiceId: "FAC-AKW-2026-0165", date: "2026-07-20T11:45:00", amount: 30070, currency: "EUR",
    method: "SWIFT", kind: "Solde", bank: "CBAO", bankRef: "SWIFT-DKR-570122", status: "Confirmé", owner: "Comptabilité AKWA",
  },
  {
    id: "PAY-AKW-2026-0845", clientId: "MAD-001", client: "Abidjan Lubricants Group", orderRef: "AKW-EXP-2026-0187",
    invoiceId: "PF-AKW-2026-0187", date: "2026-08-16T00:00:00", amount: 30525, currency: "EUR",
    method: "Virement bancaire", kind: "Solde", bank: "Attijariwafa Bank", bankRef: "—", status: "Attendu", owner: "Comptabilité AKWA",
    comment: "Solde attendu avant embarquement.",
  },
  {
    id: "PAY-AKW-2026-0846", clientId: "GUI-005", client: "Conakry Motors Distribution", orderRef: "AKW-EXP-2026-0169",
    invoiceId: "FAC-AKW-2026-0169", date: "2026-07-20T00:00:00", amount: 41000, currency: "EUR",
    method: "Virement bancaire", kind: "Solde", bank: "BICIGUI", bankRef: "—", status: "Attendu", owner: "Comptabilité AKWA",
    comment: "Facture échue depuis le 20/07 — relance envoyée.",
  },
  {
    id: "PAY-AKW-2026-0731", clientId: "CIV-008", client: "Ivoire Heavy Duty Parts", orderRef: "AKW-EXP-2026-0136",
    invoiceId: "FAC-AKW-2026-0136", date: "2026-05-18T14:30:00", amount: 41220, currency: "EUR",
    method: "Virement bancaire", kind: "Solde", bank: "Société Générale CI", bankRef: "VIR-SPD-220945", status: "Confirmé", owner: "Comptabilité AKWA",
  },
];

let unmatched: UnmatchedPayment[] = [
  {
    id: "BNK-2026-4471", date: "2026-08-13T08:20:00", amount: 30525, bankRef: "SWIFT-ABJ-835928", bank: "Attijariwafa Bank",
    detectedClient: "Abidjan Lubricants Group", detectedClientId: "MAD-001", suggestedInvoiceId: "PF-AKW-2026-0187",
    confidence: 94, method: "SWIFT",
  },
  {
    id: "BNK-2026-4468", date: "2026-08-12T16:05:00", amount: 18400, bankRef: "SWIFT-TEM-224988", bank: "Ecobank Ghana",
    detectedClient: "Ghana Auto Trade", detectedClientId: "GHA-011", suggestedInvoiceId: "FAC-AKW-2026-0163",
    confidence: 88, method: "SWIFT",
  },
  {
    id: "BNK-2026-4460", date: "2026-08-11T09:35:00", amount: 9800, bankRef: "VIR-COO-990412", bank: "Bank of Africa Bénin",
    detectedClient: "Cotonou Motors Distribution", detectedClientId: "BEN-014", suggestedInvoiceId: "PF-AKW-2026-0211",
    confidence: 72, method: "Virement bancaire",
  },
  {
    id: "BNK-2026-4455", date: "2026-08-10T11:12:00", amount: 15600, bankRef: "VIR-BKO-772566", bank: "Bank of Africa Mali",
    detectedClient: "Bamako Automotive Supply", detectedClientId: "MLI-004", suggestedInvoiceId: "FAC-AKW-2026-0176",
    confidence: 81, method: "Virement bancaire",
  },
];

let log: InvoiceEvent[] = [
  { at: "2026-08-13T08:20:00", user: "Système AKWA", label: "Virement bancaire non rapproché détecté", detail: "SWIFT-ABJ-835928 — 30 525 €" },
  { at: "2026-08-12T14:05:00", user: "Comptabilité AKWA", label: "Paiement reçu", detail: "PAY-AKW-2026-0834 — 30 525 € sur PF-AKW-2026-0187" },
  { at: "2026-08-11T08:12:00", user: "Abidjan Lubricants Group", label: "Facture consultée", detail: "PF-AKW-2026-0187" },
  { at: "2026-08-10T11:20:00", user: CURRENT_BILLING_USER, label: "Facture envoyée au client", detail: "PF-AKW-2026-0187" },
  { at: "2026-08-10T09:00:00", user: CURRENT_BILLING_USER, label: "Facture proforma créée", detail: "PF-AKW-2026-0187 — 61 050 €" },
];

/* ============================ Store ============================ */

const listeners = new Set<() => void>();
let cache: BillingState = { invoices, payments, unmatched, log };
const refresh = () => {
  cache = { invoices, payments, unmatched, log };
  listeners.forEach((l) => l());
};
const trace = (label: string, detail?: string, user = CURRENT_BILLING_USER) => {
  log = [{ at: nowIso(), user, label, detail }, ...log];
};

const pushHistory = (id: string, label: string, detail?: string, user = CURRENT_BILLING_USER) => {
  invoices = invoices.map((i) =>
    i.id === id ? { ...i, history: [...i.history, { at: nowIso(), user, label, detail }] } : i,
  );
};

export const paidOf = (invoiceId: string, list: Payment[] = payments) =>
  list
    .filter((p) => p.invoiceId === invoiceId && ["Reçu", "Confirmé", "Partiel"].includes(p.status))
    .reduce((s, p) => s + p.amount, 0);

const recomputeStatus = (inv: Invoice, paid: number): InvoiceStatus => {
  if (["Brouillon", "Annulée", "Remplacée"].includes(inv.status)) return inv.status;
  const total = invoiceTotal(inv);
  if (paid >= total - 0.5) return "Payée";
  if (paid > 0) return "Partiellement payée";
  if (new Date(inv.dueAt) < new Date("2026-08-14T00:00:00")) return "En retard";
  return inv.sentAt ? "Envoyée" : "Émise";
};

const syncStatuses = () => {
  invoices = invoices.map((i) => ({ ...i, status: recomputeStatus(i, paidOf(i.id)) }));
};

export const billingStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
  get: () => cache,

  getInvoice: (id: string) => invoices.find((i) => i.id === id),
  invoicesOfOrder: (orderRef: string) => invoices.filter((i) => i.orderRef === orderRef),
  invoicesOfClient: (clientId: string) => invoices.filter((i) => i.clientId === clientId),
  paymentsOfInvoice: (id: string) => payments.filter((p) => p.invoiceId === id),
  paymentsOfOrder: (orderRef: string) => payments.filter((p) => p.orderRef === orderRef),
  paid: (id: string) => paidOf(id),

  folderOf(orderRef: string) {
    const list = invoices.filter((i) => i.orderRef === orderRef);
    const proforma = list.find((i) => i.type === "Proforma" && i.status !== "Annulée");
    const final = list.find((i) => i.type === "Facture finale" && i.status !== "Annulée");
    const invoiced = final ? invoiceTotal(final) : proforma ? invoiceTotal(proforma) : 0;
    const paid = list.reduce((s, i) => s + (i.status === "Remplacée" ? 0 : paidOf(i.id)), 0);
    return { orderRef, proforma, final, invoiced, paid, balance: Math.max(0, invoiced - paid), settled: invoiced > 0 && paid >= invoiced - 0.5 };
  },

  comparison(orderRef: string) {
    const { proforma, final } = billingStore.folderOf(orderRef);
    if (!proforma) return null;
    const rows = [
      { label: "Marchandises", pf: goodsTotal(proforma), fi: final ? goodsTotal(final) : null },
      ...FEE_LABELS.map((f) => ({
        label: f.label,
        pf: proforma.fees[f.key],
        fi: final ? final.fees[f.key] : null,
      })),
    ].filter((r) => r.pf !== 0 || (r.fi ?? 0) !== 0);
    const totalPf = invoiceTotal(proforma);
    const totalFi = final ? invoiceTotal(final) : null;
    return { rows, totalPf, totalFi, variances: final?.variances ?? [], proforma, final };
  },

  /* --------- actions factures --------- */
  createProforma(input: {
    orderRef: string; quoteId: string | null; clientId: string; client: string; country: string;
    destination: string; incoterm: string; lines: InvoiceLine[]; fees: Partial<InvoiceFees>;
    paymentTerms?: string; notes?: string; dueAt?: string; draft?: boolean;
  }) {
    const num = input.orderRef.split("-").pop() ?? uid();
    const id = `PF-AKW-2026-${num}`;
    if (invoices.some((i) => i.id === id)) return invoices.find((i) => i.id === id)!;
    const inv = mk({
      id, type: "Proforma", orderRef: input.orderRef, quoteId: input.quoteId, clientId: input.clientId,
      client: input.client, country: input.country, destination: input.destination, incoterm: input.incoterm,
      issuedAt: nowIso(), dueAt: input.dueAt ?? "2026-08-31T00:00:00",
      status: input.draft ? "Brouillon" : "Émise", lines: input.lines, fees: input.fees,
      paymentTerms: input.paymentTerms, notes: input.notes,
      history: [{ at: nowIso(), user: CURRENT_BILLING_USER, label: "Facture proforma créée", detail: input.quoteId ? `Depuis ${input.quoteId}` : undefined }],
    });
    invoices = [inv, ...invoices];
    trace("Facture proforma créée", `${id} — ${eur(invoiceTotal(inv))}`);
    refresh();
    return inv;
  },

  updateInvoice(id: string, patch: Partial<Invoice>, label = "Facture modifiée") {
    invoices = invoices.map((i) => (i.id === id ? { ...i, ...patch } : i));
    pushHistory(id, label);
    trace(label, id);
    refresh();
  },

  validateInvoice(id: string) {
    invoices = invoices.map((i) => (i.id === id ? { ...i, status: "Émise" as InvoiceStatus, visibleToClient: true } : i));
    pushHistory(id, "Facture validée");
    trace("Facture validée", id);
    syncStatuses();
    refresh();
  },

  sendInvoice(id: string) {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    invoices = invoices.map((i) =>
      i.id === id ? { ...i, status: "Envoyée" as InvoiceStatus, sentAt: nowIso(), visibleToClient: true } : i,
    );
    pushHistory(id, "Facture envoyée au client", `E-mail simulé — ${inv.client}`);
    trace("Facture envoyée au client", `${id} — ${inv.client}`);
    syncStatuses();
    refresh();
    return `Une nouvelle ${inv.type.toLowerCase()} ${id} est disponible.`;
  },

  cancelInvoice(id: string, reason: string) {
    invoices = invoices.map((i) => (i.id === id ? { ...i, status: "Annulée" as InvoiceStatus } : i));
    pushHistory(id, "Facture annulée", reason);
    trace("Facture annulée", `${id} — ${reason}`);
    refresh();
  },

  duplicateInvoice(id: string) {
    const src = invoices.find((i) => i.id === id);
    if (!src) return;
    const copy: Invoice = {
      ...src,
      id: `${src.id}-COPIE-${uid().slice(0, 3).toUpperCase()}`,
      status: "Brouillon", sentAt: null, visibleToClient: false,
      issuedAt: nowIso(), history: [{ at: nowIso(), user: CURRENT_BILLING_USER, label: `Dupliquée depuis ${src.id}` }],
    };
    invoices = [copy, ...invoices];
    trace("Facture dupliquée", `${src.id} → ${copy.id}`);
    refresh();
    return copy;
  },

  addInternalNote(id: string, text: string) {
    invoices = invoices.map((i) =>
      i.id === id ? { ...i, internalNotes: [{ id: uid(), at: nowIso(), author: CURRENT_BILLING_USER, text }, ...i.internalNotes] } : i,
    );
    pushHistory(id, "Note interne ajoutée");
    refresh();
  },

  /** Génère la facture finale à partir de la proforma du même dossier. */
  generateFinalInvoice(orderRef: string, adjustments: { key: keyof InvoiceFees; amount: number; reason: string }[]) {
    const proforma = invoices.find((i) => i.orderRef === orderRef && i.type === "Proforma" && i.status !== "Annulée");
    if (!proforma) return null;
    if (invoices.some((i) => i.orderRef === orderRef && i.type === "Facture finale")) return null;
    const num = orderRef.split("-").pop() ?? uid();
    const id = `FAC-AKW-2026-${num}`;
    const fees = { ...proforma.fees };
    adjustments.forEach((a) => { fees[a.key] = (fees[a.key] ?? 0) + a.amount; });
    const final: Invoice = {
      ...proforma,
      id, type: "Facture finale", status: "Émise", issuedAt: nowIso(), sentAt: null,
      dueAt: "2026-09-10T00:00:00", fees, proformaId: proforma.id, finalId: undefined,
      internalNotes: [], visibleToClient: true,
      variances: adjustments.map((a) => ({
        label: FEE_LABELS.find((f) => f.key === a.key)?.label ?? a.key,
        amount: a.amount, reason: a.reason,
      })),
      history: [{ at: nowIso(), user: CURRENT_BILLING_USER, label: "Facture finale générée", detail: `Depuis ${proforma.id}` }],
    };
    invoices = [final, ...invoices.map((i) => (i.id === proforma.id ? { ...i, finalId: id } : i))];
    const delta = invoiceTotal(final) - invoiceTotal(proforma);
    trace("Facture finale générée", `${id} — ${eur(invoiceTotal(final))} (écart ${delta >= 0 ? "+" : ""}${eur(delta)})`);
    syncStatuses();
    refresh();
    return final;
  },

  /* --------- actions paiements --------- */
  recordPayment(input: {
    clientId: string; client: string; orderRef: string; invoiceId: string | null; amount: number;
    kind: PaymentKind; method: PaymentMethod; bank: string; bankRef: string; date?: string;
    proof?: string; comment?: string; status?: PaymentStatus;
  }) {
    const id = `PAY-AKW-2026-${String(850 + payments.length).padStart(4, "0")}`;
    const payment: Payment = {
      id, clientId: input.clientId, client: input.client, orderRef: input.orderRef, invoiceId: input.invoiceId,
      date: input.date ?? nowIso(), amount: input.amount, currency: "EUR", method: input.method, kind: input.kind,
      bank: input.bank, bankRef: input.bankRef, status: input.status ?? "Confirmé", owner: "Comptabilité AKWA",
      proof: input.proof, comment: input.comment,
    };
    payments = [payment, ...payments];
    if (input.invoiceId) pushHistory(input.invoiceId, "Paiement enregistré", `${id} — ${eur2(input.amount)}`);
    trace("Paiement enregistré", `${id} — ${eur(input.amount)}${input.invoiceId ? ` sur ${input.invoiceId}` : ""}`);
    syncStatuses();
    refresh();
    return payment;
  },

  setPaymentStatus(id: string, status: PaymentStatus) {
    payments = payments.map((p) => (p.id === id ? { ...p, status } : p));
    trace("Statut paiement modifié", `${id} → ${status}`);
    syncStatuses();
    refresh();
  },

  reconcile(bankId: string, invoiceId: string) {
    const item = unmatched.find((u) => u.id === bankId);
    if (!item) return;
    const invoice = invoices.find((i) => i.id === invoiceId);
    unmatched = unmatched.filter((u) => u.id !== bankId);
    billingStore.recordPayment({
      clientId: item.detectedClientId, client: item.detectedClient,
      orderRef: invoice?.orderRef ?? "—", invoiceId,
      amount: item.amount, kind: "Paiement partiel", method: item.method,
      bank: item.bank, bankRef: item.bankRef, date: item.date,
      comment: `Rapproché automatiquement (confiance ${item.confidence} %).`,
    });
    trace("Paiement rapproché", `${item.bankRef} → ${invoiceId}`);
    refresh();
  },

  ignoreUnmatched(bankId: string) {
    const item = unmatched.find((u) => u.id === bankId);
    unmatched = unmatched.filter((u) => u.id !== bankId);
    trace("Virement ignoré", item?.bankRef);
    refresh();
  },
};

syncStatuses();
refresh();

export function useBilling() {
  return useSyncExternalStore(
    (cb) => billingStore.subscribe(cb),
    () => cache,
    () => cache,
  );
}

/* ============================ Dérivés ============================ */

export const invoiceStatusTone = (s: InvoiceStatus): "muted" | "success" | "warning" | "danger" | "info" | "ai" => {
  switch (s) {
    case "Payée": return "success";
    case "Partiellement payée": return "warning";
    case "En retard": case "Échue": return "danger";
    case "Envoyée": return "ai";
    case "Émise": return "info";
    case "Annulée": case "Remplacée": case "Brouillon": default: return "muted";
  }
};

export const paymentStatusTone = (s: PaymentStatus): "muted" | "success" | "warning" | "danger" | "info" | "ai" => {
  switch (s) {
    case "Confirmé": case "Reçu": return "success";
    case "Partiel": case "À vérifier": return "warning";
    case "Rejeté": case "Annulé": return "danger";
    case "Remboursé": return "info";
    case "Attendu": default: return "muted";
  }
};

export function billingKpis(state: BillingState) {
  const active = state.invoices.filter((i) => !["Annulée", "Remplacée"].includes(i.status));
  const totalInvoiced = active.reduce((s, i) => s + invoiceTotal(i), 0);
  const collected = active.reduce((s, i) => s + paidOf(i.id, state.payments), 0);
  const outstanding = Math.max(0, totalInvoiced - collected);
  const proformas = active.filter((i) => i.type === "Proforma").length;
  const finals = active.filter((i) => i.type === "Facture finale").length;
  const late = active.filter((i) => i.status === "En retard").length;
  const dueSoon = active.filter(
    (i) => i.status !== "Payée" && new Date(i.dueAt) >= new Date("2026-08-14") && new Date(i.dueAt) <= new Date("2026-08-31"),
  ).length;
  const rate = totalInvoiced ? (collected / totalInvoiced) * 100 : 0;
  return { totalInvoiced, collected, outstanding, proformas, finals, late, dueSoon, rate };
}

export function paymentKpis(state: BillingState) {
  const confirmed = state.payments.filter((p) => ["Confirmé", "Reçu", "Partiel"].includes(p.status));
  const monthReceived = confirmed
    .filter((p) => p.date.startsWith("2026-08"))
    .reduce((s, p) => s + p.amount, 0);
  const expected = state.payments.filter((p) => p.status === "Attendu").reduce((s, p) => s + p.amount, 0);
  const late = state.invoices
    .filter((i) => i.status === "En retard")
    .reduce((s, i) => s + Math.max(0, invoiceTotal(i) - paidOf(i.id, state.payments)), 0);
  const toCheck = state.payments.filter((p) => p.status === "À vérifier").length;
  const partial = state.payments.filter((p) => p.kind === "Paiement partiel" || p.status === "Partiel").length;
  const received = confirmed.reduce((s, p) => s + p.amount, 0);
  const recovery = received + expected + late ? (received / (received + expected + late)) * 100 : 0;
  return { monthReceived, expected, late, toCheck, partial, toReconcile: state.unmatched.length, received, recovery };
}
