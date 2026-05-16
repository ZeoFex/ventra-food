import { formatCedi } from "@/lib/format-cedi";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChefHat,
  Clock,
  CreditCard,
  Receipt,
  ShoppingBag,
  Users,
} from "lucide-react";
import Link from "next/link";

const STAT_CARDS = [
  {
    label: "Today's sales",
    value: formatCedi(4820.5),
    delta: "+12.4%",
    up: true,
    hint: "vs yesterday",
    icon: CreditCard,
  },
  {
    label: "Orders",
    value: "156",
    delta: "+8",
    up: true,
    hint: "completed today",
    icon: Receipt,
  },
  {
    label: "Avg. ticket",
    value: formatCedi(30.9),
    delta: "−2.1%",
    up: false,
    hint: "per order",
    icon: ShoppingBag,
  },
  {
    label: "Covers",
    value: "312",
    delta: "+14",
    up: true,
    hint: "dine-in + takeaway",
    icon: Users,
  },
] as const;

const RECENT_ORDERS = [
  {
    id: "#1042",
    table: "T12",
    items: "2× Jollof, 1× Grilled fish",
    total: 185.0,
    status: "Paid" as const,
    time: "2 min ago",
  },
  {
    id: "#1041",
    table: "Takeaway",
    items: "1× Caesar salad, 1× Juice",
    total: 45.0,
    status: "Kitchen" as const,
    time: "8 min ago",
  },
  {
    id: "#1040",
    table: "T04",
    items: "4× Burger combo",
    total: 220.0,
    status: "Paid" as const,
    time: "18 min ago",
  },
  {
    id: "#1039",
    table: "T08",
    items: "Soup + swallow",
    total: 95.0,
    status: "Pending" as const,
    time: "24 min ago",
  },
] as const;

const KITCHEN_QUEUE = [
  { station: "Grill", count: 5 },
  { station: "Cold / salad", count: 3 },
  { station: "Drinks", count: 7 },
] as const;

export function DashboardHome() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Overview
        </h1>
        <p className="mt-1 text-sm text-[var(--pos-muted)]">
          Saturday snapshot · live from this location
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                    {s.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-[var(--foreground)]">
                    {s.value}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-0.5 font-semibold ${
                        s.up ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {s.up ? (
                        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                      ) : (
                        <ArrowDownRight
                          className="h-3.5 w-3.5"
                          strokeWidth={2}
                        />
                      )}
                      {s.delta}
                    </span>
                    <span className="text-[#9ca3af]">{s.hint}</span>
                  </div>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3f4f6] text-[#374151]">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Sales · last 7 days
            </h2>
            <span className="text-xs font-medium text-[#9ca3af]">GH₵ thousands</span>
          </div>
          <div className="mt-6 flex h-48 items-end justify-between gap-2 px-1 sm:gap-3">
            {[3.2, 4.1, 3.8, 4.8, 3.5, 4.6, 4.82].map((h, i) => (
              <div
                key={i}
                className="flex h-full min-h-0 flex-1 flex-col justify-end gap-2"
              >
                <div
                  className="mx-auto w-full max-w-[3rem] rounded-t-md bg-gradient-to-t from-[var(--pos-primary)] to-orange-400/90 opacity-90"
                  style={{
                    height: `${Math.max(12, Math.round((h / 5.2) * 140))}px`,
                  }}
                  title={`${h}k`}
                />
                <span className="text-center text-[10px] font-medium text-[#9ca3af]">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-[var(--pos-primary)]" strokeWidth={1.6} />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Kitchen queue
            </h2>
          </div>
          <ul className="mt-4 space-y-3">
            {KITCHEN_QUEUE.map((row) => (
              <li
                key={row.station}
                className="flex items-center justify-between rounded-lg border border-[var(--pos-border)] bg-[#fafafa] px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-[#374151]">{row.station}</span>
                <span className="tabular-nums font-semibold text-[var(--foreground)]">
                  {row.count} tickets
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[#9ca3af]">
            Syncs when staff use KOT &amp; Print from POS.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--pos-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pos-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#9ca3af]" strokeWidth={1.6} />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Recent orders
            </h2>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-[var(--pos-primary)] hover:underline"
          >
            Open POS
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pos-border)] bg-[#fafafa] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Where</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--pos-border)] last:border-b-0"
                >
                  <td className="px-5 py-3.5 font-semibold text-[var(--foreground)]">
                    {row.id}
                  </td>
                  <td className="px-5 py-3.5 text-[#374151]">{row.table}</td>
                  <td className="max-w-[220px] truncate px-5 py-3.5 text-[#6b7280]">
                    {row.items}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium tabular-nums text-[var(--foreground)]">
                    {formatCedi(row.total)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.status === "Paid"
                          ? "bg-emerald-50 text-emerald-800"
                          : row.status === "Kitchen"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-[#9ca3af]">
                    {row.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
