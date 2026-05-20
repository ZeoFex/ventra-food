"use client";

import { useFinance } from "@/components/finance/finance-context";
import { formatCedi } from "@/lib/format-cedi";
import {
  expenseCategoryLabel,
  filterEntriesByRange,
  formatLedgerWhen,
  payMethodLabel,
  summarizeLedger,
  type FinanceDateRange,
  type FinanceLedgerEntry,
  type FinancePayMethod,
  type LedgerEntryKind,
} from "@/lib/finance-ledger";
import { gooeyToast } from "goey-toast";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Receipt,
  Search,
  Smartphone,
  Timer,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

const RANGE_FILTERS: { id: FinanceDateRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All" },
];

const KIND_FILTERS: { id: "all" | LedgerEntryKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sale", label: "Sales" },
  { id: "expense", label: "Expenses" },
  { id: "refund", label: "Refunds" },
];

function MethodIcon({ method }: { method: FinancePayMethod }) {
  const Icon =
    method === "cash"
      ? Banknote
      : method === "card"
        ? CreditCard
        : method === "momo"
          ? Smartphone
          : Timer;
  return <Icon className="h-3.5 w-3.5" strokeWidth={1.65} />;
}

function kindLabel(kind: LedgerEntryKind) {
  switch (kind) {
    case "sale":
      return "Sale";
    case "expense":
      return "Expense";
    case "refund":
      return "Refund";
    default:
      return kind;
  }
}

function kindStyle(kind: LedgerEntryKind) {
  switch (kind) {
    case "sale":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200/90";
    case "expense":
      return "bg-rose-50 text-rose-900 ring-rose-200/85";
    case "refund":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function entryTitle(row: FinanceLedgerEntry): string {
  if (row.kind === "sale") {
    return row.orderRef ?? "POS sale";
  }
  if (row.kind === "expense") {
    return row.vendor ?? expenseCategoryLabel(row.category ?? "other");
  }
  return row.note ?? "Refund";
}

function entrySubtitle(row: FinanceLedgerEntry): string | null {
  if (row.kind === "sale") {
    return row.channel ?? null;
  }
  if (row.kind === "expense" && row.category) {
    return expenseCategoryLabel(row.category);
  }
  return row.note ?? null;
}

export function FinanceOverview() {
  const { entries, hydrated, removeEntry } = useFinance();
  const [range, setRange] = useState<FinanceDateRange>("today");
  const [kindFilter, setKindFilter] =
    useState<(typeof KIND_FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");

  const inRange = useMemo(
    () => filterEntriesByRange(entries, range),
    [entries, range],
  );

  const summary = useMemo(() => summarizeLedger(inRange), [inRange]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inRange.filter((row) => {
      if (kindFilter !== "all" && row.kind !== kindFilter) return false;
      if (!q) return true;
      const hay = [
        row.orderRef ?? "",
        row.channel ?? "",
        row.staffName ?? "",
        row.couponCode ?? "",
        row.vendor ?? "",
        row.note ?? "",
        row.category ?? "",
        kindLabel(row.kind),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [inRange, kindFilter, query]);

  const methodRows = useMemo(() => {
    const methods: FinancePayMethod[] = ["cash", "card", "momo", "due"];
    const total = methods.reduce((s, m) => s + summary.byMethod[m], 0);
    return methods
      .map((m) => ({
        method: m,
        amount: summary.byMethod[m],
        pct: total > 0 ? (summary.byMethod[m] / total) * 100 : 0,
      }))
      .filter((r) => r.amount > 0);
  }, [summary.byMethod]);

  const deleteEntry = (row: FinanceLedgerEntry) => {
    if (!window.confirm(`Remove this ${kindLabel(row.kind).toLowerCase()} entry?`)) {
      return;
    }
    removeEntry(row.id);
    gooeyToast.info("Entry removed");
  };

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center p-16 text-sm text-[#9ca3af]">
        Loading finances…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Revenue"
          value={formatCedi(summary.revenueGhs)}
          hint={`${summary.saleCount} sale(s)`}
          icon={TrendingUp}
          tone="positive"
        />
        <SummaryCard
          label="Expenses"
          value={formatCedi(summary.expensesGhs)}
          hint={`${summary.expenseCount} expense(s)`}
          icon={TrendingDown}
          tone="negative"
        />
        <SummaryCard
          label="Net"
          value={formatCedi(summary.netGhs)}
          hint={
            summary.refundsGhs > 0
              ? `After ${formatCedi(summary.refundsGhs)} refunds`
              : "Revenue − expenses"
          }
          icon={Wallet}
          tone={summary.netGhs >= 0 ? "neutral" : "negative"}
        />
        <SummaryCard
          label="Avg. ticket"
          value={
            summary.saleCount > 0
              ? formatCedi(summary.revenueGhs / summary.saleCount)
              : formatCedi(0)
          }
          hint="Per settled sale in range"
          icon={Receipt}
          tone="neutral"
        />
      </div>

      {methodRows.length > 0 ? (
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Sales by payment method
          </h2>
          <div className="mt-4 space-y-3">
            {methodRows.map((row) => (
              <div key={row.method}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#374151]">
                    <MethodIcon method={row.method} />
                    {payMethodLabel(row.method)}
                  </span>
                  <span className="font-semibold tabular-nums text-[var(--foreground)]">
                    {formatCedi(row.amount)}
                    <span className="ml-1.5 text-xs font-normal text-[#9ca3af]">
                      {row.pct.toFixed(0)}%
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--pos-primary)] to-orange-400"
                    style={{ width: `${Math.max(4, row.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
            placeholder="Search order, vendor, staff…"
            className="w-full rounded-lg border border-[var(--pos-border)] bg-white py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/25"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_FILTERS.map((r) => (
            <FilterPill
              key={r.id}
              active={range === r.id}
              onClick={() => setRange(r.id)}
              label={r.label}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {KIND_FILTERS.map((f) => (
          <FilterPill
            key={f.id}
            active={kindFilter === f.id}
            onClick={() => setKindFilter(f.id)}
            label={f.label}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--pos-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pos-border)] bg-[#fafafa] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                <th className="px-4 py-3 font-medium sm:px-5">When</th>
                <th className="px-4 py-3 font-medium sm:px-5">Type</th>
                <th className="px-4 py-3 font-medium sm:px-5">Description</th>
                <th className="px-4 py-3 font-medium sm:px-5">Method / category</th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">Amount</th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-[#9ca3af]"
                  >
                    No entries in this period.
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const isIn = row.kind === "sale";
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--pos-border)] last:border-b-0 hover:bg-[#fafafa]"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 text-[#374151] sm:px-5">
                        {formatLedgerWhen(row.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${kindStyle(row.kind)}`}
                        >
                          {kindLabel(row.kind)}
                        </span>
                      </td>
                      <td className="max-w-[240px] px-4 py-3.5 sm:px-5">
                        <p className="font-medium text-[var(--foreground)]">
                          {entryTitle(row)}
                        </p>
                        {entrySubtitle(row) ? (
                          <p className="mt-0.5 truncate text-xs text-[#9ca3af]">
                            {entrySubtitle(row)}
                          </p>
                        ) : null}
                        {row.kind === "sale" && row.discountGhs != null && row.discountGhs > 0 ? (
                          <p className="mt-0.5 text-[11px] text-emerald-700">
                            Discount {formatCedi(row.discountGhs)}
                            {row.couponCode ? ` · ${row.couponCode}` : ""}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 text-[#6b7280] sm:px-5">
                        {row.kind === "sale" && row.method ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MethodIcon method={row.method} />
                            {payMethodLabel(row.method)}
                          </span>
                        ) : row.category ? (
                          expenseCategoryLabel(row.category)
                        ) : (
                          "—"
                        )}
                        {row.staffName ? (
                          <p className="mt-0.5 text-[11px]">{row.staffName}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 text-right sm:px-5">
                        <span
                          className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${
                            isIn ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {isIn ? (
                            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2} />
                          )}
                          {formatCedi(row.amountGhs)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right sm:px-5">
                        <button
                          type="button"
                          onClick={() => deleteEntry(row)}
                          className="rounded-lg p-2 text-[#9ca3af] hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-[#9ca3af]">
        POS sales post when you complete <strong className="font-semibold text-[#6b7280]">Bill &amp; Payment</strong>.
        Stored in this browser until your accounting API is connected.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: "positive" | "negative" | "neutral";
}) {
  const valueColor =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
        ? "text-rose-700"
        : "text-[var(--foreground)]";

  return (
    <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
            {label}
          </p>
          <p className={`mt-2 text-2xl font-bold tabular-nums ${valueColor}`}>
            {value}
          </p>
          <p className="mt-1 text-xs text-[#6b7280]">{hint}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f4f6] text-[#374151]">
          <Icon className="h-5 w-5" strokeWidth={1.6} />
        </span>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
        active
          ? "bg-[var(--foreground)] text-white shadow-sm"
          : "border border-[var(--pos-border)] bg-white text-[#374151] hover:bg-[#f9fafb]"
      }`}
    >
      {label}
    </button>
  );
}
