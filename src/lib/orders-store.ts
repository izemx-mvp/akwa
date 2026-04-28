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
let store: SubmittedOrder[] = [];
const listeners = new Set<() => void>();

export const ordersStore = {
  getAll(): (Order | SubmittedOrder)[] {
    return [...store, ...seedOrders];
  },
  getSubmitted(): SubmittedOrder[] {
    return store;
  },
  add(order: SubmittedOrder) {
    store = [order, ...store];
    listeners.forEach((l) => l());
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
