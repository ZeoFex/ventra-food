"use client";

import { Printer, X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export type ThermalKotLine = {
  name: string;
  qty: number;
  /** Kitchen instructions, e.g. "no onion" */
  notes?: string;
};

export type ThermalKotPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  businessName?: string;
  orderNumber: string | number;
  tableLabel?: string;
  /** Dine-in, Takeaway, etc. */
  serviceType?: string;
  lines: ThermalKotLine[];
};

function dashedRule() {
  return (
    <div
      className="my-2.5 border-t-2 border-dashed border-black/45"
      aria-hidden
    />
  );
}

export function ThermalKotPreviewModal({
  open,
  onClose,
  businessName = "RESTROBIT",
  orderNumber,
  tableLabel = "Table —",
  serviceType = "Dine-in",
  lines,
}: ThermalKotPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
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

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const now = new Date();
  const kotId = `KOT-${orderNumber}-${now.getTime().toString(36).toUpperCase()}`;
  const totalPieces = lines.reduce((s, l) => s + l.qty, 0);

  const node = (
    <div className="thermal-modal-root fixed inset-0 z-[190] overflow-y-auto overflow-x-hidden">
      <div
        className="thermal-print-hide fixed inset-0 bg-black/40"
        style={{
          WebkitBackdropFilter: "blur(8px)",
          backdropFilter: "blur(8px)",
        }}
        aria-hidden
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <div className="relative z-[1] mx-auto flex min-h-[min(100dvh,880px)] max-w-lg flex-col px-4 py-10">
        <div
          className="thermal-print-hide mb-3 flex shrink-0 items-center justify-between rounded-xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-black/5"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div>
            <p className="text-sm font-semibold text-[#1a2233]">KOT &amp; Print</p>
            <p className="text-xs text-[#64748b]">
              Kitchen ticket · 80mm · Order #{orderNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-3 py-2 text-xs font-semibold text-white hover:bg-black"
            >
              <Printer className="h-4 w-4" strokeWidth={1.75} />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e5e5] bg-white p-2 text-[#64748b] hover:bg-[#f8fafc]"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          id="thermal-kot"
          className="thermal-kot-root mx-auto w-full max-w-[280px] rounded-sm bg-[#fffef7] px-3 py-4 text-black shadow-[0_12px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-black/10"
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          }}
          role="document"
          aria-labelledby={titleId}
        >
          <div
            className="-mx-3 -mt-4 mb-3 flex h-3 justify-center gap-0.5 overflow-hidden opacity-50"
            aria-hidden
          >
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className="block w-2 -translate-y-2 rotate-45 border border-black/20 bg-[#fffef7]"
              />
            ))}
          </div>

          <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-black/55">
            Kitchen
          </p>
          <h1
            id={titleId}
            className="mt-1 text-center text-[17px] font-black uppercase leading-none tracking-tight text-black"
          >
            Order ticket
          </h1>
          <p className="mt-1 text-center text-[11px] font-semibold uppercase tracking-wide text-black/70">
            {businessName}
          </p>

          {dashedRule()}

          <p className="text-center text-[11px] font-bold tabular-nums text-black">
            {now.toLocaleString("en-GH", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[11px] leading-tight">
            <span className="font-bold text-black/50">Order</span>
            <span className="font-bold">#{orderNumber}</span>
            <span className="font-bold text-black/50">Ticket</span>
            <span className="break-all text-[10px]">{kotId}</span>
            <span className="font-bold text-black/50">Table</span>
            <span className="font-bold">{tableLabel}</span>
            <span className="font-bold text-black/50">Service</span>
            <span className="font-bold">{serviceType}</span>
          </div>

          {dashedRule()}

          <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-black/50">
            Items to prepare
          </p>

          <ul className="space-y-3">
            {lines.map((line, i) => (
              <li
                key={`${line.name}-${i}`}
                className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-2">
                  <span className="shrink-0 rounded bg-black px-2 py-0.5 text-[13px] font-black tabular-nums leading-none text-[#fffef7]">
                    {line.qty}×
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5 text-[12px] font-bold uppercase leading-snug tracking-tight text-black">
                    {line.name}
                  </span>
                </div>
                {line.notes?.trim() ? (
                  <p className="mt-1.5 pl-1 text-[10px] font-medium italic leading-snug text-black/70">
                    Note: {line.notes.trim()}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          {dashedRule()}

          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-black/50">Total portions</span>
            <span className="tabular-nums">{totalPieces}</span>
          </div>

          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-wide text-black/55">
            Fire immediately
          </p>

          <div
            className="-mx-3 -mb-4 mt-4 flex h-3 justify-center gap-0.5 overflow-hidden opacity-50"
            aria-hidden
          >
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className="block w-2 translate-y-2 rotate-45 border border-black/20 bg-[#fffef7]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
