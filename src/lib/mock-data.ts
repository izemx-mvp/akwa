export type Country = "Sénégal" | "Côte d'Ivoire" | "Mauritanie" | "Mali" | "Guinée";

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: "Gas" | "Lubricants" | "Additives" | "Fuel";
  unitPrice: number; // USD
  cost: number;
  unitWeightKg: number;
  unitVolumeM3: number;
  stock: number;
  image: string; // emoji icon
};

export type Client = {
  id: string;
  name: string;
  country: Country;
  segment: "Distributor" | "Industrial" | "Reseller";
  ytdRevenue: number;
  marginPct: number;
  trend: number; // -10..+10
};

export type OrderStatus = "Draft" | "Pending" | "Validated" | "Shipped" | "Delivered";

export type OrderLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  reference: string;
  clientId: string;
  destination: Country;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  containerFillPct: number;
  marginPct: number;
};

export const products: Product[] = [
  { id: "p1", sku: "BUT-12", name: "Bouteille Butane 12kg", category: "Gas", unitPrice: 32.5, cost: 24, unitWeightKg: 14, unitVolumeM3: 0.045, stock: 12400, image: "🛢️" },
  { id: "p2", sku: "LUB-XL", name: "Lubrifiant Pack XL", category: "Lubricants", unitPrice: 78.9, cost: 52, unitWeightKg: 22, unitVolumeM3: 0.06, stock: 3200, image: "🛞" },
  { id: "p3", sku: "ADD-DRM", name: "Fût Additif Carburant 200L", category: "Additives", unitPrice: 410, cost: 290, unitWeightKg: 210, unitVolumeM3: 0.25, stock: 540, image: "🧪" },
  { id: "p4", sku: "BUT-06", name: "Bouteille Butane 6kg", category: "Gas", unitPrice: 18.2, cost: 12.4, unitWeightKg: 7.5, unitVolumeM3: 0.025, stock: 18800, image: "⛽" },
  { id: "p5", sku: "LUB-IND", name: "Huile Industrielle 20L", category: "Lubricants", unitPrice: 56, cost: 38, unitWeightKg: 19, unitVolumeM3: 0.025, stock: 5400, image: "🧴" },
  { id: "p6", sku: "FUEL-AV", name: "Pack Carburant Aviation", category: "Fuel", unitPrice: 920, cost: 720, unitWeightKg: 180, unitVolumeM3: 0.22, stock: 220, image: "✈️" },
];

export const clients: Client[] = [
  { id: "c1", name: "Atlantic Trade SARL", country: "Sénégal", segment: "Distributor", ytdRevenue: 1_240_000, marginPct: 18.4, trend: 2.1 },
  { id: "c2", name: "Dakar Energy Supply", country: "Sénégal", segment: "Industrial", ytdRevenue: 980_000, marginPct: 12.6, trend: -6.2 },
  { id: "c3", name: "Sahel Distribution", country: "Mali", segment: "Distributor", ytdRevenue: 720_000, marginPct: 21.0, trend: 4.5 },
  { id: "c4", name: "Abidjan Logistics Co.", country: "Côte d'Ivoire", segment: "Distributor", ytdRevenue: 1_550_000, marginPct: 19.2, trend: 3.4 },
  { id: "c5", name: "Nouakchott Petro", country: "Mauritanie", segment: "Industrial", ytdRevenue: 510_000, marginPct: 9.8, trend: -3.8 },
  { id: "c6", name: "Conakry Resellers", country: "Guinée", segment: "Reseller", ytdRevenue: 320_000, marginPct: 16.4, trend: 1.2 },
];

export const orders: Order[] = [
  { id: "o1", reference: "AKW-2410-0182", clientId: "c1", destination: "Sénégal", createdAt: "2025-04-12", status: "Validated", lines: [{ productId: "p1", quantity: 800, unitPrice: 32.5 }, { productId: "p4", quantity: 400, unitPrice: 18.2 }], containerFillPct: 87, marginPct: 18.2 },
  { id: "o2", reference: "AKW-2410-0183", clientId: "c4", destination: "Côte d'Ivoire", createdAt: "2025-04-14", status: "Shipped", lines: [{ productId: "p2", quantity: 220, unitPrice: 78.9 }], containerFillPct: 64, marginPct: 22.1 },
  { id: "o3", reference: "AKW-2410-0184", clientId: "c3", destination: "Mali", createdAt: "2025-04-15", status: "Pending", lines: [{ productId: "p3", quantity: 40, unitPrice: 410 }, { productId: "p5", quantity: 120, unitPrice: 56 }], containerFillPct: 78, marginPct: 19.6 },
  { id: "o4", reference: "AKW-2410-0185", clientId: "c2", destination: "Sénégal", createdAt: "2025-04-16", status: "Pending", lines: [{ productId: "p1", quantity: 300, unitPrice: 32.5 }], containerFillPct: 42, marginPct: 11.2 },
  { id: "o5", reference: "AKW-2410-0186", clientId: "c5", destination: "Mauritanie", createdAt: "2025-04-17", status: "Draft", lines: [{ productId: "p6", quantity: 8, unitPrice: 920 }], containerFillPct: 31, marginPct: 8.4 },
  { id: "o6", reference: "AKW-2410-0187", clientId: "c6", destination: "Guinée", createdAt: "2025-04-18", status: "Delivered", lines: [{ productId: "p4", quantity: 950, unitPrice: 18.2 }], containerFillPct: 91, marginPct: 17.0 },
];

export const monthlyRevenue = [
  { month: "Nov", revenue: 820, margin: 16.2 },
  { month: "Déc", revenue: 910, margin: 17.1 },
  { month: "Jan", revenue: 1040, margin: 17.8 },
  { month: "Fév", revenue: 980, margin: 16.5 },
  { month: "Mar", revenue: 1180, margin: 18.4 },
  { month: "Avr", revenue: 1320, margin: 19.1 },
];

export const countryPerformance = [
  { country: "Sénégal", revenue: 2220, margin: 16.1 },
  { country: "Côte d'Ivoire", revenue: 1550, margin: 19.2 },
  { country: "Mali", revenue: 720, margin: 21.0 },
  { country: "Mauritanie", revenue: 510, margin: 9.8 },
  { country: "Guinée", revenue: 320, margin: 16.4 },
];

export const containerScenarios = [
  { name: "Actuel", fill: 78, units: 820, marginUSD: 12400 },
  { name: "Optimisé IA", fill: 94, units: 980, marginUSD: 15780 },
  { name: "Volume Max", fill: 99, units: 1040, marginUSD: 14210 },
];

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n);
