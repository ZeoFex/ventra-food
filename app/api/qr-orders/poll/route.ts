import { NextResponse } from "next/server";
import {
  relayTokenFromHeaders,
  validateQrRelayRequest,
} from "@/lib/qr-order-relay-auth";
import {
  isQrOrderRelayBackendConfigured,
  pollGuestOrders,
} from "@/lib/qr-order-relay-store";

export async function GET(req: Request) {
  if (!validateQrRelayRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isQrOrderRelayBackendConfigured()) {
    return NextResponse.json({ orders: [] as const });
  }

  const token = relayTokenFromHeaders(req);
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const orders = await pollGuestOrders(token);
  return NextResponse.json({ orders });
}
