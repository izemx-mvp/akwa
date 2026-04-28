import { orders as seedOrders, type Order, type OrderLine } from "./mock-data";

export type SubmittedOrderLine = OrderLine & {
  proposedPrice?: number; // prix suggéré par le client si différent
  priceNote?: string;
};

export type SubmittedOrder = Order & {
  lines: SubmittedOrderLine[];
  submittedAt: string;
  source: "client";
};

// Store en mémoire (mock) avec abonnement basique
let submitted: SubmittedOrder[] = [];
let cachedAll: (Order | SubmittedOrder)[] = [...submitted, ...seedOrders];
const listeners = new Set<() => void>();

function recompute() {
  cachedAll = [...submitted, ...seedOrders];
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
    listeners.forEach((l) => l());
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
