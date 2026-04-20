import { Sparkles, TrendingUp, Package, BarChart3, FileCheck, MessageSquare, type LucideIcon } from "lucide-react";

export type AgentId =
  | "pricing-advisor"
  | "container-optimizer"
  | "margin-analyst"
  | "export-assistant"
  | "internal-copilot"
  | "order-assistant";

export type Agent = {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  icon: LucideIcon;
  capabilities: string[];
  recentActions: string[];
  status: "active" | "idle" | "analyzing";
};

export const agents: Agent[] = [
  {
    id: "pricing-advisor",
    name: "Pricing Advisor",
    role: "Optimisation dynamique des prix",
    description: "Analyse en continu les marges, signaux concurrentiels et historiques pour suggérer les prix d'export optimaux par pays et par client.",
    icon: TrendingUp,
    capabilities: ["Détection d'anomalies de marge", "Pricing par pays", "Simulation de remises", "Benchmark concurrentiel"],
    recentActions: [
      "Suggestion +2,5 % sur Butane 12kg pour le Sénégal",
      "Marge < 12 % détectée pour Dakar Energy Supply",
      "Prix optimal recommandé : 125,50 USD sur Lubrifiant Pack XL",
    ],
    status: "active",
  },
  {
    id: "container-optimizer",
    name: "Container Optimizer",
    role: "Optimisation de chargement & expédition",
    description: "Calcule la configuration de conteneur la plus rentable selon poids, volume, destination et mix produits.",
    icon: Package,
    capabilities: ["Équilibrage volume/poids", "Chargement multi-produits", "Simulation de scénarios", "Réduction du coût/unité"],
    recentActions: [
      "Remplissage amélioré 78 % → 94 % sur AKW-2410-0184",
      "+120 unités de Butane 6kg suggérées",
      "1 380 $ économisés sur l'expédition Mali",
    ],
    status: "analyzing",
  },
  {
    id: "margin-analyst",
    name: "Margin Analyst",
    role: "Intelligence de rentabilité",
    description: "Détecte les clients non rentables, les tendances en baisse et les SKUs sous-performants sur tous les corridors export.",
    icon: BarChart3,
    capabilities: ["Drill-down P&L client", "Détection de tendances", "Performance SKU", "Alertes proactives"],
    recentActions: [
      "Marge en Côte d'Ivoire en baisse de 4 %",
      "Client Dakar Energy Supply : −6 %",
      "Produit Carburant Aviation sous-performant",
    ],
    status: "active",
  },
  {
    id: "export-assistant",
    name: "Export Assistant",
    role: "Copilote douane & documentation",
    description: "Vérifie en temps réel la documentation, les exigences douanières et la conformité de chaque expédition.",
    icon: FileCheck,
    capabilities: ["Checklist documents", "Intelligence douanière", "Règles par pays", "Score de risque"],
    recentActions: [
      "Certificat d'origine manquant sur AKW-2410-0185",
      "Exigence douanière vérifiée pour la Mauritanie",
      "Code SH non concordant signalé sur lubrifiants",
    ],
    status: "idle",
  },
  {
    id: "internal-copilot",
    name: "Internal Copilot",
    role: "Assistant conversationnel data",
    description: "Posez n'importe quelle question sur vos opérations — meilleurs clients, optimisation d'expédition, etc.",
    icon: MessageSquare,
    capabilities: ["Requêtes en langage naturel", "Analyse cross-données", "Prévisions", "Aide à la décision"],
    recentActions: [
      "A répondu : « Meilleur client du mois »",
      "A expliqué la baisse de marge en Mauritanie",
      "A généré le brief exécutif hebdomadaire",
    ],
    status: "active",
  },
  {
    id: "order-assistant",
    name: "AI Order Assistant",
    role: "Assistant intelligent de commande (côté client)",
    description: "Aide les clients à construire des commandes rentables et bien chargées avec des recommandations en temps réel.",
    icon: Sparkles,
    capabilities: ["Recommandations live", "Vérification du remplissage", "Produits alternatifs", "Astuces de réduction des coûts"],
    recentActions: [
      "+200 unités recommandées pour remplir le conteneur",
      "Alternative Lubrifiant Pack XL suggérée",
      "Économie estimée : 740 $",
    ],
    status: "active",
  },
];

export const getAgent = (id: AgentId) => agents.find((a) => a.id === id)!;

// === Order Assistant: dynamic recommendations based on cart ===
export type CartLine = { productId: string; quantity: number };

export type Recommendation = {
  id: string;
  title: string;
  message: string;
  severity: "info" | "success" | "warning";
  cta?: string;
  delta?: string;
};

import { products } from "./mock-data";

export function computeOrderInsights(cart: CartLine[], destination: string) {
  const totalVolume = cart.reduce((s, l) => {
    const p = products.find((p) => p.id === l.productId);
    return s + (p?.unitVolumeM3 ?? 0) * l.quantity;
  }, 0);
  const totalWeight = cart.reduce((s, l) => {
    const p = products.find((p) => p.id === l.productId);
    return s + (p?.unitWeightKg ?? 0) * l.quantity;
  }, 0);
  const totalValue = cart.reduce((s, l) => {
    const p = products.find((p) => p.id === l.productId);
    return s + (p?.unitPrice ?? 0) * l.quantity;
  }, 0);
  const totalMargin = cart.reduce((s, l) => {
    const p = products.find((p) => p.id === l.productId);
    return s + ((p?.unitPrice ?? 0) - (p?.cost ?? 0)) * l.quantity;
  }, 0);
  const containerVolume = 33;
  const containerWeight = 26000;
  const fillByVolume = Math.min(100, (totalVolume / containerVolume) * 100);
  const fillByWeight = Math.min(100, (totalWeight / containerWeight) * 100);
  const fill = Math.max(fillByVolume, fillByWeight);

  return { totalVolume, totalWeight, totalValue, totalMargin, fill };
}

export function generateOrderRecommendations(
  cart: CartLine[],
  destination: string
): Recommendation[] {
  const recs: Recommendation[] = [];
  const { fill, totalValue, totalMargin } = computeOrderInsights(cart, destination);

  if (cart.length === 0) {
    recs.push({
      id: "start",
      title: "Commencez votre commande",
      message: "Ajoutez des produits depuis le catalogue. Je suggérerai des optimisations à mesure que vous avancez.",
      severity: "info",
    });
    return recs;
  }

  if (fill < 60) {
    recs.push({
      id: "fill-low",
      title: "Conteneur sous-utilisé",
      message: `Chargement actuel à ${fill.toFixed(0)} %. Ajouter 200 unités de Butane 6kg porterait le remplissage à ~85 % et réduirait le coût d'expédition par unité de 14 %.`,
      severity: "warning",
      cta: "Appliquer la suggestion",
      delta: `+${(85 - fill).toFixed(0)}%`,
    });
  } else if (fill < 90) {
    recs.push({
      id: "fill-mid",
      title: "Presque optimal",
      message: `Vous êtes à ${fill.toFixed(0)} %. Ajouter 80 unités de plus maximiserait le conteneur.`,
      severity: "info",
      cta: "Optimiser",
    });
  } else {
    recs.push({
      id: "fill-ok",
      title: "Conteneur optimisé ✓",
      message: `Excellent — ${fill.toFixed(0)} % d'utilisation. Le coût par unité est au plus bas.`,
      severity: "success",
    });
  }

  const hasPremium = cart.some((l) => l.productId === "p2");
  if (!hasPremium && totalValue > 5000) {
    recs.push({
      id: "alt-product",
      title: "Alternative à meilleure marge",
      message: "Remplacer 30 % des lubrifiants standard par Lubrifiant Pack XL améliorerait la marge totale d'environ 420 $.",
      severity: "info",
      cta: "Comparer",
      delta: "+420 $",
    });
  }

  if (destination === "Mauritanie") {
    recs.push({
      id: "customs",
      title: "Avis douanier",
      message: "La Mauritanie exige un Certificat d'origine + code SH 2710 pour les lubrifiants. L'Export Assistant les préparera automatiquement.",
      severity: "info",
    });
  }

  if (totalMargin / Math.max(totalValue, 1) < 0.12 && totalValue > 0) {
    recs.push({
      id: "margin-low",
      title: "Marge en dessous de la cible",
      message: `Marge de la commande : ${((totalMargin / totalValue) * 100).toFixed(1)} %. Pricing Advisor suggère +1,8 % sur Butane 12kg pour cette destination.`,
      severity: "warning",
      cta: "Appliquer le pricing",
    });
  }

  return recs;
}
