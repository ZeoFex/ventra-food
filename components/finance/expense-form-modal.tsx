"use client";

import { useFinance } from "@/components/finance/finance-context";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/finance-ledger";
import { gooeyToast } from "goey-toast";
import { X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export function ExpenseFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addExpense } = useFinance();
  const titleId = useId();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("supplies");
  const [vendor, setVendor] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setCategory("supplies");
    setVendor("");
    setNote("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const n = Number.parseFloat(amount);
      if (!Number.isFinite(n) || n <= 0) {
        gooeyToast.warning("Enter a valid amount");
        return;
      }
      addExpense({
        amountGhs: n,
        category,
        vendor: vendor.trim() || undefined,
        note: note.trim() || undefined,
      });
      gooeyToast.success("Expense recorded", {
        description: vendor.trim() || category,
      });
      onClose();
    },
    [amount, category, vendor, note, addExpense, onClose],
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-[var(--pos-border)] bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--pos-border)] px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-[var(--foreground)]">
            Record expense
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#9ca3af] hover:bg-[#f4f4f5]"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.6} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Amount (₵)
            </span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm tabular-nums outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Vendor <span className="font-normal normal-case">(optional)</span>
            </span>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Supplier name"
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Note <span className="font-normal normal-case">(optional)</span>
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1.5 w-full resize-none rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
            />
          </label>
        </div>

        <div className="flex gap-2 border-t border-[var(--pos-border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--pos-border)] py-2.5 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-[var(--pos-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--pos-primary-hover)]"
          >
            Save expense
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
