/** Finance ledger — sales, expenses, refunds (localStorage until API). */

import { roundMoney } from "@/lib/pos-catalog";

export type FinancePayMethod = "cash" | "card" | "momo" | "due";

export type LedgerEntryKind = "sale" | "expense" | "refund";

export type ExpenseCategory =
  | "supplies"
  | "payroll"
  | "utilities"
  | "rent"
  | "marketing"
  | "other";

export type FinanceLedgerEntry = {
  id: string;
  kind: LedgerEntryKind;
  /** Positive amount in GHS (expenses stored as positive, summed separately). */
  amountGhs: number;
  createdAt: string;
  note?: string;
  /** POS sale */
  orderRef?: string;
  subtotalGhs?: number;
  discountGhs?: number;
  method?: FinancePayMethod;
  channel?: string;
  itemCount?: number;
  staffName?: string;
  staffId?: string;
  shiftId?: string;
  couponCode?: string;
  /** Expense */
  category?: ExpenseCategory;
  vendor?: string;
};

export const FINANCE_LEDGER_STORAGE_KEY = "ventra_finance_ledger_v1";

export type FinanceDateRange = "today" | "7d" | "30d" | "all";

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: "supplies", label: "Supplies & inventory" },
  { id: "payroll", label: "Payroll" },
  { id: "utilities", label: "Utilities" },
  { id: "rent", label: "Rent" },
  { id: "marketing", label: "Marketing" },
  { id: "other", label: "Other" },
];

export function expenseCategoryLabel(id: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? "Other";
}

export function payMethodLabel(m: FinancePayMethod): string {
  switch (m) {
    case "momo":
      return "MoMo";
    case "due":
      return "On account";
    default:
      return m.charAt(0).toUpperCase() + m.slice(1);
  }
}

export function newLedgerEntryId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

export function startOfRange(range: FinanceDateRange, now = new Date()): Date | null {
  if (range === "all") return null;
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (range === "7d") {
    d.setDate(d.getDate() - 6);
    return d;
  }
  if (range === "30d") {
    d.setDate(d.getDate() - 29);
    return d;
  }
  return d;
}

export function filterEntriesByRange(
  entries: FinanceLedgerEntry[],
  range: FinanceDateRange,
  now = new Date(),
): FinanceLedgerEntry[] {
  const start = startOfRange(range, now);
  if (!start) return [...entries];
  const t0 = start.getTime();
  return entries.filter((e) => {
    const t = new Date(e.createdAt).getTime();
    return !Number.isNaN(t) && t >= t0;
  });
}

export type FinanceSummary = {
  revenueGhs: number;
  expensesGhs: number;
  refundsGhs: number;
  netGhs: number;
  saleCount: number;
  expenseCount: number;
  byMethod: Record<FinancePayMethod, number>;
};

export function summarizeLedger(entries: FinanceLedgerEntry[]): FinanceSummary {
  const byMethod: Record<FinancePayMethod, number> = {
    cash: 0,
    card: 0,
    momo: 0,
    due: 0,
  };

  let revenueGhs = 0;
  let expensesGhs = 0;
  let refundsGhs = 0;
  let saleCount = 0;
  let expenseCount = 0;

  for (const e of entries) {
    const amt = roundMoney(e.amountGhs);
    if (e.kind === "sale") {
      revenueGhs += amt;
      saleCount += 1;
      if (e.method) byMethod[e.method] += amt;
    } else if (e.kind === "expense") {
      expensesGhs += amt;
      expenseCount += 1;
    } else if (e.kind === "refund") {
      refundsGhs += amt;
    }
  }

  const netGhs = roundMoney(revenueGhs - expensesGhs - refundsGhs);

  return {
    revenueGhs: roundMoney(revenueGhs),
    expensesGhs: roundMoney(expensesGhs),
    refundsGhs: roundMoney(refundsGhs),
    netGhs,
    saleCount,
    expenseCount,
    byMethod: {
      cash: roundMoney(byMethod.cash),
      card: roundMoney(byMethod.card),
      momo: roundMoney(byMethod.momo),
      due: roundMoney(byMethod.due),
    },
  };
}

export type RecordSaleInput = {
  orderNumber: number | string;
  subtotalGhs: number;
  discountGhs: number;
  totalGhs: number;
  method: FinancePayMethod;
  channel: string;
  itemCount: number;
  staffName?: string;
  staffId?: string;
  shiftId?: string;
  couponCode?: string;
};

export type ShiftSalesTotals = {
  cashGhs: number;
  cardGhs: number;
  momoGhs: number;
  creditGhs: number;
  saleCount: number;
};

export function formatMoneyFieldValue(n: number): string {
  const r = roundMoney(Number.isFinite(n) ? n : 0);
  return Number.isInteger(r) ? String(r) : String(r);
}

/** Sum POS sales for shift close — matches shiftId when present, else staff + time window. */
export function summarizeShiftSales(
  entries: FinanceLedgerEntry[],
  filter: {
    shiftId?: string;
    staffId?: string;
    staffName?: string;
    startedAt: string;
    endedAt?: string;
  },
): ShiftSalesTotals {
  const empty: ShiftSalesTotals = {
    cashGhs: 0,
    cardGhs: 0,
    momoGhs: 0,
    creditGhs: 0,
    saleCount: 0,
  };

  const startMs = new Date(filter.startedAt).getTime();
  const endMs = filter.endedAt
    ? new Date(filter.endedAt).getTime()
    : Date.now();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return empty;

  let cashGhs = 0;
  let cardGhs = 0;
  let momoGhs = 0;
  let creditGhs = 0;
  let saleCount = 0;

  const nameKey = filter.staffName?.trim().toLowerCase();

  for (const e of entries) {
    if (e.kind !== "sale" || !e.method) continue;

    const t = new Date(e.createdAt).getTime();
    if (Number.isNaN(t) || t < startMs || t > endMs) continue;

    let matches = false;
    if (e.shiftId && filter.shiftId) {
      matches = e.shiftId === filter.shiftId;
    } else if (e.shiftId && !filter.shiftId) {
      matches = false;
    } else {
      if (filter.staffId && e.staffId === filter.staffId) matches = true;
      else if (
        nameKey &&
        e.staffName?.trim().toLowerCase() === nameKey
      ) {
        matches = true;
      }
    }

    if (!matches) continue;

    const amt = roundMoney(e.amountGhs);
    saleCount += 1;
    switch (e.method) {
      case "cash":
        cashGhs += amt;
        break;
      case "card":
        cardGhs += amt;
        break;
      case "momo":
        momoGhs += amt;
        break;
      case "due":
        creditGhs += amt;
        break;
      default:
        break;
    }
  }

  return {
    cashGhs: roundMoney(cashGhs),
    cardGhs: roundMoney(cardGhs),
    momoGhs: roundMoney(momoGhs),
    creditGhs: roundMoney(creditGhs),
    saleCount,
  };
}

export function buildSaleEntry(input: RecordSaleInput): FinanceLedgerEntry {
  return {
    id: newLedgerEntryId("sale"),
    kind: "sale",
    amountGhs: roundMoney(input.totalGhs),
    createdAt: new Date().toISOString(),
    orderRef: `#${input.orderNumber}`,
    subtotalGhs: roundMoney(input.subtotalGhs),
    discountGhs: roundMoney(input.discountGhs),
    method: input.method,
    channel: input.channel,
    itemCount: input.itemCount,
    staffName: input.staffName?.trim() || undefined,
    staffId: input.staffId?.trim() || undefined,
    shiftId: input.shiftId?.trim() || undefined,
    couponCode: input.couponCode?.trim() || undefined,
  };
}

const now = new Date();
const hoursAgo = (h: number) =>
  new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

export const DEFAULT_FINANCE_LEDGER: FinanceLedgerEntry[] = [
  {
    id: "seed-sale-1",
    kind: "sale",
    amountGhs: 185,
    createdAt: hoursAgo(2),
    orderRef: "#1042",
    subtotalGhs: 195,
    discountGhs: 10,
    method: "momo",
    channel: "T12 · Dine-in",
    itemCount: 3,
    staffName: "Owusu Kenneth",
    couponCode: "WELCOME10",
  },
  {
    id: "seed-sale-2",
    kind: "sale",
    amountGhs: 45,
    createdAt: hoursAgo(4),
    orderRef: "#1041",
    subtotalGhs: 45,
    discountGhs: 0,
    method: "cash",
    channel: "Takeaway",
    itemCount: 2,
    staffName: "Ama Boateng",
  },
  {
    id: "seed-sale-3",
    kind: "sale",
    amountGhs: 220,
    createdAt: hoursAgo(5),
    orderRef: "#1040",
    subtotalGhs: 220,
    discountGhs: 0,
    method: "card",
    channel: "T04 · Dine-in",
    itemCount: 4,
    staffName: "Owusu Kenneth",
  },
  {
    id: "seed-exp-1",
    kind: "expense",
    amountGhs: 420,
    createdAt: hoursAgo(26),
    category: "supplies",
    vendor: "Fresh produce market",
    note: "Weekly vegetables & protein",
  },
  {
    id: "seed-exp-2",
    kind: "expense",
    amountGhs: 180,
    createdAt: hoursAgo(48),
    category: "utilities",
    vendor: "ECG prepaid",
    note: "Power top-up",
  },
];

function normalizeEntry(row: unknown): FinanceLedgerEntry | null {
  if (typeof row !== "object" || row === null) return null;
  const o = row as Record<string, unknown>;
  const kind =
    o.kind === "sale" || o.kind === "expense" || o.kind === "refund"
      ? o.kind
      : null;
  if (!kind || typeof o.id !== "string") return null;
  const amountGhs = Number(o.amountGhs);
  if (!Number.isFinite(amountGhs) || amountGhs < 0) return null;
  const createdAt =
    typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString();

  const method =
    o.method === "cash" ||
    o.method === "card" ||
    o.method === "momo" ||
    o.method === "due"
      ? o.method
      : undefined;

  const category =
    o.category === "supplies" ||
    o.category === "payroll" ||
    o.category === "utilities" ||
    o.category === "rent" ||
    o.category === "marketing" ||
    o.category === "other"
      ? o.category
      : undefined;

  return {
    id: o.id,
    kind,
    amountGhs: roundMoney(amountGhs),
    createdAt,
    note: typeof o.note === "string" && o.note.trim() ? o.note.trim() : undefined,
    orderRef:
      typeof o.orderRef === "string" && o.orderRef.trim()
        ? o.orderRef.trim()
        : undefined,
    subtotalGhs:
      o.subtotalGhs != null && Number.isFinite(Number(o.subtotalGhs))
        ? roundMoney(Number(o.subtotalGhs))
        : undefined,
    discountGhs:
      o.discountGhs != null && Number.isFinite(Number(o.discountGhs))
        ? roundMoney(Number(o.discountGhs))
        : undefined,
    method,
    channel:
      typeof o.channel === "string" && o.channel.trim()
        ? o.channel.trim()
        : undefined,
    itemCount:
      o.itemCount != null && Number.isFinite(Number(o.itemCount))
        ? Math.max(0, Math.floor(Number(o.itemCount)))
        : undefined,
    staffName:
      typeof o.staffName === "string" && o.staffName.trim()
        ? o.staffName.trim()
        : undefined,
    staffId:
      typeof o.staffId === "string" && o.staffId.trim()
        ? o.staffId.trim()
        : undefined,
    shiftId:
      typeof o.shiftId === "string" && o.shiftId.trim()
        ? o.shiftId.trim()
        : undefined,
    couponCode:
      typeof o.couponCode === "string" && o.couponCode.trim()
        ? o.couponCode.trim()
        : undefined,
    category,
    vendor:
      typeof o.vendor === "string" && o.vendor.trim()
        ? o.vendor.trim()
        : undefined,
  };
}

export function loadFinanceLedgerFromStorage(): FinanceLedgerEntry[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FINANCE_LEDGER_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    const out = data.map(normalizeEntry).filter(Boolean) as FinanceLedgerEntry[];
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

/** Map a ledger sale row to the Payments table shape. */
export type PaymentRowView = {
  id: string;
  time: string;
  orderRef: string;
  tableOrChannel: string;
  method: FinancePayMethod;
  amount: number;
  status: "settled" | "pending" | "refunded";
  staff?: string;
};

export function saleEntryToPaymentRow(entry: FinanceLedgerEntry): PaymentRowView {
  const d = new Date(entry.createdAt);
  const time = Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
  const shortId = entry.id.replace(/^sale-/, "").slice(0, 8).toUpperCase();
  return {
    id: `TXN-${shortId}`,
    time,
    orderRef: entry.orderRef ?? "—",
    tableOrChannel: entry.channel ?? "—",
    method: entry.method ?? "cash",
    amount: entry.amountGhs,
    status: "settled",
    staff: entry.staffName,
  };
}

export function formatLedgerWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
