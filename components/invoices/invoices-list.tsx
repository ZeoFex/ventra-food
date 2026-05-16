"use client";

import { formatCedi } from "@/lib/format-cedi";
import { Calendar, Search } from "lucide-react";
import { useMemo, useState } from "react";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partial"
  | "paid"
  | "overdue";

export type InvoiceRow = {
  id: string;
  customer: string;
  customerId?: string;
  issued: string;
  due: string;
  total: number;
  paid?: number;
  status: InvoiceStatus;
};

const INVOICES: InvoiceRow[] = [
  {
    id: "INV-2026-0142",
    customer: "Dev Team Accra Ltd",
    customerId: "CUS-8803",
    issued: "12 May 2026",
    due: "26 May 2026",
    total: 4620.75,
    paid: 4620.75,
    status: "paid",
  },
  {
    id: "INV-2026-0141",
    customer: "Kofi Mensah",
    customerId: "CUS-8801",
    issued: "10 May 2026",
    due: "24 May 2026",
    total: 890.0,
    paid: 400.0,
    status: "partial",
  },
  {
    id: "INV-2026-0140",
    customer: "Nana Yaw",
    customerId: "CUS-8805",
    issued: "3 May 2026",
    due: "17 May 2026",
    total: 1200.0,
    status: "overdue",
  },
  {
    id: "INV-2026-0138",
    customer: "Ama Serwaa",
    customerId: "CUS-8802",
    issued: "14 May 2026",
    due: "28 May 2026",
    total: 320.5,
    status: "sent",
  },
  {
    id: "INV-2026-0137",
    customer: "Walk-in · Corporate lunch",
    issued: "15 May 2026",
    due: "15 May 2026",
    total: 2150.0,
    status: "draft",
  },
  {
    id: "INV-2026-0136",
    customer: "Esi Owusu",
    customerId: "CUS-8804",
    issued: "1 May 2026",
    due: "15 May 2026",
    total: 175.25,
    paid: 175.25,
    status: "paid",
  },
];

const STATUS_FILTERS: { id: "all" | InvoiceStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "partial", label: "Partial" },
  { id: "paid", label: "Paid" },
  { id: "overdue", label: "Overdue" },
];

function statusStyle(s: InvoiceStatus) {
  switch (s) {
    case "paid":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200/90";
    case "sent":
      return "bg-sky-50 text-sky-900 ring-sky-200/90";
    case "partial":
      return "bg-amber-50 text-amber-950 ring-amber-200/90";
    case "overdue":
      return "bg-rose-50 text-rose-900 ring-rose-200/85";
    case "draft":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function InvoicesList() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]["id"]>(
    "all",
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INVOICES.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (!q) return true;
      const hay = [row.id, row.customer, row.customerId ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, status]);

  const aging = useMemo(() => {
    const outstanding = INVOICES.filter(
      (i) => i.status === "sent" || i.status === "partial" || i.status === "overdue",
    );
    const dueTotal = outstanding.reduce((s, i) => {
      const paid = i.paid ?? 0;
      return s + Math.max(0, i.total - paid);
    }, 0);
    const overdue = INVOICES.filter((i) => i.status === "overdue").length;
    return { dueTotal, overdue, count: outstanding.length };
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
            Outstanding (sample)
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--foreground)]">
            {formatCedi(aging.dueTotal)}
          </p>
          <p className="mt-1 text-xs text-[#6b7280]">
            {aging.count} open invoice(s)
          </p>
        </div>
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
            Overdue
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-rose-700">
            {aging.overdue}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
            In register
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--foreground)]">
            {INVOICES.length}
          </p>
          <p className="mt-1 text-xs text-[#6b7280]">Demo rows</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 lg:max-w-md lg:flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
            strokeWidth={1.6}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoice #, customer…"
            className="w-full rounded-lg border border-[var(--pos-border)] bg-white py-2.5 pl-9 pr-3 text-sm text-[#374151] outline-none placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/25"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = status === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatus(f.id)}
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
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pos-border)] bg-[#fafafa] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                <th className="px-4 py-3 font-medium sm:px-5">Invoice</th>
                <th className="px-4 py-3 font-medium sm:px-5">Customer</th>
                <th className="px-4 py-3 font-medium sm:px-5">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" strokeWidth={1.6} />
                    Issued
                  </span>
                </th>
                <th className="px-4 py-3 font-medium sm:px-5">Due</th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">
                  Total
                </th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">
                  Paid
                </th>
                <th className="px-4 py-3 font-medium sm:px-5">Status</th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const balance =
                  row.paid != null ? row.total - row.paid : row.total;
                const showBalance =
                  row.status !== "paid" && row.status !== "draft";
                return (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--pos-border)] last:border-b-0"
                  >
                    <td className="px-4 py-3.5 sm:px-5">
                      <p className="font-semibold text-[var(--foreground)]">
                        {row.id}
                      </p>
                    </td>
                    <td className="max-w-[220px] px-4 py-3.5 sm:px-5">
                      <p className="font-medium text-[var(--foreground)]">
                        {row.customer}
                      </p>
                      {row.customerId && (
                        <p className="text-[11px] text-[#9ca3af]">
                          {row.customerId}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[#374151] sm:px-5">
                      {row.issued}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[#374151] sm:px-5">
                      {row.due}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-[var(--foreground)] sm:px-5">
                      {formatCedi(row.total)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums sm:px-5">
                      {row.paid != null ? (
                        <span className="font-medium text-[#374151]">
                          {formatCedi(row.paid)}
                        </span>
                      ) : (
                        <span className="text-[#9ca3af]">—</span>
                      )}
                      {showBalance && balance > 0.004 && (
                        <span className="mt-0.5 block text-[11px] text-rose-600">
                          Due {formatCedi(balance)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusStyle(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--pos-primary)] hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-[#6b7280]">
            No invoices match this filter.
          </p>
        )}
      </div>

      <p className="text-center text-xs text-[#9ca3af]">
        Demo billing register — connect accounting or your ventrapos API when
        ready.
      </p>
    </div>
  );
}
