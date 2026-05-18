import { NextResponse } from "next/server";
import {
  relayTokenFromHeaders,
  validateQrRelayRequest,
} from "@/lib/qr-order-relay-auth";
import type { GuestOrderPayload } from "@/lib/qr-guest-orders";
import {
  isQrOrderRelayBackendConfigured,
  pushGuestOrder,
} from "@/lib/qr-order-relay-store";

function parsePayload(body: unknown): GuestOrderPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const o = body as Record<string, unknown>;
  if (typeof o.ref !== "string" || !o.ref.trim()) return null;
  const items = o.items;
  if (!Array.isArray(items) || items.length === 0) return null;
  for (const row of items) {
    if (typeof row !== "object" || row === null) return null;
    const it = row as Record<string, unknown>;
    if (typeof it.name !== "string" || !it.name.trim()) return null;
    if (typeof it.qty !== "number" || it.qty < 1) return null;
  }
  const total = typeof o.total === "number" ? o.total : Number.NaN;
  if (!Number.isFinite(total)) return null;
  const at = typeof o.at === "string" ? o.at : new Date().toISOString();
  const table =
    o.table === null
      ? null
      : typeof o.table === "string"
        ? o.table
        : null;
  return {
    ref: o.ref.trim(),
    table,
    items: items as GuestOrderPayload["items"],
    total,
    at,
  };
}

export async function POST(req: Request) {
  if (!validateQrRelayRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isQrOrderRelayBackendConfigured()) {
    return NextResponse.json(
      { error: "Relay not configured (KV_REST_API_URL / KV_REST_API_TOKEN)" },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = parsePayload(json);
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const token = relayTokenFromHeaders(req);
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const ok = await pushGuestOrder(token, payload);
  if (!ok) {
    return NextResponse.json({ error: "Failed to queue order" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ref: payload.ref });
}
