import type {
  KitchenBoardTicket,
  KitchenTicketStatus,
} from "@/lib/kitchen-board-queue";

/** Same token as QR relay unless KITCHEN_RELAY_TOKEN is set. */
export function getClientKitchenRelayToken(): string | null {
  const kitchen = process.env.NEXT_PUBLIC_KITCHEN_RELAY_TOKEN?.trim();
  if (kitchen) return kitchen;
  const qr = process.env.NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN?.trim();
  return qr || null;
}

export function isKitchenRelayClientConfigured(): boolean {
  return getClientKitchenRelayToken() !== null;
}

function relayHeaders(): HeadersInit | null {
  const token = getClientKitchenRelayToken();
  if (!token) return null;
  return {
    "Content-Type": "application/json",
    "x-qr-relay-token": token,
  };
}

export async function fetchKitchenTicketsFromRelay(): Promise<
  KitchenBoardTicket[] | null
> {
  const headers = relayHeaders();
  if (!headers) return null;
  try {
    const res = await fetch("/api/kitchen-tickets", { headers });
    if (!res.ok) return null;
    const data = (await res.json()) as { tickets?: KitchenBoardTicket[] };
    return Array.isArray(data.tickets) ? data.tickets : [];
  } catch {
    return null;
  }
}

export async function pushKitchenTicketToRelay(
  ticket: KitchenBoardTicket,
): Promise<boolean> {
  const headers = relayHeaders();
  if (!headers) return false;
  try {
    const res = await fetch("/api/kitchen-tickets", {
      method: "POST",
      headers,
      body: JSON.stringify(ticket),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function patchKitchenTicketStatusOnRelay(
  id: string,
  status: KitchenTicketStatus,
): Promise<boolean> {
  const headers = relayHeaders();
  if (!headers) return false;
  try {
    const res = await fetch("/api/kitchen-tickets/status", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
