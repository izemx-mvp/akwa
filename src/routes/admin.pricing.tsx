import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Loader2,
  Settings2,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { AgentBadge } from "@/components/AgentBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { clients, products, type Product } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/pricing")({
  component: PricingAgentPage,
});

type AgentState = "Actif" | "Analyse en cours" | "Recommandation prête" | "Action appliquée";
type PricingStrategy = "Maximiser la marge" | "Maximiser le volume" | "Équilibré";
type RiskLevel = "Conservateur" | "Modéré" | "Agressif";
type PricingStatus = "Optimal" | "Faible marge" | "Attention requise" | "Appliqué";

type PricingRow = {
  id: string;
  client: string;
  country: string;
  product: Product;
  baseCost: number;
  logisticsCost: number;
  currentPrice: number;
  recommendedPrice: number;
  currentMargin: number;
  targetMargin: number;
  status: PricingStatus;
  previousPrice?: number;
};

type SimulationInputs = {
  client: string;
  country: string;
  productId: string;
  volume: number;
  baseCost: number;
  logisticsCost: number;
  currentPrice: number;
  targetMargin: number;
  strategy: PricingStrategy;
  risk: RiskLevel;
};

type Scenario = {
  name: string;
  price: number;
  margin: number;
  risk: "Faible" | "Moyen" | "Élevé";
  best?: boolean;
};

type SimulationResult = {
  client: string;
  country: string;
  productName: string;
  currentPrice: number;
  recommendedPrice: number;
  variation: number;
  expectedMargin: number;
  monthlyGain: number;
  confidence: number;
  beforeMargin: number;
  afterMargin: number;
  scenarios: Scenario[];
  alerts: string[];
  explanations: string[];
};

type KnowledgeDocument = {
  name: string;
  type: string;
  status: "Analysé" | "Analyse en cours";
  insights: string[];
};

const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const loadingMessages = [
  "Analyse des données…",
  "Évaluation des marges…",
  "Comparaison avec l’historique…",
  "Génération des scénarios…",
];

const productLabel: Record<string, string> = {
  p1: "Bouteille Butane 12kg",
  p2: "Lubrifiant Pack XL",
  p3: "Fût Additif Carburant",
};

const initialRows = products.slice(0, 3).map((product, index): PricingRow => {
  const clientNames = ["Atlantic Trade SARL", "Dakar Energy Supply", "Sahel Distribution"];
  const countries = ["Sénégal", "Sénégal", "Mauritanie"];
  const logistics = [8.5, 11.8, 14.2][index];
  const currentPrice = [119, 118.2, 96.4][index] ?? product.unitPrice;
  const targetMargin = [16, 16, 15][index];
  const baseCost = [93.2, 93.1, 72.8][index] ?? product.cost;
  const currentMargin = ((currentPrice - baseCost - logistics) / currentPrice) * 100;
  const recommendedPrice = [123.5, 125.5, 101.8][index] ?? currentPrice * 1.04;

  return {
    id: product.id,
    client: clientNames[index],
    country: countries[index],
    product: { ...product, name: productLabel[product.id] ?? product.name },
    baseCost,
    logisticsCost: logistics,
    currentPrice,
    recommendedPrice,
    currentMargin,
    targetMargin,
    status: currentMargin < targetMargin - 3 ? "Faible marge" : currentMargin < targetMargin ? "Attention requise" : "Optimal",
  };
});

const defaultDocuments: KnowledgeDocument[] = [
  {
    name: "Contrat Atlantic Trade SARL.pdf",
    type: "Contrat",
    status: "Analysé",
    insights: ["Selon le contrat : limite d’augmentation +2 % sans validation", "Marge cible confirmée à 16 %"],
  },
  {
    name: "Politique pricing export.xlsx",
    type: "Excel",
    status: "Analysé",
    insights: ["Selon vos règles : corridor Sénégal prioritaire", "Seuil d’alerte logistique fixé à 12 €"],
  },
];

const recommendations = [
  {
    id: "senegal-25",
    title: "Augmenter le prix de 2,5 % pour le Sénégal",
    text: "L’élasticité de la demande est faible et les prix concurrents sont plus élevés",
    impact: "+4 200 € / mois",
    severity: "success",
  },
  {
    id: "dakar-margin",
    title: "Marge sous la cible pour Dakar Energy Supply",
    text: "Marge actuelle : 11,2 % — Cible : 16 %",
    impact: "Écart : -4,8 %",
    severity: "warning",
  },
  {
    id: "optimal-125",
    title: "Prix optimal détecté : 125,50 €",
    text: "Prix actuel : 118,20 € — Confiance IA : 87 %",
    impact: "+6 200 € / mois",
    severity: "info",
  },
] as const;

function PricingAgentPage() {
  const [rows, setRows] = useState<PricingRow[]>(initialRows);
  const [agentState, setAgentState] = useState<AgentState>("Actif");
  const [confidence, setConfidence] = useState(87);
  const [lastAction, setLastAction] = useState("Analyse du marché Sénégal terminée");
  const [activity, setActivity] = useState<string[]>([
    "Analyse du marché Sénégal terminée",
    "Règle utilisée : marge minimale 16 %",
    "Simulation effectuée pour Dakar Energy Supply",
  ]);
  const [filters, setFilters] = useState({ client: "Tous", country: "Tous", product: "Tous", lowMargin: "Tous" });
  const [inputs, setInputs] = useState<SimulationInputs>({
    client: "Atlantic Trade SARL",
    country: "Sénégal",
    productId: rows[0].product.id,
    volume: 500,
    baseCost: 93.2,
    logisticsCost: 8.5,
    currentPrice: 119,
    targetMargin: 16,
    strategy: "Équilibré",
    risk: "Modéré",
  });
  const [simOpen, setSimOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(defaultDocuments);
  const [rules, setRules] = useState({ minMargin: 16, marginAlert: 12, costAlert: 12, countryRule: "Sénégal : +2,5 % si marge < cible" });
  const simulationRef = useRef<HTMLDivElement>(null);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const clientOk = filters.client === "Tous" || row.client === filters.client;
      const countryOk = filters.country === "Tous" || row.country === filters.country;
      const productOk = filters.product === "Tous" || row.product.name === filters.product;
      const marginOk = filters.lowMargin === "Tous" || row.currentMargin < row.targetMargin;
      return clientOk && countryOk && productOk && marginOk;
    });
  }, [filters, rows]);

  const pushActivity = (message: string) => setActivity((items) => [message, ...items].slice(0, 8));

  const syncInputsFromRow = (row: PricingRow, overrides?: Partial<SimulationInputs>) => {
    setInputs({
      client: row.client,
      country: row.country,
      productId: row.product.id,
      volume: overrides?.volume ?? 500,
      baseCost: row.baseCost,
      logisticsCost: row.logisticsCost,
      currentPrice: row.currentPrice,
      targetMargin: row.targetMargin,
      strategy: overrides?.strategy ?? "Équilibré",
      risk: overrides?.risk ?? "Modéré",
    });
  };

  const buildSimulation = (source: SimulationInputs): SimulationResult => {
    const product = rows.find((row) => row.product.id === source.productId)?.product;
    const totalCost = source.baseCost + source.logisticsCost;
    const currentMargin = ((source.currentPrice - totalCost) / source.currentPrice) * 100;
    const targetPrice = totalCost / (1 - source.targetMargin / 100);
    const riskMultiplier = source.risk === "Conservateur" ? 1.012 : source.risk === "Agressif" ? 1.052 : 1.025;
    const strategyMultiplier = source.strategy === "Maximiser la marge" ? 1.018 : source.strategy === "Maximiser le volume" ? 0.992 : 1;
    const recommendedPrice = Math.max(source.currentPrice * riskMultiplier * strategyMultiplier, targetPrice);
    const expectedMargin = ((recommendedPrice - totalCost) / recommendedPrice) * 100;
    const variation = ((recommendedPrice - source.currentPrice) / source.currentPrice) * 100;
    const monthlyGain = Math.max(0, (recommendedPrice - source.currentPrice) * source.volume * 1.9);

    const alerts = [
      currentMargin < source.targetMargin ? `Marge actuelle ${(source.targetMargin - currentMargin).toFixed(1)} % sous la cible` : "Prix dans la zone cible",
      source.volume < 350 ? "Volume faible — rentabilité réduite" : "Volume suffisant pour absorber les coûts fixes",
      source.logisticsCost > rules.costAlert ? "Coût logistique élevé sur ce corridor" : "Coût logistique sous contrôle",
      source.currentPrice > recommendedPrice * 0.99 ? "Risque commercial : prix déjà proche du plafond" : "Prix client sous la zone optimale",
    ];

    return {
      client: source.client,
      country: source.country,
      productName: product?.name ?? "Produit export",
      currentPrice: source.currentPrice,
      recommendedPrice,
      variation,
      expectedMargin,
      monthlyGain,
      confidence: source.risk === "Agressif" ? 81 : 87,
      beforeMargin: currentMargin,
      afterMargin: expectedMargin,
      scenarios: [
        { name: "Scénario 1 — Conservateur", price: source.currentPrice * 1.024, margin: ((source.currentPrice * 1.024 - totalCost) / (source.currentPrice * 1.024)) * 100, risk: "Faible" },
        { name: "Scénario 2 — Recommandé", price: recommendedPrice, margin: expectedMargin, risk: "Faible", best: true },
        { name: "Scénario 3 — Agressif", price: source.currentPrice * 1.074, margin: ((source.currentPrice * 1.074 - totalCost) / (source.currentPrice * 1.074)) * 100, risk: "Moyen" },
      ],
      explanations: [
        "La marge actuelle est inférieure à la cible",
        "Le coût logistique a augmenté sur ce corridor",
        "L’historique valide un prix plus élevé",
        "Le prix reste compétitif sur ce marché",
      ],
      alerts,
    };
  };

  const launchSimulation = (source = inputs, openSheet = true) => {
    if (openSheet) setSimOpen(true);
    setIsSimulating(true);
    setLoadingStep(0);
    setResult(null);
    setAgentState("Analyse en cours");
    setLastAction("Simulation de pricing en cours");
    pushActivity("Simulation lancée");

    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setLoadingStep(Math.min(step, loadingMessages.length - 1));
      if (step >= loadingMessages.length) {
        window.clearInterval(timer);
        const next = buildSimulation(source);
        setResult(next);
        setIsSimulating(false);
        setAgentState("Recommandation prête");
        setConfidence(next.confidence);
        setLastAction(`Simulation terminée pour ${next.productName} – ${next.country} – ${next.client}`);
        pushActivity("Analyse terminée");
      }
    }, 650);
  };

  const applyPriceToRow = (rowId: string, newPrice: number, message = "Recommandation appliquée avec succès") => {
    setApplying(rowId);
    setAgentState("Analyse en cours");
    setLastAction("Application de la recommandation en cours");
    window.setTimeout(() => {
      setRows((items) =>
        items.map((row) => {
          if (row.id !== rowId) return row;
          const newMargin = ((newPrice - row.baseCost - row.logisticsCost) / newPrice) * 100;
          return { ...row, previousPrice: row.currentPrice, currentPrice: newPrice, currentMargin: newMargin, status: "Appliqué" };
        }),
      );
      setApplying(null);
      setAgentState("Action appliquée");
      setLastAction("Augmentation de 2,5 % appliquée pour le Sénégal");
      pushActivity("Recommandation appliquée");
      toast.success(message, { description: "Badge : +2,5 % appliqué • Gain mensuel estimé : +4 210 €" });
    }, 950);
  };

  const applyRecommendedResult = () => {
    if (!result) return;
    const row = rows.find((item) => item.product.id === inputs.productId) ?? rows[0];
    applyPriceToRow(row.id, result.recommendedPrice, "Prix recommandé appliqué avec succès");
    setSimOpen(false);
  };

  const handleRecommendationApply = (id: string) => {
    if (id === "senegal-25") {
      const row = rows.find((item) => item.country === "Sénégal" && item.product.name.includes("Butane")) ?? rows[0];
      applyPriceToRow(row.id, row.currentPrice * 1.025);
    }
    if (id === "optimal-125") {
      const row = rows.find((item) => item.client === "Dakar Energy Supply") ?? rows[1];
      applyPriceToRow(row.id, 125.5, "Prix optimal appliqué avec succès");
    }
  };

  const handleSimulateRecommendation = (id: string) => {
    const row = id === "optimal-125" || id === "dakar-margin" ? rows[1] : rows[0];
    const nextInputs = {
      client: row.client,
      country: row.country,
      productId: row.product.id,
      volume: id === "optimal-125" ? 520 : 500,
      baseCost: row.baseCost,
      logisticsCost: row.logisticsCost,
      currentPrice: row.currentPrice,
      targetMargin: row.targetMargin,
      strategy: "Équilibré" as PricingStrategy,
      risk: "Modéré" as RiskLevel,
    };
    setInputs(nextInputs);
    launchSimulation(nextInputs);
  };

  const openReview = () => {
    setAgentState("Analyse en cours");
    setLastAction("Analyse de marge lancée pour Dakar Energy Supply");
    pushActivity("Problème de marge analysé");
    setReviewOpen(true);
  };

  const focusInputs = () => {
    setSimOpen(false);
    window.setTimeout(() => simulationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const uploadKnowledge = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    setDocuments((items) => [
      { name: file.name, type: file.name.endsWith(".xlsx") ? "Excel" : file.name.endsWith(".pdf") ? "PDF" : "Contrat", status: "Analysé", insights: ["Selon le contrat : clause détectée", "Selon vos règles : marge cible 16 %"] },
      ...items,
    ]);
    setLastAction(`Document analysé : ${file.name}`);
    pushActivity("Règle utilisée depuis la base de connaissance");
    toast.success("Document analysé par l’Agent de Pricing");
  };

  return (
    <div className="max-w-[1600px] space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Agent de Pricing</h1>
              <AgentBadge name="Pricing" icon={TrendingUp} />
              <Badge className="bg-success text-success-foreground">{agentState}</Badge>
            </div>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Agent IA pour optimiser les prix, améliorer les marges et guider les décisions export
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Suggestions à fort impact" value="3" />
              <Kpi label="Gain estimé" value="+11 840 € / mois" />
              <Kpi label="Alertes de marge" value="2" />
              <Kpi label="Simulations effectuées" value="8" />
            </div>
          </div>
          <div className="w-full rounded-lg bg-gradient-ai p-4 text-ai-foreground shadow-ai lg:w-[360px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs opacity-80">Agent de Pricing</p>
                <p className="font-semibold">Statut : {agentState}</p>
              </div>
              {agentState === "Analyse en cours" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Brain className="h-5 w-5 animate-ai-pulse" />}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-md bg-ai-foreground/10 p-3">
                <p className="opacity-75">Confiance</p>
                <p className="text-lg font-bold">{confidence} %</p>
              </div>
              <div className="rounded-md bg-ai-foreground/10 p-3">
                <p className="opacity-75">Mode</p>
                <p className="text-lg font-bold">Actionnable</p>
              </div>
            </div>
            <div className="mt-3 border-t border-ai-foreground/20 pt-3">
              <p className="text-[11px] uppercase tracking-wider opacity-70">Dernière action</p>
              <p className="mt-1 text-sm leading-relaxed">{lastAction}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {recommendations.map((rec) => (
          <div key={rec.id} className={cn("rounded-xl border bg-card p-5 shadow-card transition-smooth hover:shadow-elegant", rec.severity === "warning" && "border-warning/40 bg-warning/5", rec.severity === "success" && "border-success/40 bg-success/5", rec.severity === "info" && "border-ai/40 bg-ai/5")}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Badge variant="outline" className="border-ai/30 text-ai">Recommandation IA</Badge>
                <h2 className="text-base font-semibold">{rec.title}</h2>
                <p className="text-sm text-muted-foreground">{rec.text}</p>
              </div>
              <Sparkles className="h-5 w-5 text-ai" />
            </div>
            <p className="mt-4 text-sm font-semibold text-success">Impact : {rec.impact}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {rec.id === "dakar-margin" ? (
                <>
                  <Button size="sm" variant="outline" onClick={openReview}>Revoir le pricing</Button>
                  <Button size="sm" className="gap-1 bg-gradient-ai text-ai-foreground" onClick={() => handleSimulateRecommendation(rec.id)}><Sparkles className="h-3.5 w-3.5" /> Lancer la simulation</Button>
                </>
              ) : (
                <>
                  <Button size="sm" disabled={applying !== null} onClick={() => handleRecommendationApply(rec.id)}>{applying ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}Appliquer</Button>
                  <Button size="sm" variant="outline" onClick={() => handleSimulateRecommendation(rec.id)}>Simuler</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">Tableau de pricing</h2>
            <p className="text-sm text-muted-foreground">Données export mockées, recommandations et statuts de marge.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MiniSelect value={filters.client} values={["Tous", "Atlantic Trade SARL", "Dakar Energy Supply", "Sahel Distribution"]} onChange={(client) => setFilters((state) => ({ ...state, client }))} />
            <MiniSelect value={filters.country} values={["Tous", "Sénégal", "Côte d’Ivoire", "Mauritanie"]} onChange={(country) => setFilters((state) => ({ ...state, country }))} />
            <MiniSelect value={filters.product} values={["Tous", ...rows.map((row) => row.product.name)]} onChange={(product) => setFilters((state) => ({ ...state, product }))} />
            <MiniSelect value={filters.lowMargin} values={["Tous", "Faible marge"]} onChange={(lowMargin) => setFilters((state) => ({ ...state, lowMargin }))} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Client", "Pays", "Produit", "Coût de base", "Coût logistique", "Prix actuel", "Prix recommandé", "Marge actuelle", "Marge cible", "Statut"].map((head) => <th key={head} className="px-4 py-3 text-left font-medium">{head}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.map((row) => (
                <tr key={row.id} className={cn("transition-colors hover:bg-muted/30", row.status === "Faible marge" && "bg-warning/5")}>
                  <td className="px-4 py-3 font-medium">{row.client}</td>
                  <td className="px-4 py-3">{row.country}</td>
                  <td className="px-4 py-3">{row.product.image} {row.product.name}</td>
                  <td className="px-4 py-3">{euro.format(row.baseCost)}</td>
                  <td className="px-4 py-3">{euro.format(row.logisticsCost)}</td>
                  <td className="px-4 py-3">
                    {row.previousPrice && <span className="mr-2 text-xs text-muted-foreground line-through">{euro.format(row.previousPrice)}</span>}
                    <span className={cn(row.previousPrice && "font-semibold text-success")}>{euro.format(row.currentPrice)}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ai">{euro.format(row.recommendedPrice)}</td>
                  <td className={cn("px-4 py-3 font-semibold", row.currentMargin < row.targetMargin ? "text-warning" : "text-success")}>{row.currentMargin.toFixed(1)} %</td>
                  <td className="px-4 py-3">{row.targetMargin.toFixed(1)} %</td>
                  <td className="px-4 py-3"><Badge variant="outline" className={cn(row.status === "Appliqué" && "border-success/40 bg-success/10 text-success", row.status === "Faible marge" && "border-warning/40 bg-warning/10 text-warning")}>{row.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section ref={simulationRef} className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Zone de simulation</h2>
              <p className="text-sm text-muted-foreground">Paramétrez l’agent avant de lancer une analyse.</p>
            </div>
            <Target className="h-5 w-5 text-ai" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FieldSelect label="Client" value={inputs.client} values={["Atlantic Trade SARL", "Dakar Energy Supply", "Sahel Distribution"]} onChange={(client) => setInputs((state) => ({ ...state, client }))} />
            <FieldSelect label="Pays" value={inputs.country} values={["Sénégal", "Côte d’Ivoire", "Mauritanie"]} onChange={(country) => setInputs((state) => ({ ...state, country }))} />
            <FieldSelect label="Produit" value={inputs.productId} values={rows.map((row) => row.product.id)} labels={Object.fromEntries(rows.map((row) => [row.product.id, row.product.name]))} onChange={(productId) => {
              const row = rows.find((item) => item.product.id === productId);
              if (row) syncInputsFromRow(row);
            }} />
            <FieldNumber label="Volume" value={inputs.volume} onChange={(volume) => setInputs((state) => ({ ...state, volume }))} />
            <FieldNumber label="Coût de base" value={inputs.baseCost} onChange={(baseCost) => setInputs((state) => ({ ...state, baseCost }))} />
            <FieldNumber label="Coût logistique" value={inputs.logisticsCost} onChange={(logisticsCost) => setInputs((state) => ({ ...state, logisticsCost }))} />
            <FieldNumber label="Prix actuel" value={inputs.currentPrice} onChange={(currentPrice) => setInputs((state) => ({ ...state, currentPrice }))} />
            <FieldNumber label="Marge cible %" value={inputs.targetMargin} onChange={(targetMargin) => setInputs((state) => ({ ...state, targetMargin }))} />
            <FieldSelect label="Stratégie pricing" value={inputs.strategy} values={["Maximiser la marge", "Maximiser le volume", "Équilibré"]} onChange={(strategy) => setInputs((state) => ({ ...state, strategy: strategy as PricingStrategy }))} />
            <FieldSelect label="Niveau de risque" value={inputs.risk} values={["Conservateur", "Modéré", "Agressif"]} onChange={(risk) => setInputs((state) => ({ ...state, risk: risk as RiskLevel }))} />
          </div>
          <Button className="mt-5 gap-2 bg-gradient-ai text-ai-foreground shadow-ai" onClick={() => launchSimulation()} disabled={isSimulating}>
            {isSimulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Lancer la simulation
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-4 font-semibold">Résultats de simulation</h2>
          {isSimulating && <LoadingPanel step={loadingStep} />}
          {!isSimulating && result && <ResultPreview result={result} onApply={applyRecommendedResult} onCompare={() => setCompareOpen(true)} onAdjust={focusInputs} onSave={() => { pushActivity("Simulation enregistrée"); toast.success("Simulation enregistrée"); }} />}
          {!isSimulating && !result && <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">Aucune simulation active. L’Agent de Pricing affichera ici une recommandation, les scénarios et les actions possibles.</div>}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Settings2 className="h-4 w-4 text-ai" /> Configurer l’agent</h2>
          <div className="space-y-3">
            <FieldNumber label="Marge minimale %" value={rules.minMargin} onChange={(minMargin) => setRules((state) => ({ ...state, minMargin }))} />
            <FieldNumber label="Seuil alerte marge %" value={rules.marginAlert} onChange={(marginAlert) => setRules((state) => ({ ...state, marginAlert }))} />
            <FieldNumber label="Seuil coût logistique €" value={rules.costAlert} onChange={(costAlert) => setRules((state) => ({ ...state, costAlert }))} />
            <div className="space-y-1.5"><Label>Règle pays</Label><Input value={rules.countryRule} onChange={(event) => setRules((state) => ({ ...state, countryRule: event.target.value }))} /></div>
          </div>
          <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Stratégie : marge / volume / pénétration marché</Badge>
            <Badge variant="outline">Risque : conservateur / modéré / agressif</Badge>
            <Badge variant="outline">Règles : pays / client / produit</Badge>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Upload className="h-4 w-4 text-ai" /> Base de connaissance</h2>
          <Label htmlFor="knowledge-upload" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm transition-colors hover:bg-muted">
            <Upload className="h-4 w-4" /> Importer contrats, PDF ou Excel
          </Label>
          <Input id="knowledge-upload" type="file" className="hidden" accept=".pdf,.xlsx,.xls,.doc,.docx" onChange={(event) => uploadKnowledge(event.target.files)} />
          <div className="mt-4 space-y-3">
            {documents.map((doc) => (
              <div key={doc.name} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-medium">{doc.type === "Excel" ? <FileSpreadsheet className="h-4 w-4 text-success" /> : <FileText className="h-4 w-4 text-ai" />} {doc.name}</p>
                  <Badge className="bg-success text-success-foreground">{doc.status}</Badge>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {doc.insights.map((insight) => <li key={insight}>• {insight}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-ai" /> Activité de l’agent</h2>
          <div className="space-y-3">
            {activity.map((item, index) => (
              <div key={`${item}-${index}`} className="flex gap-3 text-sm">
                <span className="mt-1 h-2 w-2 rounded-full bg-ai" />
                <div>
                  <p>{item}</p>
                  <p className="text-xs text-muted-foreground">Agent de Pricing</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Sheet open={simOpen} onOpenChange={setSimOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-ai" /> Simulation de l’Agent de Pricing</SheetTitle>
            <SheetDescription>Analyse IA simulée, scénarios et actions immédiates.</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {isSimulating && <LoadingPanel step={loadingStep} />}
            {!isSimulating && result && <ResultPreview result={result} onApply={applyRecommendedResult} onCompare={() => setCompareOpen(true)} onAdjust={focusInputs} onSave={() => { pushActivity("Simulation enregistrée"); toast.success("Simulation enregistrée"); }} detailed />}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={reviewOpen} onOpenChange={setReviewOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Revoir le pricing — Dakar Energy Supply</SheetTitle>
            <SheetDescription>Analyse IA du problème de marge et recommandations d’action.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-3"><Kpi label="Marge actuelle" value="11,2 %" /><Kpi label="Marge cible" value="16 %" /><Kpi label="Écart" value="-4,8 %" /></div>
            <div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
              <h3 className="font-semibold">Analyse IA</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {["Prix trop bas comparé aux clients similaires", "Coût logistique élevé", "Performance client faible", "Commandes récentes constamment sous-performantes"].map((item) => <li key={item} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{item}</li>)}
              </ul>
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">Faible marge</Badge>
              <Badge variant="outline" className="ml-2 border-warning/40 bg-warning/10 text-warning">Attention requise</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { setReviewOpen(false); handleSimulateRecommendation("dakar-margin"); }}>Lancer la simulation</Button>
              <Button variant="outline" onClick={() => { const row = rows[1]; applyPriceToRow(row.id, row.recommendedPrice); setReviewOpen(false); }}>Appliquer ajustement</Button>
              <Button variant="outline" onClick={() => toast.info("Historique client affiché dans l’activité agent")}>Voir historique</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comparer les scénarios</DialogTitle>
            <DialogDescription>Comparaison avant / après et arbitrage du risque.</DialogDescription>
          </DialogHeader>
          {result && <ResultPreview result={result} onApply={applyRecommendedResult} onCompare={() => setCompareOpen(false)} onAdjust={focusInputs} onSave={() => toast.success("Comparaison enregistrée")} detailed />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function MiniSelect({ value, values, onChange }: { value: string; values: string[]; onChange: (value: string) => void }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger className="h-9 min-w-[150px] text-xs"><SelectValue /></SelectTrigger><SelectContent>{values.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>;
}

function FieldSelect({ label, value, values, labels, onChange }: { label: string; value: string; values: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{values.map((item) => <SelectItem key={item} value={item}>{labels?.[item] ?? item}</SelectItem>)}</SelectContent></Select></div>;
}

function FieldNumber({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Input type="number" step="0.1" value={value} onChange={(event) => onChange(Number(event.target.value))} /></div>;
}

function LoadingPanel({ step }: { step: number }) {
  return <div className="space-y-5"><div className="rounded-lg bg-gradient-ai p-4 text-ai-foreground shadow-ai"><div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" /><div><p className="text-xs opacity-75">Agent de Pricing</p><p className="font-semibold">Statut : Analyse en cours</p></div></div></div><div className="space-y-2">{loadingMessages.map((message, index) => <div key={message} className={cn("flex items-center gap-2 text-sm", index < step && "text-success", index === step && "font-medium", index > step && "text-muted-foreground/50")}>{index < step ? <CheckCircle2 className="h-4 w-4" /> : index === step ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-4 w-4 rounded-full border border-current" />}{message}</div>)}</div></div>;
}

function ResultPreview({ result, onApply, onCompare, onAdjust, onSave, detailed = false }: { result: SimulationResult; onApply: () => void; onCompare: () => void; onAdjust: () => void; onSave: () => void; detailed?: boolean }) {
  return <div className="space-y-4"><div className="rounded-lg border border-ai/40 bg-ai/5 p-4"><div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-semibold">Recommandation</h3><Badge className="bg-ai text-ai-foreground"><Shield className="mr-1 h-3 w-3" /> Confiance élevée</Badge></div><div className="grid gap-3 sm:grid-cols-2"><Kpi label="Prix recommandé" value={euro.format(result.recommendedPrice)} /><Kpi label="Prix actuel" value={euro.format(result.currentPrice)} /><Kpi label="Variation" value={`+${result.variation.toFixed(1)} %`} /><Kpi label="Marge estimée" value={`${result.expectedMargin.toFixed(1)} %`} /><Kpi label="Gain estimé" value={`${euro.format(result.monthlyGain)} / mois`} /><Kpi label="Confiance" value={`${result.confidence} %`} /></div></div>{detailed && <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">AVANT</p><p className="mt-2 font-semibold">Prix : {euro.format(result.currentPrice)}</p><p className="text-sm text-warning">Marge : {result.beforeMargin.toFixed(1)} %</p></div><div className="rounded-lg border border-success/40 bg-success/5 p-4"><p className="text-xs text-muted-foreground">APRÈS</p><p className="mt-2 font-semibold">Prix : {euro.format(result.recommendedPrice)}</p><p className="text-sm text-success">Marge : {result.afterMargin.toFixed(1)} %</p></div></div>}<div className="rounded-lg border border-border p-4"><h3 className="mb-3 font-semibold">Explication IA</h3><ul className="space-y-2 text-sm text-muted-foreground">{result.explanations.map((item) => <li key={item} className="flex gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-ai" />{item}</li>)}</ul></div><div className="grid gap-3 md:grid-cols-3">{result.scenarios.map((scenario) => <div key={scenario.name} className={cn("rounded-lg border p-4", scenario.best && "border-ai/50 bg-ai/5 shadow-ai")}><div className="flex items-center justify-between gap-2"><h4 className="text-sm font-semibold">{scenario.name}</h4>{scenario.best && <Badge className="bg-ai text-ai-foreground">Meilleure option</Badge>}</div><p className="mt-3 text-sm">Prix : <span className="font-semibold">{euro.format(scenario.price)}</span></p><p className="text-sm">Marge : <span className="font-semibold text-success">{scenario.margin.toFixed(1)} %</span></p><Badge variant="outline" className="mt-2">Risque {scenario.risk}</Badge></div>)}</div><div className="rounded-lg border border-warning/40 bg-warning/5 p-4"><h3 className="mb-2 font-semibold">Alertes IA</h3><div className="grid gap-2 sm:grid-cols-2">{result.alerts.map((alert) => <p key={alert} className="flex gap-2 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{alert}</p>)}</div></div><div className="flex flex-wrap gap-2"><Button onClick={onApply}><CheckCircle2 className="mr-1 h-4 w-4" />Appliquer le prix recommandé</Button><Button variant="outline" onClick={onCompare}>Comparer les scénarios</Button><Button variant="outline" onClick={onAdjust}>Ajuster les paramètres</Button><Button variant="outline" onClick={onSave}>Enregistrer la simulation</Button></div></div>;
}
