// Mock data + store réactif pour le cockpit "Détail d'une commande" export AKWA
import { useSyncExternalStore } from "react";

export type ExportStatus =
  | "Brouillon"
  | "En attente de confirmation"
  | "Confirmée"
  | "Approvisionnement"
  | "En préparation"
  | "En consolidation"
  | "Prête au chargement"
  | "Chargée"
  | "Expédiée"
  | "En transit"
  | "Arrivée au port"
  | "En dédouanement"
  | "Livrée"
  | "Annulée"
  | "En retard";

export const statusMeta: Record<ExportStatus, { cls: string; dot: string }> = {
  Brouillon: { cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  "En attente de confirmation": { cls: "bg-warning/15 text-warning", dot: "bg-warning" },
  Confirmée: { cls: "bg-primary/10 text-primary", dot: "bg-primary" },
  Approvisionnement: { cls: "bg-ai/15 text-ai", dot: "bg-ai" },
  "En préparation": { cls: "bg-ai/15 text-ai", dot: "bg-ai" },
  "En consolidation": { cls: "bg-ai/15 text-ai", dot: "bg-ai" },
  "Prête au chargement": { cls: "bg-primary/10 text-primary", dot: "bg-primary" },
  Chargée: { cls: "bg-primary/10 text-primary", dot: "bg-primary" },
  Expédiée: { cls: "bg-success/15 text-success", dot: "bg-success" },
  "En transit": { cls: "bg-success/15 text-success", dot: "bg-success" },
  "Arrivée au port": { cls: "bg-success/15 text-success", dot: "bg-success" },
  "En dédouanement": { cls: "bg-warning/15 text-warning", dot: "bg-warning" },
  Livrée: { cls: "bg-success/15 text-success", dot: "bg-success" },
  Annulée: { cls: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
  "En retard": { cls: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
};

export type PrepStatus = "Prêt" | "En préparation" | "Attente fournisseur";

export type ExportLine = {
  ref: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  unitPrice: number;
  weightKg: number;
  volumeM3: number;
  prep: PrepStatus;
  container: 1 | 2;
  pallets: number;
};

export type DocStatus = "Disponible" | "En préparation" | "À venir" | "À valider" | "Disponible après embarquement";

export type ExportDoc = {
  id: string;
  name: string;
  reference: string;
  date: string | null;
  status: DocStatus;
  category: "Commercial" | "Export" | "Transport" | "Assurance";
};

export type TimelineEvent = {
  date: string;
  title: string;
  detail?: string;
  state: "done" | "current" | "planned";
  delay?: string;
};

export type Payment = {
  id: string;
  date: string;
  label: string;
  amount: number;
  state: "done" | "pending";
  meta?: string;
};

export type Instruction = {
  id: string;
  text: string;
  createdAt: string;
  status: "Nouvelle" | "Prise en compte" | "En cours" | "Appliquée" | "Refusée";
  handler?: string;
};

export type Message = {
  id: string;
  author: string;
  side: "client" | "akwa";
  at: string;
  text: string;
  category: "Commercial" | "Logistique" | "Documents" | "Paiement" | "Qualité";
  attachment?: string;
};

export type Decision = {
  id: string;
  title: string;
  description: string;
  due: string;
  status: "En attente" | "Validée" | "Modification demandée";
};

export type Alert = {
  id: string;
  level: "Information" | "Attention" | "Urgent";
  title: string;
  message: string;
  action?: { label: string; tab: string };
};

export type AuditEntry = {
  at: string;
  action: string;
  from?: string;
  to?: string;
  user: string;
};

export type ExportOrder = {
  reference: string;
  clientRef: string;
  client: string;
  city: string;
  country: string;
  createdAt: string;
  incoterm: string;
  currency: string;
  status: ExportStatus;
  progressPct: number;
  currentStep: string;
  salesRep: string;
  exportManager: string;
  portDeparture: string;
  portArrival: string;
  transport: string;
  paymentTerms: string;
  etd: string;
  eta: string;
  carrier: string;
  vessel: string;
  voyage: string;
  transitDays: number;
  shippingStatus: string;
  sealNumber: string | null;
  consolidationDate: string;
  loadingDate: string;
  totals: {
    goods: number;
    logistics: number;
    insurance: number;
    freight: number;
    other: number;
    total: number;
    paid: number;
  };
  weightKg: number;
  volumeM3: number;
  lines: ExportLine[];
  containers: {
    id: string;
    type: string;
    reference: string;
    fillPct: number;
    weightKg: number;
    maxWeightKg: number;
    volumeM3: number;
    maxVolumeM3: number;
    pallets: number;
    status: string;
    index: 1 | 2;
  }[];
  familyReadiness: { name: string; pct: number }[];
  quality: { name: string; state: "Validé" | "En cours" | "À venir" }[];
  checklist: { label: string; done: boolean }[];
  health: { score: number; label: string; criteria: { name: string; pct: number }[]; summary: string };
  timeline: TimelineEvent[];
  documents: ExportDoc[];
  payments: Payment[];
  instructions: Instruction[];
  messages: Message[];
  decisions: Decision[];
  alerts: Alert[];
  audit: AuditEntry[];
};

export const STEPS = [
  "Commande confirmée",
  "Approvisionnement",
  "Préparation",
  "Chargement",
  "Expédition",
  "En transit",
  "Livrée",
];

const lines: ExportLine[] = [
  { ref: "AKW-OLV-001", name: "Huile d'olive extra vierge 1L", category: "Épicerie", qty: 480, unit: "Bouteilles", unitPrice: 6.4, weightKg: 720, volumeM3: 1.9, prep: "Prêt", container: 1, pallets: 3 },
  { ref: "AKW-OLV-005", name: "Huile d'olive extra vierge 5L", category: "Épicerie", qty: 160, unit: "Bidons", unitPrice: 24.8, weightKg: 880, volumeM3: 2.4, prep: "Prêt", container: 1, pallets: 2 },
  { ref: "AKW-CNS-003", name: "Sardines à l'huile 125g", category: "Conserverie", qty: 600, unit: "Boîtes", unitPrice: 1.65, weightKg: 95, volumeM3: 0.4, prep: "En préparation", container: 1, pallets: 1 },
  { ref: "AKW-CUS-002", name: "Couscous moyen 1kg", category: "Céréales", qty: 300, unit: "Sachets", unitPrice: 2.1, weightKg: 315, volumeM3: 0.9, prep: "Prêt", container: 1, pallets: 1 },
  { ref: "AKW-TMT-004", name: "Concentré de tomate 800g", category: "Conserverie", qty: 240, unit: "Boîtes", unitPrice: 2.85, weightKg: 205, volumeM3: 0.6, prep: "En préparation", container: 1, pallets: 1 },
  { ref: "AKW-OLV-002", name: "Huile d'olive vierge 2L", category: "Épicerie", qty: 220, unit: "Bidons", unitPrice: 11.9, weightKg: 470, volumeM3: 1.3, prep: "Prêt", container: 1, pallets: 2 },
  { ref: "AKW-CNS-007", name: "Thon à l'huile d'olive 200g", category: "Conserverie", qty: 420, unit: "Boîtes", unitPrice: 3.4, weightKg: 105, volumeM3: 0.5, prep: "Prêt", container: 2, pallets: 1 },
  { ref: "AKW-OLI-009", name: "Olives vertes cassées 4kg", category: "Conserverie", qty: 180, unit: "Seaux", unitPrice: 12.6, weightKg: 780, volumeM3: 2.2, prep: "En préparation", container: 2, pallets: 3 },
  { ref: "AKW-CER-011", name: "Semoule fine 5kg", category: "Céréales", qty: 260, unit: "Sacs", unitPrice: 5.2, weightKg: 1350, volumeM3: 2.1, prep: "Prêt", container: 2, pallets: 3 },
  { ref: "AKW-EPI-014", name: "Épices ras el hanout 500g", category: "Épicerie", qty: 150, unit: "Sachets", unitPrice: 4.75, weightKg: 80, volumeM3: 0.3, prep: "Attente fournisseur", container: 2, pallets: 1 },
  { ref: "AKW-FRS-018", name: "Dattes Medjool conditionnées 1kg", category: "Produits conditionnés", qty: 200, unit: "Barquettes", unitPrice: 9.9, weightKg: 220, volumeM3: 0.8, prep: "Attente fournisseur", container: 2, pallets: 1 },
  { ref: "AKW-CNF-021", name: "Confiture de figues 370g", category: "Épicerie", qty: 190, unit: "Pots", unitPrice: 3.15, weightKg: 90, volumeM3: 0.4, prep: "Prêt", container: 2, pallets: 1 },
];

const baseOrder: ExportOrder = {
  reference: "AKW-EXP-2026-0187",
  clientRef: "PO-MAD-0826-014",
  client: "Maison Atlas Distribution",
  city: "Abidjan",
  country: "Côte d'Ivoire",
  createdAt: "02 août 2026",
  incoterm: "CIF Abidjan",
  currency: "EUR",
  status: "En préparation",
  progressPct: 45,
  currentStep: "Préparation / Consolidation",
  salesRep: "Sofia El Mansouri",
  exportManager: "Yassine Bennani",
  portDeparture: "Port de Casablanca",
  portArrival: "Port Autonome d'Abidjan",
  transport: "Maritime",
  paymentTerms: "60 % acompte / 40 % avant embarquement",
  etd: "18/08/2026",
  eta: "30/08/2026",
  carrier: "CMA CGM",
  vessel: "CMA CGM TANGER",
  voyage: "TG426W",
  transitDays: 12,
  shippingStatus: "Réservation confirmée",
  sealNumber: null,
  consolidationDate: "14 août 2026",
  loadingDate: "16 août 2026",
  totals: { goods: 41250, logistics: 2400, insurance: 750, freight: 4350, other: 0, total: 48750, paid: 29250 },
  weightKg: 23840,
  volumeM3: 61.4,
  lines,
  containers: [
    { id: "c1", index: 1, type: "40' High Cube", reference: "AKW-CNT-2026-041", fillPct: 92, weightKg: 12180, maxWeightKg: 26500, volumeM3: 35.1, maxVolumeM3: 38.1, pallets: 18, status: "Planifié" },
    { id: "c2", index: 2, type: "40' High Cube", reference: "AKW-CNT-2026-042", fillPct: 88, weightKg: 11660, maxWeightKg: 26500, volumeM3: 33.5, maxVolumeM3: 38.1, pallets: 17, status: "Planifié" },
  ],
  familyReadiness: [
    { name: "Huile d'olive", pct: 100 },
    { name: "Conserves", pct: 85 },
    { name: "Produits céréaliers", pct: 100 },
    { name: "Produits frais / conditionnés", pct: 62 },
  ],
  quality: [
    { name: "Contrôle quantitatif", state: "Validé" },
    { name: "Contrôle packaging", state: "En cours" },
    { name: "Conformité étiquetage", state: "Validé" },
    { name: "Contrôle palettes", state: "À venir" },
    { name: "Documents export", state: "En cours" },
  ],
  checklist: [
    { label: "Quantités vérifiées", done: true },
    { label: "Références conformes", done: true },
    { label: "Étiquettes validées", done: true },
    { label: "Origine produit vérifiée", done: true },
    { label: "Palettes inspectées", done: false },
    { label: "Chargement contrôlé", done: false },
    { label: "Scellé conteneur enregistré", done: false },
  ],
  health: {
    score: 92,
    label: "Bon",
    criteria: [
      { name: "Approvisionnement", pct: 95 },
      { name: "Logistique", pct: 90 },
      { name: "Documents", pct: 85 },
      { name: "Paiement", pct: 100 },
      { name: "Planning", pct: 90 },
    ],
    summary:
      "Votre commande progresse normalement. Aucun retard majeur n'est actuellement identifié. Le prochain jalon important est la consolidation prévue le 14 août.",
  },
  timeline: [
    { date: "02 août 2026", title: "Commande confirmée", detail: "Commande validée par AKWA.", state: "done" },
    { date: "03 août 2026", title: "Acompte reçu", detail: "29 250 € reçus.", state: "done" },
    { date: "04 août 2026", title: "Approvisionnement lancé", detail: "Commandes fournisseurs confirmées.", state: "done" },
    { date: "10 août 2026", title: "78 % des marchandises disponibles", detail: "Préparation en cours en entrepôt Casablanca.", state: "current" },
    { date: "14 août 2026", title: "Consolidation prévue", detail: "Regroupement des palettes sur quai.", state: "planned", delay: "Décalée de 1 jour" },
    { date: "16 août 2026", title: "Chargement conteneurs prévu", state: "planned" },
    { date: "18 août 2026", title: "Départ navire prévu", detail: "Casablanca → Abidjan", state: "planned" },
    { date: "30 août 2026", title: "Arrivée estimée à Abidjan", state: "planned" },
  ],
  documents: [
    { id: "d1", name: "Bon de commande", reference: "BC-AKW-2026-0187", date: "02/08/2026", status: "Disponible", category: "Commercial" },
    { id: "d2", name: "Facture proforma", reference: "PI-AKW-2026-0187", date: "02/08/2026", status: "Disponible", category: "Commercial" },
    { id: "d3", name: "Facture commerciale", reference: "INV-AKW-2026-0187", date: null, status: "En préparation", category: "Commercial" },
    { id: "d4", name: "Packing List", reference: "PL-AKW-2026-0187", date: null, status: "En préparation", category: "Export" },
    { id: "d5", name: "Certificat d'origine", reference: "COO-2026-0187", date: null, status: "À venir", category: "Export" },
    { id: "d6", name: "Certificat sanitaire", reference: "SAN-2026-0187", date: null, status: "À venir", category: "Export" },
    { id: "d7", name: "Certificat phytosanitaire", reference: "PHY-2026-0187", date: null, status: "À venir", category: "Export" },
    { id: "d8", name: "Bill of Lading (draft)", reference: "BL-CMA-0187", date: "09/08/2026", status: "À valider", category: "Transport" },
    { id: "d9", name: "Police d'assurance", reference: "ASS-2026-0187", date: "05/08/2026", status: "Disponible", category: "Assurance" },
    { id: "d10", name: "Déclaration export", reference: "DEX-2026-0187", date: null, status: "À venir", category: "Export" },
    { id: "d11", name: "Liste de colisage", reference: "LC-AKW-2026-0187", date: null, status: "Disponible après embarquement", category: "Transport" },
  ],
  payments: [
    { id: "pay1", date: "02/08/2026", label: "Facture proforma émise", amount: 48750, state: "done" },
    { id: "pay2", date: "04/08/2026", label: "Acompte reçu", amount: 29250, state: "done", meta: "Virement — Attijariwafa Bank" },
    { id: "pay3", date: "16/08/2026", label: "Solde attendu", amount: 19500, state: "pending", meta: "Avant embarquement" },
  ],
  instructions: [
    { id: "i1", text: "Merci de renforcer le filmage des palettes contenant les bouteilles d'huile.", createdAt: "05/08/2026", status: "Appliquée", handler: "Yassine Bennani" },
    { id: "i2", text: "Merci d'utiliser les étiquettes en français conformes au marché ivoirien.", createdAt: "06/08/2026", status: "En cours", handler: "Sofia El Mansouri" },
    { id: "i3", text: "Merci de transmettre le draft du Bill of Lading avant validation finale.", createdAt: "08/08/2026", status: "Prise en compte", handler: "Yassine Bennani" },
  ],
  messages: [
    { id: "m1", author: "Maison Atlas Distribution", side: "client", at: "05 août 10:24", text: "Pouvez-vous confirmer que les cartons d'huile seront renforcés ?", category: "Qualité" },
    { id: "m2", author: "Sofia El Mansouri — AKWA", side: "akwa", at: "05 août 10:42", text: "Oui, un double renfort carton a été prévu pour cette expédition.", category: "Qualité" },
    { id: "m3", author: "Maison Atlas Distribution", side: "client", at: "08 août 14:15", text: "Merci. Pouvez-vous également m'envoyer le draft du certificat d'origine ?", category: "Documents" },
    { id: "m4", author: "Yassine Bennani — AKWA", side: "akwa", at: "08 août 16:02", text: "Le draft sera disponible dès réception du visa chambre de commerce, prévu le 13 août.", category: "Documents" },
  ],
  decisions: [
    { id: "dec1", title: "Validation du draft Bill of Lading", description: "Vérifiez le nom du consignataire, le port de déchargement et la description marchandise avant émission définitive.", due: "15 août 2026", status: "En attente" },
    { id: "dec2", title: "Validation packaging", description: "Double renfort carton + filmage renforcé sur les palettes d'huile d'olive.", due: "12 août 2026", status: "En attente" },
    { id: "dec3", title: "Autoriser produit substitut", description: "Dattes Medjool 1kg indisponibles chez le fournisseur principal — substitution proposée par un calibre équivalent.", due: "11 août 2026", status: "En attente" },
  ],
  alerts: [
    { id: "a1", level: "Urgent", title: "Solde à régler avant embarquement", message: "Le solde de 19 500 € doit être réglé avant le 16 août afin de confirmer l'embarquement.", action: { label: "Voir paiement", tab: "paiements" } },
    { id: "a2", level: "Attention", title: "Draft du Bill of Lading à valider", message: "Le draft BL-CMA-0187 attend votre validation avant le 15 août.", action: { label: "Voir la décision", tab: "overview" } },
    { id: "a3", level: "Attention", title: "Produit en attente fournisseur", message: "Dattes Medjool 1kg : substitution proposée, votre accord est requis.", action: { label: "Voir les articles", tab: "articles" } },
    { id: "a4", level: "Information", title: "Consolidation décalée", message: "La consolidation est passée du 13 au 14 août. Aucun impact sur l'ETD.", action: { label: "Voir la logistique", tab: "logistique" } },
  ],
  audit: [
    { at: "10 août 2026 – 14:28", action: "Date de consolidation modifiée", from: "13 août", to: "14 août", user: "Yassine Bennani" },
    { at: "09 août 2026 – 11:15", action: "Quantité Sardines 125g modifiée", from: "560 unités", to: "600 unités", user: "Sofia El Mansouri" },
    { at: "07 août 2026 – 16:42", action: "Incoterm confirmé", to: "CIF Abidjan", user: "Sofia El Mansouri" },
    { at: "05 août 2026 – 09:03", action: "Police d'assurance émise", to: "ASS-2026-0187", user: "Système AKWA" },
    { at: "04 août 2026 – 10:31", action: "Acompte encaissé", to: "29 250 €", user: "Comptabilité AKWA" },
    { at: "02 août 2026 – 08:55", action: "Commande créée", to: "AKW-EXP-2026-0187", user: "Sofia El Mansouri" },
  ],
};

let state: ExportOrder = baseOrder;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<ExportOrder>) => {
  state = { ...state, ...patch };
  emit();
};
const uid = () => Math.random().toString(36).slice(2, 9);

export const exportOrderStore = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  addMessage(m: Omit<Message, "id" | "at" | "side" | "author">) {
    const msg: Message = {
      id: uid(),
      side: "client",
      author: state.client,
      at: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date()),
      ...m,
    };
    set({ messages: [...state.messages, msg] });
  },
  addInstruction(text: string) {
    const ins: Instruction = {
      id: uid(),
      text,
      createdAt: new Intl.DateTimeFormat("fr-FR").format(new Date()),
      status: "Nouvelle",
    };
    set({ instructions: [ins, ...state.instructions] });
    exportOrderStore.log("Instruction client ajoutée", undefined, text.slice(0, 40) + "…");
  },
  updateInstruction(id: string, text: string) {
    set({ instructions: state.instructions.map((i) => (i.id === id ? { ...i, text } : i)) });
  },
  removeInstruction(id: string) {
    set({ instructions: state.instructions.filter((i) => i.id !== id) });
  },
  resolveDecision(id: string, status: Decision["status"]) {
    set({ decisions: state.decisions.map((d) => (d.id === id ? { ...d, status } : d)) });
    const d = state.decisions.find((x) => x.id === id);
    if (d) exportOrderStore.log(d.title, "En attente", status);
    if (id === "dec1" && status === "Validée") {
      set({
        documents: state.documents.map((doc) =>
          doc.id === "d8" ? { ...doc, name: "Bill of Lading", status: "Disponible" as DocStatus, date: "10/08/2026" } : doc,
        ),
        timeline: [
          ...state.timeline,
          { date: "10 août 2026", title: "Bill of Lading validé par le client", detail: "Draft BL-CMA-0187 approuvé.", state: "done" },
        ],
        alerts: state.alerts.filter((a) => a.id !== "a2"),
      });
    }
  },
  addPaymentProof(p: { bank: string; ref: string; amount: number; date: string; comment?: string; file?: string }) {
    const pay: Payment = {
      id: uid(),
      date: p.date,
      label: "Justificatif de paiement transmis",
      amount: p.amount,
      state: "pending",
      meta: `${p.bank} — Réf. ${p.ref}${p.file ? ` — ${p.file}` : ""}${p.comment ? ` — ${p.comment}` : ""}`,
    };
    set({ payments: [...state.payments, pay] });
    exportOrderStore.log("Justificatif de paiement transmis", undefined, `${p.amount} € — ${p.bank}`);
  },
  markShipped() {
    set({
      status: "En transit",
      progressPct: 78,
      currentStep: "En transit",
      shippingStatus: "En transit",
      sealNumber: "CMAU839271",
      containers: state.containers.map((c) => ({ ...c, status: "Chargé & scellé" })),
      timeline: state.timeline.map((e) =>
        e.title.includes("Départ navire")
          ? { ...e, state: "done" as const, title: "Départ navire effectué" }
          : e.state === "current"
            ? { ...e, state: "done" as const }
            : e,
      ),
    });
    exportOrderStore.log("Statut commande", "En préparation", "En transit");
  },
  log(action: string, from?: string, to?: string) {
    const entry: AuditEntry = {
      at: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date()),
      action,
      from,
      to,
      user: state.client,
    };
    state = { ...state, audit: [entry, ...state.audit] };
    emit();
  },
};

export function useExportOrder() {
  return useSyncExternalStore(
    (cb) => exportOrderStore.subscribe(cb),
    () => exportOrderStore.get(),
    () => exportOrderStore.get(),
  );
}

export const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
export const eur2 = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
export const num = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export function downloadMock(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
