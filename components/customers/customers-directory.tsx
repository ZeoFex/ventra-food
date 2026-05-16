"use client";

import { formatCedi } from "@/lib/format-cedi";
import { Mail, Phone, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  visits: number;
  lifetimeValue: number;
  lastVisit: string;
  tags: string[];
};

const CUSTOMERS: CustomerRow[] = [
  {
    id: "CUS-8801",
    name: "Kofi Mensah",
    phone: "+233 24 411 2299",
    email: "kofi.m@example.com",
    visits: 34,
    lifetimeValue: 3180.5,
    lastVisit: "2 days ago",
    tags: ["VIP", "Regular"],
  },
  {
    id: "CUS-8802",
    name: "Ama Serwaa",
    phone: "+233 20 998 4410",
    visits: 12,
    lifetimeValue: 920.0,
    lastVisit: "Today",
    tags: ["MoMo"],
  },
  {
    id: "CUS-8803",
    name: "Dev Team Accra Ltd",
    phone: "+233 54 200 1188",
    email: "ops@devteamaccra.gh",
    visits: 8,
    lifetimeValue: 4620.75,
    lastVisit: "1 week ago",
    tags: ["Corporate"],
  },
  {
    id: "CUS-8804",
    name: "Esi Owusu",
    phone: "+233 27 555 0192",
    visits: 5,
    lifetimeValue: 410.25,
    lastVisit: "3 days ago",
    tags: ["First visit"],
  },
  {
    id: "CUS-8805",
    name: "Nana Yaw",
    phone: "+233 23 881 0044",
    visits: 21,
    lifetimeValue: 1890.0,
    lastVisit: "5 days ago",
    tags: ["Regular", "Late diner"],
  },
  {
    id: "CUS-8806",
    name: "Sena Abladey",
    phone: "+233 59 120 7734",
    visits: 3,
    lifetimeValue: 198.5,
    lastVisit: "2 weeks ago",
    tags: ["Takeaway"],
  },
];

const SEGMENTS = [
  { id: "all" as const, label: "All" },
  { id: "vip" as const, label: "VIP" },
  { id: "corporate" as const, label: "Corporate" },
  { id: "regular" as const, label: "Regular" },
] as const;

function matchesSegment(row: CustomerRow, segment: (typeof SEGMENTS)[number]["id"]) {
  if (segment === "all") return true;
  const t = row.tags.map((x) => x.toLowerCase());
  if (segment === "vip") return t.includes("vip");
  if (segment === "corporate") return t.includes("corporate");
  if (segment === "regular") return t.includes("regular");
  return true;
}

export function CustomersDirectory() {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]["id"]>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CUSTOMERS.filter((row) => {
      if (!matchesSegment(row, segment)) return false;
      if (!q) return true;
      const hay = [
        row.name,
        row.phone,
        row.email ?? "",
        row.id,
        ...row.tags,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, segment]);

  const summary = useMemo(() => {
    const total = CUSTOMERS.length;
    const vip = CUSTOMERS.filter((c) =>
      c.tags.some((t) => t.toLowerCase() === "vip"),
    ).length;
    const ltv = CUSTOMERS.reduce((s, c) => s + c.lifetimeValue, 0);
    return { total, vip, ltv };
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
            Profiles
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--foreground)]">
            {summary.total}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
            VIP
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-2xl font-bold tabular-nums text-[var(--foreground)]">
            <Star
              className="h-6 w-6 text-amber-500"
              strokeWidth={1.5}
              fill="currentColor"
            />
            {summary.vip}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
            Sample LTV (all)
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--foreground)]">
            {formatCedi(summary.ltv)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative min-w-0 sm:max-w-md sm:flex-1 lg:max-w-lg">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
            strokeWidth={1.6}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, phone, email, tag…"
            className="w-full rounded-lg border border-[var(--pos-border)] bg-white py-2.5 pl-9 pr-3 text-sm text-[#374151] outline-none placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/25"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {SEGMENTS.map((s) => {
            const active = segment === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSegment(s.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                  active
                    ? "bg-[var(--foreground)] text-white shadow-sm"
                    : "border border-[var(--pos-border)] bg-white text-[#374151] hover:bg-[#f9fafb]"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--pos-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pos-border)] bg-[#fafafa] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                <th className="px-4 py-3 font-medium sm:px-5">Customer</th>
                <th className="px-4 py-3 font-medium sm:px-5">Contact</th>
                <th className="px-4 py-3 font-medium sm:px-5">Visits</th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">
                  Lifetime value
                </th>
                <th className="px-4 py-3 font-medium sm:px-5">Last visit</th>
                <th className="px-4 py-3 font-medium sm:px-5">Tags</th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">
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
                  <td className="px-4 py-3.5 sm:px-5">
                    <p className="font-semibold text-[var(--foreground)]">
                      {row.name}
                    </p>
                    <p className="text-[11px] font-medium text-[#9ca3af]">
                      {row.id}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <span className="flex items-center gap-1.5 text-xs text-[#374151]">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" strokeWidth={1.6} />
                      {row.phone}
                    </span>
                    {row.email && (
                      <span className="mt-1 flex items-center gap-1.5 text-xs text-[#6b7280]">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" strokeWidth={1.6} />
                        {row.email}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium tabular-nums text-[var(--foreground)] sm:px-5">
                    {row.visits}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-[var(--foreground)] sm:px-5">
                    {formatCedi(row.lifetimeValue)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[#374151] sm:px-5">
                    {row.lastVisit}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <div className="flex flex-wrap gap-1">
                      {row.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-[var(--pos-border)] bg-[#f9fafb] px-2 py-0.5 text-[10px] font-semibold text-[#475569]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
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
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-[#6b7280]">
            No customers match this filter.
          </p>
        )}
      </div>

      <p className="text-center text-xs text-[#9ca3af]">
        Demo directory — connect your CRM or loyalty API when ready.
      </p>
    </div>
  );
}
