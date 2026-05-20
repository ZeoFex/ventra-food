"use client";

import { usePromotions } from "@/components/promotions/promotions-context";
import {
  newPromotionId,
  normalizePromotionCode,
  type Promotion,
  type PromotionKind,
} from "@/lib/promotions";
import { roundMoney } from "@/lib/pos-catalog";
import { gooeyToast } from "goey-toast";
import { X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export function PromotionFormModal({
  open,
  onClose,
  mode,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial: Promotion | null;
  onSave: (promo: Promotion) => void;
}) {
  const { promotions } = usePromotions();
  const titleId = useId();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<PromotionKind>("percentage");
  const [value, setValue] = useState("10");
  const [active, setActive] = useState(true);
  const [minOrderGhs, setMinOrderGhs] = useState("");
  const [maxDiscountGhs, setMaxDiscountGhs] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setCode(initial.code);
      setName(initial.name);
      setDescription(initial.description ?? "");
      setKind(initial.kind);
      setValue(String(initial.value));
      setActive(initial.active);
      setMinOrderGhs(
        initial.minOrderGhs != null ? String(initial.minOrderGhs) : "",
      );
      setMaxDiscountGhs(
        initial.maxDiscountGhs != null ? String(initial.maxDiscountGhs) : "",
      );
      setUsageLimit(
        initial.usageLimit != null ? String(initial.usageLimit) : "",
      );
      setStartsAt(
        initial.startsAt ? initial.startsAt.slice(0, 16) : "",
      );
      setEndsAt(initial.endsAt ? initial.endsAt.slice(0, 16) : "");
    } else {
      setCode("");
      setName("");
      setDescription("");
      setKind("percentage");
      setValue("10");
      setActive(true);
      setMinOrderGhs("");
      setMaxDiscountGhs("");
      setUsageLimit("");
      setStartsAt("");
      setEndsAt("");
    }
  }, [open, mode, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const parseOptionalMoney = (raw: string): number | undefined => {
    const t = raw.trim();
    if (!t) return undefined;
    const n = Number.parseFloat(t);
    if (!Number.isFinite(n) || n < 0) return undefined;
    return roundMoney(n);
  };

  const parseOptionalInt = (raw: string): number | undefined => {
    const t = raw.trim();
    if (!t) return undefined;
    const n = Number.parseInt(t, 10);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return n;
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const normalizedCode = normalizePromotionCode(code);
      const promoName = name.trim();
      const val = Number.parseFloat(value);

      if (!normalizedCode) {
        gooeyToast.warning("Coupon code required");
        return;
      }
      if (!promoName) {
        gooeyToast.warning("Name required");
        return;
      }
      if (!Number.isFinite(val) || val <= 0) {
        gooeyToast.warning("Enter a valid discount value");
        return;
      }
      if (kind === "percentage" && val > 100) {
        gooeyToast.warning("Percentage cannot exceed 100");
        return;
      }

      const duplicate = promotions.some(
        (p) =>
          p.code === normalizedCode &&
          (mode !== "edit" || p.id !== initial?.id),
      );
      if (duplicate) {
        gooeyToast.error("Code already in use", { description: normalizedCode });
        return;
      }

      const minOrder = parseOptionalMoney(minOrderGhs);
      const maxDiscount = parseOptionalMoney(maxDiscountGhs);
      const limit = parseOptionalInt(usageLimit);

      const promo: Promotion = {
        id: mode === "edit" && initial ? initial.id : newPromotionId(),
        code: normalizedCode,
        name: promoName,
        description: description.trim() || undefined,
        kind,
        value: kind === "percentage" ? val : roundMoney(val),
        active,
        minOrderGhs: minOrder,
        maxDiscountGhs: kind === "percentage" ? maxDiscount : undefined,
        usageLimit: limit,
        usedCount: mode === "edit" && initial ? initial.usedCount : 0,
        startsAt: startsAt.trim()
          ? new Date(startsAt).toISOString()
          : undefined,
        endsAt: endsAt.trim() ? new Date(endsAt).toISOString() : undefined,
        createdAt:
          mode === "edit" && initial
            ? initial.createdAt
            : new Date().toISOString(),
      };

      onSave(promo);
      onClose();
      gooeyToast.success(mode === "edit" ? "Coupon updated" : "Coupon created", {
        description: normalizedCode,
      });
    },
    [
      code,
      name,
      description,
      kind,
      value,
      active,
      minOrderGhs,
      maxDiscountGhs,
      usageLimit,
      startsAt,
      endsAt,
      promotions,
      mode,
      initial,
      onSave,
      onClose,
    ],
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
        className="w-full max-w-lg rounded-2xl border border-[var(--pos-border)] bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--pos-border)] px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-[var(--foreground)]">
            {mode === "edit" ? "Edit coupon" : "New coupon"}
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

        <div className="max-h-[min(70vh,560px)] space-y-4 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Coupon code
            </span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 font-mono text-sm uppercase outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Display name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Welcome discount"
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Description <span className="font-normal normal-case">(optional)</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1.5 w-full resize-none rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                Discount type
              </span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as PromotionKind)}
                className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount (₵)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                {kind === "percentage" ? "Percent off" : "Amount off (₵)"}
              </span>
              <input
                type="number"
                min={0}
                step={kind === "percentage" ? 1 : 0.5}
                max={kind === "percentage" ? 100 : undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm tabular-nums outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                Min order (₵) <span className="font-normal normal-case">(optional)</span>
              </span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={minOrderGhs}
                onChange={(e) => setMinOrderGhs(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
              />
            </label>
            {kind === "percentage" ? (
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                  Max discount (₵) <span className="font-normal normal-case">(optional)</span>
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={maxDiscountGhs}
                  onChange={(e) => setMaxDiscountGhs(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
                />
              </label>
            ) : (
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                  Usage limit <span className="font-normal normal-case">(optional)</span>
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
                />
              </label>
            )}
          </div>
          {kind === "percentage" ? (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                Usage limit <span className="font-normal normal-case">(optional)</span>
              </span>
              <input
                type="number"
                min={1}
                step={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
              />
            </label>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                Valid from <span className="font-normal normal-case">(optional)</span>
              </span>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                Valid until <span className="font-normal normal-case">(optional)</span>
              </span>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
              />
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--pos-border)] text-[var(--pos-primary)]"
            />
            <span className="text-sm font-medium text-[#374151]">Active — usable at POS</span>
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
            {mode === "edit" ? "Save changes" : "Create coupon"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
