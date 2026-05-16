"use client";

import { LogOut, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SESSION_KEY = "ventra_kitchen_session";

const DEMO_TICKETS = [
  {
    id: "KOT-1042",
    table: "T12",
    time: "14:22",
    items: ["2× Jollof", "1× Grilled tilapia", "1× Palm wine"],
    station: "Grill · Pass",
    status: "new" as const,
  },
  {
    id: "KOT-1041",
    table: "Takeaway",
    time: "14:05",
    items: ["1× Caesar salad", "2× Fresh juice"],
    station: "Cold",
    status: "fired" as const,
  },
  {
    id: "KOT-1040",
    table: "T04",
    time: "13:48",
    items: ["4× Burger combo", "2× Fries"],
    station: "Grill",
    status: "fired" as const,
  },
];

export default function KitchenBoardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== "1") {
      router.replace("/kitchen/login");
      return;
    }
    setReady(true);
  }, [router]);

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    router.replace("/kitchen/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-10">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0c0f14]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-6 w-6 text-[var(--pos-primary)]" strokeWidth={1.6} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Live line
            </p>
            <h1 className="text-lg font-bold text-white">Kitchen board</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/kitchen-config"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
          >
            KLD config
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-6 sm:px-6">
        <p className="text-sm text-slate-400">
          Demo tickets — connect to your KOT stream for real orders. SMS alerts
          are configured under KLD config.
        </p>

        <ul className="space-y-4">
          {DEMO_TICKETS.map((t) => (
            <li
              key={t.id}
              className={`rounded-2xl border p-4 sm:p-5 ${
                t.status === "new"
                  ? "border-[var(--pos-primary)]/50 bg-[var(--pos-primary)]/10"
                  : "border-white/10 bg-[#141922]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-slate-500">{t.id}</p>
                  <p className="text-lg font-bold text-white">{t.table}</p>
                  <p className="text-xs text-slate-400">{t.time}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                    t.status === "new"
                      ? "bg-[var(--pos-primary)] text-white"
                      : "bg-slate-600 text-white"
                  }`}
                >
                  {t.status}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-[var(--pos-primary)]">
                {t.station}
              </p>
              <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm text-slate-200">
                {t.items.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
