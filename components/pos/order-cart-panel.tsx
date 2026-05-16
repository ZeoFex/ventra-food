"use client";

import {
  Check,
  ChevronDown,
  FileText,
  Pencil,
  Search,
  ShoppingBag,
  StickyNote,
  Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { formatCedi } from "@/lib/format-cedi";
import { CollectPaymentModal, type PaymentResult } from "./collect-payment-modal";
import {
  DraftOrdersModal,
  type DraftTicket,
} from "./draft-orders-modal";
import { ThermalBillPreviewModal } from "./thermal-bill-preview-modal";
import { ThermalKotPreviewModal } from "./thermal-kot-preview-modal";
import { QuantityStepper } from "./quantity-stepper";

const CART_ORANGE = "#f27a21";
const LINE_PRICE_ORANGE = "#d97706";
const CART_GREEN = "#10b981";
const CART_NAVY = "#0f172a";
const PANEL_BG = "#f9f9f9";
const PANEL_BORDER = "#e8e8e8";

const ORDER_NUMBER = 15;

const LINE_ITEMS = [
  { name: "Fresh Basil Salad", unit: 10, qty: 2, active: true },
  { name: "Fresh Basil Salad", unit: 10, qty: 1, active: false },
  { name: "Fresh Basil Salad", unit: 10, qty: 1, active: false },
] as const;

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

/** Line-sum total — summary, payment, and receipt stay in sync */
const BILL_TOTAL_GHS = roundMoney(
  LINE_ITEMS.reduce((s, l) => s + l.unit * l.qty, 0),
);

function OrderBagCheckIcon() {
  return (
    <span
      className="relative inline-flex h-7 w-7 shrink-0 text-black"
      aria-hidden
    >
      <ShoppingBag
        className="absolute inset-0 h-7 w-7"
        strokeWidth={1.65}
        stroke="currentColor"
        fill="none"
      />
      <Check
        className="absolute -bottom-0.5 -right-0.5 h-3 w-3"
        strokeWidth={2.75}
        stroke="currentColor"
      />
    </span>
  );
}

function SelectField({
  children,
  ...props
}: React.ComponentProps<"select"> & { children: React.ReactNode }) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full cursor-default appearance-none rounded-[10px] border border-[#e5e5e5] bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-[#374151] outline-none"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
        strokeWidth={1.75}
      />
    </div>
  );
}

export type OrderCartPanelProps = {
  /** When both are set, draft modal open state is controlled by the parent (e.g. header “Draft list”). */
  draftOpen?: boolean;
  onDraftOpenChange?: (open: boolean) => void;
};

export function OrderCartPanel({
  draftOpen: draftControlled,
  onDraftOpenChange,
}: OrderCartPanelProps = {}) {
  const [collectPaymentOpen, setCollectPaymentOpen] = useState(false);
  const [billPrintOpen, setBillPrintOpen] = useState(false);
  const [billAutoPrint, setBillAutoPrint] = useState(false);
  const [kotPrintOpen, setKotPrintOpen] = useState(false);
  const [draftInternalOpen, setDraftInternalOpen] = useState(false);

  const draftControlledMode =
    typeof draftControlled === "boolean" && onDraftOpenChange != null;
  const draftModalOpen = draftControlledMode ? draftControlled : draftInternalOpen;
  const setDraftModalOpen = useCallback(
    (next: boolean) => {
      if (draftControlledMode) onDraftOpenChange(next);
      else setDraftInternalOpen(next);
    },
    [draftControlledMode, onDraftOpenChange],
  );

  const receiptLines = LINE_ITEMS.map((l) => ({
    name: l.name,
    qty: l.qty,
    unitPrice: l.unit,
  }));

  const kotLines = LINE_ITEMS.map((l) => ({
    name: l.name,
    qty: l.qty,
  }));

  const receiptSummary = {
    productDiscount: 0,
    extraDiscount: 0,
    couponDiscount: 0,
    total: BILL_TOTAL_GHS,
  };

  const clearBillAutoPrint = useCallback(() => {
    setBillAutoPrint(false);
  }, []);

  const handlePaymentComplete = useCallback((result: PaymentResult) => {
    if (result.kind === "settled" && result.done) {
      setBillAutoPrint(true);
      setBillPrintOpen(true);
    }
    if (process.env.NODE_ENV === "development") {
      console.info("[ventrafood] payment", result);
    }
  }, []);

  const handleResumeDraft = useCallback((draft: DraftTicket) => {
    if (process.env.NODE_ENV === "development") {
      console.info("[ventrafood] resume draft", draft);
    }
  }, []);

  return (
    <aside
      className="flex h-full min-h-0 w-full max-w-[400px] shrink-0 flex-col overflow-hidden rounded-xl border shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
      style={{
        backgroundColor: PANEL_BG,
        borderColor: PANEL_BORDER,
      }}
    >
      <div className="shrink-0 space-y-3 p-4 pb-0">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
            strokeWidth={1.6}
          />
          <input
            type="search"
            readOnly
            placeholder="Search in Existing"
            className="w-full rounded-[10px] border border-[#e5e5e5] bg-white py-2.5 pl-9 pr-3 text-sm text-[#374151] outline-none placeholder:text-[#9ca3af] focus-visible:ring-2 focus-visible:ring-[#f27a21]/30"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SelectField disabled defaultValue="dining">
            <option value="dining">Select Dining</option>
          </SelectField>
          <SelectField disabled defaultValue="table">
            <option value="table">Select Table</option>
          </SelectField>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 pt-1">
        <div className="flex items-center gap-2.5">
          <OrderBagCheckIcon />
          <span className="text-sm font-bold tracking-tight text-black">
            Order #{ORDER_NUMBER}
          </span>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-2"
        style={{ scrollbarGutter: "stable" }}
      >
        {LINE_ITEMS.map((line, idx) => (
          <div
            key={`${line.name}-${idx}`}
            className="rounded-2xl border border-[#f0f0f0] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 text-sm font-normal text-[#1a1a1a]">
                {line.name}
              </p>
              <button
                type="button"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity ${
                  line.active
                    ? "bg-[#ef4444] text-white hover:opacity-90"
                    : "bg-[#fce8e8] text-[#f9a8a8] hover:bg-[#fce4e4]"
                }`}
                aria-label="Remove line"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <p
              className="mt-3 text-xs leading-relaxed"
              style={{ color: LINE_PRICE_ORANGE }}
            >
              <span className="font-normal">
                {`${formatCedi(line.unit)} × ${line.qty} = `}
              </span>
              <span className="font-bold">
                {formatCedi(line.unit * line.qty)}
              </span>
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <QuantityStepper value={line.qty} active={line.active} />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md bg-[#f8fafc] px-2.5 py-1.5 text-xs font-medium text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <StickyNote className="h-3.5 w-3.5 text-[#64748b]" strokeWidth={1.6} />
                Add Notes
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-[#eaeaea] bg-[#fafafa] p-4">
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span>Sub total :</span>
            <span className="font-medium text-[#0f172a]">{formatCedi(BILL_TOTAL_GHS)}</span>
          </div>
          <div className="flex items-center justify-between text-[#6b7280]">
            <span>Product Discount :</span>
            <span className="font-medium text-[#0f172a]">{formatCedi(0)}</span>
          </div>
          <div className="flex items-center justify-between text-[#6b7280]">
            <span>Extra Discount :</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[#0f172a]">
              <Pencil className="h-3.5 w-3.5 text-[#c4c4c4]" strokeWidth={1.6} />
              {formatCedi(0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#6b7280]">
            <span>Coupon discount :</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[#0f172a]">
              <Pencil className="h-3.5 w-3.5 text-[#c4c4c4]" strokeWidth={1.6} />
              {formatCedi(0)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[#e5e5e5] pt-3 text-base font-bold text-[#0f172a]">
            <span>Total :</span>
            <span>{formatCedi(BILL_TOTAL_GHS)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setKotPrintOpen(true)}
              className="flex min-h-[2.75rem] flex-[3] items-center justify-center rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-95"
              style={{ backgroundColor: CART_NAVY }}
            >
              KOT & Print
            </button>
            <button
              type="button"
              onClick={() => setDraftModalOpen(true)}
              className="flex min-h-[2.75rem] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#d1d5db] bg-white text-sm font-semibold text-[#6b7280] shadow-sm hover:bg-[#f9fafb]"
            >
              <FileText className="h-4 w-4 shrink-0" strokeWidth={1.6} />
              Draft
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCollectPaymentOpen(true)}
              className="flex min-h-[2.75rem] flex-1 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-95"
              style={{ backgroundColor: CART_ORANGE }}
            >
              Bill & Payment
            </button>
            <button
              type="button"
              onClick={() => setBillPrintOpen(true)}
              className="flex min-h-[2.75rem] flex-1 items-center justify-center rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-95"
              style={{ backgroundColor: CART_GREEN }}
            >
              Bill & Print
            </button>
          </div>
        </div>
      </div>

      <ThermalBillPreviewModal
        open={billPrintOpen}
        onClose={() => setBillPrintOpen(false)}
        autoPrint={billAutoPrint}
        onAutoPrintHandled={clearBillAutoPrint}
        orderNumber={ORDER_NUMBER}
        tableLabel="Dine-in"
        lines={receiptLines}
        summary={receiptSummary}
      />

      <ThermalKotPreviewModal
        open={kotPrintOpen}
        onClose={() => setKotPrintOpen(false)}
        orderNumber={ORDER_NUMBER}
        tableLabel="Table —"
        serviceType="Dine-in"
        lines={kotLines}
      />

      <CollectPaymentModal
        open={collectPaymentOpen}
        onClose={() => setCollectPaymentOpen(false)}
        onComplete={handlePaymentComplete}
        orderNumber={ORDER_NUMBER}
        totalDue={BILL_TOTAL_GHS}
      />

      <DraftOrdersModal
        open={draftModalOpen}
        onClose={() => setDraftModalOpen(false)}
        activeOrderNumber={ORDER_NUMBER}
        activeLineCount={LINE_ITEMS.length}
        activeTotal={BILL_TOTAL_GHS}
        onResumeDraft={handleResumeDraft}
      />
    </aside>
  );
}
