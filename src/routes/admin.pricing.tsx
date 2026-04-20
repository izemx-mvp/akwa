import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { products as initialProducts, clients, countryPerformance, formatCurrency, type Product } from "@/lib/mock-data";
import { AgentBadge } from "@/components/AgentBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Target,
  Activity,
  Brain,
  Shield,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/pricing")({
  component: Pricing,
});

type PricingRow = Product & {
  appliedDelta?: number; // % delta applied
  previousPrice?: number;
};

type AgentStatus = {
  state: "idle" | "analyzing" | "applying" | "reviewing" | "simulating" | "ready" | "applied";
  lastAction: string;
};

type Scenario = {
  label: string;
  price: number;
  margin: number;
  risk: "Low" | "Medium" | "High";
  best?: boolean;
};

type SimulationResult = {
  product: Product;
  client: string;
  country: string;
  volume: number;
  baseCost: number;
  logisticsCost: number;
  targetMargin: number;
  currentPrice: number;
  recommendedPrice: number;
  expectedMargin: number;
  confidence: number;
  scenarios: Scenario[];
  alerts: string[];
  insights: string[];
};

const LOADING_MESSAGES = [
  "Analyse de la structure de coûts...",
  "Évaluation des marges...",
  "Comparaison avec scénarios clients similaires...",
  "Génération des stratégies optimales...",
];

function Pricing() {
  const [rows, setRows] = useState<PricingRow[]>(initialProducts);
  const [agent, setAgent] = useState<AgentStatus>({
    state: "idle",
    lastAction: "En attente — prêt à analyser",
  });

  // Global simulation
  const [simOpen, setSimOpen] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simInputs, setSimInputs] = useState({
    clientId: clients[0].id,
    country: "Sénégal",
    productId: initialProducts[0].id,
    volume: 500,
    baseCost: initialProducts[0].cost,
    logisticsCost: 8.5,
    targetMargin: 16,
    currentPrice: initialProducts[0].unitPrice,
  });
  const inputsRef = useRef<HTMLDivElement>(null);

  // Per-row apply loading
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Review drawer
  const [reviewOpen, setReviewOpen] = useState(false);

  // Recs panel
  const [appliedRecs, setAppliedRecs] = useState<Set<string>>(new Set());

  // Sync inputs when product changes
  useEffect(() => {
    const p = rows.find((r) => r.id === simInputs.productId);
    if (p) {
      setSimInputs((s) => ({ ...s, baseCost: p.cost, currentPrice: p.unitPrice }));
    }
  }, [simInputs.productId, rows]);

  function runSimulation(opts?: { productId?: string; targetPriceHint?: number }) {
    const productId = opts?.productId ?? simInputs.productId;
    setSimInputs((s) => ({ ...s, productId }));
    setSimOpen(true);
    setSimLoading(true);
    setSimResult(null);
    setSimStep(0);
    setAgent({ state: "analyzing", lastAction: "Simulation de pricing en cours..." });

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < LOADING_MESSAGES.length) {
        setSimStep(step);
      } else {
        clearInterval(interval);
        finishSimulation(productId, opts?.targetPriceHint);
      }
    }, 650);
  }

  function finishSimulation(productId: string, hint?: number) {
    const product = rows.find((r) => r.id === productId)!;
    const client = clients.find((c) => c.id === simInputs.clientId)!;
    const baseCost = simInputs.baseCost;
    const logistics = simInputs.logisticsCost;
    const totalCost = baseCost + logistics;
    const target = simInputs.targetMargin / 100;
    const recommended = hint ?? Math.max(simInputs.currentPrice * 1.038, totalCost / (1 - target));
    const expectedMargin = ((recommended - totalCost) / recommended) * 100;

    const scenarios: Scenario[] = [
      {
        label: "Conservateur",
        price: simInputs.currentPrice * 1.017,
        margin: ((simInputs.currentPrice * 1.017 - totalCost) / (simInputs.currentPrice * 1.017)) * 100,
        risk: "Low",
      },
      {
        label: "Recommandé",
        price: recommended,
        margin: expectedMargin,
        risk: "Low",
        best: true,
      },
      {
        label: "Agressif",
        price: simInputs.currentPrice * 1.068,
        margin: ((simInputs.currentPrice * 1.068 - totalCost) / (simInputs.currentPrice * 1.068)) * 100,
        risk: "Medium",
      },
    ];

    const alerts: string[] = [];
    const currentMargin = ((simInputs.currentPrice - totalCost) / simInputs.currentPrice) * 100;
    if (currentMargin < simInputs.targetMargin) {
      alerts.push(`Marge actuelle ${(simInputs.targetMargin - currentMargin).toFixed(1)}% sous la cible`);
    }
    if (simInputs.volume < 300) {
      alerts.push("Volume faible — rentabilité réduite");
    }
    if (logistics > baseCost * 0.25) {
      alerts.push("Coût logistique élevé vers ce corridor");
    }
    if (simInputs.currentPrice < totalCost * 1.1) {
      alerts.push("Prix client sous la zone optimale");
    }

    const insights = [
      "L'augmentation est supportée par l'historique d'acceptation client",
      `Le pricing concurrentiel sur ${simInputs.country} permet l'ajustement`,
      "La stabilité des volumes réduit le risque commercial",
      "Les commandes passées valident la fourchette recommandée",
    ];

    setSimResult({
      product,
      client: client.name,
      country: simInputs.country,
      volume: simInputs.volume,
      baseCost,
      logisticsCost: logistics,
      targetMargin: simInputs.targetMargin,
      currentPrice: simInputs.currentPrice,
      recommendedPrice: recommended,
      expectedMargin,
      confidence: 87,
      scenarios,
      alerts,
      insights,
    });
    setSimLoading(false);
    setAgent({
      state: "ready",
      lastAction: `Simulation terminée — ${product.name} • ${simInputs.country} • ${client.name}`,
    });
  }

  function applyRecommendedPrice() {
    if (!simResult) return;
    setRows((rs) =>
      rs.map((r) =>
        r.id === simResult.product.id
          ? { ...r, previousPrice: r.unitPrice, unitPrice: simResult.recommendedPrice }
          : r
      )
    );
    setAgent({
      state: "applied",
      lastAction: `Prix recommandé appliqué sur ${simResult.product.name} (${formatCurrency(simResult.recommendedPrice)})`,
    });
    toast.success("Prix recommandé appliqué avec succès", {
      description: `${simResult.product.name} → ${formatCurrency(simResult.recommendedPrice)} • Marge ${simResult.expectedMargin.toFixed(1)}%`,
    });
    setSimOpen(false);
  }

  function applyRowSuggestion(row: PricingRow, suggestion: number) {
    setApplyingId(row.id);
    setAgent({ state: "applying", lastAction: `Application de la recommandation sur ${row.name}...` });
    setTimeout(() => {
      setRows((rs) =>
        rs.map((r) =>
          r.id === row.id ? { ...r, previousPrice: r.unitPrice, unitPrice: suggestion } : r
        )
      );
      const delta = ((suggestion - row.unitPrice) / row.unitPrice) * 100;
      setAgent({
        state: "applied",
        lastAction: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% appliqué sur ${row.name}`,
      });
      toast.success("Recommandation appliquée avec succès", {
        description: `${row.name} : ${formatCurrency(row.unitPrice)} → ${formatCurrency(suggestion)} • Uplift estimé +4 210 $/mois`,
      });
      setApplyingId(null);
    }, 1100);
  }

  function applyRec(rec: typeof recs[number]) {
    if (rec.id === "1") {
      // Senegal +2.5% on Butane products
      setAgent({ state: "applying", lastAction: "Application +2,5% sur le corridor Sénégal..." });
      setTimeout(() => {
        setRows((rs) =>
          rs.map((r) =>
            r.category === "Gas"
              ? { ...r, previousPrice: r.unitPrice, unitPrice: r.unitPrice * 1.025 }
              : r
          )
        );
        setAppliedRecs((s) => new Set(s).add(rec.id));
        setAgent({
          state: "applied",
          lastAction: "Hausse +2,5% appliquée sur le corridor Sénégal (Gaz)",
        });
        toast.success("Recommandation appliquée avec succès", {
          description: "Hausse +2,5% • Uplift estimé +4 210 $/mois",
        });
      }, 1100);
    } else if (rec.id === "2") {
      // Open review drawer
      setAgent({ state: "reviewing", lastAction: "Analyse pricing — Dakar Energy Supply" });
      setReviewOpen(true);
    } else if (rec.id === "3") {
      // Run simulation on Lubricant with target price
      const lub = rows.find((r) => r.sku === "LUB-XL");
      if (lub) {
        setSimInputs((s) => ({
          ...s,
          productId: lub.id,
          currentPrice: lub.unitPrice,
          baseCost: lub.cost,
        }));
        runSimulation({ productId: lub.id, targetPriceHint: 125.5 });
      }
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 max-w-[1500px]">
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              Pricing <AgentBadge name="Pricing Advisor" icon={TrendingUp} />
            </h1>
            <p className="text-sm text-muted-foreground">
              Optimisation dynamique des prix par produit et corridor.
            </p>
          </div>
          <Button
            onClick={() => runSimulation()}
            className="gap-1.5 bg-gradient-ai text-ai-foreground hover:opacity-90 shadow-ai"
          >
            <Sparkles className="h-4 w-4" /> Lancer une simulation
          </Button>
        </div>

        {/* Inputs panel */}
        <div ref={inputsRef} className="rounded-xl border border-border bg-card shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-ai" />
              <h3 className="font-semibold text-sm">Paramètres de simulation</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Modifiables avant lancement
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <Label className="text-[11px]">Client</Label>
              <Select
                value={simInputs.clientId}
                onValueChange={(v) => setSimInputs((s) => ({ ...s, clientId: v }))}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Pays</Label>
              <Select
                value={simInputs.country}
                onValueChange={(v) => setSimInputs((s) => ({ ...s, country: v }))}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Sénégal", "Côte d'Ivoire", "Mauritanie", "Mali", "Guinée"].map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Produit</Label>
              <Select
                value={simInputs.productId}
                onValueChange={(v) => setSimInputs((s) => ({ ...s, productId: v }))}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rows.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Volume commande</Label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={simInputs.volume}
                onChange={(e) => setSimInputs((s) => ({ ...s, volume: +e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Coût de base ($)</Label>
              <Input
                type="number"
                step="0.1"
                className="h-8 text-xs"
                value={simInputs.baseCost}
                onChange={(e) => setSimInputs((s) => ({ ...s, baseCost: +e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Coût logistique ($)</Label>
              <Input
                type="number"
                step="0.1"
                className="h-8 text-xs"
                value={simInputs.logisticsCost}
                onChange={(e) => setSimInputs((s) => ({ ...s, logisticsCost: +e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Marge cible (%)</Label>
              <Input
                type="number"
                step="0.1"
                className="h-8 text-xs"
                value={simInputs.targetMargin}
                onChange={(e) => setSimInputs((s) => ({ ...s, targetMargin: +e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Prix actuel ($)</Label>
              <Input
                type="number"
                step="0.1"
                className="h-8 text-xs"
                value={simInputs.currentPrice}
                onChange={(e) => setSimInputs((s) => ({ ...s, currentPrice: +e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Pricing table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Produit</th>
                <th className="text-right px-5 py-3 font-medium">Prix actuel</th>
                <th className="text-right px-5 py-3 font-medium">Coût</th>
                <th className="text-right px-5 py-3 font-medium">Marge</th>
                <th className="text-right px-5 py-3 font-medium">Suggestion IA</th>
                <th className="text-right px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p, i) => {
                const margin = ((p.unitPrice - p.cost) / p.unitPrice) * 100;
                const suggestion =
                  p.unitPrice * (1 + (i % 3 === 0 ? 0.025 : i % 3 === 1 ? -0.018 : 0.041));
                const wasUpdated = p.previousPrice !== undefined;
                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className="mr-2">{p.image}</span>
                      {p.name}
                      {wasUpdated && (
                        <Badge variant="outline" className="ml-2 text-[10px] border-success/40 text-success bg-success/10">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Appliqué
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {wasUpdated && (
                        <span className="text-[11px] text-muted-foreground line-through mr-2">
                          {formatCurrency(p.previousPrice!)}
                        </span>
                      )}
                      <span className={cn(wasUpdated && "text-success font-semibold animate-fade-in")}>
                        {formatCurrency(p.unitPrice)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {formatCurrency(p.cost)}
                    </td>
                    <td className="px-5 py-3 text-right text-success font-semibold">
                      {margin.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-ai font-semibold">{formatCurrency(suggestion)}</span>
                      <span
                        className={`ml-2 text-[10px] font-medium ${
                          suggestion > p.unitPrice ? "text-success" : "text-warning"
                        }`}
                      >
                        {suggestion > p.unitPrice ? "+" : ""}
                        {(((suggestion - p.unitPrice) / p.unitPrice) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={applyingId === p.id}
                        className="h-7 text-xs gap-1"
                        onClick={() => applyRowSuggestion(p, suggestion)}
                      >
                        {applyingId === p.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" /> Application...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" /> Appliquer
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card p-5">
          <h3 className="font-semibold mb-4">Marge par pays</h3>
          <div className="space-y-3">
            {countryPerformance.map((c) => (
              <div key={c.country}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{c.country}</span>
                  <span className="text-muted-foreground">{c.margin}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary rounded-full transition-all"
                    style={{ width: `${(c.margin / 25) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-3">
        {/* Live agent panel */}
        <div className="rounded-xl bg-gradient-ai text-ai-foreground p-5 shadow-ai sticky top-20">
          <div className="flex items-center justify-between">
            <AgentBadge name="Pricing Advisor" icon={TrendingUp} />
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  agent.state === "idle" && "bg-white/60",
                  ["analyzing", "applying", "reviewing", "simulating"].includes(agent.state) &&
                    "bg-yellow-300 animate-pulse",
                  ["ready", "applied"].includes(agent.state) && "bg-green-400"
                )}
              />
              {agent.state === "idle" && "En veille"}
              {agent.state === "analyzing" && "Analyse..."}
              {agent.state === "applying" && "Application..."}
              {agent.state === "reviewing" && "Revue..."}
              {agent.state === "simulating" && "Simulation..."}
              {agent.state === "ready" && "Recommandation prête"}
              {agent.state === "applied" && "Action appliquée"}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold">3 suggestions à fort impact</h3>
          <p className="text-xs text-white/80 mt-1">
            Uplift combiné estimé : <span className="font-bold">+11 840 $/mois</span>
          </p>
          <div className="mt-3 pt-3 border-t border-white/15">
            <p className="text-[10px] uppercase tracking-wider text-white/60 mb-1">Dernière action</p>
            <p className="text-xs text-white/95 leading-relaxed">{agent.lastAction}</p>
          </div>
        </div>

        {recs.map((r) => {
          const applied = appliedRecs.has(r.id);
          return (
            <div
              key={r.id}
              className={cn(
                "rounded-xl border bg-card p-4 transition-smooth hover:shadow-elegant",
                r.severity === "warning" && "border-warning/40 bg-warning/5",
                r.severity === "info" && "border-ai/30 bg-ai/5",
                applied && "border-success/40 bg-success/5"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    r.severity === "warning" && "bg-warning/15 text-warning",
                    r.severity === "info" && "bg-ai/15 text-ai",
                    applied && "bg-success/15 text-success"
                  )}
                >
                  {applied ? <CheckCircle2 className="h-4 w-4" /> : r.severity === "warning" ? <AlertTriangle className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold">{r.title}</h4>
                    {r.delta && (
                      <span className="text-[11px] font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded">
                        {r.delta}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{r.message}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={applied}
                    className="mt-3 h-7 text-xs gap-1.5"
                    onClick={() => applyRec(r)}
                  >
                    {applied ? (
                      <><CheckCircle2 className="h-3 w-3" /> Appliqué</>
                    ) : (
                      <><Sparkles className="h-3 w-3" /> {r.cta}</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </aside>

      {/* Simulation Sheet */}
      <Sheet open={simOpen} onOpenChange={setSimOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-ai" />
              Simulation Pricing IA
            </SheetTitle>
            <SheetDescription>
              Pricing Advisor analyse vos paramètres et propose plusieurs scénarios.
            </SheetDescription>
          </SheetHeader>

          {simLoading && (
            <div className="mt-8 space-y-6">
              <div className="rounded-xl bg-gradient-ai text-ai-foreground p-5 shadow-ai">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70 uppercase tracking-wider">Pricing Advisor</p>
                    <p className="text-sm font-semibold">Status : Analyse en cours...</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {LOADING_MESSAGES.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 text-sm transition-all",
                      i < simStep && "text-success",
                      i === simStep && "text-foreground font-medium",
                      i > simStep && "text-muted-foreground/40"
                    )}
                  >
                    {i < simStep ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : i === simStep ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-current" />
                    )}
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {simResult && !simLoading && (
            <div className="mt-6 space-y-5">
              {/* Summary */}
              <div className="rounded-xl border border-ai/30 bg-ai/5 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-ai" /> Recommandation
                  </h3>
                  <Badge className="bg-ai text-ai-foreground gap-1">
                    <Shield className="h-3 w-3" /> Confiance {simResult.confidence}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Stat label="Prix actuel" value={formatCurrency(simResult.currentPrice)} />
                  <Stat
                    label="Prix recommandé"
                    value={formatCurrency(simResult.recommendedPrice)}
                    accent="ai"
                  />
                  <Stat
                    label="Hausse suggérée"
                    value={`+${(((simResult.recommendedPrice - simResult.currentPrice) / simResult.currentPrice) * 100).toFixed(1)}%`}
                    accent="success"
                  />
                  <Stat
                    label="Marge attendue"
                    value={`${simResult.expectedMargin.toFixed(1)}%`}
                    accent="success"
                  />
                </div>
              </div>

              {/* Explanation */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-ai" /> Explication IA
                </h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {simResult.insights.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 mt-0.5 text-ai shrink-0" />
                      <span>{ins}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Scenarios */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-ai" /> Scénarios
                </h3>
                <div className="space-y-2">
                  {simResult.scenarios.map((sc, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-4 transition-smooth",
                        sc.best
                          ? "border-ai/50 bg-ai/5 shadow-ai"
                          : "border-border bg-card"
                      )}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Scénario {i + 1} — {sc.label}</span>
                          {sc.best && (
                            <Badge className="bg-ai text-ai-foreground text-[10px]">Best Option</Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              sc.risk === "Low" && "border-success/40 text-success bg-success/10",
                              sc.risk === "Medium" && "border-warning/40 text-warning bg-warning/10"
                            )}
                          >
                            Risk: {sc.risk}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Prix</p>
                          <p className="font-semibold">{formatCurrency(sc.price)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Marge</p>
                          <p className="font-semibold text-success">{sc.margin.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              {simResult.alerts.length > 0 && (
                <div className="rounded-xl border border-warning/40 bg-warning/5 p-5">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-4 w-4" /> Alertes IA
                  </h3>
                  <ul className="space-y-1.5 text-xs">
                    {simResult.alerts.map((a, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-warning">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  onClick={applyRecommendedPrice}
                  className="bg-gradient-ai text-ai-foreground hover:opacity-90 gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Appliquer le prix
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => toast.info("Vue comparée affichée ci-dessus")}
                >
                  <Activity className="h-4 w-4" /> Comparer
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    setSimOpen(false);
                    setTimeout(() => inputsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
                    toast.info("Ajustez les paramètres puis relancez la simulation");
                  }}
                >
                  <Target className="h-4 w-4" /> Ajuster
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => toast.success("Simulation enregistrée")}
                >
                  <Sparkles className="h-4 w-4" /> Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Review Pricing Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Revue Pricing — Dakar Energy Supply
            </DialogTitle>
            <DialogDescription>
              Analyse détaillée du Pricing Advisor sur ce client à risque.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Marge actuelle" value="11,2%" accent="warning" />
              <Stat label="Marge cible" value="16,0%" />
              <Stat label="Écart" value="-4,8%" accent="warning" />
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4 text-ai" /> Analyse IA
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex gap-2"><TrendingDown className="h-3 w-3 mt-0.5 text-warning shrink-0" />Pricing inférieur aux clients comparables</li>
                <li className="flex gap-2"><TrendingDown className="h-3 w-3 mt-0.5 text-warning shrink-0" />Coût logistique élevé impactant la marge</li>
                <li className="flex gap-2"><TrendingDown className="h-3 w-3 mt-0.5 text-warning shrink-0" />3 dernières commandes en sous-performance</li>
              </ul>
            </div>
            <div className="rounded-xl border border-ai/30 bg-ai/5 p-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-ai" /> Recommandations
              </h4>
              <ul className="space-y-1.5 text-xs">
                <li className="flex gap-2"><ArrowRight className="h-3 w-3 mt-0.5 text-ai shrink-0" />Augmenter prix Butane de +4,8%</li>
                <li className="flex gap-2"><ArrowRight className="h-3 w-3 mt-0.5 text-ai shrink-0" />Ajuster la stratégie de remise</li>
                <li className="flex gap-2"><ArrowRight className="h-3 w-3 mt-0.5 text-ai shrink-0" />Relever le minimum de commande à 800 unités</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Produits impactés</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-warning/40 text-warning bg-warning/10">🛢️ Butane 12kg • Marge basse</Badge>
                <Badge variant="outline" className="border-warning/40 text-warning bg-warning/10">⛽ Butane 6kg • Attention requise</Badge>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="gap-1.5 bg-gradient-ai text-ai-foreground hover:opacity-90"
                onClick={() => {
                  setReviewOpen(false);
                  const but = rows.find((r) => r.sku === "BUT-12");
                  if (but) {
                    setSimInputs((s) => ({
                      ...s,
                      productId: but.id,
                      currentPrice: but.unitPrice,
                      baseCost: but.cost,
                      clientId: clients[0].id,
                    }));
                    setTimeout(() => runSimulation({ productId: but.id }), 250);
                  }
                }}
              >
                <Sparkles className="h-4 w-4" /> Lancer une simulation
              </Button>
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  setRows((rs) =>
                    rs.map((r) =>
                      r.category === "Gas"
                        ? { ...r, previousPrice: r.unitPrice, unitPrice: r.unitPrice * 1.048 }
                        : r
                    )
                  );
                  setAppliedRecs((s) => new Set(s).add("2"));
                  setAgent({
                    state: "applied",
                    lastAction: "Ajustement +4,8% appliqué pour Dakar Energy Supply",
                  });
                  toast.success("Ajustement appliqué", {
                    description: "Marge attendue alignée sur la cible 16%",
                  });
                  setReviewOpen(false);
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> Appliquer ajustement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "ai" | "success" | "warning";
}) {
  return (
    <div className="rounded-lg bg-background border border-border/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-base font-bold mt-0.5",
          accent === "ai" && "text-ai",
          accent === "success" && "text-success",
          accent === "warning" && "text-warning"
        )}
      >
        {value}
      </p>
    </div>
  );
}

const recs = [
  {
    id: "1",
    title: "Augmenter le prix de 2,5 % pour le Sénégal",
    message:
      "L'élasticité de la demande est faible et la moyenne concurrentielle est à +3,1 %. Marge supplémentaire estimée : 4 210 $/mois.",
    severity: "info" as const,
    cta: "Appliquer",
    delta: "+4,2k $",
  },
  {
    id: "2",
    title: "Marge sous la cible pour Dakar Energy Supply",
    message:
      "Les 3 dernières commandes ont une marge moyenne de 11,2 % (cible : 16 %). Renégociation suggérée sur les SKUs Butane.",
    severity: "warning" as const,
    cta: "Revoir le pricing",
  },
  {
    id: "3",
    title: "Prix optimal détecté : 125,50 $",
    message: "Sur Lubrifiant Pack XL — prix moyen actuel 118,20 $. Confiance IA : 87 %.",
    severity: "info" as const,
    cta: "Simuler",
    delta: "+6,2 %",
  },
];
