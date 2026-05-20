"use client";

import { useFinance } from "@/components/finance/finance-context";
import { ShiftReconciliationPanel } from "@/components/staff/shift-reconciliation-panel";
import { useStaff } from "@/components/staff/staff-context";
import { formatCedi } from "@/lib/format-cedi";
import {
  formatMoneyFieldValue,
  summarizeShiftSales,
} from "@/lib/finance-ledger";
import { parseMoneyInput, reconcileShift, type StaffShift } from "@/lib/staff-shifts";
import { gooeyToast } from "goey-toast";
import { Info, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";

function MoneyField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
      />
      {hint ? <p className="mt-1 text-[11px] text-[#6b7280]">{hint}</p> : null}
    </label>
  );
}

export function CloseShiftModal({
  open,
  onClose,
  shift,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  shift: StaffShift;
  onSuccess?: () => void;
}) {
  const { closeShift, getMemberById } = useStaff();
  const { entries, hydrated: financeHydrated } = useFinance();
  const titleId = useId();

  const [cashSales, setCashSales] = useState("");
  const [cardSales, setCardSales] = useState("");
  const [momoSales, setMomoSales] = useState("");
  const [creditSales, setCreditSales] = useState("");
  const [payOuts, setPayOuts] = useState("");
  const [payIns, setPayIns] = useState("");
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");
  const [posSaleCount, setPosSaleCount] = useState(0);

  const posTotals = useMemo(() => {
    if (!open || !financeHydrated) return null;
    const member = getMemberById(shift.staffId);
    return summarizeShiftSales(entries, {
      shiftId: shift.id,
      staffId: shift.staffId,
      staffName: member?.name,
      startedAt: shift.startedAt,
      endedAt: shift.endedAt,
    });
  }, [
    open,
    financeHydrated,
    entries,
    shift.id,
    shift.staffId,
    shift.startedAt,
    shift.endedAt,
    getMemberById,
  ]);

  useEffect(() => {
    if (!open) return;

    if (posTotals) {
      setCashSales(formatMoneyFieldValue(posTotals.cashGhs));
      setCardSales(formatMoneyFieldValue(posTotals.cardGhs));
      setMomoSales(formatMoneyFieldValue(posTotals.momoGhs));
      setCreditSales(formatMoneyFieldValue(posTotals.creditGhs));
      setPosSaleCount(posTotals.saleCount);
    } else {
      setCashSales("0");
      setCardSales("0");
      setMomoSales("0");
      setCreditSales("0");
      setPosSaleCount(0);
    }

    setPayOuts(formatMoneyFieldValue(shift.cashPayOutsGhs));
    setPayIns(formatMoneyFieldValue(shift.cashPayInsGhs));
    setCounted("");
    setNotes(shift.notes ?? "");
  }, [open, shift.cashPayOutsGhs, shift.cashPayInsGhs, shift.notes, posTotals]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const previewShift = useMemo((): StaffShift => {
    const draft: StaffShift = {
      ...shift,
      status: "closed",
      endedAt: new Date().toISOString(),
      cashSalesGhs: parseMoneyInput(cashSales) ?? 0,
      cardSalesGhs: parseMoneyInput(cardSales) ?? 0,
      momoSalesGhs: parseMoneyInput(momoSales) ?? 0,
      creditSalesGhs: parseMoneyInput(creditSales) ?? 0,
      cashPayOutsGhs: parseMoneyInput(payOuts) ?? 0,
      cashPayInsGhs: parseMoneyInput(payIns) ?? 0,
      closingCountedCashGhs: parseMoneyInput(counted) ?? undefined,
    };
    return draft;
  }, [shift, cashSales, cardSales, momoSales, creditSales, payOuts, payIns, counted]);

  const previewRecon = useMemo(() => reconcileShift(previewShift), [previewShift]);

  if (!open || typeof document === "undefined") return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cashSalesGhs = parseMoneyInput(cashSales);
    const cardSalesGhs = parseMoneyInput(cardSales);
    const momoSalesGhs = parseMoneyInput(momoSales);
    const creditSalesGhs = parseMoneyInput(creditSales);
    const cashPayOutsGhs = parseMoneyInput(payOuts);
    const cashPayInsGhs = parseMoneyInput(payIns);
    const closingCountedCashGhs = parseMoneyInput(counted);

    if (
      cashSalesGhs == null ||
      cardSalesGhs == null ||
      momoSalesGhs == null ||
      creditSalesGhs == null ||
      cashPayOutsGhs == null ||
      cashPayInsGhs == null ||
      closingCountedCashGhs == null
    ) {
      gooeyToast.warning("Check all amounts", {
        description: "Every field must be a valid number (0 or more).",
      });
      return;
    }

    const result = closeShift(shift.id, {
      cashSalesGhs,
      cardSalesGhs,
      momoSalesGhs,
      creditSalesGhs,
      cashPayOutsGhs,
      cashPayInsGhs,
      closingCountedCashGhs,
      notes: notes.trim() || undefined,
    });
    if (!result.ok) {
      gooeyToast.error(result.error);
      return;
    }

    const label =
      previewRecon.varianceLabel === "balanced"
        ? "Drawer balanced"
        : previewRecon.varianceLabel === "over"
          ? "Cash over"
          : "Cash short";
    gooeyToast.success("Shift closed", { description: label });
    onClose();
    onSuccess?.();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-labelledby={titleId}
        onSubmit={submit}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--pos-border)] bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--pos-border)] px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            Close shift
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#9ca3af] hover:bg-[#f4f4f5]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <p className="text-xs text-[#6b7280]">
            Sales by payment type are prefilled from POS checkouts this shift.
            Adjust if needed, then count physical cash in the drawer.
          </p>

          {posTotals && posSaleCount > 0 ? (
            <div className="flex gap-2 rounded-lg border border-sky-200/80 bg-sky-50 px-3 py-2.5 text-xs text-sky-950">
              <Info className="h-4 w-4 shrink-0 text-sky-700" strokeWidth={2} />
              <p>
                <strong className="font-semibold">{posSaleCount}</strong> settled
                POS sale{posSaleCount === 1 ? "" : "s"} since shift start
                {posTotals.cashGhs +
                  posTotals.cardGhs +
                  posTotals.momoGhs +
                  posTotals.creditGhs >
                0 ? (
                  <>
                    {" "}
                    · total{" "}
                    {formatCedi(
                      posTotals.cashGhs +
                        posTotals.cardGhs +
                        posTotals.momoGhs +
                        posTotals.creditGhs,
                    )}
                  </>
                ) : null}
                .
              </p>
            </div>
          ) : open && financeHydrated ? (
            <div className="flex gap-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
              <Info className="h-4 w-4 shrink-0 text-amber-800" strokeWidth={2} />
              <p>
                No POS sales recorded for this shift yet. Totals default to 0 —
                complete <strong className="font-semibold">Bill &amp; Payment</strong>{" "}
                on orders to auto-fill next time.
              </p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <MoneyField label="Cash sales" value={cashSales} onChange={setCashSales} />
            <MoneyField label="Card sales" value={cardSales} onChange={setCardSales} />
            <MoneyField label="Mobile money" value={momoSales} onChange={setMomoSales} />
            <MoneyField
              label="Credit / due"
              value={creditSales}
              onChange={setCreditSales}
              hint="Not in drawer"
            />
            <MoneyField
              label="Cash paid out"
              value={payOuts}
              onChange={setPayOuts}
              hint="Removed from drawer"
            />
            <MoneyField
              label="Cash paid in"
              value={payIns}
              onChange={setPayIns}
              hint="Added to drawer"
            />
          </div>

          <MoneyField
            label="Counted cash in drawer (GHS)"
            value={counted}
            onChange={setCounted}
            hint="Physical count at shift end — required"
          />

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Closing note
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1.5 w-full resize-none rounded-lg border border-[var(--pos-border)] px-3 py-2 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
              placeholder="Explain any over/short…"
            />
          </label>

          <ShiftReconciliationPanel shift={previewShift} compact />
        </div>

        <div className="flex shrink-0 gap-2 border-t border-[var(--pos-border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--pos-border)] py-2.5 text-sm font-semibold text-[#374151]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-[var(--pos-primary)] py-2.5 text-sm font-semibold text-white"
          >
            Close & save
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

