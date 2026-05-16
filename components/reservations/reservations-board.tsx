"use client";

import { ChevronLeft, ChevronRight, Clock, Phone, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export type ReservationStatus =
  | "confirmed"
  | "seated"
  | "waitlist"
  | "cancelled"
  | "no_show";

export type ReservationRow = {
  id: string;
  time: string;
  guest: string;
  party: number;
  table?: string;
  phone?: string;
  status: ReservationStatus;
  notes?: string;
  occasion?: string;
};

const SAMPLE: ReservationRow[] = [
  {
    id: "RSV-1040",
    time: "18:00",
    guest: "Kofi Mensah",
    party: 4,
    table: "T05",
    phone: "024 411 2299",
    status: "confirmed",
    notes: "Birthday — cake on arrival",
  },
  {
    id: "RSV-1041",
    time: "18:30",
    guest: "Ama Serwaa",
    party: 2,
    table: "T02",
    phone: "020 998 4410",
    status: "seated",
    occasion: "Anniversary",
  },
  {
    id: "RSV-1042",
    time: "19:00",
    guest: "Dev team dinner",
    party: 8,
    table: "T13",
    phone: "054 200 1188",
    status: "confirmed",
    notes: "Split billing, one vegan",
  },
  {
    id: "RSV-1043",
    time: "19:30",
    guest: "Esi Owusu",
    party: 3,
    phone: "027 555 0192",
    status: "confirmed",
    table: "T04",
  },
  {
    id: "RSV-1044",
    time: "20:00",
    guest: "Walk-in overflow",
    party: 2,
    status: "waitlist",
    phone: "059 120 7734",
    notes: "Prefers patio if possible",
  },
  {
    id: "RSV-1038",
    time: "17:30",
    guest: "Nana Yaw",
    party: 6,
    status: "cancelled",
    phone: "023 881 0044",
  },
  {
    id: "RSV-1037",
    time: "21:00",
    guest: "Sena & friends",
    party: 5,
    table: "Bar rail",
    status: "confirmed",
  },
];

const FILTERS: { id: "all" | ReservationStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "seated", label: "Seated" },
  { id: "waitlist", label: "Waitlist" },
  { id: "cancelled", label: "Cancelled" },
  { id: "no_show", label: "No-show" },
];

function statusBadge(status: ReservationStatus) {
  switch (status) {
    case "confirmed":
      return "bg-sky-50 text-sky-900 ring-sky-200/90";
    case "seated":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200/90";
    case "waitlist":
      return "bg-amber-50 text-amber-950 ring-amber-200/90";
    case "cancelled":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    case "no_show":
      return "bg-rose-50 text-rose-900 ring-rose-200/80";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function ReservationsBoard() {
  const [dayOffset, setDayOffset] = useState(0);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const date = useMemo(() => addDays(new Date(), dayOffset), [dayOffset]);
  const dateLabel = useMemo(
    () =>
      date.toLocaleDateString("en-GH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [date],
  );

  const visible = useMemo(() => {
    const rows = [...SAMPLE].sort((a, b) => a.time.localeCompare(b.time));
    return filter === "all"
      ? rows
      : rows.filter((r) => r.status === filter);
  }, [filter]);

  const tonight = useMemo(() => {
    const c = SAMPLE.filter((r) => r.status === "confirmed").length;
    const s = SAMPLE.filter((r) => r.status === "seated").length;
    const w = SAMPLE.filter((r) => r.status === "waitlist").length;
    return { c, s, w, covers: SAMPLE.reduce((n, r) => n + r.party, 0) };
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDayOffset((d) => d - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--pos-border)] bg-white text-[#374151] shadow-sm hover:bg-[#f9fafb]"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <div className="min-w-0 rounded-xl border border-[var(--pos-border)] bg-white px-4 py-2.5 shadow-sm sm:min-w-[280px]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
              Diary
            </p>
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {dateLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDayOffset((d) => d + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--pos-border)] bg-white text-[#374151] shadow-sm hover:bg-[#f9fafb]"
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
          </button>
          {dayOffset !== 0 && (
            <button
              type="button"
              onClick={() => setDayOffset(0)}
              className="rounded-lg border border-[var(--pos-border)] bg-[#fafafa] px-3 py-2 text-xs font-semibold text-[#374151] hover:bg-[#f3f4f6]"
            >
              Today
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold sm:text-sm">
          <span className="rounded-lg border border-sky-200/80 bg-sky-50/80 px-3 py-1.5 text-sky-950 tabular-nums">
            {tonight.c} confirmed
          </span>
          <span className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-emerald-950 tabular-nums">
            {tonight.s} seated
          </span>
          <span className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-1.5 text-amber-950 tabular-nums">
            {tonight.w} waitlist
          </span>
          <span className="rounded-lg border border-[var(--pos-border)] bg-white px-3 py-1.5 text-[#374151] tabular-nums">
            ~{tonight.covers} covers (sample day)
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

      <div className="overflow-hidden rounded-xl border border-[var(--pos-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pos-border)] bg-[#fafafa] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                <th className="px-4 py-3 font-medium sm:px-5">Time</th>
                <th className="px-4 py-3 font-medium sm:px-5">Guest</th>
                <th className="px-4 py-3 font-medium sm:px-5">Party</th>
                <th className="px-4 py-3 font-medium sm:px-5">Table / zone</th>
                <th className="px-4 py-3 font-medium sm:px-5">Contact</th>
                <th className="px-4 py-3 font-medium sm:px-5">Status</th>
                <th className="px-4 py-3 font-medium sm:px-5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--pos-border)] last:border-b-0"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 sm:px-5">
                    <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-[var(--foreground)]">
                      <Clock className="h-3.5 w-3.5 text-[#9ca3af]" strokeWidth={1.6} />
                      {row.time}
                    </span>
                  </td>
                  <td className="max-w-[200px] px-4 py-3.5 sm:max-w-none sm:px-5">
                    <p className="font-semibold text-[var(--foreground)]">
                      {row.guest}
                    </p>
                    {(row.notes || row.occasion) && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#6b7280]">
                        {[row.occasion, row.notes].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] font-medium text-[#9ca3af]">
                      {row.id}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <span className="inline-flex items-center gap-1 tabular-nums text-[#374151]">
                      <Users className="h-3.5 w-3.5 text-[#9ca3af]" strokeWidth={1.6} />
                      {row.party}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[#374151] sm:px-5">
                    {row.table ?? "—"}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    {row.phone ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#475569]">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" strokeWidth={1.6} />
                        {row.phone}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusBadge(row.status)}`}
                    >
                      {row.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right sm:px-5">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href="/tables"
                        className="rounded-lg border border-[var(--pos-border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[#f9fafb]"
                      >
                        Floor
                      </Link>
                      <Link
                        href="/"
                        className="rounded-lg bg-[var(--pos-primary)] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[var(--pos-primary-hover)]"
                      >
                        POS
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-[#6b7280]">
            No bookings in this view.
          </p>
        )}
      </div>

      <p className="text-center text-xs text-[#9ca3af]">
        Sample data for UI only — connect your booking API when ready.
      </p>
    </div>
  );
}
