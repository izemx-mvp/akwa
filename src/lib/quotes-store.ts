import { useSyncExternalStore } from "react";

export type QuoteStatus =
  | "Brouillon"
  | "Envoyé"
  | "À valider"
  | "Accepté"
  | "Refusé"
  | "En révision"
  | "Remplacé"
  | "Expiré";

export type QuoteItem = {
  ref: string;
  label: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

export type QuoteCharges = {
  preparation: number;
  logistics: number;
  freight: number;
  insurance: number;
};

export type TimelineEvent = {
  id: string;
  at: string; // ISO
  label: string;
  detail?: string;
  tone: "neutral" | "info" | "success" | "danger" | "warning";
};

export type QuoteMessage = {
  id: string;
  at: string;
  author: string;
  org: "client" | "akwa";
  text: string;
  attachment?: string;
};

export type QuoteAudit = {
  sentAt?: string;
  firstViewedAt?: string;
  downloadedAt?: string;
  acceptedAt?: string;
  acceptedBy?: string;
  acceptedRole?: string;
  signedFile?: string;
  refusedAt?: string;
  refusalReason?: string;
  refusalMessage?: string;
  refusalFile?: string;
};

export type Quote = {
  id: string; // DEV-AKW-2026-0187-V1
  family: string; // DEV-AKW-2026-0187
  version: number;
  orderRef: string;
  client: string;
  destination: string;
  incoterm: string;
  portDeparture: string;
  portDestination: string;
  currency: "EUR";
  issuedAt: string; // ISO date
  validUntil: string; // ISO date
  status: QuoteStatus;
  items: QuoteItem[];
  charges: QuoteCharges;
  paymentTerms: string;
  preparationDelay: string;
  etd: string;
  notes: string;
  timeline: TimelineEvent[];
  messages: QuoteMessage[];
  audit: QuoteAudit;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  quoteId: string;
  at: string;
  read: boolean;
  tone: "info" | "warning" | "success" | "danger";
};

export const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const eur2 = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

export const dateFR = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

export const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const dateTimeFR = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const goodsTotal = (q: Quote) => q.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
export const chargesTotal = (q: Quote) =>
  q.charges.preparation + q.charges.logistics + q.charges.freight + q.charges.insurance;
export const quoteTotal = (q: Quote) => goodsTotal(q) + chargesTotal(q);

export const daysLeft = (q: Quote) =>
  Math.ceil((new Date(q.validUntil).getTime() - Date.now()) / 86_400_000);

export const isActionable = (q: Quote) => q.status === "À valider" || q.status === "Envoyé";

const iso = (d: string) => new Date(d).toISOString();

function baseTimeline(sentAt: string, viewedAt?: string): TimelineEvent[] {
  const t: TimelineEvent[] = [
    { id: "t1", at: sentAt, label: "Devis généré par AKWA", detail: "Génération après validation de la commande", tone: "neutral" },
    { id: "t2", at: new Date(new Date(sentAt).getTime() + 5 * 60000).toISOString(), label: "Devis envoyé au client", tone: "info" },
  ];
  if (viewedAt) t.push({ id: "t3", at: viewedAt, label: "Devis consulté par le client", tone: "info" });
  return t;
}

const atlasItems: QuoteItem[] = [
  { ref: "AKW-OLV-001", label: "Huile d'olive extra vierge 1L", quantity: 2400, unit: "bouteilles", unitPrice: 6.4 },
  { ref: "AKW-CNS-003", label: "Sardines à l'huile 125g", quantity: 4800, unit: "boîtes", unitPrice: 1.65 },
  { ref: "AKW-CNS-008", label: "Conserves de tomates pelées 400g", quantity: 3000, unit: "boîtes", unitPrice: 0.98 },
  { ref: "AKW-DAT-002", label: "Dattes Medjool premium 1kg", quantity: 900, unit: "sachets", unitPrice: 8.9 },
  { ref: "AKW-CPR-004", label: "Câpres fines au vinaigre 500g", quantity: 400, unit: "bocaux", unitPrice: 3.75 },
  { ref: "AKW-EPC-011", label: "Épices ras el hanout 250g", quantity: 800, unit: "sachets", unitPrice: 2.4 },
  { ref: "AKW-CSC-006", label: "Couscous moyen 5kg", quantity: 400, unit: "sacs", unitPrice: 6.2 },
  { ref: "AKW-THE-009", label: "Thé vert gunpowder 500g", quantity: 280, unit: "paquets", unitPrice: 4 },
];

const dakarItems: QuoteItem[] = [
  { ref: "AKW-OLV-002", label: "Huile d'olive vierge 5L", quantity: 320, unit: "bidons", unitPrice: 27.5 },
  { ref: "AKW-CNS-003", label: "Sardines à l'huile 125g", quantity: 6000, unit: "boîtes", unitPrice: 1.62 },
  { ref: "AKW-CSC-006", label: "Couscous moyen 5kg", quantity: 1200, unit: "sacs", unitPrice: 6.1 },
  { ref: "AKW-EPC-011", label: "Épices ras el hanout 250g", quantity: 2200, unit: "sachets", unitPrice: 2.3 },
];

const doualaItems: QuoteItem[] = [
  { ref: "AKW-DAT-002", label: "Dattes Medjool premium 1kg", quantity: 1500, unit: "sachets", unitPrice: 8.7 },
  { ref: "AKW-CNF-014", label: "Confiture d'abricot 380g", quantity: 2000, unit: "bocaux", unitPrice: 2.15 },
  { ref: "AKW-THE-009", label: "Thé vert gunpowder 500g", quantity: 1000, unit: "paquets", unitPrice: 4.2 },
];

function q(partial: Omit<Quote, "family" | "version"> & { family?: string; version?: number }): Quote {
  const m = partial.id.match(/^(.*)-V(\d+)$/);
  return {
    ...partial,
    family: partial.family ?? (m ? m[1] : partial.id),
    version: partial.version ?? (m ? Number(m[2]) : 1),
  };
}

const seed: Quote[] = [
  q({
    id: "DEV-AKW-2026-0187-V1",
    orderRef: "AKW-EXP-2026-0187",
    client: "Maison Atlas Distribution",
    destination: "Abidjan, Côte d'Ivoire",
    incoterm: "CIF Abidjan",
    portDeparture: "Port de Casablanca",
    portDestination: "Port Autonome d'Abidjan",
    currency: "EUR",
    issuedAt: iso("2026-08-10T09:30:00"),
    validUntil: iso("2026-08-17T23:59:00"),
    status: "À valider",
    items: atlasItems,
    charges: { preparation: 1250, logistics: 1150, freight: 4350, insurance: 750 },
    paymentTerms: "60 % à la commande / 40 % avant embarquement",
    preparationDelay: "10 jours ouvrés",
    etd: iso("2026-08-18T00:00:00"),
    notes:
      "Les délais indiqués restent soumis à la disponibilité des produits et aux disponibilités des compagnies maritimes.",
    timeline: baseTimeline(iso("2026-08-10T09:30:00")),
    messages: [],
    audit: { sentAt: iso("2026-08-10T09:35:00") },
  }),
  q({
    id: "DEV-AKW-2026-0193-V1",
    orderRef: "AKW-EXP-2026-0193",
    client: "Sahel Gourmet SARL",
    destination: "Conakry, Guinée",
    incoterm: "FOB Casablanca",
    portDeparture: "Port de Casablanca",
    portDestination: "Port de Conakry",
    currency: "EUR",
    issuedAt: iso("2026-08-05T10:10:00"),
    validUntil: iso("2026-08-12T23:59:00"),
    status: "À valider",
    items: [
      { ref: "AKW-CNS-008", label: "Conserves de tomates pelées 400g", quantity: 2400, unit: "boîtes", unitPrice: 0.95 },
      { ref: "AKW-CPR-004", label: "Câpres fines au vinaigre 500g", quantity: 600, unit: "bocaux", unitPrice: 3.6 },
      { ref: "AKW-CNF-014", label: "Confiture d'abricot 380g", quantity: 1400, unit: "bocaux", unitPrice: 2.1 },
    ],
    charges: { preparation: 780, logistics: 640, freight: 2950, insurance: 410 },
    paymentTerms: "50 % à la commande / 50 % avant embarquement",
    preparationDelay: "8 jours ouvrés",
    etd: iso("2026-08-16T00:00:00"),
    notes: "Offre soumise à confirmation de la disponibilité des emballages export.",
    timeline: baseTimeline(iso("2026-08-05T10:10:00"), iso("2026-08-05T14:02:00")),
    messages: [],
    audit: { sentAt: iso("2026-08-05T10:15:00"), firstViewedAt: iso("2026-08-05T14:02:00") },
  }),
  q({
    id: "DEV-AKW-2026-0176-V2",
    orderRef: "AKW-EXP-2026-0176",
    client: "West Africa Food Distribution",
    destination: "Dakar, Sénégal",
    incoterm: "CIF Dakar",
    portDeparture: "Port de Casablanca",
    portDestination: "Port de Dakar",
    currency: "EUR",
    issuedAt: iso("2026-07-22T08:45:00"),
    validUntil: iso("2026-07-31T23:59:00"),
    status: "Accepté",
    items: dakarItems,
    charges: { preparation: 980, logistics: 890, freight: 3450, insurance: 630 },
    paymentTerms: "40 % à la commande / 60 % avant embarquement",
    preparationDelay: "12 jours ouvrés",
    etd: iso("2026-08-03T00:00:00"),
    notes: "Consolidation avec l'expédition AKW-EXP-2026-0180 possible sur demande.",
    timeline: [
      ...baseTimeline(iso("2026-07-22T08:45:00"), iso("2026-07-22T11:30:00")),
      { id: "t4", at: iso("2026-07-24T16:20:00"), label: "Devis accepté par le client", detail: "Signataire : Aminata Diallo", tone: "success" },
    ],
    messages: [
      { id: "m1", at: iso("2026-07-23T09:12:00"), author: "Aminata Diallo", org: "client", text: "Merci pour la révision du fret, nous validons cette version." },
      { id: "m2", at: iso("2026-07-23T10:40:00"), author: "Sofia El Mansouri", org: "akwa", text: "Parfait, nous lançons la préparation dès réception du devis signé." },
    ],
    audit: {
      sentAt: iso("2026-07-22T08:50:00"),
      firstViewedAt: iso("2026-07-22T11:30:00"),
      downloadedAt: iso("2026-07-22T11:34:00"),
      acceptedAt: iso("2026-07-24T16:20:00"),
      acceptedBy: "Aminata Diallo",
      acceptedRole: "Directrice achats",
      signedFile: "DEV-AKW-2026-0176-V2-SIGNED.pdf",
    },
  }),
  q({
    id: "DEV-AKW-2026-0164-V1",
    orderRef: "AKW-EXP-2026-0164",
    client: "Cameroun Import Négoce",
    destination: "Douala, Cameroun",
    incoterm: "CIF Douala",
    portDeparture: "Port de Casablanca",
    portDestination: "Port de Douala",
    currency: "EUR",
    issuedAt: iso("2026-07-02T09:00:00"),
    validUntil: iso("2026-07-09T23:59:00"),
    status: "Refusé",
    items: doualaItems,
    charges: { preparation: 720, logistics: 690, freight: 4100, insurance: 540 },
    paymentTerms: "60 % à la commande / 40 % avant embarquement",
    preparationDelay: "15 jours ouvrés",
    etd: iso("2026-07-20T00:00:00"),
    notes: "Départ soumis au planning de la compagnie maritime.",
    timeline: [
      ...baseTimeline(iso("2026-07-02T09:00:00"), iso("2026-07-02T13:12:00")),
      { id: "t4", at: iso("2026-07-03T10:05:00"), label: "Devis refusé par le client", detail: "Motif : Délai", tone: "danger" },
      { id: "t5", at: iso("2026-07-05T09:00:00"), label: "Nouvelle version envoyée (V2)", tone: "info" },
    ],
    messages: [
      { id: "m1", at: iso("2026-07-03T10:05:00"), author: "Paul Ekambi", org: "client", text: "Le délai de préparation de 15 jours est trop long pour notre saison commerciale." },
      { id: "m2", at: iso("2026-07-03T15:30:00"), author: "Sofia El Mansouri", org: "akwa", text: "Bien noté, nous préparons une version avec un délai réduit à 9 jours ouvrés." },
    ],
    audit: {
      sentAt: iso("2026-07-02T09:05:00"),
      firstViewedAt: iso("2026-07-02T13:12:00"),
      downloadedAt: iso("2026-07-02T13:20:00"),
      refusedAt: iso("2026-07-03T10:05:00"),
      refusalReason: "Délai",
      refusalMessage: "Le délai de préparation de 15 jours est trop long pour notre saison commerciale.",
    },
  }),
  q({
    id: "DEV-AKW-2026-0164-V2",
    orderRef: "AKW-EXP-2026-0164",
    client: "Cameroun Import Négoce",
    destination: "Douala, Cameroun",
    incoterm: "CIF Douala",
    portDeparture: "Port de Casablanca",
    portDestination: "Port de Douala",
    currency: "EUR",
    issuedAt: iso("2026-07-05T09:00:00"),
    validUntil: iso("2026-07-14T23:59:00"),
    status: "Accepté",
    items: doualaItems.map((i) => ({ ...i, unitPrice: +(i.unitPrice * 0.975).toFixed(2) })),
    charges: { preparation: 720, logistics: 690, freight: 3650, insurance: 540 },
    paymentTerms: "50 % à la commande / 50 % avant embarquement",
    preparationDelay: "9 jours ouvrés",
    etd: iso("2026-07-15T00:00:00"),
    notes: "Délai de préparation réduit suite à votre retour sur la V1.",
    timeline: [
      ...baseTimeline(iso("2026-07-05T09:00:00"), iso("2026-07-05T12:00:00")),
      { id: "t4", at: iso("2026-07-06T11:45:00"), label: "Devis accepté par le client", detail: "Signataire : Paul Ekambi", tone: "success" },
    ],
    messages: [],
    audit: {
      sentAt: iso("2026-07-05T09:05:00"),
      firstViewedAt: iso("2026-07-05T12:00:00"),
      downloadedAt: iso("2026-07-05T12:05:00"),
      acceptedAt: iso("2026-07-06T11:45:00"),
      acceptedBy: "Paul Ekambi",
      acceptedRole: "Gérant",
      signedFile: "DEV-AKW-2026-0164-V2-SIGNED.pdf",
    },
  }),
  q({
    id: "DEV-AKW-2026-0158-V1",
    orderRef: "AKW-EXP-2026-0158",
    client: "Nouakchott Trading",
    destination: "Nouakchott, Mauritanie",
    incoterm: "FOB Casablanca",
    portDeparture: "Port de Casablanca",
    portDestination: "Port de Nouakchott",
    currency: "EUR",
    issuedAt: iso("2026-06-18T08:20:00"),
    validUntil: iso("2026-06-27T23:59:00"),
    status: "Accepté",
    items: [
      { ref: "AKW-CSC-006", label: "Couscous moyen 5kg", quantity: 700, unit: "sacs", unitPrice: 6.05 },
      { ref: "AKW-THE-009", label: "Thé vert gunpowder 500g", quantity: 900, unit: "paquets", unitPrice: 4.1 },
    ],
    charges: { preparation: 420, logistics: 380, freight: 2100, insurance: 260 },
    paymentTerms: "100 % avant embarquement",
    preparationDelay: "7 jours ouvrés",
    etd: iso("2026-06-30T00:00:00"),
    notes: "Palettisation standard export 120 × 100.",
    timeline: [
      ...baseTimeline(iso("2026-06-18T08:20:00"), iso("2026-06-18T09:40:00")),
      { id: "t4", at: iso("2026-06-19T10:00:00"), label: "Devis accepté par le client", tone: "success" },
    ],
    messages: [],
    audit: {
      sentAt: iso("2026-06-18T08:25:00"),
      firstViewedAt: iso("2026-06-18T09:40:00"),
      acceptedAt: iso("2026-06-19T10:00:00"),
      acceptedBy: "Moustapha Ould Salem",
      acceptedRole: "Directeur général",
      signedFile: "DEV-AKW-2026-0158-V1-SIGNED.pdf",
    },
  }),
  q({
    id: "DEV-AKW-2026-0142-V1",
    orderRef: "AKW-EXP-2026-0142",
    client: "Lomé Distribution Group",
    destination: "Lomé, Togo",
    incoterm: "CIF Lomé",
    portDeparture: "Port de Casablanca",
    portDestination: "Port Autonome de Lomé",
    currency: "EUR",
    issuedAt: iso("2026-05-28T09:00:00"),
    validUntil: iso("2026-06-08T23:59:00"),
    status: "Accepté",
    items: [
      { ref: "AKW-OLV-001", label: "Huile d'olive extra vierge 1L", quantity: 1500, unit: "bouteilles", unitPrice: 6.3 },
      { ref: "AKW-DAT-002", label: "Dattes Medjool premium 1kg", quantity: 1800, unit: "sachets", unitPrice: 8.5 },
      { ref: "AKW-CNS-003", label: "Sardines à l'huile 125g", quantity: 3000, unit: "boîtes", unitPrice: 1.58 },
    ],
    charges: { preparation: 1450, logistics: 1290, freight: 4800, insurance: 880 },
    paymentTerms: "30 % à la commande / 70 % avant embarquement",
    preparationDelay: "14 jours ouvrés",
    etd: iso("2026-06-14T00:00:00"),
    notes: "Chargement réparti sur 2 conteneurs 40' HC.",
    timeline: [
      ...baseTimeline(iso("2026-05-28T09:00:00"), iso("2026-05-28T15:10:00")),
      { id: "t4", at: iso("2026-05-30T14:00:00"), label: "Devis accepté par le client", tone: "success" },
    ],
    messages: [],
    audit: {
      sentAt: iso("2026-05-28T09:05:00"),
      firstViewedAt: iso("2026-05-28T15:10:00"),
      acceptedAt: iso("2026-05-30T14:00:00"),
      acceptedBy: "Kossi Adjovi",
      acceptedRole: "Responsable achats",
      signedFile: "DEV-AKW-2026-0142-V1-SIGNED.pdf",
    },
  }),
  q({
    id: "DEV-AKW-2026-0151-V1",
    orderRef: "AKW-EXP-2026-0151",
    client: "Bamako Négoce International",
    destination: "Bamako, Mali",
    incoterm: "CIF Abidjan + route Bamako",
    portDeparture: "Port de Casablanca",
    portDestination: "Port Autonome d'Abidjan",
    currency: "EUR",
    issuedAt: iso("2026-06-05T09:00:00"),
    validUntil: iso("2026-06-12T23:59:00"),
    status: "Expiré",
    items: [
      { ref: "AKW-EPC-011", label: "Épices ras el hanout 250g", quantity: 2200, unit: "sachets", unitPrice: 2.35 },
      { ref: "AKW-CNF-014", label: "Confiture d'abricot 380g", quantity: 1800, unit: "bocaux", unitPrice: 2.05 },
      { ref: "AKW-CPR-004", label: "Câpres fines au vinaigre 500g", quantity: 900, unit: "bocaux", unitPrice: 3.55 },
    ],
    charges: { preparation: 640, logistics: 1180, freight: 3200, insurance: 380 },
    paymentTerms: "60 % à la commande / 40 % avant embarquement",
    preparationDelay: "11 jours ouvrés",
    etd: iso("2026-06-20T00:00:00"),
    notes: "Acheminement routier Abidjan – Bamako inclus.",
    timeline: [
      ...baseTimeline(iso("2026-06-05T09:00:00"), iso("2026-06-06T08:20:00")),
      { id: "t4", at: iso("2026-06-12T23:59:00"), label: "Devis expiré", detail: "Aucune décision reçue avant la date de validité", tone: "warning" },
    ],
    messages: [],
    audit: { sentAt: iso("2026-06-05T09:05:00"), firstViewedAt: iso("2026-06-06T08:20:00") },
  }),
];

let quotes: Quote[] = seed;
let notifications: Notification[] = [
  {
    id: "n1",
    title: "Nouveau devis disponible",
    body: "Le devis DEV-AKW-2026-0187-V1 pour votre commande AKW-EXP-2026-0187 est disponible.",
    quoteId: "DEV-AKW-2026-0187-V1",
    at: iso("2026-08-10T09:35:00"),
    read: false,
    tone: "info",
  },
  {
    id: "n2",
    title: "Votre devis expire dans 2 jours",
    body: "Le devis DEV-AKW-2026-0193-V1 arrive à échéance le 12/08/2026.",
    quoteId: "DEV-AKW-2026-0193-V1",
    at: iso("2026-08-10T07:00:00"),
    read: false,
    tone: "warning",
  },
];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const uid = () => Math.random().toString(36).slice(2, 10);

function patch(id: string, fn: (q: Quote) => Quote) {
  quotes = quotes.map((x) => (x.id === id ? fn(x) : x));
  emit();
}

function pushEvent(q: Quote, e: Omit<TimelineEvent, "id">): Quote {
  return { ...q, timeline: [...q.timeline, { id: uid(), ...e }] };
}

export const quotesStore = {
  getAll: () => quotes,
  getNotifications: () => notifications,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  get(id: string) {
    return quotes.find((x) => x.id === id);
  },
  versionsOf(family: string) {
    return quotes.filter((x) => x.family === family).sort((a, b) => a.version - b.version);
  },
  latestForOrder(orderRef: string) {
    const list = quotes.filter((x) => x.orderRef === orderRef).sort((a, b) => b.version - a.version);
    return list[0];
  },
  markViewed(id: string) {
    const q = quotes.find((x) => x.id === id);
    if (!q || q.audit.firstViewedAt) return;
    patch(id, (x) =>
      pushEvent({ ...x, audit: { ...x.audit, firstViewedAt: new Date().toISOString() } }, {
        at: new Date().toISOString(),
        label: "Devis consulté par le client",
        tone: "info",
      }),
    );
  },
  markDownloaded(id: string) {
    patch(id, (x) =>
      pushEvent({ ...x, audit: { ...x.audit, downloadedAt: new Date().toISOString() } }, {
        at: new Date().toISOString(),
        label: "Devis téléchargé par le client",
        tone: "neutral",
      }),
    );
  },
  accept(
    id: string,
    data: { signer: string; role: string; comment?: string; fileName: string },
  ) {
    const now = new Date().toISOString();
    patch(id, (x) =>
      pushEvent(
        {
          ...x,
          status: "Accepté",
          audit: {
            ...x.audit,
            acceptedAt: now,
            acceptedBy: data.signer,
            acceptedRole: data.role,
            signedFile: data.fileName,
          },
          messages: data.comment
            ? [...x.messages, { id: uid(), at: now, author: data.signer, org: "client", text: data.comment }]
            : x.messages,
        },
        { at: now, label: "Devis accepté et signé par le client", detail: `Signataire : ${data.signer}`, tone: "success" },
      ),
    );
    notifications = [
      {
        id: uid(),
        title: "Devis accepté",
        body: `Le devis ${id} a été accepté. La commande associée passe en préparation.`,
        quoteId: id,
        at: now,
        read: false,
        tone: "success",
      },
      ...notifications,
    ];
    emit();
  },
  refuse(id: string, data: { reason: string; message: string; fileName?: string }) {
    const now = new Date().toISOString();
    patch(id, (x) =>
      pushEvent(
        {
          ...x,
          status: "Refusé",
          audit: {
            ...x.audit,
            refusedAt: now,
            refusalReason: data.reason,
            refusalMessage: data.message,
            refusalFile: data.fileName,
          },
          messages: [
            ...x.messages,
            { id: uid(), at: now, author: x.client, org: "client", text: data.message, attachment: data.fileName },
          ],
        },
        { at: now, label: "Devis refusé par le client", detail: `Motif : ${data.reason}`, tone: "danger" },
      ),
    );
    // AKWA répond puis envoie une nouvelle version (simulation)
    setTimeout(() => {
      const src = quotes.find((x) => x.id === id);
      if (!src) return;
      const at = new Date().toISOString();
      patch(id, (x) => ({
        ...x,
        status: "Remplacé",
        messages: [
          ...x.messages,
          {
            id: uid(),
            at,
            author: "Sofia El Mansouri",
            org: "akwa",
            text: "Bonjour, votre demande a bien été prise en compte. Nous vous transmettons une nouvelle proposition révisée.",
          },
        ],
        timeline: [...x.timeline, { id: uid(), at, label: `Nouvelle version envoyée (V${x.version + 1})`, tone: "info" }],
      }));
      const next: Quote = {
        ...src,
        id: `${src.family}-V${src.version + 1}`,
        version: src.version + 1,
        status: "À valider",
        issuedAt: at,
        validUntil: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        charges: { ...src.charges, freight: Math.round(src.charges.freight * 0.9) },
        paymentTerms: "50 % à la commande / 50 % avant embarquement",
        notes: `Version révisée suite à votre retour du ${dateShort(now)} (motif : ${data.reason}).`,
        timeline: [
          { id: uid(), at, label: "Nouvelle version générée par AKWA", detail: `Révision suite au refus de la V${src.version}`, tone: "neutral" },
          { id: uid(), at, label: "Devis envoyé au client", tone: "info" },
        ],
        messages: [],
        audit: { sentAt: at },
      };
      quotes = [next, ...quotes];
      notifications = [
        {
          id: uid(),
          title: "Nouvelle version de devis disponible",
          body: `Le devis ${next.id} pour votre commande ${next.orderRef} est disponible.`,
          quoteId: next.id,
          at,
          read: false,
          tone: "info",
        },
        ...notifications,
      ];
      emit();
    }, 4000);
  },
  addMessage(id: string, text: string, attachment?: string) {
    const now = new Date().toISOString();
    const q = quotes.find((x) => x.id === id);
    if (!q) return;
    patch(id, (x) => ({
      ...x,
      messages: [...x.messages, { id: uid(), at: now, author: x.client, org: "client", text, attachment }],
    }));
    setTimeout(() => {
      patch(id, (x) => ({
        ...x,
        messages: [
          ...x.messages,
          {
            id: uid(),
            at: new Date().toISOString(),
            author: "Sofia El Mansouri",
            org: "akwa",
            text: "Bonjour, votre message a bien été reçu. Notre équipe revient vers vous sous 24 h ouvrées.",
          },
        ],
      }));
    }, 2500);
  },
  requestNewVersion(id: string, message: string) {
    const now = new Date().toISOString();
    patch(id, (x) =>
      pushEvent(
        {
          ...x,
          status: "En révision",
          messages: [...x.messages, { id: uid(), at: now, author: x.client, org: "client", text: message }],
        },
        { at: now, label: "Nouveau devis demandé par le client", tone: "warning" },
      ),
    );
  },
  markNotificationsRead() {
    notifications = notifications.map((n) => ({ ...n, read: true }));
    emit();
  },
};

export function useQuotes() {
  return useSyncExternalStore(
    (cb) => quotesStore.subscribe(cb),
    () => quotesStore.getAll(),
    () => quotesStore.getAll(),
  );
}

export function useQuoteNotifications() {
  return useSyncExternalStore(
    (cb) => quotesStore.subscribe(cb),
    () => quotesStore.getNotifications(),
    () => quotesStore.getNotifications(),
  );
}

export const statusStyle: Record<QuoteStatus, string> = {
  Brouillon: "bg-muted text-muted-foreground",
  Envoyé: "bg-ai/15 text-ai",
  "À valider": "bg-warning/15 text-warning",
  Accepté: "bg-success/15 text-success",
  Refusé: "bg-destructive/15 text-destructive",
  "En révision": "bg-ai/15 text-ai",
  Remplacé: "bg-muted text-muted-foreground",
  Expiré: "bg-muted text-muted-foreground line-through decoration-1",
};

/** Génère un PDF mock téléchargeable pour un devis. */
export function downloadQuotePdf(quote: Quote) {
  const lines = [
    `AKWA EXPORT - DEVIS ${quote.id}`,
    `Commande associee : ${quote.orderRef}`,
    `Client : ${quote.client}`,
    `Destination : ${quote.destination}`,
    `Emis le ${dateShort(quote.issuedAt)} - Valable jusqu'au ${dateShort(quote.validUntil)}`,
    `Incoterm : ${quote.incoterm}`,
    `Paiement : ${quote.paymentTerms}`,
    "",
    ...quote.items.map((i) => `${i.ref}  ${i.label}  ${i.quantity} ${i.unit} x ${i.unitPrice} EUR`),
    "",
    `TOTAL DEVIS : ${quoteTotal(quote).toFixed(2)} EUR`,
  ];
  const content = lines
    .map((l, idx) => `BT /F1 11 Tf 40 ${760 - idx * 18} Td (${l.replace(/[()\\]/g, " ")}) Tj ET`)
    .join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${quote.id}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  quotesStore.markDownloaded(quote.id);
}
