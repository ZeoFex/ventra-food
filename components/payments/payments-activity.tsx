"use client";

import { formatCedi } from "@/lib/format-cedi";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Timer,
} from "lucide-react";
import { useMemo, useState } from "react";

export type PayMethod = "cash" | "card" | "momo" | "due";
export type PayStatus = "settled" | "pending" | "refunded";

export type PaymentRow = {
  id: string;
  time: string;
  orderRef: string;
  tableOrChannel: string;
  method: PayMethod;
  amount: number;
  tip?: number;
  status: PayStatus;
  staff?: string;
};

const ROWS: PaymentRow[] = [
  {
    id: "TXN-9A2F",
    time: "14:22",
    orderRef: "#1042",
    tableOrChannel: "T12 · Dine-in",
    method: "momo",
    amount: 185.0,
    tip: 10,
    status: "settled",
    staff: "Nahid",
  },
  {
    id: "TXN-9A2E",
    time: "14:05",
    orderRef: "#1041",
    tableOrChannel: "Takeaway",
    method: "cash",
    amount: 45.0,
    status: "settled",
    staff: "Nahid",
  },
  {
    id: "TXN-9A2D",
    time: "13:48",
    orderRef: "#1040",
    tableOrChannel: "T04 · Dine-in",
    method: "card",
    amount: 220.0,
    tip: 20,
    status: "settled",
    staff: "Kojo",
  },
  {
    id: "TXN-9A2C",
    time: "13:15",
    orderRef: "#1039",
    tableOrChannel: "QR menu",
    method: "momo",
    amount: 62.5,
    status: "pending",
    staff: "System",
  },
  {
    id: "TXN-9A2B",
    time: "12:50",
    orderRef: "#1038",
    tableOrChannel: "T06",
    method: "cash",
    amount: 132.0,
    status: "refunded",
  },
  {
    id: "TXN-9A2A",
    time: "12:20",
    orderRef: "#1037",
    tableOrChannel: "Corporate",
    method: "due",
    amount: 890.0,
    status: "settled",
    staff: "Nahid",
  },
];

const RANGE_FILTERS = [
  { id: "today" as const, label: "Today" },
  { id: "7d" as const, label: "7 days" },
  { id: "30d" as const, label: "30 days" },
  { id: "all" as const, label: "All" },
];

const METHOD_FILTERS: { id: "all" | PayMethod; label: string }[] = [
  { id: "all", label: "All methods" },
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "momo", label: "MoMo" },
  { id: "due", label: "DUE" },
];

function MethodIcon({ method }: { method: PayMethod }) {
  const Icon =
    method === "cash"
      ? Banknote
      : method === "card"
        ? CreditCard
        : method === "momo"
          ? Smartphone
          : Timer;
  return <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.65} />;
}

function methodLabel(m: PayMethod) {
  switch (m) {
    case "momo":
      return "MoMo";
    case "due":
      return "DUE";
    default:
      return m.charAt(0).toUpperCase() + m.slice(1);
  }
}

function statusStyle(s: PayStatus) {
  switch (s) {
    case "settled":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200/90";
    case "pending":
      return "bg-amber-50 text-amber-950 ring-amber-200/90";
    case "refunded":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function PaymentsActivity() {
  const [range, setRange] = useState<(typeof RANGE_FILTERS)[number]["id"]>(
    "today",
  );
  const [method, setMethod] = useState<(typeof METHOD_FILTERS)[number]["id"]>(
    "all",
  );

  const visible = useMemo(
    () =>
      method === "all"
        ? ROWS
        : ROWS.filter((r) => r.method === method),
    [method],
  );

  const stats = useMemo(() => {
    const settled = ROWS.filter((r) => r.status === "settled");
    const gross = settled.reduce((s, r) => s + r.amount + (r.tip ?? 0), 0);
    const tips = settled.reduce((s, r) => s + (r.tip ?? 0), 0);
    const pending = ROWS.filter((r) => r.status === "pending").length;
    const refunded = ROWS.filter((r) => r.status === "refunded").length;
    return {
      gross,
      tips,
      count: ROWS.length,
      pending,
      refunded,
    };
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
            Gross (sample)
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--foreground)]">
            {formatCedi(stats.gross)}
          </p>
          <p className="mt-1 text-xs text-[#6b7280]">Settled rows only</p>
        </div>
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
            Tips
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--foreground)]">
            {formatCedi(stats.tips)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
            Transactions
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--foreground)]">
            {stats.count}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
            Attention
          </p>
          <p className="mt-2 text-sm font-semibold text-amber-800">
            {stats.pending} pending · {stats.refunded} refunded
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {RANGE_FILTERS.map((r) => {
            const active = range === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                  active
                    ? "bg-[var(--foreground)] text-white shadow-sm"
                    : "border border-[var(--pos-border)] bg-white text-[#374151] hover:bg-[#f9fafb]"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {METHOD_FILTERS.map((f) => {
            const active = method === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setMethod(f.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                  active
                    ? "bg-[var(--foreground)] text-white shadow-sm"
                    : "border border-[var(--pos-border)] bg-white text-[#374151] hover:bg-[#f9fafb]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--pos-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pos-border)] bg-[#fafafa] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                <th className="px-4 py-3 font-medium sm:px-5">Time</th>
                <th className="px-4 py-3 font-medium sm:px-5">Transaction</th>
                <th className="px-4 py-3 font-medium sm:px-5">Order</th>
                <th className="px-4 py-3 font-medium sm:px-5">Channel</th>
                <th className="px-4 py-3 font-medium sm:px-5">Method</th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">
                  Amount
                </th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">
                  Tip
                </th>
                <th className="px-4 py-3 font-medium sm:px-5">Status</th>
                <th className="px-4 py-3 font-medium sm:px-5">Staff</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--pos-border)] last:border-b-0"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium tabular-nums text-[var(--foreground)] sm:px-5">
                    {row.time}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-[#475569] sm:px-5">
                    {row.id}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-[var(--foreground)] sm:px-5">
                    {row.orderRef}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3.5 text-[#374151] sm:px-5">
                    {row.tableOrChannel}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <span className="inline-flex items-center gap-1.5 text-[#374151]">
                      <MethodIcon method={row.method} />
                      {methodLabel(row.method)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-[var(--foreground)] sm:px-5">
                    {formatCedi(row.amount)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#6b7280] tabular-nums sm:px-5">
                    {row.tip != null ? formatCedi(row.tip) : "—"}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusStyle(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[#6b7280] sm:px-5">
                    {row.staff ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-[#9ca3af]">
        Sample ledger for UI — date range pills are ready to wire; list is
        unchanged until your API is connected.
      </p>
    </div>
  );
}
