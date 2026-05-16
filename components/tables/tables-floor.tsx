"use client";

import { formatCedi } from "@/lib/format-cedi";
import { Clock, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

export type FloorTable = {
  id: string;
  zone: string;
  seats: number;
  status: TableStatus;
  covers?: number;
  openFor?: string;
  checkTotal?: number;
  note?: string;
};

const TABLES: FloorTable[] = [
  { id: "T01", zone: "Main", seats: 2, status: "occupied", covers: 2, openFor: "18m", checkTotal: 86.5 },
  { id: "T02", zone: "Main", seats: 2, status: "available" },
  { id: "T03", zone: "Main", seats: 4, status: "occupied", covers: 3, openFor: "42m", checkTotal: 214 },
  { id: "T04", zone: "Main", seats: 4, status: "reserved", note: "Esi · 7:30 PM" },
  { id: "T05", zone: "Main", seats: 6, status: "available" },
  { id: "T06", zone: "Main", seats: 6, status: "occupied", covers: 5, openFor: "8m", checkTotal: 132 },
  { id: "T07", zone: "Window", seats: 2, status: "cleaning" },
  { id: "T08", zone: "Window", seats: 2, status: "occupied", covers: 1, openFor: "55m", checkTotal: 44 },
  { id: "T09", zone: "Window", seats: 4, status: "available" },
  { id: "T10", zone: "Bar", seats: 4, status: "occupied", covers: 2, openFor: "12m", checkTotal: 67.25 },
  { id: "T11", zone: "Bar", seats: 2, status: "available" },
  { id: "T12", zone: "Patio", seats: 4, status: "reserved", note: "Party · 8 PM" },
  { id: "T13", zone: "Patio", seats: 8, status: "available" },
  { id: "T14", zone: "Patio", seats: 4, status: "occupied", covers: 4, openFor: "26m", checkTotal: 189 },
];

const FILTERS: { id: "all" | TableStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "occupied", label: "Occupied" },
  { id: "reserved", label: "Reserved" },
  { id: "cleaning", label: "Cleaning" },
];

function statusStyles(status: TableStatus) {
  switch (status) {
    case "available":
      return {
        badge: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
        ring: "ring-emerald-200/60",
        accent: "from-emerald-500/15 to-transparent",
      };
    case "occupied":
      return {
        badge: "bg-orange-50 text-orange-900 ring-orange-200/90",
        ring: "ring-[var(--pos-primary)]/35",
        accent: "from-[var(--pos-primary)]/20 to-transparent",
      };
    case "reserved":
      return {
        badge: "bg-sky-50 text-sky-900 ring-sky-200/90",
        ring: "ring-sky-200/70",
        accent: "from-sky-500/15 to-transparent",
      };
    case "cleaning":
      return {
        badge: "bg-slate-100 text-slate-700 ring-slate-200",
        ring: "ring-slate-200/80",
        accent: "from-slate-400/15 to-transparent",
      };
    default:
      return {
        badge: "bg-slate-100 text-slate-700",
        ring: "ring-slate-200",
        accent: "from-slate-400/10 to-transparent",
      };
  }
}

export function TablesFloor() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const counts = useMemo(() => {
    const total = TABLES.length;
    const occupied = TABLES.filter((t) => t.status === "occupied").length;
    const available = TABLES.filter((t) => t.status === "available").length;
    const reserved = TABLES.filter((t) => t.status === "reserved").length;
    return { total, occupied, available, reserved };
  }, []);

  const visible = useMemo(
    () =>
      TABLES.filter((t) => (filter === "all" ? true : t.status === filter)),
    [filter],
  );

  const byZone = useMemo(() => {
    const m = new Map<string, FloorTable[]>();
    for (const t of visible) {
      const list = m.get(t.zone) ?? [];
      list.push(t);
      m.set(t.zone, list);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [visible]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Live floor
          </h2>
          <p className="mt-0.5 text-sm text-[var(--pos-muted)]">
            Tap a table to open in POS when an order is in progress.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold sm:text-sm">
          <span className="rounded-lg border border-[var(--pos-border)] bg-white px-3 py-1.5 text-[#374151] shadow-sm tabular-nums">
            {counts.total} tables
          </span>
          <span className="rounded-lg border border-orange-200/80 bg-orange-50/80 px-3 py-1.5 text-orange-900 tabular-nums">
            {counts.occupied} checks
          </span>
          <span className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-emerald-900 tabular-nums">
            {counts.available} free
          </span>
          <span className="rounded-lg border border-sky-200/80 bg-sky-50/80 px-3 py-1.5 text-sky-900 tabular-nums">
            {counts.reserved} held
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
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

      <div className="space-y-8">
        {byZone.map(([zone, tables]) => (
          <section key={zone}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
              {zone}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables.map((t) => {
                const st = statusStyles(t.status);
                return (
                  <div
                    key={t.id}
                    className={`relative overflow-hidden rounded-2xl border border-[var(--pos-border)] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-2 ring-transparent transition-shadow hover:shadow-md ${st.ring}`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${st.accent}`}
                      aria-hidden
                    />
                    <div className="relative flex items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                          {t.id}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#6b7280]">
                          <Users className="h-3.5 w-3.5" strokeWidth={1.6} />
                          {t.seats} seats
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${st.badge}`}
                      >
                        {t.status}
                      </span>
                    </div>

                    {t.status === "occupied" &&
                      t.checkTotal != null &&
                      t.openFor && (
                        <div className="relative mt-4 space-y-2 border-t border-[var(--pos-border)] pt-3 text-sm">
                          <div className="flex items-center justify-between text-[#6b7280]">
                            <span className="flex items-center gap-1.5 text-xs">
                              <Clock className="h-3.5 w-3.5" strokeWidth={1.6} />
                              {t.openFor}
                            </span>
                            {t.covers != null ? (
                              <span className="text-xs font-medium tabular-nums text-[#374151]">
                                {t.covers} covers
                              </span>
                            ) : null}
                          </div>
                          <p className="text-base font-bold tabular-nums text-[var(--foreground)]">
                            {formatCedi(t.checkTotal)}
                          </p>
                          <Link
                            href="/"
                            className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-[var(--pos-primary)] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--pos-primary-hover)]"
                          >
                            Open in POS
                          </Link>
                        </div>
                      )}

                    {t.status === "reserved" && t.note && (
                      <p className="relative mt-3 border-t border-dashed border-[var(--pos-border)] pt-3 text-xs font-medium text-[#475569]">
                        {t.note}
                      </p>
                    )}

                    {t.status === "available" && (
                      <button
                        type="button"
                        className="relative mt-4 w-full rounded-xl border border-dashed border-[var(--pos-border)] bg-[#fafafa] py-2.5 text-xs font-semibold text-[#64748b] transition-colors hover:border-[var(--pos-primary)]/40 hover:bg-orange-50/40 hover:text-[var(--pos-primary)]"
                      >
                        Seat guests
                      </button>
                    )}

                    {t.status === "cleaning" && (
                      <p className="relative mt-3 text-xs text-[#64748b]">
                        Crew finishing turn — hold new seats.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
