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
    role: "Dynamic price optimization",
    description: "Continuously analyzes margins, competitor signals and order patterns to suggest optimal export prices per country and client.",
    icon: TrendingUp,
    capabilities: ["Margin anomaly detection", "Country-based pricing", "Discount simulation", "Competitive benchmarking"],
    recentActions: [
      "Suggested +2.5% on Butane 12kg for Senegal",
      "Flagged margin <12% for Dakar Energy Supply",
      "Recommended optimal price 125.50 USD on Lubricant Pack XL",
    ],
    status: "active",
  },
  {
    id: "container-optimizer",
    name: "Container Optimizer",
    role: "3D loading & shipment optimization",
    description: "Computes the most profitable container configuration based on weight, volume, destination and product mix.",
    icon: Package,
    capabilities: ["Volume/weight balancing", "Mixed-product loading", "Scenario simulation", "Cost-per-unit reduction"],
    recentActions: [
      "Improved fill from 78% to 94% on AKW-2410-0184",
      "Suggested +120 units of Butane 6kg",
      "Saved $1,380 on Mali shipment",
    ],
    status: "analyzing",
  },
  {
    id: "margin-analyst",
    name: "Margin Analyst",
    role: "Profitability intelligence",
    description: "Detects unprofitable clients, declining trends and underperforming SKUs across all export corridors.",
    icon: BarChart3,
    capabilities: ["Client P&L drill-down", "Trend detection", "SKU performance", "Proactive alerts"],
    recentActions: [
      "Margin in Côte d'Ivoire decreased by 4%",
      "Client Dakar Energy Supply dropped 6%",
      "Product Aviation Fuel Pack underperforming",
    ],
    status: "active",
  },
  {
    id: "export-assistant",
    name: "Export Assistant",
    role: "Customs & documentation copilot",
    description: "Verifies documentation, customs requirements and compliance for every shipment in real time.",
    icon: FileCheck,
    capabilities: ["Document checklist", "Customs intelligence", "Country-specific rules", "Risk scoring"],
    recentActions: [
      "Missing Certificate of Origin on AKW-2410-0185",
      "Verified customs requirement for Mauritania",
      "Flagged HS code mismatch on lubricants",
    ],
    status: "idle",
  },
  {
    id: "internal-copilot",
    name: "Internal Copilot",
    role: "Conversational data assistant",
    description: "Ask anything about your operations — from best clients to optimal shipment configurations.",
    icon: MessageSquare,
    capabilities: ["Natural-language queries", "Cross-data analysis", "Forecasting", "Decision support"],
    recentActions: [
      "Answered: 'Best client this month'",
      "Explained margin drop in Mauritania",
      "Generated weekly executive brief",
    ],
    status: "active",
  },
  {
    id: "order-assistant",
    name: "AI Order Assistant",
    role: "Smart order companion (client-facing)",
    description: "Helps clients build profitable, well-loaded orders with real-time recommendations.",
    icon: Sparkles,
    capabilities: ["Live recommendations", "Container fill check", "Alternative products", "Cost reduction tips"],
    recentActions: [
      "Recommended +200 units to fill container",
      "Suggested Lubricant Pack XL alternative",
      "Estimated saving: $740",
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
  const containerVolume = 33; // m3 (20ft container)
  const containerWeight = 26000; // kg
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
      title: "Start building your order",
      message: "Add products from the catalog. I'll suggest optimizations as you go.",
      severity: "info",
    });
    return recs;
  }

  if (fill < 60) {
    recs.push({
      id: "fill-low",
      title: "Container under-utilized",
      message: `Current load is ${fill.toFixed(0)}%. Adding 200 units of Butane 6kg would raise fill to ~85% and reduce shipping cost per unit by 14%.`,
      severity: "warning",
      cta: "Apply suggestion",
      delta: `+${(85 - fill).toFixed(0)}%`,
    });
  } else if (fill < 90) {
    recs.push({
      id: "fill-mid",
      title: "Almost optimal",
      message: `You're at ${fill.toFixed(0)}%. Adding 80 units more would maximize the container.`,
      severity: "info",
      cta: "Optimize",
    });
  } else {
    recs.push({
      id: "fill-ok",
      title: "Container optimized ✓",
      message: `Excellent — ${fill.toFixed(0)}% utilization. Cost per unit is at its lowest.`,
      severity: "success",
    });
  }

  const hasPremium = cart.some((l) => l.productId === "p2");
  if (!hasPremium && totalValue > 5000) {
    recs.push({
      id: "alt-product",
      title: "Better margin alternative",
      message: "Replacing 30% of standard lubricants with Lubricant Pack XL would improve total margin by ~$420.",
      severity: "info",
      cta: "Compare",
      delta: "+$420",
    });
  }

  if (destination === "Mauritania") {
    recs.push({
      id: "customs",
      title: "Customs notice",
      message: "Mauritania requires Certificate of Origin + HS code 2710 for lubricants. Export Assistant will prepare them automatically.",
      severity: "info",
    });
  }

  if (totalMargin / Math.max(totalValue, 1) < 0.12 && totalValue > 0) {
    recs.push({
      id: "margin-low",
      title: "Margin below target",
      message: `Order margin is ${((totalMargin / totalValue) * 100).toFixed(1)}%. Pricing Advisor suggests +1.8% on Butane 12kg for this destination.`,
      severity: "warning",
      cta: "Apply pricing",
    });
  }

  return recs;
}
