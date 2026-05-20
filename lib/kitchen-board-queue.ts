/**
 * Kitchen board queue: localStorage + BroadcastChannel (same-browser instant updates).
 * When KV + NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN are set, tickets also sync via Redis relay
 * (/api/kitchen-tickets) so POS and KLD can use different browsers/devices.
 */

import {
  patchKitchenTicketStatusOnRelay,
  pushKitchenTicketToRelay,
} from "@/lib/kitchen-ticket-relay-client";

import type { QrMenuOrder } from "@/lib/qr-guest-orders";

export const KITCHEN_TICKETS_KEY = "ventra_kitchen_tickets_v1";

export const KITCHEN_BOARD_CHANNEL = "ventra-kitchen-board-v1";

export const KITCHEN_BOARD_EVENT = "ventra-kitchen-board-updated";

export type KitchenTicketStatus =
  | "new"
  | "preparing"
  | "prepared"
  | "completed";

export const KITCHEN_STATUS_FLOW: KitchenTicketStatus[] = [
  "new",
  "preparing",
  "prepared",
  "completed",
];

export function nextKitchenStatus(
  s: KitchenTicketStatus,
): KitchenTicketStatus | null {
  const i = KITCHEN_STATUS_FLOW.indexOf(s);
  if (i < 0 || i >= KITCHEN_STATUS_FLOW.length - 1) return null;
  return KITCHEN_STATUS_FLOW[i + 1] ?? null;
}

export function kitchenStatusLabel(s: KitchenTicketStatus): string {
  switch (s) {
    case "new":
      return "New order";
    case "preparing":
      return "Preparing";
    case "prepared":
      return "Ready";
    case "completed":
      return "Completed";
    default:
      return s;
  }
}

export function kitchenAdvanceButtonLabel(
  next: KitchenTicketStatus,
): string {
  switch (next) {
    case "preparing":
      return "Start preparing";
    case "prepared":
      return "Mark prepared (ready for pickup)";
    case "completed":
      return "Mark served / done";
    default:
      return "Next";
  }
}

export type KitchenBoardTicket = {
  id: string;
  table: string;
  time: string;
  items: string[];
  station: string;
  status: KitchenTicketStatus;
  source: "qr" | "pos";
  createdAt: string;
  /** In-memory dedupe; stripped before persist if needed */
  dedupeKey?: string;
};

const MAX_TICKETS = 80;

function migrateTicketStatus(raw: unknown): KitchenTicketStatus {
  if (raw === "fired") return "preparing";
  if (
    raw === "new" ||
    raw === "preparing" ||
    raw === "prepared" ||
    raw === "completed"
  ) {
    return raw;
  }
  return "new";
}

function parseTickets(raw: string | null): KitchenBoardTicket[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const out: KitchenBoardTicket[] = [];
    for (const row of data) {
      if (typeof row !== "object" || row === null) continue;
      const o = row as Record<string, unknown>;
      if (typeof o.id !== "string") continue;
      out.push({
        ...(row as KitchenBoardTicket),
        status: migrateTicketStatus(o.status),
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function readKitchenTickets(): KitchenBoardTicket[] {
  if (typeof window === "undefined") return [];
  return parseTickets(localStorage.getItem(KITCHEN_TICKETS_KEY));
}

function writeKitchenTickets(tickets: KitchenBoardTicket[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      KITCHEN_TICKETS_KEY,
      JSON.stringify(tickets.slice(0, MAX_TICKETS)),
    );
  } catch {
    /* quota */
  }
}

/** Replace local queue (e.g. after polling Redis). */
export function replaceKitchenTickets(tickets: KitchenBoardTicket[]): void {
  writeKitchenTickets(tickets);
  notifyKitchenBoardUpdated();
}

export function notifyKitchenBoardUpdated(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(KITCHEN_BOARD_EVENT));
  } catch {
    /* ignore */
  }
  try {
    const ch = new BroadcastChannel(KITCHEN_BOARD_CHANNEL);
    ch.postMessage({ type: "kitchen-update" });
    ch.close();
  } catch {
    /* ignore */
  }
}

export type AppendKitchenTicketOptions = {
  /** Skip append if a ticket with this key is already in the queue */
  dedupeKey?: string;
};

export function appendKitchenTicket(
  ticket: KitchenBoardTicket,
  options?: AppendKitchenTicketOptions,
): boolean {
  if (typeof window === "undefined") return false;
  const dedupeKey = options?.dedupeKey ?? ticket.dedupeKey;
  let list = readKitchenTickets();

  if (dedupeKey) {
    const exists = list.some(
      (t) =>
        (t.dedupeKey != null && t.dedupeKey === dedupeKey) || t.id === dedupeKey,
    );
    if (exists) return false;
  }

  const row: KitchenBoardTicket = {
    ...ticket,
    ...(dedupeKey ? { dedupeKey } : {}),
  };
  list = [row, ...list].slice(0, MAX_TICKETS);
  writeKitchenTickets(list);
  notifyKitchenBoardUpdated();
  void pushKitchenTicketToRelay(row);
  return true;
}

export function updateKitchenTicketStatus(
  id: string,
  status: KitchenTicketStatus,
): void {
  if (typeof window === "undefined") return;
  const list = readKitchenTickets().map((t) =>
    t.id === id ? { ...t, status } : t,
  );
  writeKitchenTickets(list);
  notifyKitchenBoardUpdated();
  void patchKitchenTicketStatusOnRelay(id, status);
}

/** Called when a guest QR order is merged into the POS cart — kitchen sees it immediately. */
export function pushKitchenTicketForQrOrder(order: QrMenuOrder): boolean {
  const dedupeKey = `qr-order-${order.code}`;
  const table =
    order.tableOrName === "QR guest" ? "Walk-up QR" : order.tableOrName;
  const items = order.items.map(
    (i) => `${Math.max(1, i.qty)}× ${i.name}`,
  );
  return appendKitchenTicket(
    {
      id: `KOT-QR-${order.code}`,
      table,
      time: formatKitchenTime(new Date()),
      items,
      station: "QR menu → kitchen",
      status: "new",
      source: "qr",
      createdAt: new Date().toISOString(),
      dedupeKey,
    },
    { dedupeKey },
  );
}

export function formatKitchenTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
