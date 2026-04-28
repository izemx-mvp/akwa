import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  clients,
  formatCurrency,
  formatNumber,
  products,
  type OrderLine,
} from "@/lib/mock-data";
import { ordersStore, type SubmittedOrder } from "@/lib/orders-store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  Container,
  FileEdit,
  Flame,
  Layers,
  PackageCheck,
  Play,
  Sparkles,
  TrendingUp,
  Wand2,
} from "lucide-react";

export const Route = createFileRoute("/admin/order-details/$orderId")({
  component: OrderSynthesis,
});

const statusLabel: Record<string, string> = {
  Draft: "Brouillon",
  Pending: "En validation",
  Validated: "Confirmée",
  Shipped: "Expédiée",
  Delivered: "Livrée",
};

const statusColor: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Pending: "bg-warning/15 text-warning",
  Validated: "bg-primary/10 text-primary",
  Shipped: "bg-ai/15 text-ai",
  Delivered: "bg-success/15 text-success",
};

type EnrichedLine = OrderLine & {
  proposedPrice?: number;
  priceNote?: string;
  product: (typeof products)[number];
  currentPrice: number;
  suggestedPrice: number;
  currentMarginPct: number;
  targetMarginPct: number;
  deltaPct: number;
  status: "ok" | "watch" | "issue";
  lineRevenue: number;
  lineMargin: number;
};

function useOrders() {
  return useSyncExternalStore(
    (cb) => ordersStore.subscribe(cb),
    () => ordersStore.getAll(),
    () => ordersStore.getAll(),
  );
}

function OrderSynthesis() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const orders = useOrders();
  const order = orders.find((o) => o.id === orderId);
  const [appliedSuggestions, setAppliedSuggestions] = useState(false);
  const [activity, setActivity] = useState<{ ts: string; label: string }[]>([
    { ts: "10:02", label: "Commande créée" },
    { ts: "10:14", label: "Analyse IA lancée par l'agent Pricing" },
    { ts: "10:15", label: "3 recommandations générées" },
  ]);

  const pushActivity = (label: string) => {
    const ts = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setActivity((a) => [{ ts, label }, ...a]);
  };

  const enriched: EnrichedLine[] = useMemo(() => {
    if (!order) return [];
    return order.lines.map((l) => {
      const product = products.find((p) => p.id === l.productId)!;
      const anyL = l as OrderLine & { proposedPrice?: number; priceNote?: string };
      const currentPrice = anyL.proposedPrice ?? l.unitPrice;
      // Prix suggéré IA : marge cible 16% sur le coût
      const targetMarginPct = 16;
      const suggestedPrice = appliedSuggestions
        ? currentPrice
        : Math.round((product.cost / (1 - targetMarginPct / 100)) * 100) / 100;
      const currentMarginPct = ((currentPrice - product.cost) / currentPrice) * 100;
      const deltaPct = ((suggestedPrice - currentPrice) / currentPrice) * 100;
      const status: EnrichedLine["status"] =
        currentMarginPct >= targetMarginPct
          ? "ok"
          : currentMarginPct >= targetMarginPct - 4
          ? "watch"
          : "issue";
      return {
        ...l,
        proposedPrice: anyL.proposedPrice,
        priceNote: anyL.priceNote,
        product,
        currentPrice,
        suggestedPrice,
        currentMarginPct,
        targetMarginPct,
        deltaPct,
        status,
        lineRevenue: currentPrice * l.quantity,
        lineMargin: (currentPrice - product.cost) * l.quantity,
      };
    });
  }, [order, appliedSuggestions]);

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/orders" })}>
          <ArrowLeft className="h-4 w-4" /> Retour aux commandes
        </Button>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Commande introuvable.
          </CardContent>
        </Card>
      </div>
    );
  }

  const client = clients.find((c) => c.id === order.clientId);
  const totalRevenue = enriched.reduce((s, l) => s + l.lineRevenue, 0);
  const totalMargin = enriched.reduce((s, l) => s + l.lineMargin, 0);
  const marginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
  const totalVolume = enriched.reduce((s, l) => s + l.product.unitVolumeM3 * l.quantity, 0);
  const totalWeight = enriched.reduce((s, l) => s + l.product.unitWeightKg * l.quantity, 0);
  const productCount = enriched.length;

  const suggestedRevenue = enriched.reduce((s, l) => s + l.suggestedPrice * l.quantity, 0);
  const upliftEUR = Math.max(0, suggestedRevenue - totalRevenue);

  const issues = enriched.filter((l) => l.status === "issue");
  const watch = enriched.filter((l) => l.status === "watch");

  // Conteneur 40' ~ 67 m³
  const containerCapacity = 67;
  const fillPct = Math.min(100, Math.round((totalVolume / containerCapacity) * 100));
  const recommendedContainer = totalVolume > 33 ? "40 pieds" : "20 pieds";

  const handleApplySuggestions = () => {
    setAppliedSuggestions(true);
    pushActivity("Prix suggérés IA appliqués (+" + formatCurrency(upliftEUR) + ")");
    toast.success("Prix suggérés appliqués", {
      description: "Marges réalignées sur la cible 16 %.",
    });
  };

  const handleSimulation = () => {
    pushActivity("Simulation pricing lancée");
    toast("Simulation lancée", {
      description: "L'agent Pricing analyse 3 scénarios…",
    });
    setTimeout(() => {
      pushActivity("Simulation terminée — scénario optimal détecté");
      toast.success("Simulation terminée", {
        description: "Scénario optimal : +" + formatCurrency(upliftEUR + 1200),
      });
    }, 1400);
  };

  const handleOptimizeContainer = () => {
    pushActivity("Optimisation conteneur déléguée à l'agent Logistique");
    toast("Optimisation lancée", {
      description: `Conteneur recommandé : ${recommendedContainer} (${fillPct}% rempli)`,
    });
  };

  const handleValidate = () => {
    pushActivity("Commande validée");
    toast.success("Commande validée", { description: "Transmise à la préparation." });
  };

  const totalContrib = totalMargin || 1;

  return (
    <div className="space-y-5 max-w-[1500px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/orders" })}>
            <ArrowLeft className="h-4 w-4" /> Commandes
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{order.reference}</h1>
              <span
                className={cn(
                  "text-[11px] font-medium px-2 py-0.5 rounded",
                  statusColor[order.status],
                )}
              >
                {statusLabel[order.status]}
              </span>
              {(order as SubmittedOrder).source === "client" && (
                <Badge variant="secondary" className="text-[10px]">Soumise par client</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {client?.name} • {order.destination} • Créée le{" "}
              {new Date(order.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="gap-1 bg-ai text-ai-foreground">
            <Sparkles className="h-3 w-3" /> Agent IA actif
          </Badge>
        </div>
      </div>

      {/* Résumé global */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard label="Montant total" value={formatCurrency(totalRevenue)} icon={<TrendingUp className="h-4 w-4" />} />
        <SummaryCard
          label="Marge globale"
          value={`${marginPct.toFixed(1)} %`}
          icon={<BadgeCheck className="h-4 w-4" />}
          tone={marginPct >= 16 ? "ok" : marginPct >= 12 ? "watch" : "issue"}
        />
        <SummaryCard label="Produits" value={String(productCount)} icon={<Boxes className="h-4 w-4" />} />
        <SummaryCard label="Volume total" value={`${totalVolume.toFixed(1)} m³`} icon={<Layers className="h-4 w-4" />} />
        <SummaryCard label="Poids total" value={`${formatNumber(Math.round(totalWeight))} kg`} icon={<PackageCheck className="h-4 w-4" />} />
      </div>

      {/* Bloc Agent IA */}
      <Card className="border-ai/30 bg-gradient-to-br from-ai/5 to-transparent">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-ai/15 text-ai flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Agent IA — Synthèse</div>
            <p className="text-sm text-muted-foreground mt-1">
              Cette commande peut générer{" "}
              <span className="font-semibold text-ai">+{formatCurrency(upliftEUR)}</span>{" "}
              supplémentaires en optimisant le pricing, et{" "}
              <span className="font-semibold text-ai">+{formatCurrency(640)}</span> via la
              consolidation conteneur. {issues.length} produit(s) sous la marge cible.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleApplySuggestions} disabled={appliedSuggestions || upliftEUR === 0}>
              <Wand2 className="h-4 w-4" />
              {appliedSuggestions ? "Appliqué" : "Appliquer recommandations"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleSimulation}>
              <Play className="h-4 w-4" /> Lancer simulation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau produits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-4 w-4" /> Produits & pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Produit</th>
                  <th className="text-right px-5 py-3 font-medium">Quantité</th>
                  <th className="text-right px-5 py-3 font-medium">Coût unitaire</th>
                  <th className="text-right px-5 py-3 font-medium">Prix actuel</th>
                  <th className="text-right px-5 py-3 font-medium">Prix suggéré IA</th>
                  <th className="text-right px-5 py-3 font-medium">Marge actuelle</th>
                  <th className="text-right px-5 py-3 font-medium">Marge cible</th>
                  <th className="text-right px-5 py-3 font-medium">Écart</th>
                  <th className="text-left px-5 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {enriched.map((l) => (
                  <tr key={l.productId} className="hover:bg-muted/30 transition-smooth">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{l.product.image}</span>
                        <div>
                          <div className="font-medium">{l.product.name}</div>
                          <div className="text-[11px] text-muted-foreground">{l.product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">{formatNumber(l.quantity)}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{formatCurrency(l.product.cost)}</td>
                    <td className="px-5 py-3 text-right font-semibold">{formatCurrency(l.currentPrice)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-semibold text-ai">{formatCurrency(l.suggestedPrice)}</span>
                    </td>
                    <td className={cn("px-5 py-3 text-right font-semibold", l.status === "ok" ? "text-success" : l.status === "watch" ? "text-warning" : "text-destructive")}>
                      {l.currentMarginPct.toFixed(1)} %
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{l.targetMarginPct} %</td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded", l.deltaPct > 0 ? "bg-ai/15 text-ai" : "bg-success/15 text-success")}>
                        {l.deltaPct > 0 ? "+" : ""}{l.deltaPct.toFixed(1)} %
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Analyse pricing */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ai" /> Analyse de l'agent de Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {issues.length > 0 && (
              <RecoLine
                tone="issue"
                text={`${issues.length} produit(s) ont une marge inférieure à la cible (${issues.map((i) => i.product.sku).join(", ")})`}
              />
            )}
            {enriched
              .filter((l) => l.deltaPct > 0)
              .slice(0, 2)
              .map((l) => (
                <RecoLine
                  key={l.productId}
                  tone="ai"
                  text={`Prix de ${l.product.name} peut être augmenté de ${l.deltaPct.toFixed(1)} %`}
                />
              ))}
            {client && client.marginPct < 14 && (
              <RecoLine
                tone="watch"
                text={`Le client ${client.name} bénéficie d'un prix inférieur au standard.`}
              />
            )}
            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" onClick={handleApplySuggestions} disabled={appliedSuggestions || upliftEUR === 0}>
                <Wand2 className="h-4 w-4" /> Appliquer recommandations
              </Button>
              <Button size="sm" variant="outline" onClick={handleSimulation}>
                <Play className="h-4 w-4" /> Lancer simulation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rentabilité */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" /> Rentabilité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Marge totale</span>
              <span className="text-lg font-bold text-success">{formatCurrency(totalMargin)}</span>
            </div>
            <div className="space-y-2">
              {enriched
                .slice()
                .sort((a, b) => b.lineMargin - a.lineMargin)
                .map((l) => {
                  const pct = (l.lineMargin / totalContrib) * 100;
                  return (
                    <div key={l.productId}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="truncate">{l.product.sku}</span>
                        <span className="text-muted-foreground">{pct.toFixed(0)} %</span>
                      </div>
                      <div className="h-1.5 rounded bg-muted overflow-hidden">
                        <div className="h-full bg-success" style={{ width: `${Math.max(2, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Logistique */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Container className="h-4 w-4" /> Logistique & conteneur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Volume total" value={`${totalVolume.toFixed(1)} m³`} />
            <Row label="Conteneur recommandé" value={recommendedContainer} highlight />
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Taux de remplissage</span>
                <span className={cn("font-semibold", fillPct >= 85 ? "text-success" : fillPct >= 60 ? "text-warning" : "text-destructive")}>{fillPct} %</span>
              </div>
              <div className="h-2 rounded bg-muted overflow-hidden">
                <div
                  className={cn("h-full", fillPct >= 85 ? "bg-success" : fillPct >= 60 ? "bg-warning" : "bg-destructive")}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={handleOptimizeContainer}>
              <Container className="h-4 w-4" /> Optimiser le chargement
            </Button>
          </CardContent>
        </Card>

        {/* Alertes */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Alertes & anomalies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {issues.length > 0 && (
              <Alert tone="issue" text={`Marge trop faible sur ${issues.length} produit(s) : ${issues.map((i) => i.product.sku).join(", ")}`} />
            )}
            {fillPct < 70 && (
              <Alert tone="watch" text={`Volume insuffisant pour un conteneur optimisé (${fillPct} % de remplissage)`} />
            )}
            {watch.length > 0 && (
              <Alert tone="watch" text={`${watch.length} produit(s) à surveiller — marge proche du seuil critique.`} />
            )}
            {(order as SubmittedOrder).lines?.some?.((l: any) => l.proposedPrice !== undefined) && (
              <Alert tone="ai" text="Prix proposé par le client — validation requise." />
            )}
            {issues.length === 0 && fillPct >= 70 && watch.length === 0 && (
              <Alert tone="ok" text="Aucune anomalie détectée. Commande prête à valider." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={handleApplySuggestions} disabled={appliedSuggestions || upliftEUR === 0}>
            <Wand2 className="h-4 w-4" /> Appliquer prix suggérés
          </Button>
          <Button variant="outline" onClick={() => toast("Édition", { description: "Mode édition activé." })}>
            <FileEdit className="h-4 w-4" /> Modifier la commande
          </Button>
          <Button variant="outline" onClick={handleSimulation}>
            <Play className="h-4 w-4" /> Lancer simulation pricing
          </Button>
          <Button variant="outline" onClick={handleOptimizeContainer}>
            <Container className="h-4 w-4" /> Optimiser conteneur
          </Button>
          <Button className="bg-success text-success-foreground hover:bg-success/90" onClick={handleValidate}>
            <CheckCircle2 className="h-4 w-4" /> Valider la commande
          </Button>
        </CardContent>
      </Card>

      {/* Activité */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-ai" /> Activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="text-xs text-muted-foreground w-12 shrink-0">{a.ts}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-ai" />
                <span>{a.label}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div>
        <Link to="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground">
          ← Retour à la liste
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "ok" | "watch" | "issue";
}) {
  const toneClass =
    tone === "ok"
      ? "text-success"
      : tone === "watch"
      ? "text-warning"
      : tone === "issue"
      ? "text-destructive"
      : "";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className={cn("text-xl font-bold mt-1", toneClass)}>{value}</div>
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: "ok" | "watch" | "issue" }) {
  const map = {
    ok: { label: "Optimal", cls: "bg-success/15 text-success" },
    watch: { label: "Sous-optimal", cls: "bg-warning/15 text-warning" },
    issue: { label: "Problème", cls: "bg-destructive/15 text-destructive" },
  } as const;
  const m = map[status];
  return <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded", m.cls)}>{m.label}</span>;
}

function RecoLine({ tone, text }: { tone: "ai" | "issue" | "watch"; text: string }) {
  const cls =
    tone === "issue"
      ? "border-destructive/30 bg-destructive/5"
      : tone === "watch"
      ? "border-warning/30 bg-warning/5"
      : "border-ai/30 bg-ai/5";
  const iconCls =
    tone === "issue" ? "text-destructive" : tone === "watch" ? "text-warning" : "text-ai";
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm", cls)}>
      <Sparkles className={cn("h-4 w-4 mt-0.5 shrink-0", iconCls)} />
      <span>{text}</span>
    </div>
  );
}

function Alert({ tone, text }: { tone: "ok" | "watch" | "issue" | "ai"; text: string }) {
  const cls =
    tone === "issue"
      ? "border-destructive/30 bg-destructive/5 text-destructive"
      : tone === "watch"
      ? "border-warning/30 bg-warning/5 text-warning"
      : tone === "ok"
      ? "border-success/30 bg-success/5 text-success"
      : "border-ai/30 bg-ai/5 text-ai";
  return (
    <div className={cn("rounded-lg border px-3 py-2 text-sm font-medium", cls)}>{text}</div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", highlight && "text-primary")}>{value}</span>
    </div>
  );
}
