import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { orders, clients } from "@/lib/mock-data";
import { AgentBadge } from "@/components/AgentBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  FileCheck, AlertTriangle, CheckCircle2, Ship, Clock, XCircle, Eye, Download,
  Upload, Bot, FileText, ShieldCheck, Truck, PackageCheck, MapPin, Calendar,
  AlertOctagon, Sparkles, Settings2, Activity, ChevronRight, FileWarning,
} from "lucide-react";

export const Route = createFileRoute("/admin/export")({
  component: ExportPage,
});

// ───────────────── Types & mock domain ─────────────────
type ShipStatus = "En préparation" | "En attente documents" | "Validée" | "En transit" | "Livrée" | "Retardée";
type Risk = "Faible" | "Modéré" | "Élevé";
type DocStatus = "validé" | "disponible" | "en cours" | "manquant";
type Impact = "critique" | "important" | "mineur";

type ShipDoc = { name: string; status: DocStatus; uploadedAt?: string; validatedBy?: string };
type Validation = { step: string; status: "validé" | "en attente" | "rejeté"; by?: string; date?: string };
type Missing = { label: string; impact: Impact };
type TimelineEvent = { label: string; at: string; done: boolean; alert?: boolean };

type Shipment = {
  id: string;
  orderRef: string;
  clientId: string;
  country: string;
  destination: string;
  departure: string;
  realDeparture?: string;
  status: ShipStatus;
  risk: Risk;
  container: string;
  products: string;
  delayed: boolean;
  docs: ShipDoc[];
  validations: Validation[];
  missing: Missing[];
  timeline: TimelineEvent[];
};

const initialShipments: Shipment[] = [
  {
    id: "EXP-2410-0185",
    orderRef: "AKW-2410-0185",
    clientId: "c2",
    country: "Sénégal",
    destination: "Port de Dakar",
    departure: "2025-04-29",
    status: "En attente documents",
    risk: "Élevé",
    container: "CONT-40HC-7821",
    products: "Bouteille Butane 12kg ×300",
    delayed: true,
    docs: [
      { name: "Facture commerciale", status: "validé", uploadedAt: "2025-04-20", validatedBy: "M. Diop" },
      { name: "Liste de colisage", status: "validé", uploadedAt: "2025-04-20", validatedBy: "M. Diop" },
      { name: "Connaissement (B/L)", status: "en cours", uploadedAt: "2025-04-22" },
      { name: "Certificat d'origine", status: "manquant" },
      { name: "Déclaration en douane", status: "en cours" },
      { name: "Certificat d'assurance", status: "validé", uploadedAt: "2025-04-19", validatedBy: "Compliance" },
    ],
    validations: [
      { step: "Validation interne", status: "validé", by: "A. Sow", date: "2025-04-21" },
      { step: "Validation douane", status: "en attente" },
      { step: "Validation logistique", status: "en attente" },
    ],
    missing: [
      { label: "Certificat d'origine manquant", impact: "critique" },
      { label: "Validation douanière non effectuée", impact: "critique" },
      { label: "B/L non finalisé", impact: "important" },
    ],
    timeline: [
      { label: "Commande créée", at: "2025-04-16 09:12", done: true },
      { label: "Préparation des documents", at: "2025-04-19 14:40", done: true },
      { label: "Validation interne", at: "2025-04-21 11:05", done: true },
      { label: "Validation douane", at: "En attente", done: false, alert: true },
      { label: "Chargement conteneur", at: "—", done: false },
      { label: "Départ du port", at: "—", done: false },
    ],
  },
  {
    id: "EXP-2410-0182",
    orderRef: "AKW-2410-0182",
    clientId: "c1",
    country: "Sénégal",
    destination: "Port de Dakar",
    departure: "2025-04-26",
    realDeparture: "2025-04-26",
    status: "En transit",
    risk: "Faible",
    container: "CONT-40HC-7798",
    products: "Butane 12kg ×800 · Butane 6kg ×400",
    delayed: false,
    docs: [
      { name: "Facture commerciale", status: "validé", uploadedAt: "2025-04-18", validatedBy: "M. Diop" },
      { name: "Liste de colisage", status: "validé", uploadedAt: "2025-04-18", validatedBy: "M. Diop" },
      { name: "Connaissement (B/L)", status: "validé", uploadedAt: "2025-04-23", validatedBy: "Logistique" },
      { name: "Certificat d'origine", status: "validé", uploadedAt: "2025-04-22", validatedBy: "CCI" },
      { name: "Déclaration en douane", status: "validé", uploadedAt: "2025-04-24", validatedBy: "Douane" },
      { name: "Certificat d'assurance", status: "validé", uploadedAt: "2025-04-17", validatedBy: "Compliance" },
    ],
    validations: [
      { step: "Validation interne", status: "validé", by: "A. Sow", date: "2025-04-19" },
      { step: "Validation douane", status: "validé", by: "Douane SN", date: "2025-04-24" },
      { step: "Validation logistique", status: "validé", by: "Logistique", date: "2025-04-25" },
    ],
    missing: [],
    timeline: [
      { label: "Commande créée", at: "2025-04-12 10:00", done: true },
      { label: "Préparation des documents", at: "2025-04-17 09:30", done: true },
      { label: "Validation douane", at: "2025-04-24 16:20", done: true },
      { label: "Chargement conteneur", at: "2025-04-25 08:10", done: true },
      { label: "Départ du port", at: "2025-04-26 18:45", done: true },
      { label: "En transit", at: "En cours", done: true },
    ],
  },
  {
    id: "EXP-2410-0183",
    orderRef: "AKW-2410-0183",
    clientId: "c4",
    country: "Côte d'Ivoire",
    destination: "Port d'Abidjan",
    departure: "2025-04-27",
    realDeparture: "2025-04-28",
    status: "En transit",
    risk: "Modéré",
    container: "CONT-20DC-7745",
    products: "Lubrifiant Pack XL ×220",
    delayed: true,
    docs: [
      { name: "Facture commerciale", status: "validé", uploadedAt: "2025-04-20" },
      { name: "Liste de colisage", status: "validé", uploadedAt: "2025-04-20" },
      { name: "Connaissement (B/L)", status: "validé", uploadedAt: "2025-04-25" },
      { name: "Certificat d'origine", status: "disponible", uploadedAt: "2025-04-22" },
      { name: "Déclaration en douane", status: "validé", uploadedAt: "2025-04-26" },
      { name: "Certificat d'assurance", status: "validé", uploadedAt: "2025-04-19" },
    ],
    validations: [
      { step: "Validation interne", status: "validé", by: "A. Sow", date: "2025-04-21" },
      { step: "Validation douane", status: "validé", by: "Douane CI", date: "2025-04-26" },
      { step: "Validation logistique", status: "validé", by: "Logistique", date: "2025-04-27" },
    ],
    missing: [],
    timeline: [
      { label: "Commande créée", at: "2025-04-14 11:20", done: true },
      { label: "Préparation des documents", at: "2025-04-19 10:00", done: true },
      { label: "Validation douane", at: "2025-04-26 15:10", done: true },
      { label: "Chargement conteneur", at: "2025-04-27 07:30", done: true },
      { label: "Départ du port", at: "2025-04-28 09:00", done: true, alert: true },
    ],
  },
  {
    id: "EXP-2410-0186",
    orderRef: "AKW-2410-0186",
    clientId: "c5",
    country: "Mauritanie",
    destination: "Port de Nouakchott",
    departure: "2025-05-02",
    status: "En préparation",
    risk: "Modéré",
    container: "CONT-20DC-7901",
    products: "Pack Carburant Aviation ×8",
    delayed: false,
    docs: [
      { name: "Facture commerciale", status: "disponible", uploadedAt: "2025-04-26" },
      { name: "Liste de colisage", status: "en cours" },
      { name: "Connaissement (B/L)", status: "manquant" },
      { name: "Certificat d'origine", status: "manquant" },
      { name: "Déclaration en douane", status: "manquant" },
      { name: "Certificat d'assurance", status: "disponible", uploadedAt: "2025-04-26" },
    ],
    validations: [
      { step: "Validation interne", status: "en attente" },
      { step: "Validation douane", status: "en attente" },
      { step: "Validation logistique", status: "en attente" },
    ],
    missing: [
      { label: "B/L non généré", impact: "critique" },
      { label: "Certificat d'origine manquant", impact: "critique" },
      { label: "Code SH 2710 requis pour la Mauritanie", impact: "important" },
    ],
    timeline: [
      { label: "Commande créée", at: "2025-04-17 08:40", done: true },
      { label: "Préparation des documents", at: "En cours", done: false },
      { label: "Validation douane", at: "—", done: false },
      { label: "Chargement", at: "—", done: false },
      { label: "Départ du port", at: "—", done: false },
    ],
  },
  {
    id: "EXP-2410-0187",
    orderRef: "AKW-2410-0187",
    clientId: "c6",
    country: "Guinée",
    destination: "Port de Conakry",
    departure: "2025-04-15",
    realDeparture: "2025-04-15",
    status: "Livrée",
    risk: "Faible",
    container: "CONT-40HC-7610",
    products: "Butane 6kg ×950",
    delayed: false,
    docs: [
      { name: "Facture commerciale", status: "validé" },
      { name: "Liste de colisage", status: "validé" },
      { name: "Connaissement (B/L)", status: "validé" },
      { name: "Certificat d'origine", status: "validé" },
      { name: "Déclaration en douane", status: "validé" },
      { name: "Certificat d'assurance", status: "validé" },
    ],
    validations: [
      { step: "Validation interne", status: "validé", by: "A. Sow", date: "2025-04-10" },
      { step: "Validation douane", status: "validé", by: "Douane GN", date: "2025-04-12" },
      { step: "Validation logistique", status: "validé", by: "Logistique", date: "2025-04-14" },
    ],
    missing: [],
    timeline: [
      { label: "Commande créée", at: "2025-04-08", done: true },
      { label: "Validation douane", at: "2025-04-12", done: true },
      { label: "Départ du port", at: "2025-04-15", done: true },
      { label: "Livrée", at: "2025-04-22", done: true },
    ],
  },
];

const docStatusStyle: Record<DocStatus, string> = {
  validé: "bg-success/10 text-success border-success/30",
  disponible: "bg-ai/10 text-ai border-ai/30",
  "en cours": "bg-warning/10 text-warning border-warning/30",
  manquant: "bg-destructive/10 text-destructive border-destructive/30",
};

const statusStyle: Record<ShipStatus, string> = {
  "En préparation": "bg-muted text-foreground",
  "En attente documents": "bg-warning/15 text-warning",
  "Validée": "bg-ai/15 text-ai",
  "En transit": "bg-primary/15 text-primary",
  "Livrée": "bg-success/15 text-success",
  "Retardée": "bg-destructive/15 text-destructive",
};

const riskStyle: Record<Risk, string> = {
  "Faible": "bg-success/10 text-success border-success/30",
  "Modéré": "bg-warning/10 text-warning border-warning/30",
  "Élevé": "bg-destructive/10 text-destructive border-destructive/30",
};

const impactStyle: Record<Impact, string> = {
  critique: "bg-destructive/10 text-destructive border-destructive/40",
  important: "bg-warning/10 text-warning border-warning/40",
  mineur: "bg-muted text-muted-foreground border-border",
};

// ───────────────── Component ─────────────────
function ExportPage() {
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [riskOnly, setRiskOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [agentState, setAgentState] = useState<"actif" | "analyse" | "action">("actif");
  const [activity, setActivity] = useState<{ at: string; text: string }[]>([
    { at: "il y a 2 min", text: "Alerte générée — EXP-2410-0185 : certificat d'origine manquant" },
    { at: "il y a 18 min", text: "Recommandation IA — Prioriser EXP-2410-0185" },
    { at: "il y a 1 h", text: "Validation douane effectuée — EXP-2410-0183" },
  ]);
  const [kbDocs, setKbDocs] = useState([
    { name: "Règlement douanier Sénégal 2025.pdf", status: "analysé", insight: "Certificat d'origine obligatoire" },
    { name: "Procédure interne export AKWA.pdf", status: "analysé", insight: "B/L doit être validé avant chargement" },
    { name: "Exigences Mauritanie.xlsx", status: "analysé", insight: "Code SH 2710 requis pour lubrifiants" },
  ]);

  const filtered = useMemo(() => shipments.filter(s =>
    (filterStatus === "all" || s.status === filterStatus) &&
    (filterCountry === "all" || s.country === filterCountry) &&
    (filterClient === "all" || s.clientId === filterClient) &&
    (!riskOnly || s.risk === "Élevé" || s.delayed)
  ), [shipments, filterStatus, filterCountry, filterClient, riskOnly]);

  const selected = shipments.find(s => s.id === selectedId) || null;

  const log = (text: string) => setActivity(a => [{ at: "à l'instant", text }, ...a].slice(0, 12));

  const runAgentScan = () => {
    setAgentState("analyse");
    toast.info("Agent Export — analyse des expéditions en cours…");
    setTimeout(() => {
      setAgentState("actif");
      log("Analyse IA terminée — 2 expéditions à risque détectées");
      toast.success("Analyse terminée — 2 alertes critiques");
    }, 1400);
  };

  const validateStep = (shipId: string, step: string) => {
    setAgentState("action");
    setShipments(prev => prev.map(s => s.id === shipId ? {
      ...s,
      validations: s.validations.map(v => v.step === step ? { ...v, status: "validé", by: "Vous", date: new Date().toISOString().slice(0, 10) } : v),
    } : s));
    log(`Validation effectuée — ${step} sur ${shipId}`);
    toast.success(`${step} validée`);
    setTimeout(() => setAgentState("actif"), 600);
  };

  const uploadMissing = (shipId: string, docName: string) => {
    setShipments(prev => prev.map(s => s.id === shipId ? {
      ...s,
      docs: s.docs.map(d => d.name === docName ? { ...d, status: "disponible", uploadedAt: new Date().toISOString().slice(0, 10) } : d),
      missing: s.missing.filter(m => !m.label.toLowerCase().includes(docName.toLowerCase().split(" ")[0])),
    } : s));
    log(`Document ajouté — ${docName} sur ${shipId}`);
    toast.success(`${docName} téléversé`);
  };

  const countries = Array.from(new Set(shipments.map(s => s.country)));

  // KPIs
  const total = shipments.length;
  const delayed = shipments.filter(s => s.delayed).length;
  const blocked = shipments.filter(s => s.missing.some(m => m.impact === "critique")).length;
  const inTransit = shipments.filter(s => s.status === "En transit").length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 max-w-[1500px]">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              Module Export — Suivi des Expéditions
              <AgentBadge name="Agent Export" icon={FileCheck} />
            </h1>
            <p className="text-sm text-muted-foreground">Traçabilité, conformité et pilotage intelligent des expéditions.</p>
          </div>
          <Button onClick={runAgentScan} className="gap-2">
            <Sparkles className="h-4 w-4" /> Lancer une analyse IA
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Expéditions", value: total, icon: Ship, tone: "text-primary" },
            { label: "En transit", value: inTransit, icon: Truck, tone: "text-ai" },
            { label: "En retard", value: delayed, icon: Clock, tone: "text-warning" },
            { label: "Bloquées", value: blocked, icon: AlertOctagon, tone: "text-destructive" },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${k.tone}`}>
                  <k.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{k.label}</div>
                  <div className="text-xl font-bold">{k.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Statut</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {(["En préparation","En attente documents","Validée","En transit","Livrée","Retardée"] as ShipStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Pays</Label>
              <Select value={filterCountry} onValueChange={setFilterCountry}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Client</Label>
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant={riskOnly ? "default" : "outline"} className="w-full gap-2" onClick={() => setRiskOnly(v => !v)}>
                <AlertTriangle className="h-4 w-4" /> À risque uniquement
              </Button>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={() => { setFilterStatus("all"); setFilterCountry("all"); setFilterClient("all"); setRiskOnly(false); }}>
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shipments table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Liste des expéditions</CardTitle>
            <span className="text-xs text-muted-foreground">{filtered.length} résultat(s)</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2">ID</th>
                    <th className="text-left px-4 py-2">Client</th>
                    <th className="text-left px-4 py-2">Pays</th>
                    <th className="text-left px-4 py-2">Destination</th>
                    <th className="text-left px-4 py-2">Date départ</th>
                    <th className="text-left px-4 py-2">Statut</th>
                    <th className="text-left px-4 py-2">Docs</th>
                    <th className="text-left px-4 py-2">Risque</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(s => {
                    const client = clients.find(c => c.id === s.clientId);
                    const docsOk = s.docs.every(d => d.status === "validé");
                    return (
                      <tr key={s.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedId(s.id)}>
                        <td className="px-4 py-3 font-medium">{s.id}</td>
                        <td className="px-4 py-3">{client?.name}</td>
                        <td className="px-4 py-3">{s.country}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.destination}</td>
                        <td className="px-4 py-3">{s.departure}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${statusStyle[s.status]}`}>
                            {s.status}
                          </span>
                          {s.delayed && <Badge variant="destructive" className="ml-2">En retard</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          {docsOk ? (
                            <span className="inline-flex items-center gap-1 text-success text-xs"><CheckCircle2 className="h-3.5 w-3.5" /> Oui</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive text-xs"><XCircle className="h-3.5 w-3.5" /> Non</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${riskStyle[s.risk]}`}>{s.risk}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Configuration des règles export (base de connaissance)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Documents obligatoires par pays</Label>
                <div className="mt-2 space-y-2 text-sm">
                  {[
                    { c: "Sénégal", d: "Facture · B/L · Certificat d'origine · Déclaration douane" },
                    { c: "Côte d'Ivoire", d: "Facture · B/L · Certificat d'origine · Assurance" },
                    { c: "Mauritanie", d: "Facture · B/L · Code SH 2710 · Certificat d'origine" },
                    { c: "Mali", d: "Facture · B/L · Certificat d'origine" },
                  ].map(r => (
                    <div key={r.c} className="rounded-lg border p-2 flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">{r.c}</div>
                        <div className="text-xs text-muted-foreground">{r.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">SLA validation (h)</Label>
                  <Input defaultValue={48} type="number" />
                </div>
                <div>
                  <Label className="text-xs">SLA upload doc (h)</Label>
                  <Input defaultValue={24} type="number" />
                </div>
                <div>
                  <Label className="text-xs">Seuil retard (j)</Label>
                  <Input defaultValue={2} type="number" />
                </div>
                <div>
                  <Label className="text-xs">Niveau criticité défaut</Label>
                  <Select defaultValue="important">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critique">Critique</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="mineur">Mineur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Base de connaissance</Label>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => {
                  setKbDocs(d => [{ name: `Document_${d.length + 1}.pdf`, status: "analysé", insight: "Règle extraite : validation B/L avant départ" }, ...d]);
                  log("Document ajouté à la base de connaissance");
                  toast.success("Document analysé par l'agent");
                }}>
                  <Upload className="h-3.5 w-3.5" /> Importer
                </Button>
              </div>
              <div className="space-y-2">
                {kbDocs.map(d => (
                  <div key={d.name} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-ai" />
                      <span className="text-sm font-medium flex-1 truncate">{d.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{d.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-ai" /> {d.insight}
                    </div>
                  </div>
                ))}
              </div>
              <Textarea placeholder="Ajouter une règle métier (ex: Sénégal exige certificat d'origine obligatoire)…" rows={3} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar agent + activity */}
      <aside className="space-y-4">
        <div className="rounded-xl bg-gradient-ai text-ai-foreground p-5 shadow-ai sticky top-20 space-y-3">
          <div className="flex items-center justify-between">
            <AgentBadge name="Agent Export" icon={Bot} />
            <span className="text-[10px] uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded">
              {agentState === "analyse" ? "Analyse…" : agentState === "action" ? "Action en cours" : "Actif"}
            </span>
          </div>
          <div>
            <h3 className="text-base font-semibold">Recommandations IA</h3>
            <ul className="mt-2 text-xs text-white/85 space-y-2">
              <li className="flex gap-2"><AlertOctagon className="h-3.5 w-3.5 mt-0.5" /> EXP-2410-0185 : 2 documents critiques manquants</li>
              <li className="flex gap-2"><Clock className="h-3.5 w-3.5 mt-0.5" /> Risque de retard élevé sur Dakar Energy Supply</li>
              <li className="flex gap-2"><Sparkles className="h-3.5 w-3.5 mt-0.5" /> Recommandé : prioriser cette expédition aujourd'hui</li>
            </ul>
          </div>
          <Button size="sm" variant="secondary" className="w-full" onClick={runAgentScan}>
            Relancer l'analyse
          </Button>
          <div className="pt-3 border-t border-white/15">
            <div className="text-xs uppercase tracking-wider opacity-80 mb-2 flex items-center gap-1"><Activity className="h-3 w-3" /> Activité</div>
            <ul className="space-y-1.5 text-[11px] text-white/85 max-h-48 overflow-auto">
              {activity.map((a, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="truncate">{a.text}</span>
                  <span className="opacity-60 shrink-0">{a.at}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Ship className="h-5 w-5 text-primary" /> {selected.id}
                </SheetTitle>
                <SheetDescription>
                  {clients.find(c => c.id === selected.clientId)?.name} → {selected.destination}
                </SheetDescription>
              </SheetHeader>

              {/* Status banner */}
              <div className={`mt-4 rounded-lg p-3 text-sm flex items-start gap-2 ${selected.delayed ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                {selected.delayed ? <AlertTriangle className="h-4 w-4 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 mt-0.5" />}
                <div>
                  <div className="font-medium">
                    {selected.delayed ? "Retard détecté" : "Expédition dans les délais"}
                  </div>
                  <div className="text-xs opacity-90">
                    {selected.delayed ? "Validation douanière en attente — niveau critique" : `Statut : ${selected.status}`}
                  </div>
                </div>
              </div>

              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="info">Infos</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="docs">Documents</TabsTrigger>
                  <TabsTrigger value="missing">Manquants</TabsTrigger>
                  <TabsTrigger value="valid">Validation</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-2 mt-4 text-sm">
                  <InfoRow label="Référence commande" value={selected.orderRef} />
                  <InfoRow label="Pays" value={selected.country} />
                  <InfoRow label="Destination" value={selected.destination} />
                  <InfoRow label="Conteneur" value={selected.container} />
                  <InfoRow label="Produits" value={selected.products} />
                  <InfoRow label="Date départ prévue" value={selected.departure} />
                  <InfoRow label="Date départ réelle" value={selected.realDeparture || "—"} />
                  <InfoRow label="Risque" value={<span className={`text-xs px-2 py-0.5 rounded border ${riskStyle[selected.risk]}`}>{selected.risk}</span>} />
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <ol className="relative border-l-2 border-border ml-3 space-y-4">
                    {selected.timeline.map((e, i) => (
                      <li key={i} className="ml-4">
                        <span className={`absolute -left-[9px] h-4 w-4 rounded-full border-2 border-background ${e.alert ? "bg-destructive" : e.done ? "bg-success" : "bg-muted-foreground/40"}`} />
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{e.label}</span>
                          {e.alert && <Badge variant="destructive" className="text-[10px]">Alerte</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {e.at}
                        </div>
                      </li>
                    ))}
                  </ol>
                </TabsContent>

                <TabsContent value="docs" className="space-y-2 mt-4">
                  {selected.docs.map(d => (
                    <div key={d.name} className="rounded-lg border p-3 flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{d.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.uploadedAt ? `Téléversé le ${d.uploadedAt}` : "—"}
                          {d.validatedBy && ` · validé par ${d.validatedBy}`}
                        </div>
                      </div>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${docStatusStyle[d.status]}`}>{d.status}</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => toast.info(`Aperçu : ${d.name}`)}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => toast.success(`Téléchargement : ${d.name}`)}><Download className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="missing" className="space-y-3 mt-4">
                  {selected.missing.length === 0 ? (
                    <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-4 w-4" /> Aucun élément bloquant — l'expédition est complète.
                    </div>
                  ) : (
                    <>
                      <div className="rounded-lg border border-ai/30 bg-ai/5 p-3 text-xs flex items-start gap-2">
                        <Bot className="h-4 w-4 text-ai mt-0.5" />
                        <span>Cette expédition ne peut pas être validée tant que ces éléments ne sont pas complétés.</span>
                      </div>
                      {selected.missing.map(m => (
                        <div key={m.label} className={`rounded-lg border p-3 flex items-center gap-3 ${impactStyle[m.impact]}`}>
                          <FileWarning className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{m.label}</div>
                            <div className="text-[11px] uppercase tracking-wider opacity-70">Impact : {m.impact}</div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => uploadMissing(selected.id, m.label.split(" ")[0])}>
                            <Upload className="h-3.5 w-3.5 mr-1" /> Téléverser
                          </Button>
                        </div>
                      ))}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="valid" className="space-y-2 mt-4">
                  {selected.validations.map(v => (
                    <div key={v.step} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4 w-4 ${v.status === "validé" ? "text-success" : v.status === "rejeté" ? "text-destructive" : "text-warning"}`} />
                        <span className="text-sm font-medium flex-1">{v.step}</span>
                        <Badge variant={v.status === "validé" ? "secondary" : "outline"} className="text-[10px]">{v.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {v.by ? `Par ${v.by} · ${v.date}` : "En attente d'action"}
                      </div>
                      {v.status !== "validé" && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => validateStep(selected.id, v.step)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Valider
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { toast.error("Validation rejetée"); log(`Validation rejetée — ${v.step}`); }}>
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Rejeter
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toast.info("Demande de correction envoyée")}>
                            Demander correction
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button className="w-full gap-2" onClick={() => { toast.success("Expédition validée et envoyée à la logistique"); log(`Expédition ${selected.id} validée`); }}>
                      <PackageCheck className="h-4 w-4" /> Valider l'expédition complète
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
