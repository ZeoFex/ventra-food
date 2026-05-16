"use client";

import { formatCedi } from "@/lib/format-cedi";
import {
  Check,
  Clock,
  QrCode,
  Smartphone,
  X,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

const BORDER = "#e0e0e0";
const NAVY = "#1a2233";

export type QrMenuOrderStatus = "pending" | "accepted";

export type QrMenuOrder = {
  id: string;
  code: string;
  tableOrName: string;
  items: { name: string; qty: number }[];
  total: number;
  placedAt: string;
  status: QrMenuOrderStatus;
  phone?: string;
};

const GUEST_QUEUE_KEY = "ventra_guest_orders_queue";

type GuestQueuePayload = {
  ref: string;
  table: string | null;
  items: { id?: string; name: string; qty: number; unitPrice?: number }[];
  total: number;
  at: string;
};

function formatGuestPlacedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Just now";
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString();
}

function initialOrders(): QrMenuOrder[] {
  return [
    {
      id: "qr-1",
      code: "QM-8K2F",
      tableOrName: "Table 6",
      items: [
        { name: "Jollof & goat", qty: 2 },
        { name: "Chapman", qty: 2 },
      ],
      total: 84.0,
      placedAt: "3 min ago",
      status: "pending",
      phone: "+233 55 100 2200",
    },
    {
      id: "qr-2",
      code: "QM-8K2E",
      tableOrName: "Patio · walk-up",
      items: [
        { name: "Fresh Basil Salad", qty: 1 },
        { name: "Grilled fish", qty: 1 },
      ],
      total: 52.5,
      placedAt: "8 min ago",
      status: "pending",
    },
    {
      id: "qr-3",
      code: "QM-8K2D",
      tableOrName: "Table 12",
      items: [{ name: "Burger combo", qty: 3 }],
      total: 96.0,
      placedAt: "14 min ago",
      status: "accepted",
      phone: "+233 20 441 0099",
    },
  ];
}

export type QrMenuOrdersModalProps = {
  open: boolean;
  onClose: () => void;
  /** Fires when staff accepts an order — merge into POS cart via API later */
  onAcceptToPos?: (order: QrMenuOrder) => void;
};

type Tab = "new" | "accepted";

export function QrMenuOrdersModal({
  open,
  onClose,
  onAcceptToPos,
}: QrMenuOrdersModalProps) {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<QrMenuOrder[]>(initialOrders);
  const [tab, setTab] = useState<Tab>("new");
  const [toast, setToast] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = sessionStorage.getItem(GUEST_QUEUE_KEY);
      if (!raw) return;
      const queue = JSON.parse(raw) as GuestQueuePayload[];
      if (!Array.isArray(queue)) return;
      setOrders((prev) => {
        const codes = new Set(prev.map((o) => o.code));
        const injected: QrMenuOrder[] = [];
        for (const q of queue) {
          if (!q?.ref || codes.has(q.ref)) continue;
          codes.add(q.ref);
          injected.push({
            id: `guest-${q.ref}`,
            code: q.ref,
            tableOrName: q.table?.trim()
              ? `Table ${q.table.trim()}`
              : "QR guest",
            items: (q.items ?? []).map((i) => ({
              name: i.name,
              qty: Math.max(1, i.qty ?? 1),
            })),
            total: typeof q.total === "number" ? q.total : 0,
            placedAt: formatGuestPlacedAt(q.at ?? ""),
            status: "pending",
          });
        }
        return injected.length ? [...injected, ...prev] : prev;
      });
    } catch {
      /* ignore */
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === "pending").length,
    [orders],
  );

  const visible = useMemo(
    () => orders.filter((o) => (tab === "new" ? o.status === "pending" : o.status === "accepted")),
    [orders, tab],
  );

  const accept = useCallback(
    (order: QrMenuOrder) => {
      setOrders((list) =>
        list.map((o) =>
          o.id === order.id ? { ...o, status: "accepted" as const } : o,
        ),
      );
      onAcceptToPos?.({ ...order, status: "accepted" });
      setToast(`Accepted ${order.code} — ring kitchen or add to cart in backend.`);
      setTab("accepted");
    },
    [onAcceptToPos],
  );

  const reject = useCallback((id: string) => {
    setOrders((list) => list.filter((o) => o.id !== id));
    setToast("Order removed from queue.");
  }, []);

  if (!mounted || !open) return null;

  const node = (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden bg-black/35"
      style={{
        WebkitBackdropFilter: "blur(20px)",
        backdropFilter: "blur(20px)",
      }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex min-h-[100dvh] w-full justify-center px-4 pb-10 pt-8"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="flex w-full max-w-[460px] shrink-0 flex-col rounded-[10px] bg-white shadow-[0_8px_40px_rgba(26,34,51,0.18)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <header
            className="flex items-start justify-between gap-3 border-b px-5 py-4"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border bg-white"
                style={{ borderColor: `${NAVY}33`, color: NAVY }}
              >
                <QrCode className="h-5 w-5" strokeWidth={1.65} />
              </span>
              <div>
                <h2
                  id={titleId}
                  className="text-[15px] font-bold leading-tight text-[#1a2233]"
                >
                  QR menu orders
                </h2>
                <p className="mt-0.5 text-xs text-[#6b7280]">
                  Guests who ordered from the scanned menu ·{" "}
                  <span className="font-semibold text-[#1a2233]">
                    {pendingCount} new
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e5e5] bg-white p-2 text-[#64748b] hover:bg-[#f8fafc]"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </header>

          <div className="flex gap-1 border-b px-3 py-2" style={{ borderColor: BORDER }}>
            {(
              [
                ["new", "New", pendingCount] as const,
                ["accepted", "Accepted", orders.filter((o) => o.status === "accepted").length] as const,
              ] satisfies [Tab, string, number][]
            ).map(([id, label, count]) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors sm:text-[13px] ${
                    active
                      ? "bg-[#1a2233] text-white shadow-sm"
                      : "text-[#64748b] hover:bg-[#f8fafc]"
                  }`}
                >
                  {label}
                  <span className="ml-1 tabular-nums opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {toast && (
            <div className="mx-4 mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200/80">
              {toast}
            </div>
          )}

          <div className="max-h-[min(58dvh,480px)] min-h-[180px] overflow-y-auto px-2 py-2">
            {visible.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-[#6b7280]">
                {tab === "new"
                  ? "No new QR orders right now."
                  : "No accepted orders in this session."}
              </p>
            ) : (
              <ul className="space-y-2 p-2">
                {visible.map((order) => (
                  <li
                    key={order.id}
                    className="rounded-xl border border-[#eaeaea] bg-[#fafafa] p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-[11px] font-semibold text-[var(--pos-primary)]">
                          {order.code}
                        </p>
                        <p className="text-sm font-bold text-[#1a2233]">
                          {order.tableOrName}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6b7280]">
                          <Clock className="h-3.5 w-3.5" strokeWidth={1.6} />
                          {order.placedAt}
                        </p>
                        {order.phone && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-[#64748b]">
                            <Smartphone className="h-3.5 w-3.5" strokeWidth={1.6} />
                            {order.phone}
                          </p>
                        )}
                      </div>
                      <p className="text-right text-base font-bold tabular-nums text-[#1a2233]">
                        {formatCedi(order.total)}
                      </p>
                    </div>
                    <ul className="mt-3 space-y-1 border-t border-[#e5e5e5] pt-3 text-xs text-[#374151]">
                      {order.items.map((line, i) => (
                        <li key={`${line.name}-${i}`}>
                          {line.qty}× {line.name}
                        </li>
                      ))}
                    </ul>
                    {order.status === "pending" ? (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => accept(order)}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2.5 text-xs font-semibold text-white"
                          style={{ backgroundColor: NAVY }}
                        >
                          <Check className="h-4 w-4" strokeWidth={2.25} />
                          Accept to POS
                        </button>
                        <button
                          type="button"
                          onClick={() => reject(order.id)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" strokeWidth={1.65} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 rounded-lg bg-emerald-50/80 px-2 py-2 text-center text-[11px] font-semibold text-emerald-800">
                        Accepted — sync to open check in your API next.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer
            className="border-t px-5 py-4"
            style={{ borderColor: BORDER }}
          >
            <p className="mb-3 text-center text-[11px] text-[#9ca3af]">
              Production: webhook from guest menu → this queue → accept merges
              lines into cart or creates a ticket.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-full rounded-[8px] border bg-white text-[13px] font-semibold text-[#1a2233] hover:bg-[#fafafa]"
              style={{ borderColor: BORDER }}
            >
              Close
            </button>
          </footer>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
