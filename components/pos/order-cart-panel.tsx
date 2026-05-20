"use client";

import { useFinance } from "@/components/finance/finance-context";
import { usePromotions } from "@/components/promotions/promotions-context";
import { useStaff } from "@/components/staff/staff-context";
import { readActivePosStaffId } from "@/lib/pos-active-staff";
import type { FinancePayMethod } from "@/lib/finance-ledger";
import {
  Check,
  ChevronDown,
  FileText,
  Pencil,
  QrCode,
  ShoppingBag,
  StickyNote,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCedi } from "@/lib/format-cedi";
import type { PosCartLine } from "@/lib/pos-catalog";
import { roundMoney } from "@/lib/pos-catalog";
import { CartLineNotesModal } from "./cart-line-notes-modal";
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
        className="w-full cursor-pointer appearance-none rounded-lg border border-[#e5e5e5] bg-white py-2 pl-2.5 pr-8 text-[13px] font-medium text-[#374151] outline-none"
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
  orderNumber: number;
  lines: PosCartLine[];
  onIncrementLine: (lineId: string) => void;
  onDecrementLine: (lineId: string) => void;
  onRemoveLine: (lineId: string) => void;
  onSetLineNotes: (lineId: string, notes: string) => void;
  /** After successful payment — parent clears cart + bumps order # */
  onPaymentSettled?: () => void;
};

export function OrderCartPanel({
  draftOpen: draftControlled,
  onDraftOpenChange,
  orderNumber,
  lines,
  onIncrementLine,
  onDecrementLine,
  onRemoveLine,
  onSetLineNotes,
  onPaymentSettled,
}: OrderCartPanelProps) {
  const [notesModal, setNotesModal] = useState<{
    id: string;
    name: string;
    notes: string;
  } | null>(null);
  const [collectPaymentOpen, setCollectPaymentOpen] = useState(false);
  const [billPrintOpen, setBillPrintOpen] = useState(false);
  const [billAutoPrint, setBillAutoPrint] = useState(false);
  const [kotPrintOpen, setKotPrintOpen] = useState(false);
  const [draftInternalOpen, setDraftInternalOpen] = useState(false);
  const [dining, setDining] = useState("dine-in");
  const [table, setTable] = useState("floor");
  const [manualDiscount, setManualDiscount] = useState(0);
  const [appliedPromotionId, setAppliedPromotionId] = useState<string | null>(
    null,
  );
  const [couponInput, setCouponInput] = useState("");

  const {
    hydrated: promosHydrated,
    getPromotionById,
    getPromotionByCode,
    validateForOrder,
    recordPromotionUse,
  } = usePromotions();
  const { recordSale } = useFinance();
  const { getMemberById, getOpenShiftForStaff } = useStaff();

  const appliedPromotion = appliedPromotionId
    ? getPromotionById(appliedPromotionId)
    : undefined;

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

  const lineSubtotal = useMemo(
    () =>
      roundMoney(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)),
    [lines],
  );

  const clampDiscountInput = useCallback((raw: number) => {
    if (!Number.isFinite(raw) || raw < 0) return 0;
    return roundMoney(Math.min(raw, lineSubtotal));
  }, [lineSubtotal]);

  const couponDiscount = useMemo(() => {
    if (!appliedPromotion || lineSubtotal <= 0) return 0;
    const result = validateForOrder(appliedPromotion, lineSubtotal);
    return result.ok ? result.discountGhs : 0;
  }, [appliedPromotion, lineSubtotal, validateForOrder]);

  const discount = appliedPromotion ? couponDiscount : manualDiscount;

  const billTotal = useMemo(
    () => roundMoney(Math.max(0, lineSubtotal - discount)),
    [lineSubtotal, discount],
  );

  const receiptLines = useMemo(
    () =>
      lines.map((l) => ({
        name: l.name,
        qty: l.qty,
        unitPrice: l.unitPrice,
        notes: l.notes?.trim() || undefined,
      })),
    [lines],
  );

  const kotLines = useMemo(
    () =>
      lines.map((l) => ({
        name: l.name,
        qty: l.qty,
        notes: l.notes?.trim() || undefined,
      })),
    [lines],
  );

  const receiptSummary = useMemo(
    () => ({
      discount: roundMoney(discount),
      total: billTotal,
      discountLabel: appliedPromotion
        ? `Coupon ${appliedPromotion.code}`
        : discount > 0
          ? "Discount"
          : undefined,
    }),
    [discount, billTotal, appliedPromotion],
  );

  useEffect(() => {
    setManualDiscount((d) => clampDiscountInput(d));
  }, [lineSubtotal, clampDiscountInput]);

  useEffect(() => {
    if (lines.length === 0) {
      setManualDiscount(0);
      setAppliedPromotionId(null);
      setCouponInput("");
    }
  }, [lines.length]);

  useEffect(() => {
    if (!appliedPromotionId || !appliedPromotion) return;
    const result = validateForOrder(appliedPromotion, lineSubtotal);
    if (!result.ok) {
      setAppliedPromotionId(null);
      setCouponInput("");
      gooeyToast.warning("Coupon removed", { description: result.error });
    }
  }, [
    appliedPromotionId,
    appliedPromotion,
    lineSubtotal,
    validateForOrder,
  ]);

  const applyCoupon = useCallback(() => {
    if (!promosHydrated) {
      gooeyToast.warning("Coupons still loading");
      return;
    }
    const promo = getPromotionByCode(couponInput);
    if (!promo) {
      gooeyToast.error("Invalid coupon", {
        description: "No matching code. Check Discounts page.",
      });
      return;
    }
    const result = validateForOrder(promo, lineSubtotal);
    if (!result.ok) {
      gooeyToast.error("Cannot apply coupon", { description: result.error });
      return;
    }
    setAppliedPromotionId(promo.id);
    setCouponInput(promo.code);
    setManualDiscount(0);
    gooeyToast.success("Coupon applied", {
      description: `${promo.code} (−${formatCedi(result.discountGhs)})`,
    });
  }, [
    promosHydrated,
    couponInput,
    getPromotionByCode,
    validateForOrder,
    lineSubtotal,
  ]);

  const clearCoupon = useCallback(() => {
    setAppliedPromotionId(null);
    setCouponInput("");
  }, []);

  const clearBillAutoPrint = useCallback(() => {
    setBillAutoPrint(false);
  }, []);

  const diningLabel =
    dining === "takeaway"
      ? "Takeaway"
      : dining === "delivery"
        ? "Delivery"
        : "Dine-in";

  const tableLabel =
    table === "floor"
      ? "Walk-in"
      : table.replace(/^t-/, "Table ");

  const handlePaymentComplete = useCallback(
    (result: PaymentResult) => {
      if (result.kind === "settled" && result.done) {
        if (appliedPromotionId) {
          recordPromotionUse(appliedPromotionId);
        }

        const staffId = readActivePosStaffId();
        const staffMember = staffId ? getMemberById(staffId) : undefined;
        const openShift = staffId ? getOpenShiftForStaff(staffId) : undefined;
        const channel = `${tableLabel} · ${diningLabel}`;
        const itemCount = lines.reduce((s, l) => s + l.qty, 0);

        recordSale({
          orderNumber,
          subtotalGhs: lineSubtotal,
          discountGhs: roundMoney(discount),
          totalGhs: result.totalDue,
          method: result.method as FinancePayMethod,
          channel,
          itemCount,
          staffName: staffMember?.name,
          staffId: staffId ?? undefined,
          shiftId: openShift?.id,
          couponCode: appliedPromotion?.code,
        });

        setBillAutoPrint(true);
        setBillPrintOpen(true);
        onPaymentSettled?.();
      }
      if (process.env.NODE_ENV === "development") {
        console.info("[ventrafood] payment", result);
      }
    },
    [
      onPaymentSettled,
      appliedPromotionId,
      recordPromotionUse,
      recordSale,
      getMemberById,
      getOpenShiftForStaff,
      tableLabel,
      diningLabel,
      lines,
      orderNumber,
      lineSubtotal,
      discount,
      appliedPromotion?.code,
    ],
  );

  const handleResumeDraft = useCallback((draft: DraftTicket) => {
    if (process.env.NODE_ENV === "development") {
      console.info("[ventrafood] resume draft", draft);
    }
  }, []);

  const cartEmpty = lines.length === 0;

  return (
    <aside
      className="flex h-full min-h-0 w-full max-w-[320px] shrink-0 flex-col overflow-hidden rounded-lg border shadow-[0_1px_8px_rgba(15,23,42,0.05)]"
      style={{
        backgroundColor: PANEL_BG,
        borderColor: PANEL_BORDER,
      }}
    >
      <div className="shrink-0 space-y-2 p-3 pb-0">
        <div className="grid grid-cols-2 gap-2">
          <SelectField value={dining} onChange={(e) => setDining(e.target.value)}>
            <option value="dine-in">Dine-in</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
          </SelectField>
          <SelectField value={table} onChange={(e) => setTable(e.target.value)}>
            <option value="floor">Floor / walk-in</option>
            <option value="t-1">Table 1</option>
            <option value="t-2">Table 2</option>
            <option value="t-3">Table 3</option>
            <option value="t-4">Table 4</option>
            <option value="t-5">Table 5</option>
            <option value="t-6">Table 6</option>
            <option value="t-8">Table 8</option>
          </SelectField>
        </div>
      </div>

      <div className="shrink-0 px-3 pb-2 pt-0.5">
        <div className="flex items-center gap-2.5">
          <OrderBagCheckIcon />
          <span className="text-sm font-bold tracking-tight text-black">
            Order #{orderNumber}
          </span>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-2"
        style={{ scrollbarGutter: "stable" }}
      >
        {cartEmpty ? (
          <div className="rounded-2xl border border-dashed border-[#e5e5e5] bg-white/80 px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#6b7280]">Cart is empty</p>
            <p className="mt-1 text-xs text-[#9ca3af]">
              Tap + on a product to add items.
            </p>
          </div>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              className="rounded-xl border border-[#f0f0f0] bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-normal text-[#1a1a1a]">
                    {line.name}
                  </p>
                  {line.qrOrderBadge ? (
                    <p className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-md bg-violet-50 px-2 py-1 text-[10px] font-semibold leading-tight text-violet-900 ring-1 ring-violet-200/90">
                      <QrCode
                        className="h-3 w-3 shrink-0 opacity-90"
                        strokeWidth={2}
                      />
                      <span className="break-words">{line.qrOrderBadge}</span>
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveLine(line.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ef4444] text-white transition-opacity hover:opacity-90"
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
                  {`${formatCedi(line.unitPrice)} × ${line.qty} = `}
                </span>
                <span className="font-bold">
                  {formatCedi(line.unitPrice * line.qty)}
                </span>
              </p>
              {line.notes?.trim() ? (
                <p className="mt-2 rounded-lg bg-amber-50/90 px-2.5 py-2 text-[11px] leading-snug text-amber-950 ring-1 ring-amber-200/70">
                  <span className="font-semibold text-amber-900/90">Note: </span>
                  {line.notes.trim()}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <QuantityStepper
                  value={line.qty}
                  onIncrement={() => onIncrementLine(line.id)}
                  onDecrement={() => onDecrementLine(line.id)}
                />
                <button
                  type="button"
                  onClick={() =>
                    setNotesModal({
                      id: line.id,
                      name: line.name,
                      notes: line.notes ?? "",
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#f8fafc] px-2.5 py-1.5 text-xs font-medium text-[#64748b] hover:bg-[#f1f5f9]"
                >
                  <StickyNote className="h-3.5 w-3.5 text-[#64748b]" strokeWidth={1.6} />
                  {line.notes?.trim() ? "Edit notes" : "Add notes"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 border-t border-[#eaeaea] bg-[#fafafa] p-3">
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span>Sub total :</span>
            <span className="font-medium text-[#0f172a]">{formatCedi(lineSubtotal)}</span>
          </div>

          <div className="space-y-2 rounded-lg border border-[#ececec] bg-white p-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
              Coupon
            </p>
            {appliedPromotion ? (
              <div className="flex items-center justify-between gap-2 rounded-md bg-emerald-50 px-2.5 py-2 ring-1 ring-emerald-200/80">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 shrink-0 text-emerald-700" strokeWidth={2} />
                  <span className="truncate font-mono text-xs font-bold text-emerald-900">
                    {appliedPromotion.code}
                  </span>
                  <span className="text-xs text-emerald-800">
                    −{formatCedi(couponDiscount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearCoupon}
                  className="shrink-0 rounded p-1 text-emerald-800 hover:bg-emerald-100"
                  aria-label="Remove coupon"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyCoupon();
                    }
                  }}
                  placeholder="Code"
                  className="min-w-0 flex-1 rounded-md border border-[#e5e5e5] bg-white px-2 py-1.5 font-mono text-xs uppercase outline-none focus-visible:border-[#f27a21] focus-visible:ring-1 focus-visible:ring-[#f27a21]/30"
                  aria-label="Coupon code"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={!couponInput.trim() || cartEmpty}
                  className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                  style={{ backgroundColor: CART_ORANGE }}
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 text-[#6b7280]">
            <span className="shrink-0">
              {appliedPromotion ? "Coupon discount :" : "Discount :"}
            </span>
            <span className="inline-flex min-w-0 flex-1 items-center justify-end gap-1.5 font-medium text-[#0f172a]">
              {!appliedPromotion ? (
                <Pencil className="h-3.5 w-3.5 shrink-0 text-[#c4c4c4]" strokeWidth={1.6} />
              ) : null}
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                readOnly={Boolean(appliedPromotion)}
                value={Number.isFinite(discount) ? discount : 0}
                onChange={(e) => {
                  const v = Number.parseFloat(e.target.value);
                  setManualDiscount(clampDiscountInput(v));
                }}
                onBlur={() => setManualDiscount((d) => clampDiscountInput(d))}
                className="w-[5.5rem] rounded-md border border-[#e5e5e5] bg-white px-2 py-1 text-right text-sm tabular-nums outline-none focus-visible:border-[#f27a21] focus-visible:ring-1 focus-visible:ring-[#f27a21]/30 disabled:bg-[#f9fafb] disabled:text-[#6b7280]"
                aria-label="Order discount amount"
              />
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[#e5e5e5] pt-3 text-base font-bold text-[#0f172a]">
            <span>Total :</span>
            <span>{formatCedi(billTotal)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={cartEmpty}
              onClick={() => setKotPrintOpen(true)}
              className="flex min-h-[2.25rem] flex-[3] items-center justify-center rounded-lg text-[13px] font-semibold text-white transition-colors hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
              style={{ backgroundColor: CART_NAVY }}
            >
              KOT & Print
            </button>
            <button
              type="button"
              onClick={() => setDraftModalOpen(true)}
              className="flex min-h-[2.25rem] flex-1 items-center justify-center gap-1 rounded-lg border border-[#d1d5db] bg-white text-[13px] font-semibold text-[#6b7280] shadow-sm hover:bg-[#f9fafb]"
            >
              <FileText className="h-4 w-4 shrink-0" strokeWidth={1.6} />
              Draft
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={cartEmpty}
              onClick={() => setCollectPaymentOpen(true)}
              className="flex min-h-[2.25rem] flex-1 items-center justify-center rounded-lg text-[13px] font-semibold text-white shadow-sm transition-colors hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
              style={{ backgroundColor: CART_ORANGE }}
            >
              Bill & Payment
            </button>
            <button
              type="button"
              disabled={cartEmpty}
              onClick={() => setBillPrintOpen(true)}
              className="flex min-h-[2.25rem] flex-1 items-center justify-center rounded-lg text-[13px] font-semibold text-white transition-colors hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
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
        orderNumber={orderNumber}
        tableLabel={tableLabel}
        lines={receiptLines}
        summary={receiptSummary}
      />

      <ThermalKotPreviewModal
        open={kotPrintOpen}
        onClose={() => setKotPrintOpen(false)}
        orderNumber={orderNumber}
        tableLabel={tableLabel}
        serviceType={diningLabel}
        lines={kotLines}
      />

      <CollectPaymentModal
        open={collectPaymentOpen}
        onClose={() => setCollectPaymentOpen(false)}
        onComplete={handlePaymentComplete}
        orderNumber={orderNumber}
        totalDue={billTotal}
      />

      <DraftOrdersModal
        open={draftModalOpen}
        onClose={() => setDraftModalOpen(false)}
        activeOrderNumber={orderNumber}
        activeLineCount={lines.length}
        activeTotal={billTotal}
        onResumeDraft={handleResumeDraft}
      />

      <CartLineNotesModal
        open={notesModal != null}
        lineName={notesModal?.name ?? ""}
        initialNotes={notesModal?.notes ?? ""}
        onClose={() => setNotesModal(null)}
        onSave={(trimmed) => {
          if (notesModal) onSetLineNotes(notesModal.id, trimmed);
        }}
      />
    </aside>
  );
}
