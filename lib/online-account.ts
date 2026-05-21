/** Guest / customer session and delivery addresses (localStorage). */

export type OnlineSession = {
  name: string;
  phone: string;
  email?: string;
};

export type CustomerAddress = {
  id: string;
  label: string;
  line1: string;
  area: string;
  city: string;
  notes?: string;
  isDefault?: boolean;
};

export const ONLINE_SESSION_KEY = "ventra_online_session_v1";
export const ONLINE_ADDRESSES_KEY = "ventra_online_addresses_v1";

const DEFAULT_ADDRESSES: CustomerAddress[] = [
  {
    id: "addr-home",
    label: "Home",
    line1: "14 Ring Road Central",
    area: "Osu",
    city: "Accra",
    notes: "Gate code 4421",
    isDefault: true,
  },
];

export function readSession(): OnlineSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONLINE_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as OnlineSession;
    if (!o.name?.trim() || !o.phone?.trim()) return null;
    return o;
  } catch {
    return null;
  }
}

export function writeSession(session: OnlineSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!session) {
      localStorage.removeItem(ONLINE_SESSION_KEY);
      return;
    }
    localStorage.setItem(ONLINE_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* quota */
  }
}

export function readAddresses(): CustomerAddress[] {
  if (typeof window === "undefined") return DEFAULT_ADDRESSES;
  try {
    const raw = localStorage.getItem(ONLINE_ADDRESSES_KEY);
    if (!raw) {
      localStorage.setItem(
        ONLINE_ADDRESSES_KEY,
        JSON.stringify(DEFAULT_ADDRESSES),
      );
      return DEFAULT_ADDRESSES;
    }
    const data = JSON.parse(raw) as CustomerAddress[];
    return Array.isArray(data) && data.length > 0 ? data : DEFAULT_ADDRESSES;
  } catch {
    return DEFAULT_ADDRESSES;
  }
}

export function writeAddresses(list: CustomerAddress[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONLINE_ADDRESSES_KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

export function newAddressId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `addr-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `addr-${Date.now().toString(36)}`;
}

export function formatAddressOneLine(a: CustomerAddress): string {
  return `${a.line1}, ${a.area}, ${a.city}`;
}
