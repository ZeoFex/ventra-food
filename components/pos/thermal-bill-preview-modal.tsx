"use client";

import { formatCedi } from "@/lib/format-cedi";
import { Printer, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ThermalReceiptLine = {
  name: string;
  qty: number;
  unitPrice: number;
};

export type ThermalReceiptSummary = {
  productDiscount: number;
  extraDiscount: number;
  couponDiscount: number;
  total: number;
};

export type ThermalBillPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  /** After payment: open preview and trigger browser print once DOM is ready */
  autoPrint?: boolean;
  onAutoPrintHandled?: () => void;
  businessName?: string;
  tagline?: string;
  orderNumber: string | number;
  tableLabel?: string;
  lines: ThermalReceiptLine[];
  summary: ThermalReceiptSummary;
};

function dashedRule() {
  return (
    <div
      className="my-2 border-t border-dashed border-black/35"
      aria-hidden
    />
  );
}

function formatLineTotal(unit: number, qty: number) {
  return formatCedi(Math.round(unit * qty * 100) / 100);
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export function ThermalBillPreviewModal({
  open,
  onClose,
  autoPrint = false,
  onAutoPrintHandled,
  businessName = "RESTROBIT",
  tagline = "Kitchen · Bar · Grill",
  orderNumber,
  tableLabel = "Table —",
  lines,
  summary,
}: ThermalBillPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
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
    if (!open || !autoPrint) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      window.print();
      onAutoPrintHandled?.();
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, autoPrint, onAutoPrintHandled]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const itemsGross = useMemo(
    () => roundMoney(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)),
    [lines],
  );
  const discountTotal = useMemo(
    () =>
      roundMoney(
        summary.productDiscount +
          summary.extraDiscount +
          summary.couponDiscount,
      ),
    [
      summary.productDiscount,
      summary.extraDiscount,
      summary.couponDiscount,
    ],
  );
  const afterDiscounts = roundMoney(itemsGross - discountTotal);
  const adjustment = roundMoney(summary.total - afterDiscounts);
  const showAdjustment = Math.abs(adjustment) > 0.005;

  if (!mounted || !open) return null;

  const now = new Date();
  const receiptId = `TX-${orderNumber}-${now.getTime().toString(36).toUpperCase()}`;

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
              <p className="text-sm font-semibold text-[#1a2233]">
                Bill & Print
              </p>
              <p className="text-xs text-[#64748b]">
                80mm thermal preview · Order #{orderNumber}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a2233] px-3 py-2 text-xs font-semibold text-white hover:bg-black"
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
            ref={receiptRef}
            id="thermal-receipt"
            className="thermal-receipt-root mx-auto w-full max-w-[280px] rounded-sm bg-[#fffef7] px-3 py-4 text-black shadow-[0_12px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-black/10"
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            }}
            role="document"
            aria-labelledby={titleId}
          >
            {/* Serrated top */}
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

            <h1
              id={titleId}
              className="text-center text-[15px] font-bold uppercase tracking-[0.12em] text-black"
            >
              {businessName}
            </h1>
            <p className="mt-0.5 text-center text-[10px] uppercase tracking-wider text-black/60">
              {tagline}
            </p>
            <p className="mt-1 text-center text-[9px] leading-relaxed text-black/50">
              Accra · GH · +233 00 000 0000
            </p>

            {dashedRule()}

            <p className="text-center text-[11px] font-bold uppercase tracking-wide">
              Tax invoice / Bill
            </p>
            <p className="mt-1 text-center text-[10px] text-black/70">
              {now.toLocaleString("en-GH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>

            {dashedRule()}

            <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5 text-[10px]">
              <span className="text-black/55">Order</span>
              <span className="text-right font-semibold">#{orderNumber}</span>
              <span className="text-black/55">Receipt</span>
              <span className="text-right text-[9px]">{receiptId}</span>
              <span className="text-black/55">Service</span>
              <span className="text-right">{tableLabel}</span>
            </div>

            {dashedRule()}

            <div className="mb-1 flex justify-between text-[9px] font-bold uppercase text-black/55">
              <span className="w-[2rem]">Qty</span>
              <span className="min-w-0 flex-1 px-1">Item</span>
              <span className="w-[4.5rem] text-right">Amt</span>
            </div>

            <div className="space-y-1.5 text-[10px] leading-tight">
              {lines.map((line, i) => (
                <div key={`${line.name}-${i}`} className="flex gap-1">
                  <span className="w-[2rem] shrink-0 text-right tabular-nums">
                    {line.qty}
                  </span>
                  <span className="min-w-0 flex-1 break-words">
                    {line.name}
                  </span>
                  <span className="w-[4.5rem] shrink-0 text-right tabular-nums">
                    {formatLineTotal(line.unitPrice, line.qty)}
                  </span>
                </div>
              ))}
            </div>

            {dashedRule()}

            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-black/55">Subtotal</span>
                <span className="tabular-nums">{formatCedi(itemsGross)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/55">Product disc.</span>
                <span className="tabular-nums">
                  −{formatCedi(summary.productDiscount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/55">Extra disc.</span>
                <span className="tabular-nums">
                  −{formatCedi(summary.extraDiscount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/55">Coupon</span>
                <span className="tabular-nums">
                  −{formatCedi(summary.couponDiscount)}
                </span>
              </div>
              {showAdjustment && (
                <div className="flex justify-between">
                  <span className="text-black/55">Other charges</span>
                  <span className="tabular-nums">{formatCedi(adjustment)}</span>
                </div>
              )}
            </div>

            {dashedRule()}

            <div className="flex justify-between text-[12px] font-bold">
              <span>TOTAL</span>
              <span className="tabular-nums">{formatCedi(summary.total)}</span>
            </div>

            {/* Pseudo barcode */}
            <div
              className="mx-auto mt-3 h-10 w-[85%] opacity-80"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  90deg,
                  #000 0px,
                  #000 2px,
                  transparent 2px,
                  transparent 4px,
                  #000 4px,
                  #000 5px,
                  transparent 5px,
                  transparent 8px
                )`,
              }}
              aria-hidden
            />
            <p className="mt-1 text-center text-[9px] tracking-[0.2em] text-black/40">
              *{receiptId.slice(-12)}*
            </p>

            {dashedRule()}

            <p className="text-center text-[10px] font-semibold text-black/60">
              Thank you — visit again
            </p>
            <p className="mt-0.5 text-center text-[9px] text-black/40">
              Powered by Ventra Food POS
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
