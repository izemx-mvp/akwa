import { orders as seedOrders, type Order, type OrderLine } from "./mock-data";

export type OrderStage =
  | "BC_Provisoire"
  | "En_Pricing"
  | "Devis_Envoye"
  | "Accepte"
  | "Refuse";

export type SubmittedOrderLine = OrderLine & {
  proposedPrice?: number;
  priceNote?: string;
  pricedUnit?: number; // prix appliqué par admin
};

export type Quote = {
  id: string;
  version: number;
  createdAt: string;
  strategy: "marge" | "volume" | "equilibre";
  targetMarginPct: number;
  transportCost: number;
  variableCharges: number;
  lines: { productId: string; quantity: number; unitPrice: number; cost: number }[];
  total: number;
  marginTotal: number;
  marginPct: number;
  fillPct: number;
  status: "envoye" | "accepte" | "refuse";
  refusalReason?: string;
  scenarioName?: string;
  conditions?: string;
};

export type SubmittedOrder = Order & {
  lines: SubmittedOrderLine[];
  submittedAt: string;
  source: "client";
  stage: OrderStage;
  quotes: Quote[];
};

let submitted: SubmittedOrder[] = [];
let cachedAll: (Order | SubmittedOrder)[] = [...submitted, ...seedOrders];
const listeners = new Set<() => void>();

function recompute() {
  cachedAll = [...submitted, ...seedOrders];
}
function emit() {
  listeners.forEach((l) => l());
}

export const ordersStore = {
  getAll(): (Order | SubmittedOrder)[] {
    return cachedAll;
  },
  getSubmitted(): SubmittedOrder[] {
    return submitted;
  },
  add(order: SubmittedOrder) {
    submitted = [order, ...submitted];
    recompute();
    emit();
  },
  update(id: string, patch: Partial<SubmittedOrder>) {
    submitted = submitted.map((o) => (o.id === id ? { ...o, ...patch } : o));
    recompute();
    emit();
  },
  addQuote(orderId: string, quote: Quote) {
    submitted = submitted.map((o) =>
      o.id === orderId
        ? { ...o, quotes: [quote, ...o.quotes], stage: "Devis_Envoye" }
        : o,
    );
    recompute();
    emit();
  },
  updateQuoteStatus(orderId: string, quoteId: string, status: Quote["status"], reason?: string) {
    submitted = submitted.map((o) => {
      if (o.id !== orderId) return o;
      const quotes = o.quotes.map((q) =>
        q.id === quoteId ? { ...q, status, refusalReason: reason } : q,
      );
      const stage: OrderStage =
        status === "accepte" ? "Accepte" : status === "refuse" ? "Refuse" : o.stage;
      return { ...o, quotes, stage };
    });
    recompute();
    emit();
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
