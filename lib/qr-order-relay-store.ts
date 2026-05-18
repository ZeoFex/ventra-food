/**
 * Phone → POS relay for QR guest orders (Upstash Redis / Vercel KV).
 * Same pattern as ventrapos barcode relay: push from guest device, poll from staff POS.
 */

import { Redis } from "@upstash/redis";
import type { GuestOrderPayload } from "@/lib/qr-guest-orders";

const QUEUE_TTL_SEC = 24 * 60 * 60;
const KEY_PREFIX = "food:qr:guest:";

type QueuedRow = {
  id: string;
  consumed: boolean;
  payload: GuestOrderPayload;
};

type QueueBlob = {
  orders: QueuedRow[];
};

function redis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url?.trim() || !token?.trim()) return null;
  return new Redis({ url: url.trim(), token: token.trim() });
}

function queueKey(venueToken: string): string {
  const safe = venueToken.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  return `${KEY_PREFIX}${safe || "invalid"}`;
}

export function isQrOrderRelayBackendConfigured(): boolean {
  return redis() !== null;
}

export async function pushGuestOrder(
  venueToken: string,
  payload: GuestOrderPayload,
): Promise<boolean> {
  const client = redis();
  if (!client) return false;

  const key = queueKey(venueToken);
  const raw = await client.get<string>(key);
  const blob: QueueBlob =
    typeof raw === "string"
      ? (JSON.parse(raw) as QueueBlob)
      : raw != null
        ? (raw as unknown as QueueBlob)
        : { orders: [] };

  if (!Array.isArray(blob.orders)) blob.orders = [];

  const id = crypto.randomUUID();
  blob.orders.push({
    id,
    consumed: false,
    payload,
  });

  const trimmed = blob.orders.slice(-40);
  await client.set(key, JSON.stringify({ orders: trimmed }), {
    ex: QUEUE_TTL_SEC,
  });
  return true;
}

export async function pollGuestOrders(
  venueToken: string,
): Promise<GuestOrderPayload[]> {
  const client = redis();
  if (!client) return [];

  const key = queueKey(venueToken);
  const raw = await client.get<string>(key);
  if (!raw) return [];

  const blob: QueueBlob =
    typeof raw === "string"
      ? (JSON.parse(raw) as QueueBlob)
      : (raw as unknown as QueueBlob);

  if (!blob.orders?.length) return [];

  const out: GuestOrderPayload[] = [];
  let changed = false;
  for (const row of blob.orders) {
    if (!row.consumed && row.payload) {
      row.consumed = true;
      changed = true;
      out.push(row.payload);
    }
  }

  if (changed) {
    await client.set(key, JSON.stringify(blob), { ex: QUEUE_TTL_SEC });
  }

  return out;
}
