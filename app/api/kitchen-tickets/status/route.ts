import { NextResponse } from "next/server";
import type { KitchenTicketStatus } from "@/lib/kitchen-board-queue";
import {
  relayTokenFromHeaders,
  validateQrRelayRequest,
} from "@/lib/qr-order-relay-auth";
import {
  isKitchenTicketRelayBackendConfigured,
  setKitchenTicketStatus,
} from "@/lib/kitchen-ticket-relay-store";

function parseStatusBody(body: unknown): { id: string; status: KitchenTicketStatus } | null {
  if (typeof body !== "object" || body === null) return null;
  const o = body as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id.trim()) return null;
  const status = o.status;
  if (
    status !== "new" &&
    status !== "preparing" &&
    status !== "prepared" &&
    status !== "completed"
  ) {
    return null;
  }
  return { id: o.id.trim(), status };
}

export async function PATCH(req: Request) {
  if (!validateQrRelayRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isKitchenTicketRelayBackendConfigured()) {
    return NextResponse.json(
      { error: "Relay not configured (KV_REST_API_URL / KV_REST_API_TOKEN)" },
      { status: 503 },
    );
  }

  const token = relayTokenFromHeaders(req);
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseStatusBody(json);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const ok = await setKitchenTicketStatus(token, parsed.id, parsed.status);
  if (!ok) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
