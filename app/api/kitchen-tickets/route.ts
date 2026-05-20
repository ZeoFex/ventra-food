import { NextResponse } from "next/server";
import {
  relayTokenFromHeaders,
  validateQrRelayRequest,
} from "@/lib/qr-order-relay-auth";
import {
  isKitchenTicketRelayBackendConfigured,
  listKitchenTickets,
  parseKitchenTicketBody,
  upsertKitchenTicket,
} from "@/lib/kitchen-ticket-relay-store";

export async function GET(req: Request) {
  if (!validateQrRelayRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isKitchenTicketRelayBackendConfigured()) {
    return NextResponse.json({ tickets: [] as const });
  }

  const token = relayTokenFromHeaders(req);
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const tickets = await listKitchenTickets(token);
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
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

  const ticket = parseKitchenTicketBody(json);
  if (!ticket) {
    return NextResponse.json({ error: "Invalid ticket" }, { status: 400 });
  }

  const ok = await upsertKitchenTicket(token, ticket);
  if (!ok) {
    return NextResponse.json({ error: "Failed to save ticket" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: ticket.id });
}
