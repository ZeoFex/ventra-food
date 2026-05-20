"use client";

import { useStaff } from "@/components/staff/staff-context";
import { parseMoneyInput } from "@/lib/staff-shifts";
import { gooeyToast } from "goey-toast";
import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export function OpenShiftModal({
  open,
  onClose,
  staffId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  staffId: string;
  onSuccess?: () => void;
}) {
  const { openShift } = useStaff();
  const titleId = useId();
  const [opening, setOpening] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setOpening("");
    setNotes("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const openingCashGhs = parseMoneyInput(opening);
    if (openingCashGhs == null) {
      gooeyToast.warning("Enter opening float", {
        description: "How much cash is in the drawer at shift start?",
      });
      return;
    }
    const result = openShift(staffId, {
      openingCashGhs,
      notes: notes.trim() || undefined,
    });
    if (!result.ok) {
      gooeyToast.error(result.error);
      return;
    }
    gooeyToast.success("Shift started", {
      description: `Opening float ${openingCashGhs.toFixed(2)} GHS`,
    });
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
        className="w-full max-w-md rounded-2xl border border-[var(--pos-border)] bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--pos-border)] px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            Start shift
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
        <div className="space-y-4 px-5 py-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Opening float (GHS)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder="200.00"
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
              autoFocus
            />
            <p className="mt-1.5 text-xs text-[#6b7280]">
              Count the cash in the drawer before any sales. This is your
              starting baseline.
            </p>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Note (optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1.5 w-full resize-none rounded-lg border border-[var(--pos-border)] px-3 py-2 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
            />
          </label>
        </div>

        <div className="flex gap-2 border-t border-[var(--pos-border)] px-5 py-4">
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
            Start shift
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

