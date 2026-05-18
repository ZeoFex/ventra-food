/**
 * Shared venue token for QR URLs + API. Treat like a Wi‑Fi password: long random, rotate if leaked.
 * Set NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN in Vercel for food.ventrapos.com (and locally for dev).
 */

export function getServerQrRelayToken(): string | null {
  const t =
    process.env.QR_ORDER_RELAY_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN?.trim();
  return t || null;
}

export function relayTokenFromHeaders(request: Request): string | null {
  return (
    request.headers.get("x-qr-relay-token")?.trim() ||
    request.headers.get("authorization")?.replace(/^\s*Bearer\s+/i, "").trim() ||
    null
  );
}

export function validateQrRelayRequest(request: Request): boolean {
  const expected = getServerQrRelayToken();
  if (!expected) return false;
  const got = relayTokenFromHeaders(request);
  return got !== null && got === expected;
}
