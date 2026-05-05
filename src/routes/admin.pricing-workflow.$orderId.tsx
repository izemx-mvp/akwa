import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Wand2, FileText, TrendingUp, Container, Layers, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { clients, formatCurrency, formatNumber, products } from "@/lib/mock-data";
import { ordersStore, type SubmittedOrder, type Quote } from "@/lib/orders-store";

export const Route = createFileRoute("/admin/pricing-workflow/$orderId")({
  component: PricingWorkflow,
});

type Strategy = "marge" | "volume" | "equilibre";

function useOrders() {
  return useSyncExternalStore(
    (cb) => ordersStore.subscribe(cb),
    () => ordersStore.getAll(),
    () => ordersStore.getAll(),
  );
}

function PricingWorkflow() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const orders = useOrders();
  const order = orders.find((o) => o.id === orderId) as SubmittedOrder | undefined;

  const [transportCost, setTransportCost] = useState(1800);
  const [variableCharges, setVariableCharges] = useState(450);
  const [targetMarginPct, setTargetMarginPct] = useState(18);
  const [strategy, setStrategy] = useState<Strategy>("equilibre");
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [appliedPrices, setAppliedPrices] = useState<Record<string, number> | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analyzed, setAnalyzed] = useState(false);

  const analysisSteps = [
    "Analyse de l'historique client…",
    "Calcul des coûts (transport + charges)…",
    "Évaluation du remplissage conteneur…",
    "Génération des scénarios IA…",
  ];

  const runAnalysis = () => {
    setAnalyzing(true);
    setAnalysisStep(0);
    setAnalyzed(false);
  };

  useEffect(() => {
    if (!analyzing) return;
    if (analysisStep >= analysisSteps.length) {
      setAnalyzing(false);
      setAnalyzed(true);
      toast.success("Analyse IA terminée — 4 scénarios générés");
      return;
    }
    const t = setTimeout(() => setAnalysisStep((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [analyzing, analysisStep]);

  const enriched = useMemo(() => {
    if (!order) return [];
    return order.lines.map((l) => {
      const p = products.find((x) => x.id === l.productId)!;
      return { ...l, product: p };
    });
  }, [order]);

  const totalVolume = enriched.reduce((s, l) => s + l.product.unitVolumeM3 * l.quantity, 0);
  const totalUnits = enriched.reduce((s, l) => s + l.quantity, 0);
  const totalCost =
    enriched.reduce((s, l) => s + l.product.cost * l.quantity, 0) + transportCost + variableCharges;
  const containerCapacity = 67;
  const fillPct = Math.min(100, Math.round((totalVolume / containerCapacity) * 100));

  // 3 scénarios
  const scenarios = useMemo(() => {
    const baseMargin =
      strategy === "marge" ? targetMarginPct + 4 : strategy === "volume" ? targetMarginPct - 3 : targetMarginPct;
    const mk = (name: string, marginPct: number, qtyFactor: number, label: string, risk: string) => {
      const lines = enriched.map((l) => {
        const qty = Math.round(l.quantity * qtyFactor);
        const unitOverhead = (transportCost + variableCharges) / Math.max(totalUnits * qtyFactor, 1);
        const fullCost = l.product.cost + unitOverhead;
        const unitPrice = Math.round((fullCost / (1 - marginPct / 100)) * 100) / 100;
        return { productId: l.productId, quantity: qty, unitPrice, cost: l.product.cost };
      });
      const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
      const cost = lines.reduce((s, l) => s + l.cost * l.quantity, 0) + transportCost + variableCharges;
      const marginTotal = total - cost;
      const vol = lines.reduce((s, l) => s + (products.find((p) => p.id === l.productId)?.unitVolumeM3 ?? 0) * l.quantity, 0);
      return {
        name,
        label,
        risk,
        marginPct,
        lines,
        total,
        marginTotal,
        actualMarginPct: total > 0 ? (marginTotal / total) * 100 : 0,
        fillPct: Math.min(100, Math.round((vol / containerCapacity) * 100)),
      };
    };
    return [
      mk("Scénario 1", baseMargin, fillPct < 90 ? 1.15 : 1, "Optimal — recommandé", "Conteneur optimisé, risque faible"),
      mk("Scénario 2", baseMargin - 1, 1.3, "Augmenter le volume (+80 unités)", "PU ↓, marge globale ↑, remplissage ↑"),
      mk("Scénario 3", baseMargin - 4, 1, "Réduire la marge", "Prix compétitif, risque commercial faible"),
      mk("Scénario 4", baseMargin + 4, 1, "Maximiser la marge", "Prix élevé, risque commercial"),
    ];
  }, [enriched, strategy, targetMarginPct, transportCost, variableCharges, totalUnits, fillPct]);

  const recoScenario = scenarios[0];
  const overheadPerUnit = totalUnits > 0 ? (transportCost + variableCharges) / totalUnits : 0;

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/orders" })}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">Commande introuvable.</CardContent>
        </Card>
      </div>
    );
  }

  const client = clients.find((c) => c.id === order.clientId);

  const suggestions = [
    { id: 1, text: "Augmenter les quantités de 15 % pour réduire le coût unitaire", impact: "+3,2 % marge" },
    { id: 2, text: "Réduire la marge de 2 % pour sécuriser la vente", impact: "Risque ↓" },
    { id: 3, text: "Augmenter le prix sur produits à forte demande", impact: "+1 850 $" },
    { id: 4, text: `Compléter le conteneur (${fillPct}% → 92 %) pour améliorer la rentabilité`, impact: "+640 $" },
    { id: 5, text: "Segmenter la commande en deux lots pour optimiser logistique", impact: "Flex ↑" },
  ];

  const applyScenario = (idx: number) => {
    const sc = scenarios[idx];
    setSelectedScenario(sc.name);
    const map: Record<string, number> = {};
    sc.lines.forEach((l) => (map[l.productId] = l.unitPrice));
    setAppliedPrices(map);
    toast.success(`${sc.name} appliqué`, {
      description: `Marge ${sc.actualMarginPct.toFixed(1)} % • Total ${formatCurrency(sc.total)}`,
    });
  };

  const generateQuote = () => {
    if (!appliedPrices) {
      toast.error("Appliquez d'abord un scénario de pricing");
      return;
    }
    const sc = scenarios.find((s) => s.name === selectedScenario)!;
    const version = (order.quotes?.length ?? 0) + 1;
    const quote: Quote = {
      id: `q-${Date.now()}`,
      version,
      createdAt: new Date().toISOString(),
      strategy,
      targetMarginPct,
      transportCost,
      variableCharges,
      lines: sc.lines,
      total: sc.total,
      marginTotal: sc.marginTotal,
      marginPct: sc.actualMarginPct,
      fillPct: sc.fillPct,
      status: "envoye",
      scenarioName: sc.name,
      conditions: "Paiement à 30 jours • Devis valable 14 jours • Incoterm CIF",
    };
    ordersStore.addQuote(order.id, quote);
    toast.success(`Devis V${version} généré et envoyé au client`);
    navigate({ to: "/admin/order-details/$orderId", params: { orderId: order.id } });
  };

  return (
    <div className="space-y-5 max-w-[1500px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/orders" })}>
            <ArrowLeft className="h-4 w-4" /> Commandes
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Pricing IA — {order.reference}</h1>
              <Badge className="bg-warning/15 text-warning border-warning/20">BC Provisoire</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {client?.name} • {order.destination} • {totalUnits} unités • {totalVolume.toFixed(1)} m³
            </p>
          </div>
        </div>
        <Badge className="gap-1 bg-ai text-ai-foreground">
          <Sparkles className="h-3 w-3" /> Agent Pricing actif
        </Badge>
      </div>

      {/* Agent message */}
      <Card className="border-ai/30 bg-gradient-to-br from-ai/5 to-transparent">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-ai/15 text-ai flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Agent Pricing</div>
            <p className="text-sm text-muted-foreground mt-1">
              Cette commande peut générer <span className="font-semibold text-ai">+8 % de marge</span> si le conteneur
              est optimisé et que le scénario équilibré est appliqué. Historique client : marge moyenne {client?.marginPct}%.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Variables admin */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Variables de calcul</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Coût transport ($)</Label>
              <Input type="number" value={transportCost} onChange={(e) => setTransportCost(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Charges variables ($)</Label>
              <Input type="number" value={variableCharges} onChange={(e) => setVariableCharges(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Objectif de marge (%)</Label>
              <Input type="number" value={targetMarginPct} onChange={(e) => setTargetMarginPct(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Stratégie</Label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {(["marge", "equilibre", "volume"] as Strategy[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStrategy(s)}
                    className={cn(
                      "text-xs py-1.5 rounded border transition-smooth capitalize",
                      strategy === s
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    {s === "marge" ? "Max marge" : s === "volume" ? "Max volume" : "Équilibré"}
                  </button>
                ))}
            </div>
            <div className="pt-2 border-t border-border space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Coût produits</span><span>{formatCurrency(totalCost - transportCost - variableCharges)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Coût total</span><span className="font-semibold">{formatCurrency(totalCost)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Remplissage</span><span>{fillPct}%</span></div>
            </div>
            {!analyzed && !analyzing && (
              <Button onClick={runAnalysis} className="w-full bg-gradient-ai text-ai-foreground">
                <Sparkles className="h-4 w-4" /> Lancer l'analyse IA
              </Button>
            )}
            {analyzed && (
              <Button onClick={runAnalysis} variant="outline" className="w-full">
                <Wand2 className="h-3.5 w-3.5" /> Recalculer
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Loading IA ou Suggestions */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ai" />
              {analyzing ? "Analyse en cours…" : analyzed ? "Suggestions intelligentes" : "Agent Pricing en attente"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analyzing && (
              <div className="space-y-2 py-2">
                {analysisSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    {i < analysisStep ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : i === analysisStep ? (
                      <Loader2 className="h-4 w-4 text-ai animate-spin" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border" />
                    )}
                    <span className={cn(i <= analysisStep ? "text-foreground" : "text-muted-foreground")}>{step}</span>
                  </div>
                ))}
              </div>
            )}
            {!analyzing && !analyzed && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                Saisissez vos variables, puis lancez l'analyse IA pour générer les scénarios de pricing.
              </div>
            )}
            {analyzed && suggestions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-ai/40 transition-smooth">
                <div className="h-7 w-7 rounded-full bg-ai/15 text-ai flex items-center justify-center text-xs font-bold shrink-0">
                  {s.id}
                </div>
                <div className="flex-1 text-sm">{s.text}</div>
                <Badge variant="secondary" className="text-[10px]">{s.impact}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {analyzed && (
        <>
          {/* Résultat global du scénario recommandé */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="border-ai/30">
              <CardContent className="p-4">
                <div className="text-[10px] uppercase text-muted-foreground">Total commande</div>
                <div className="text-xl font-bold mt-1">{formatCurrency(recoScenario.total)}</div>
              </CardContent>
            </Card>
            <Card className="border-ai/30">
              <CardContent className="p-4">
                <div className="text-[10px] uppercase text-muted-foreground">Marge globale</div>
                <div className="text-xl font-bold text-success mt-1">{recoScenario.actualMarginPct.toFixed(1)} %</div>
              </CardContent>
            </Card>
            <Card className="border-ai/30">
              <CardContent className="p-4">
                <div className="text-[10px] uppercase text-muted-foreground">Remplissage conteneur</div>
                <div className="text-xl font-bold text-ai mt-1">{recoScenario.fillPct} %</div>
              </CardContent>
            </Card>
          </div>

          {/* Tableau pricing complet */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Tableau de pricing — {selectedScenario ?? recoScenario.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium">Produit</th>
                      <th className="text-right px-5 py-3 font-medium">Quantité</th>
                      <th className="text-right px-5 py-3 font-medium">Coût produit</th>
                      <th className="text-right px-5 py-3 font-medium">Charges var.</th>
                      <th className="text-right px-5 py-3 font-medium">Marge %</th>
                      <th className="text-right px-5 py-3 font-medium">Prix unitaire</th>
                      <th className="text-right px-5 py-3 font-medium">Prix total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(scenarios.find((s) => s.name === selectedScenario) ?? recoScenario).lines.map((l) => {
                      const p = products.find((x) => x.id === l.productId)!;
                      const fullCost = l.cost + overheadPerUnit;
                      const lineMarginPct = ((l.unitPrice - fullCost) / l.unitPrice) * 100;
                      return (
                        <tr key={l.productId}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{p.image}</span>
                              <div>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-[11px] text-muted-foreground">{p.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">{formatNumber(l.quantity)}</td>
                          <td className="px-5 py-3 text-right text-muted-foreground">{formatCurrency(l.cost)}</td>
                          <td className="px-5 py-3 text-right text-muted-foreground">{formatCurrency(overheadPerUnit)}</td>
                          <td className="px-5 py-3 text-right font-semibold text-success">{lineMarginPct.toFixed(1)} %</td>
                          <td className="px-5 py-3 text-right font-semibold">{formatCurrency(l.unitPrice)}</td>
                          <td className="px-5 py-3 text-right font-bold">{formatCurrency(l.unitPrice * l.quantity)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Scénarios */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4" /> Scénarios IA — sélectionnez puis générez le devis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {scenarios.map((sc, idx) => {
                  const isReco = idx === 0;
                  const isSel = selectedScenario === sc.name;
                  return (
                    <div
                      key={sc.name}
                      className={cn(
                        "rounded-xl border p-4 transition-smooth flex flex-col",
                        isSel ? "border-primary shadow-elegant bg-primary/5" : isReco ? "border-ai/40 bg-ai/5" : "border-border",
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{sc.name}</div>
                        {isReco && <Badge className="bg-ai text-ai-foreground text-[10px]">Recommandé</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">{sc.label}</div>
                      <div className="space-y-1.5 text-sm flex-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-bold">{formatCurrency(sc.total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Marge</span>
                          <span className="font-semibold text-success">{sc.actualMarginPct.toFixed(1)} %</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Remplissage</span>
                          <span>{sc.fillPct} %</span>
                        </div>
                        <div className="flex justify-between text-xs pt-1 border-t border-border mt-2">
                          <span className="text-muted-foreground">Risque</span>
                          <span className="text-right">{sc.risk}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className={cn("w-full mt-3", isSel && "bg-primary")}
                        variant={isSel ? "default" : "outline"}
                        onClick={() => applyScenario(idx)}
                      >
                        <Wand2 className="h-3.5 w-3.5" /> {isSel ? "Appliqué" : "Appliquer"}
                      </Button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Container className="h-4 w-4" /> Conteneur {fillPct}% rempli
                </div>
                <Button onClick={generateQuote} disabled={!appliedPrices} className="bg-gradient-primary shadow-elegant">
                  <FileText className="h-4 w-4" /> Générer le devis
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
