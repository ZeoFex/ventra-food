/**
 * Staff shift cash reconciliation.
 *
 * Drawer math (cash only):
 *   expected = openingFloat + cashSales + cashPayIns − cashPayOuts
 *   variance = countedAtClose − expected   (+ over, − short)
 *
 * Total sales (all tender types, for reporting — not all in drawer):
 *   total = cash + card + momo + credit
 */

import { roundMoney } from "@/lib/pos-catalog";

export const STAFF_SHIFTS_STORAGE_KEY = "ventra_staff_shifts_v1";

/** Within 2 pesewas counts as balanced. */
export const SHIFT_BALANCE_TOLERANCE_GHS = 0.02;

export type StaffShiftStatus = "open" | "closed";

export type StaffShift = {
  id: string;
  staffId: string;
  status: StaffShiftStatus;
  startedAt: string;
  endedAt?: string;
  /** Opening float in the cash drawer (GHS). */
  openingCashGhs: number;
  cashSalesGhs: number;
  cardSalesGhs: number;
  momoSalesGhs: number;
  /** Pay-later / house credit — not physical cash in drawer. */
  creditSalesGhs: number;
  /** Cash removed from drawer (petty cash, supplier, etc.). */
  cashPayOutsGhs: number;
  /** Cash added to drawer (change fund top-up). */
  cashPayInsGhs: number;
  /** Physical cash count when shift closed. */
  closingCountedCashGhs?: number;
  notes?: string;
};

export type ShiftReconciliation = {
  openingCashGhs: number;
  cashSalesGhs: number;
  cashPayInsGhs: number;
  cashPayOutsGhs: number;
  expectedCashInDrawerGhs: number;
  closingCountedCashGhs: number | null;
  varianceGhs: number | null;
  varianceLabel: "balanced" | "over" | "short" | "pending";
  totalSalesGhs: number;
  cardSalesGhs: number;
  momoSalesGhs: number;
  creditSalesGhs: number;
  nonCashSalesGhs: number;
};

export function newShiftId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `shift-${Date.now().toString(36)}`;
}

function money(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return roundMoney(Math.max(0, n));
}

export function reconcileShift(shift: StaffShift): ShiftReconciliation {
  const openingCashGhs = money(shift.openingCashGhs);
  const cashSalesGhs = money(shift.cashSalesGhs);
  const cashPayInsGhs = money(shift.cashPayInsGhs);
  const cashPayOutsGhs = money(shift.cashPayOutsGhs);
  const cardSalesGhs = money(shift.cardSalesGhs);
  const momoSalesGhs = money(shift.momoSalesGhs);
  const creditSalesGhs = money(shift.creditSalesGhs);

  const expectedCashInDrawerGhs = roundMoney(
    openingCashGhs + cashSalesGhs + cashPayInsGhs - cashPayOutsGhs,
  );

  const totalSalesGhs = roundMoney(
    cashSalesGhs + cardSalesGhs + momoSalesGhs + creditSalesGhs,
  );
  const nonCashSalesGhs = roundMoney(
    cardSalesGhs + momoSalesGhs + creditSalesGhs,
  );

  const closingCountedCashGhs =
    shift.status === "closed" && shift.closingCountedCashGhs != null
      ? money(shift.closingCountedCashGhs)
      : null;

  let varianceGhs: number | null = null;
  let varianceLabel: ShiftReconciliation["varianceLabel"] = "pending";

  if (closingCountedCashGhs != null) {
    varianceGhs = roundMoney(closingCountedCashGhs - expectedCashInDrawerGhs);
    if (Math.abs(varianceGhs) <= SHIFT_BALANCE_TOLERANCE_GHS) {
      varianceLabel = "balanced";
    } else if (varianceGhs > 0) {
      varianceLabel = "over";
    } else {
      varianceLabel = "short";
    }
  }

  return {
    openingCashGhs,
    cashSalesGhs,
    cashPayInsGhs,
    cashPayOutsGhs,
    expectedCashInDrawerGhs,
    closingCountedCashGhs,
    varianceGhs,
    varianceLabel,
    totalSalesGhs,
    cardSalesGhs,
    momoSalesGhs,
    creditSalesGhs,
    nonCashSalesGhs,
  };
}

export function formatShiftWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatShiftDuration(
  startedAt: string,
  endedAt?: string,
): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "—";
  const mins = Math.floor((end - start) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m} min`;
  return `${h}h ${m}m`;
}

function normalizeShift(row: unknown): StaffShift | null {
  if (typeof row !== "object" || row === null) return null;
  const o = row as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.staffId !== "string") return null;
  if (typeof o.startedAt !== "string") return null;
  const status = o.status === "open" ? "open" : "closed";
  const num = (k: string) => {
    const v = o[k];
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  };
  const closing =
    typeof o.closingCountedCashGhs === "number" &&
    Number.isFinite(o.closingCountedCashGhs)
      ? o.closingCountedCashGhs
      : undefined;
  const notes =
    typeof o.notes === "string" && o.notes.trim() ? o.notes.trim() : undefined;
  const endedAt =
    typeof o.endedAt === "string" && o.endedAt ? o.endedAt : undefined;
  return {
    id: o.id,
    staffId: o.staffId,
    status,
    startedAt: o.startedAt,
    endedAt,
    openingCashGhs: num("openingCashGhs"),
    cashSalesGhs: num("cashSalesGhs"),
    cardSalesGhs: num("cardSalesGhs"),
    momoSalesGhs: num("momoSalesGhs"),
    creditSalesGhs: num("creditSalesGhs"),
    cashPayOutsGhs: num("cashPayOutsGhs"),
    cashPayInsGhs: num("cashPayInsGhs"),
    closingCountedCashGhs: closing,
    notes,
  };
}

export function loadShiftsFromStorage(): StaffShift[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STAFF_SHIFTS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    return data.map(normalizeShift).filter(Boolean) as StaffShift[];
  } catch {
    return null;
  }
}

/** Demo closed shifts — balanced and one short example for STF-001. */
export function defaultStaffShifts(): StaffShift[] {
  const day = (daysAgo: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  return [
    {
      id: "shift-seed-1",
      staffId: "staff-seed-1",
      status: "closed",
      startedAt: day(1, 9),
      endedAt: day(1, 17),
      openingCashGhs: 200,
      cashSalesGhs: 840.5,
      cardSalesGhs: 1240,
      momoSalesGhs: 680,
      creditSalesGhs: 120,
      cashPayOutsGhs: 50,
      cashPayInsGhs: 0,
      closingCountedCashGhs: 990.5,
      notes: "Balanced close — lunch rush.",
    },
    {
      id: "shift-seed-2",
      staffId: "staff-seed-1",
      status: "closed",
      startedAt: day(3, 10),
      endedAt: day(3, 18),
      openingCashGhs: 150,
      cashSalesGhs: 512,
      cardSalesGhs: 890,
      momoSalesGhs: 420,
      creditSalesGhs: 0,
      cashPayOutsGhs: 12,
      cashPayInsGhs: 0,
      closingCountedCashGhs: 645,
      notes: "Short ₵5 — documented with supervisor.",
    },
  ];
}

export function parseMoneyInput(raw: string): number | null {
  const t = raw.trim().replace(/,/g, "");
  if (!t) return null;
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return roundMoney(n);
}
