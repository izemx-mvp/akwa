import { useSyncExternalStore } from "react";
import { products } from "./mock-data";

export type CartItem = { productId: string; quantity: number };

let items: CartItem[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const cartStore = {
  get: () => items,
  add(productId: string, quantity = 50) {
    const exists = items.find((i) => i.productId === productId);
    items = exists
      ? items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i))
      : [...items, { productId, quantity }];
    emit();
  },
  setQty(productId: string, quantity: number) {
    items =
      quantity <= 0
        ? items.filter((i) => i.productId !== productId)
        : items.some((i) => i.productId === productId)
          ? items.map((i) => (i.productId === productId ? { ...i, quantity } : i))
          : [...items, { productId, quantity }];
    emit();
  },
  remove(productId: string) {
    items = items.filter((i) => i.productId !== productId);
    emit();
  },
  clear() {
    items = [];
    emit();
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function useCart() {
  return useSyncExternalStore(
    (cb) => cartStore.subscribe(cb),
    () => cartStore.get(),
    () => cartStore.get(),
  );
}

export function cartTotals(cart: CartItem[]) {
  let value = 0;
  let volume = 0;
  let weight = 0;
  let units = 0;
  for (const l of cart) {
    const p = products.find((x) => x.id === l.productId);
    if (!p) continue;
    value += p.unitPrice * l.quantity;
    volume += p.unitVolumeM3 * l.quantity;
    weight += p.unitWeightKg * l.quantity;
    units += l.quantity;
  }
  const CONTAINER_VOLUME_M3 = 67;
  const CONTAINER_WEIGHT_KG = 26500;
  const fillVolume = (volume / CONTAINER_VOLUME_M3) * 100;
  const fillWeight = (weight / CONTAINER_WEIGHT_KG) * 100;
  return {
    value,
    volume,
    weight,
    units,
    fill: Math.min(100, Math.max(fillVolume, fillWeight)),
    fillVolume: Math.min(100, fillVolume),
    fillWeight: Math.min(100, fillWeight),
    containers: Math.max(1, Math.ceil(Math.max(volume / CONTAINER_VOLUME_M3, weight / CONTAINER_WEIGHT_KG) || 0) || 1),
  };
}
