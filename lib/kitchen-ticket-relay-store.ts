/**
 * Kitchen tickets relay (Upstash Redis / Vercel KV).
 * POS pushes KOTs; kitchen boards on any browser/device poll + update status.
 */

import { Redis } from "@upstash/redis";
import type { KitchenBoardTicket, KitchenTicketStatus } from "@/lib/kitchen-board-queue";

const TICKETS_TTL_SEC = 24 * 60 * 60;
const KEY_PREFIX = "food:kitchen:tickets:";
const MAX_TICKETS = 80;

type TicketBlob = {
  tickets: KitchenBoardTicket[];
};

function redis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url?.trim() || !token?.trim()) return null;
  return new Redis({ url: url.trim(), token: token.trim() });
}

function ticketsKey(venueToken: string): string {
  const safe = venueToken.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  return `${KEY_PREFIX}${safe || "invalid"}`;
}

async function readBlob(venueToken: string): Promise<TicketBlob> {
  const client = redis();
  if (!client) return { tickets: [] };

  const raw = await client.get<string>(ticketsKey(venueToken));
  if (!raw) return { tickets: [] };

  try {
    const blob: TicketBlob =
      typeof raw === "string"
        ? (JSON.parse(raw) as TicketBlob)
        : (raw as unknown as TicketBlob);
    if (!Array.isArray(blob.tickets)) return { tickets: [] };
    return { tickets: blob.tickets };
  } catch {
    return { tickets: [] };
  }
}

async function writeBlob(venueToken: string, blob: TicketBlob): Promise<boolean> {
  const client = redis();
  if (!client) return false;
  try {
    await client.set(ticketsKey(venueToken), JSON.stringify(blob), {
      ex: TICKETS_TTL_SEC,
    });
    return true;
  } catch {
    return false;
  }
}

export function isKitchenTicketRelayBackendConfigured(): boolean {
  return redis() !== null;
}

export async function listKitchenTickets(
  venueToken: string,
): Promise<KitchenBoardTicket[]> {
  const blob = await readBlob(venueToken);
  return blob.tickets.slice(0, MAX_TICKETS);
}

export async function upsertKitchenTicket(
  venueToken: string,
  ticket: KitchenBoardTicket,
): Promise<boolean> {
  const blob = await readBlob(venueToken);
  const dedupeKey = ticket.dedupeKey ?? ticket.id;
  const exists = blob.tickets.some(
    (t) =>
      t.id === ticket.id ||
      (dedupeKey &&
        (t.dedupeKey === dedupeKey || t.id === dedupeKey)),
  );
  if (exists) return true;

  const row: KitchenBoardTicket = { ...ticket };
  delete row.dedupeKey;

  blob.tickets = [row, ...blob.tickets].slice(0, MAX_TICKETS);
  return writeBlob(venueToken, blob);
}

export async function setKitchenTicketStatus(
  venueToken: string,
  id: string,
  status: KitchenTicketStatus,
): Promise<boolean> {
  const blob = await readBlob(venueToken);
  const idx = blob.tickets.findIndex((t) => t.id === id);
  if (idx < 0) return false;
  blob.tickets[idx] = { ...blob.tickets[idx], status };
  return writeBlob(venueToken, blob);
}

export function parseKitchenTicketBody(body: unknown): KitchenBoardTicket | null {
  if (typeof body !== "object" || body === null) return null;
  const o = body as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id.trim()) return null;
  if (typeof o.table !== "string") return null;
  if (typeof o.time !== "string") return null;
  if (typeof o.station !== "string") return null;
  if (typeof o.createdAt !== "string") return null;
  if (o.source !== "qr" && o.source !== "pos") return null;
  if (!Array.isArray(o.items) || o.items.some((x) => typeof x !== "string")) {
    return null;
  }
  const status = o.status;
  if (
    status !== "new" &&
    status !== "preparing" &&
    status !== "prepared" &&
    status !== "completed"
  ) {
    return null;
  }

  return {
    id: o.id.trim(),
    table: o.table,
    time: o.time,
    items: o.items as string[],
    station: o.station,
    status,
    source: o.source,
    createdAt: o.createdAt,
    ...(typeof o.dedupeKey === "string" && o.dedupeKey.trim()
      ? { dedupeKey: o.dedupeKey.trim() }
      : {}),
  };
}
