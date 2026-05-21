/**
 * Online food orders — customer placement + POS inbox (localStorage + events).
 */

import { DEFAULT_RESTAURANT_SLUG } from "@/lib/restaurants";
import { roundMoney } from "@/lib/pos-catalog";
import type { CustomerAddress } from "@/lib/online-account";

export type OnlineFulfillment = "pickup" | "delivery";

export type OnlinePaymentMethod = "momo" | "card" | "cod";

export type OnlineOrderStatus =
  | "pending_payment"
  | "placed"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export type OnlineOrderLine = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type OnlineOrder = {
  ref: string;
  /** Public storefront slug — /order/{restaurantSlug} */
  restaurantSlug: string;
  status: OnlineOrderStatus;
  fulfillment: OnlineFulfillment;
  paymentMethod: OnlinePaymentMethod;
  paymentStatus: "pending" | "paid" | "cod";
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address?: CustomerAddress;
  scheduledNote?: string;
  lines: OnlineOrderLine[];
  subtotalGhs: number;
  discountGhs: number;
  deliveryFeeGhs: number;
  taxGhs: number;
  totalGhs: number;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
};

export const ONLINE_ORDERS_STORAGE_KEY = "ventra_online_orders_v1";
export const ONLINE_ORDERS_QUEUE_KEY = "ventra_online_orders_queue_v1";
export const ONLINE_ORDERS_EVENT = "ventra-online-orders-updated";
export const ONLINE_CHECKOUT_DRAFT_KEY_PREFIX = "ventra_online_checkout_draft_";

export function checkoutDraftKey(restaurantSlug: string): string {
  return `${ONLINE_CHECKOUT_DRAFT_KEY_PREFIX}${restaurantSlug}`;
}

export const ONLINE_STATUS_LABELS: Record<OnlineOrderStatus, string> = {
  pending_payment: "Awaiting payment",
  placed: "Order received",
  confirmed: "Confirmed by restaurant",
  preparing: "Preparing your food",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Delivered / picked up",
  cancelled: "Cancelled",
};

export function newOnlineOrderRef(): string {
  return `WEB-${Date.now().toString(36).toUpperCase()}`;
}

function normalizeOrder(row: OnlineOrder): OnlineOrder {
  return {
    ...row,
    restaurantSlug: row.restaurantSlug ?? DEFAULT_RESTAURANT_SLUG,
  };
}

function parseOrders(raw: string | null): OnlineOrder[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return (data as OnlineOrder[]).map(normalizeOrder);
  } catch {
    return [];
  }
}

export function ordersForRestaurant(
  orders: OnlineOrder[],
  restaurantSlug: string,
): OnlineOrder[] {
  const slug = restaurantSlug.trim().toLowerCase();
  return orders.filter((o) => o.restaurantSlug === slug);
}

export function readAllOnlineOrders(): OnlineOrder[] {
  if (typeof window === "undefined") return [];
  return parseOrders(localStorage.getItem(ONLINE_ORDERS_STORAGE_KEY)).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function readOnlineOrderByRef(ref: string): OnlineOrder | undefined {
  return readAllOnlineOrders().find((o) => o.ref === ref);
}

function writeAllOrders(orders: OnlineOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONLINE_ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    /* quota */
  }
  notifyOnlineOrdersUpdated();
}

export function notifyOnlineOrdersUpdated(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(ONLINE_ORDERS_EVENT));
  } catch {
    /* ignore */
  }
}

export function upsertOnlineOrder(order: OnlineOrder): void {
  const all = readAllOnlineOrders();
  const idx = all.findIndex((o) => o.ref === order.ref);
  if (idx >= 0) all[idx] = order;
  else all.unshift(order);
  writeAllOrders(all);
}

export function updateOnlineOrderStatus(
  ref: string,
  status: OnlineOrderStatus,
): OnlineOrder | null {
  const all = readAllOnlineOrders();
  const idx = all.findIndex((o) => o.ref === ref);
  if (idx < 0) return null;
  const next: OnlineOrder = {
    ...all[idx],
    status,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = next;
  writeAllOrders(all);
  syncPosQueueFromOrder(next);
  return next;
}

/** Orders waiting for POS action for one restaurant. */
export function readPosOnlineQueue(restaurantSlug: string): OnlineOrder[] {
  if (typeof window === "undefined") return [];
  const slug = restaurantSlug.trim().toLowerCase();
  return parseOrders(localStorage.getItem(ONLINE_ORDERS_QUEUE_KEY)).filter(
    (o) =>
      o.restaurantSlug === slug &&
      o.status !== "completed" &&
      o.status !== "cancelled" &&
      o.status !== "pending_payment",
  );
}

function writePosQueue(list: OnlineOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONLINE_ORDERS_QUEUE_KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
  notifyOnlineOrdersUpdated();
}

export function syncPosQueueFromOrder(order: OnlineOrder): void {
  const queue = parseOrders(localStorage.getItem(ONLINE_ORDERS_QUEUE_KEY));
  const terminal =
    order.status === "completed" ||
    order.status === "cancelled" ||
    order.status === "pending_payment";
  const filtered = queue.filter((o) => o.ref !== order.ref);
  if (!terminal) filtered.unshift(order);
  writePosQueue(filtered);
}

export function enqueueForPos(order: OnlineOrder): void {
  syncPosQueueFromOrder(order);
}

export function removeFromPosQueue(ref: string): void {
  const queue = parseOrders(localStorage.getItem(ONLINE_ORDERS_QUEUE_KEY));
  writePosQueue(queue.filter((o) => o.ref !== ref));
}

export type CreateOnlineOrderInput = {
  restaurantSlug: string;
  fulfillment: OnlineFulfillment;
  paymentMethod: OnlinePaymentMethod;
  paymentStatus: "pending" | "paid" | "cod";
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address?: CustomerAddress;
  scheduledNote?: string;
  lines: OnlineOrderLine[];
  subtotalGhs: number;
  discountGhs: number;
  deliveryFeeGhs: number;
  taxGhs: number;
  totalGhs: number;
  couponCode?: string;
  status?: OnlineOrderStatus;
};

export function createOnlineOrder(
  input: CreateOnlineOrderInput,
): OnlineOrder {
  const ref = newOnlineOrderRef();
  const now = new Date().toISOString();
  const status =
    input.status ??
    (input.paymentStatus === "pending" ? "pending_payment" : "placed");

  const order: OnlineOrder = {
    ref,
    restaurantSlug: input.restaurantSlug.trim().toLowerCase(),
    status,
    fulfillment: input.fulfillment,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerEmail: input.customerEmail?.trim() || undefined,
    address: input.address,
    scheduledNote: input.scheduledNote?.trim() || undefined,
    lines: input.lines.map((l) => ({
      ...l,
      lineTotal: roundMoney(l.unitPrice * l.qty),
    })),
    subtotalGhs: roundMoney(input.subtotalGhs),
    discountGhs: roundMoney(input.discountGhs),
    deliveryFeeGhs: roundMoney(input.deliveryFeeGhs),
    taxGhs: roundMoney(input.taxGhs),
    totalGhs: roundMoney(input.totalGhs),
    couponCode: input.couponCode,
    createdAt: now,
    updatedAt: now,
  };

  upsertOnlineOrder(order);
  if (status === "placed") enqueueForPos(order);
  return order;
}

export function markOnlineOrderPaid(ref: string): OnlineOrder | null {
  const o = readOnlineOrderByRef(ref);
  if (!o) return null;
  const next: OnlineOrder = {
    ...o,
    paymentStatus: "paid",
    status: "placed",
    updatedAt: new Date().toISOString(),
  };
  upsertOnlineOrder(next);
  enqueueForPos(next);
  return next;
}

export function customerStatusSteps(
  order: OnlineOrder,
): { key: OnlineOrderStatus; label: string; done: boolean; active: boolean }[] {
  const flow: OnlineOrderStatus[] =
    order.fulfillment === "delivery"
      ? [
          "placed",
          "confirmed",
          "preparing",
          "out_for_delivery",
          "completed",
        ]
      : ["placed", "confirmed", "preparing", "ready", "completed"];

  const rank = (s: OnlineOrderStatus) => {
    if (s === "cancelled" || s === "pending_payment") return -1;
    const i = flow.indexOf(s);
    return i >= 0 ? i : flow.length;
  };
  const current = rank(order.status);

  return flow.map((key, i) => ({
    key,
    label: ONLINE_STATUS_LABELS[key],
    done: current > i || order.status === "completed",
    active: order.status === key,
  }));
}

export type OnlineCheckoutDraft = {
  fulfillment: OnlineFulfillment;
  paymentMethod: OnlinePaymentMethod;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  addressId?: string;
  scheduledNote?: string;
  couponCode?: string;
  discountGhs: number;
  appliedPromotionId?: string;
};

export function readCheckoutDraft(
  restaurantSlug: string,
): OnlineCheckoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(checkoutDraftKey(restaurantSlug));
    if (!raw) return null;
    return JSON.parse(raw) as OnlineCheckoutDraft;
  } catch {
    return null;
  }
}

export function writeCheckoutDraft(
  restaurantSlug: string,
  draft: OnlineCheckoutDraft | null,
): void {
  if (typeof window === "undefined") return;
  const key = checkoutDraftKey(restaurantSlug);
  try {
    if (!draft) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    /* quota */
  }
}
