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
  { id: "p1", sku: "AKW-ENG-5W30-001", name: "Huile moteur synthétique 5W-30 · 1L (API SP / ACEA C3)", category: "Huiles moteur", unitPrice: 5.5, cost: 3.8, unitWeightKg: 0.9, unitVolumeM3: 0.0013, stock: 42000, image: "🛢️" },
  { id: "p2", sku: "AKW-ENG-5W30-002", name: "Huile moteur synthétique 5W-30 · 4L", category: "Huiles moteur", unitPrice: 19.4, cost: 13.6, unitWeightKg: 3.6, unitVolumeM3: 0.005, stock: 18600, image: "🛢️" },
  { id: "p3", sku: "AKW-ENG-5W40-004", name: "Huile moteur synthétique 5W-40 · 5L (API SN / ACEA A3-B4)", category: "Huiles moteur", unitPrice: 24.1, cost: 16.9, unitWeightKg: 4.6, unitVolumeM3: 0.006, stock: 14200, image: "🛢️" },
  { id: "p4", sku: "AKW-ENG-10W40-006", name: "Huile moteur semi-synthétique 10W-40 · 5L", category: "Huiles moteur", unitPrice: 21, cost: 14.9, unitWeightKg: 4.5, unitVolumeM3: 0.006, stock: 16800, image: "🛢️" },
  { id: "p5", sku: "AKW-ENG-15W40-010", name: "Huile moteur diesel 15W-40 · 20L (API CI-4)", category: "Huiles moteur", unitPrice: 56.5, cost: 41, unitWeightKg: 18, unitVolumeM3: 0.024, stock: 4300, image: "🚛" },
  { id: "p6", sku: "AKW-ENG-15W40-011", name: "Huile moteur diesel 15W-40 · fût 208L", category: "Huiles moteur", unitPrice: 540, cost: 402, unitWeightKg: 188, unitVolumeM3: 0.24, stock: 460, image: "🛢️" },
  { id: "p7", sku: "AKW-ENG-20W50-013", name: "Huile moteur minérale 20W-50 · 5L", category: "Huiles moteur", unitPrice: 13.4, cost: 9.2, unitWeightKg: 4.5, unitVolumeM3: 0.006, stock: 21000, image: "🛢️" },
  { id: "p8", sku: "AKW-ATF-D3-021", name: "ATF Dexron III · 1L", category: "Huiles transmission", unitPrice: 4.75, cost: 3.2, unitWeightKg: 0.9, unitVolumeM3: 0.0013, stock: 26500, image: "⚙️" },
  { id: "p9", sku: "AKW-ATF-D6-023", name: "ATF Dexron VI · 1L", category: "Huiles transmission", unitPrice: 5.85, cost: 4.1, unitWeightKg: 0.9, unitVolumeM3: 0.0013, stock: 19400, image: "⚙️" },
  { id: "p10", sku: "AKW-GEAR-80W90-031", name: "Gear Oil 80W-90 API GL-5 · 4L", category: "Huiles transmission", unitPrice: 18, cost: 12.4, unitWeightKg: 3.7, unitVolumeM3: 0.005, stock: 9800, image: "⚙️" },
  { id: "p11", sku: "AKW-GEAR-85W140-032", name: "Gear Oil 85W-140 API GL-5 · 20L", category: "Huiles transmission", unitPrice: 84, cost: 61, unitWeightKg: 18.4, unitVolumeM3: 0.024, stock: 2600, image: "⚙️" },
  { id: "p12", sku: "AKW-HYD-46-018", name: "Huile hydraulique ISO VG 46 · 20L", category: "Huiles industrielles", unitPrice: 60.5, cost: 44, unitWeightKg: 18, unitVolumeM3: 0.024, stock: 3400, image: "🏭" },
  { id: "p13", sku: "AKW-COOL-005", name: "Liquide de refroidissement -35 °C · 5L", category: "Fluides automobiles", unitPrice: 7, cost: 4.6, unitWeightKg: 5.3, unitVolumeM3: 0.006, stock: 24800, image: "❄️" },
  { id: "p14", sku: "AKW-COOL-006", name: "Antigel concentré G12+ · 20L", category: "Fluides automobiles", unitPrice: 37.8, cost: 26.5, unitWeightKg: 21, unitVolumeM3: 0.024, stock: 5200, image: "❄️" },
  { id: "p15", sku: "AKW-BRK-DOT4-011", name: "Liquide de frein DOT 4 · 500 ml", category: "Fluides automobiles", unitPrice: 3.9, cost: 2.5, unitWeightKg: 0.56, unitVolumeM3: 0.0008, stock: 31000, image: "🛑" },
  { id: "p16", sku: "AKW-PSF-013", name: "Fluide de direction assistée · 1L", category: "Fluides automobiles", unitPrice: 4.35, cost: 2.9, unitWeightKg: 0.9, unitVolumeM3: 0.0013, stock: 17600, image: "🔄" },
  { id: "p17", sku: "AKW-ADB-014", name: "AdBlue · bidon 10L", category: "Fluides automobiles", unitPrice: 7.2, cost: 5.1, unitWeightKg: 11, unitVolumeM3: 0.012, stock: 12800, image: "🫙" },
  { id: "p18", sku: "AKW-WSH-016", name: "Liquide lave-glace -20 °C · 5L", category: "Fluides automobiles", unitPrice: 2.9, cost: 1.8, unitWeightKg: 5.1, unitVolumeM3: 0.006, stock: 28900, image: "💧" },
  { id: "p19", sku: "AKW-GREASE-LT-007", name: "Graisse lithium multiusage NLGI 2 · 5 kg", category: "Graisses", unitPrice: 20.9, cost: 14.2, unitWeightKg: 5.4, unitVolumeM3: 0.007, stock: 6400, image: "🧈" },
  { id: "p20", sku: "AKW-GREASE-LT-008", name: "Graisse lithium multiusage NLGI 2 · 18 kg", category: "Graisses", unitPrice: 67.5, cost: 48, unitWeightKg: 19, unitVolumeM3: 0.028, stock: 2900, image: "🧈" },
  { id: "p21", sku: "AKW-ADD-INJ-040", name: "Nettoyant injecteur diesel · 300 ml", category: "Additifs & nettoyants", unitPrice: 2.35, cost: 1.4, unitWeightKg: 0.34, unitVolumeM3: 0.0005, stock: 38000, image: "🧪" },
  { id: "p22", sku: "AKW-ADD-OIL-041", name: "Additif anti-friction moteur · 400 ml", category: "Additifs & nettoyants", unitPrice: 3.6, cost: 2.2, unitWeightKg: 0.44, unitVolumeM3: 0.0006, stock: 22400, image: "⚗️" },
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
