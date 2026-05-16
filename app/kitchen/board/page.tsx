"use client";

import {
  kitchenAdvanceButtonLabel,
  kitchenStatusLabel,
  KITCHEN_BOARD_CHANNEL,
  KITCHEN_BOARD_EVENT,
  KITCHEN_TICKETS_KEY,
  nextKitchenStatus,
  readKitchenTickets,
  updateKitchenTicketStatus,
  type KitchenBoardTicket,
  type KitchenTicketStatus,
} from "@/lib/kitchen-board-queue";
import { playKitchenIncomingTicket } from "@/lib/pos-beep";
import { LogOut, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_KEY = "ventra_kitchen_session";
/** One-time per tab: seed “known” ticket ids so opening the board does not ring for backlog */
const KITCHEN_SOUND_BOOT_KEY = "ventra_kitchen_incoming_sound_boot_v1";
const KITCHEN_KNOWN_IDS_KEY = "ventra_kitchen_known_ticket_ids_v1";

function loadKnownIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(KITCHEN_KNOWN_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function saveKnownIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(KITCHEN_KNOWN_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

function statusBadgeClass(s: KitchenTicketStatus): string {
  switch (s) {
    case "new":
      return "bg-[var(--pos-primary)] text-white";
    case "preparing":
      return "bg-sky-600 text-white";
    case "prepared":
      return "bg-emerald-600 text-white";
    case "completed":
      return "bg-slate-600 text-white";
    default:
      return "bg-slate-600 text-white";
  }
}

function cardBorderClass(s: KitchenTicketStatus): string {
  switch (s) {
    case "new":
      return "border-[var(--pos-primary)]/55 bg-[var(--pos-primary)]/12";
    case "preparing":
      return "border-sky-500/40 bg-sky-950/40";
    case "prepared":
      return "border-emerald-500/45 bg-emerald-950/35";
    case "completed":
      return "border-white/10 bg-[#141922]/80 opacity-80";
    default:
      return "border-white/10 bg-[#141922]";
  }
}

export default function KitchenBoardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tickets, setTickets] = useState<KitchenBoardTicket[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  const syncFromStorage = useCallback(() => {
    const list = readKitchenTickets();
    const bootDone = sessionStorage.getItem(KITCHEN_SOUND_BOOT_KEY) === "1";
    const known = loadKnownIds();

    if (!bootDone) {
      for (const t of list) known.add(t.id);
      saveKnownIds(known);
      sessionStorage.setItem(KITCHEN_SOUND_BOOT_KEY, "1");
      setTickets(list);
      return;
    }

    let shouldRing = false;
    for (const t of list) {
      if (known.has(t.id)) continue;
      known.add(t.id);
      if (t.status === "new") shouldRing = true;
    }
    saveKnownIds(known);
    setTickets(list);
    if (shouldRing) playKitchenIncomingTicket();
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== "1") {
      router.replace("/kitchen/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    syncFromStorage();
    const onEvt = () => syncFromStorage();
    window.addEventListener(KITCHEN_BOARD_EVENT, onEvt);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KITCHEN_TICKETS_KEY) syncFromStorage();
    };
    window.addEventListener("storage", onStorage);
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(KITCHEN_BOARD_CHANNEL);
      ch.onmessage = () => syncFromStorage();
    } catch {
      /* ignore */
    }
    return () => {
      window.removeEventListener(KITCHEN_BOARD_EVENT, onEvt);
      window.removeEventListener("storage", onStorage);
      try {
        ch?.close();
      } catch {
        /* ignore */
      }
    };
  }, [ready, syncFromStorage]);

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    router.replace("/kitchen/login");
  }

  const advance = useCallback(
    (id: string) => {
      const t = readKitchenTickets().find((x) => x.id === id);
      if (!t) return;
      const n = nextKitchenStatus(t.status);
      if (!n) return;
      updateKitchenTicketStatus(id, n);
      syncFromStorage();
    },
    [syncFromStorage],
  );

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  const sorted = [...tickets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const active = sorted.filter((t) => t.status !== "completed");
  const completed = sorted.filter((t) => t.status === "completed");

  return (
    <div className="min-h-dvh pb-10">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0c0f14]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <UtensilsCrossed
            className="h-6 w-6 text-[var(--pos-primary)]"
            strokeWidth={1.6}
          />
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
          Flow: <span className="text-slate-300">New → Preparing → Ready →</span>{" "}
          completed. New tickets play a ring tone (once per ticket).
        </p>

        {sorted.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/20 bg-[#141922]/50 px-4 py-12 text-center text-sm text-slate-500">
            No tickets yet. Place a QR order or tap{" "}
            <strong className="text-slate-400">KOT &amp; Print</strong> on the
            POS.
          </p>
        ) : (
          <>
            {active.length === 0 ? (
              <p className="text-center text-sm text-slate-500">
                No active tickets — all caught up.
              </p>
            ) : (
              <ul className="space-y-4">
                {active.map((t) => {
                  const next = nextKitchenStatus(t.status);
                  return (
                    <li
                      key={t.id}
                      className={`rounded-2xl border p-4 sm:p-5 ${cardBorderClass(
                        t.status,
                      )}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-xs text-slate-500">
                            {t.id}
                          </p>
                          <p className="text-lg font-bold text-white">
                            {t.table}
                          </p>
                          <p className="text-xs text-slate-400">
                            {t.time}
                            {t.source === "qr" ? (
                              <span className="ml-2 rounded bg-violet-500/20 px-1.5 py-0.5 font-semibold text-violet-200">
                                QR
                              </span>
                            ) : (
                              <span className="ml-2 rounded bg-slate-500/25 px-1.5 py-0.5 font-semibold text-slate-300">
                                POS
                              </span>
                            )}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusBadgeClass(
                            t.status,
                          )}`}
                        >
                          {kitchenStatusLabel(t.status)}
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
                      {next ? (
                        <button
                          type="button"
                          onClick={() => advance(t.id)}
                          className="mt-4 w-full rounded-xl border border-white/20 bg-white/10 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/15"
                        >
                          {kitchenAdvanceButtonLabel(next)}
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            {completed.length > 0 ? (
              <div className="border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCompleted((v) => !v)}
                  className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-slate-300"
                >
                  {showCompleted ? "Hide" : "Show"} completed ({completed.length})
                </button>
                {showCompleted ? (
                  <ul className="space-y-3">
                    {completed.map((t) => (
                      <li
                        key={t.id}
                        className="rounded-xl border border-white/10 bg-[#141922]/80 p-3 opacity-75"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="font-mono text-[10px] text-slate-500">
                            {t.id}
                          </span>
                          <span className="text-slate-500">
                            {kitchenStatusLabel(t.status)}
                          </span>
                        </div>
                        <p className="mt-1 font-semibold text-slate-300">
                          {t.table}
                        </p>
                        <ul className="mt-2 text-xs text-slate-500">
                          {t.items.map((line) => (
                            <li key={line}>· {line}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
