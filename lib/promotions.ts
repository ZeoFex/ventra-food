/** Coupons & discounts — localStorage until API. */

import { roundMoney } from "@/lib/pos-catalog";

export type PromotionKind = "percentage" | "fixed";

export type Promotion = {
  id: string;
  /** Coupon code entered at POS (e.g. WELCOME10) */
  code: string;
  name: string;
  description?: string;
  kind: PromotionKind;
  /** Percentage 0–100 or fixed amount in GHS */
  value: number;
  active: boolean;
  minOrderGhs?: number;
  /** Cap discount for percentage promos */
  maxDiscountGhs?: number;
  usageLimit?: number;
  usedCount: number;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
};

export const PROMOTIONS_STORAGE_KEY = "ventra_promotions_v1";

export function normalizePromotionCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function newPromotionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `promo-${Date.now().toString(36)}`;
}

export function promotionKindLabel(kind: PromotionKind): string {
  return kind === "percentage" ? "Percentage off" : "Fixed amount off";
}

export function formatPromotionValue(promo: Promotion): string {
  if (promo.kind === "percentage") {
    return `${promo.value}%`;
  }
  return `₵${promo.value}`;
}

export function computePromotionDiscount(
  promo: Promotion,
  subtotal: number,
): number {
  const sub = roundMoney(subtotal);
  if (sub <= 0) return 0;

  let amount = 0;
  if (promo.kind === "percentage") {
    amount = sub * (promo.value / 100);
    if (
      promo.maxDiscountGhs != null &&
      Number.isFinite(promo.maxDiscountGhs) &&
      promo.maxDiscountGhs > 0
    ) {
      amount = Math.min(amount, promo.maxDiscountGhs);
    }
  } else {
    amount = promo.value;
  }

  return roundMoney(Math.min(Math.max(0, amount), sub));
}

export type ValidatePromotionResult =
  | { ok: true; discountGhs: number }
  | { ok: false; error: string };

export function validatePromotionForOrder(
  promo: Promotion,
  subtotal: number,
  now: Date = new Date(),
): ValidatePromotionResult {
  if (!promo.active) {
    return { ok: false, error: "This coupon is inactive." };
  }

  if (promo.startsAt) {
    const start = new Date(promo.startsAt);
    if (!Number.isNaN(start.getTime()) && now < start) {
      return { ok: false, error: "This coupon is not valid yet." };
    }
  }

  if (promo.endsAt) {
    const end = new Date(promo.endsAt);
    if (!Number.isNaN(end.getTime()) && now > end) {
      return { ok: false, error: "This coupon has expired." };
    }
  }

  const sub = roundMoney(subtotal);
  if (
    promo.minOrderGhs != null &&
    Number.isFinite(promo.minOrderGhs) &&
    sub < promo.minOrderGhs
  ) {
    return {
      ok: false,
      error: `Minimum order is ₵${promo.minOrderGhs.toFixed(2)}.`,
    };
  }

  if (
    promo.usageLimit != null &&
    Number.isFinite(promo.usageLimit) &&
    promo.usageLimit > 0 &&
    promo.usedCount >= promo.usageLimit
  ) {
    return { ok: false, error: "This coupon has reached its usage limit." };
  }

  if (!Number.isFinite(promo.value) || promo.value <= 0) {
    return { ok: false, error: "Coupon is misconfigured." };
  }

  if (promo.kind === "percentage" && promo.value > 100) {
    return { ok: false, error: "Percentage cannot exceed 100%." };
  }

  const discountGhs = computePromotionDiscount(promo, sub);
  if (discountGhs <= 0) {
    return { ok: false, error: "No discount applies to this order." };
  }

  return { ok: true, discountGhs };
}

export const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: "promo-seed-welcome",
    code: "WELCOME10",
    name: "Welcome 10% off",
    description: "10% off orders of ₵50 or more (max ₵25 discount).",
    kind: "percentage",
    value: 10,
    active: true,
    minOrderGhs: 50,
    maxDiscountGhs: 25,
    usedCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "promo-seed-save5",
    code: "SAVE5",
    name: "₵5 off",
    description: "Flat ₵5 off any order.",
    kind: "fixed",
    value: 5,
    active: true,
    usedCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "promo-seed-lunch",
    code: "LUNCH15",
    name: "Lunch special",
    description: "15% off weekday lunch (demo — no date window).",
    kind: "percentage",
    value: 15,
    active: true,
    maxDiscountGhs: 40,
    usedCount: 0,
    createdAt: new Date().toISOString(),
  },
];

function normalizePromotion(row: unknown): Promotion | null {
  if (typeof row !== "object" || row === null) return null;
  const o = row as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.code !== "string") return null;
  if (typeof o.name !== "string") return null;
  const kind = o.kind === "fixed" ? "fixed" : o.kind === "percentage" ? "percentage" : null;
  if (!kind) return null;
  const value = Number(o.value);
  if (!Number.isFinite(value) || value <= 0) return null;

  const description =
    typeof o.description === "string" && o.description.trim()
      ? o.description.trim()
      : undefined;
  const active = o.active === false ? false : true;
  const minOrderGhs =
    o.minOrderGhs != null && Number.isFinite(Number(o.minOrderGhs))
      ? roundMoney(Number(o.minOrderGhs))
      : undefined;
  const maxDiscountGhs =
    o.maxDiscountGhs != null && Number.isFinite(Number(o.maxDiscountGhs))
      ? roundMoney(Number(o.maxDiscountGhs))
      : undefined;
  const usageLimit =
    o.usageLimit != null && Number.isFinite(Number(o.usageLimit))
      ? Math.max(0, Math.floor(Number(o.usageLimit)))
      : undefined;
  const usedCount =
    o.usedCount != null && Number.isFinite(Number(o.usedCount))
      ? Math.max(0, Math.floor(Number(o.usedCount)))
      : 0;
  const startsAt =
    typeof o.startsAt === "string" && o.startsAt.trim() ? o.startsAt : undefined;
  const endsAt =
    typeof o.endsAt === "string" && o.endsAt.trim() ? o.endsAt : undefined;
  const createdAt =
    typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString();

  return {
    id: o.id,
    code: normalizePromotionCode(o.code),
    name: o.name.trim(),
    description,
    kind,
    value: kind === "percentage" ? Math.min(100, value) : roundMoney(value),
    active,
    minOrderGhs,
    maxDiscountGhs,
    usageLimit: usageLimit && usageLimit > 0 ? usageLimit : undefined,
    usedCount,
    startsAt,
    endsAt,
    createdAt,
  };
}

export function loadPromotionsFromStorage(): Promotion[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROMOTIONS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    const out = data.map(normalizePromotion).filter(Boolean) as Promotion[];
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}
