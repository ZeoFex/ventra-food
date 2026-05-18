/**
 * Guest → POS bridge: orders sync via localStorage + BroadcastChannel on one device;
 * cross-device uses Redis relay (see /api/qr-orders/* and NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN).
 */

export type QrMenuOrderStatus = "pending" | "accepted";

export type QrMenuOrder = {
  id: string;
  code: string;
  tableOrName: string;
  items: { name: string; qty: number }[];
  total: number;
  placedAt: string;
  status: QrMenuOrderStatus;
  phone?: string;
};

export const GUEST_ORDERS_QUEUE_KEY = "ventra_guest_orders_queue";

export const QR_ORDERS_BROADCAST_CHANNEL = "ventra-guest-orders-v1";

export const QR_QUEUE_EVENT = "ventra-qr-queue-updated";

/** Dev-only trace for guest ↔ POS queue (filter DevTools by `ventra-qr`) */
export function qrBridgeLog(scope: string, ...args: unknown[]): void {
  if (process.env.NODE_ENV !== "development") return;
  console.log(`[ventra-qr:${scope}]`, ...args);
}

export type GuestOrderPayload = {
  ref: string;
  table: string | null;
  items: {
    id?: string;
    name: string;
    qty: number;
    unitPrice?: number;
  }[];
  total: number;
  at: string;
};

function safeParseQueue(raw: string | null): GuestOrderPayload[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const out: GuestOrderPayload[] = [];
    for (const row of data) {
      if (typeof row !== "object" || row === null) continue;
      const o = row as Record<string, unknown>;
      if (typeof o.ref !== "string" || !o.ref.trim()) continue;
      out.push(row as GuestOrderPayload);
    }
    return out;
  } catch {
    return [];
  }
}

export function readGuestOrdersQueue(): GuestOrderPayload[] {
  if (typeof window === "undefined") return [];
  return safeParseQueue(localStorage.getItem(GUEST_ORDERS_QUEUE_KEY));
}

export function writeGuestOrdersQueue(queue: GuestOrderPayload[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_ORDERS_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* quota */
  }
}

/** One-time migration from older sessionStorage-only queue */
export function migrateSessionGuestQueueToLocal(): void {
  if (typeof window === "undefined") return;
  try {
    const hasLocal = localStorage.getItem(GUEST_ORDERS_QUEUE_KEY);
    if (hasLocal) return;
    const sessionRaw = sessionStorage.getItem(GUEST_ORDERS_QUEUE_KEY);
    if (!sessionRaw) return;
    const q = safeParseQueue(sessionRaw);
    if (q.length) writeGuestOrdersQueue(q.slice(-20));
  } catch {
    /* ignore */
  }
}

export function appendGuestOrder(payload: GuestOrderPayload): void {
  if (typeof window === "undefined") return;
  try {
    const queue = readGuestOrdersQueue();
    queue.push(payload);
    writeGuestOrdersQueue(queue.slice(-20));
    qrBridgeLog("queue", "appendGuestOrder", {
      ref: payload.ref,
      queueLengthAfter: queue.slice(-20).length,
      origin: typeof window !== "undefined" ? window.location.href : "",
    });
    notifyGuestOrderPlaced(payload.ref);
  } catch (e) {
    qrBridgeLog("queue", "appendGuestOrder FAILED", e);
  }
}

/** POS / poll path: skip duplicates when the same ref is delivered twice. */
export function appendGuestOrderIfNew(payload: GuestOrderPayload): boolean {
  if (typeof window === "undefined") return false;
  try {
    const queue = readGuestOrdersQueue();
    if (queue.some((q) => q.ref === payload.ref)) return false;
    queue.push(payload);
    writeGuestOrdersQueue(queue.slice(-20));
    qrBridgeLog("queue", "appendGuestOrderIfNew", {
      ref: payload.ref,
      queueLengthAfter: queue.slice(-20).length,
    });
    notifyGuestOrderPlaced(payload.ref);
    return true;
  } catch (e) {
    qrBridgeLog("queue", "appendGuestOrderIfNew FAILED", e);
    return false;
  }
}

export function removeGuestOrderByRef(
  ref: string,
  options?: { notify?: boolean },
): void {
  if (typeof window === "undefined") return;
  const queue = readGuestOrdersQueue().filter((q) => q.ref !== ref);
  writeGuestOrdersQueue(queue);
  if (options?.notify !== false) {
    notifyGuestOrderPlaced();
  }
}

export function notifyGuestOrderPlaced(ref?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(QR_QUEUE_EVENT, { detail: { ref } }));
  } catch {
    /* ignore */
  }
  try {
    const ch = new BroadcastChannel(QR_ORDERS_BROADCAST_CHANNEL);
    ch.postMessage({ type: "qr-guest-order", ref: ref ?? null });
    ch.close();
  } catch {
    /* ignore */
  }
}

export function formatGuestPlacedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Just now";
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString();
}

export function guestPayloadToQrMenuOrder(q: GuestOrderPayload): QrMenuOrder {
  return {
    id: `guest-${q.ref}`,
    code: q.ref,
    tableOrName: q.table?.trim()
      ? `Table ${q.table.trim()}`
      : "QR guest",
    items: (q.items ?? []).map((i) => ({
      name: i.name,
      qty: Math.max(1, i.qty ?? 1),
    })),
    total: typeof q.total === "number" ? q.total : 0,
    placedAt: formatGuestPlacedAt(q.at ?? ""),
    status: "pending",
  };
}
