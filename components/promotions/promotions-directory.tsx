"use client";

import { PromotionFormModal } from "@/components/promotions/promotion-form-modal";
import { usePromotions } from "@/components/promotions/promotions-context";
import { formatCedi } from "@/lib/format-cedi";
import {
  formatPromotionValue,
  promotionKindLabel,
  type Promotion,
} from "@/lib/promotions";
import { gooeyToast } from "goey-toast";
import { Copy, Pencil, Search, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export function PromotionsDirectory({
  createOpen,
  onCreateOpenChange,
}: {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const {
    promotions,
    hydrated,
    addPromotion,
    updatePromotion,
    removePromotion,
  } = usePromotions();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [editTarget, setEditTarget] = useState<Promotion | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return promotions.filter((p) => {
      if (statusFilter === "active" && !p.active) return false;
      if (statusFilter === "inactive" && p.active) return false;
      if (!q) return true;
      const hay = [p.code, p.name, p.description ?? "", promotionKindLabel(p.kind)]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [promotions, query, statusFilter]);

  const summary = useMemo(() => {
    const active = promotions.filter((p) => p.active).length;
    const percentage = promotions.filter((p) => p.kind === "percentage").length;
    const totalUses = promotions.reduce((s, p) => s + p.usedCount, 0);
    return { total: promotions.length, active, percentage, totalUses };
  }, [promotions]);

  const savePromotion = useCallback(
    (promo: Promotion) => {
      const exists = promotions.some((p) => p.id === promo.id);
      if (exists) {
        updatePromotion(promo.id, promo);
      } else {
        const {
          id: _id,
          usedCount: _used,
          createdAt: _created,
          ...rest
        } = promo;
        addPromotion(rest);
      }
    },
    [promotions, addPromotion, updatePromotion],
  );

  const deletePromotion = useCallback(
    (p: Promotion) => {
      if (!window.confirm(`Delete coupon ${p.code}?`)) return;
      removePromotion(p.id);
      gooeyToast.info("Coupon removed", { description: p.code });
    },
    [removePromotion],
  );

  const copyCode = useCallback((code: string) => {
    void navigator.clipboard.writeText(code);
    gooeyToast.success("Code copied", { description: code });
  }, []);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center p-16 text-sm text-[#9ca3af]">
        Loading coupons…
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Coupons" value={String(summary.total)} />
          <SummaryCard label="Active" value={String(summary.active)} />
          <SummaryCard label="Percentage" value={String(summary.percentage)} />
          <SummaryCard label="Times used" value={String(summary.totalUses)} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="relative min-w-0 sm:max-w-md sm:flex-1 lg:max-w-lg">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
              strokeWidth={1.6}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, name…"
              className="w-full rounded-lg border border-[var(--pos-border)] bg-white py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/25"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              label="All"
            />
            <FilterPill
              active={statusFilter === "active"}
              onClick={() => setStatusFilter("active")}
              label="Active"
            />
            <FilterPill
              active={statusFilter === "inactive"}
              onClick={() => setStatusFilter("inactive")}
              label="Inactive"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--pos-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--pos-border)] bg-[#fafafa] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  <th className="px-4 py-3 font-medium sm:px-5">Coupon</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Discount</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Rules</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Usage</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Status</th>
                  <th className="px-4 py-3 text-right font-medium sm:px-5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-[#9ca3af]"
                    >
                      No coupons match your filters.
                    </td>
                  </tr>
                ) : (
                  visible.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--pos-border)] last:border-b-0 hover:bg-[#fafafa]"
                    >
                      <td className="px-4 py-4 sm:px-5">
                        <p className="font-mono text-sm font-bold tracking-wide text-[var(--foreground)]">
                          {row.code}
                        </p>
                        <p className="mt-0.5 text-sm text-[#374151]">{row.name}</p>
                        {row.description ? (
                          <p className="mt-1 text-xs text-[#9ca3af] line-clamp-2">
                            {row.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 sm:px-5">
                        <p className="font-semibold text-[var(--foreground)]">
                          {formatPromotionValue(row)}
                        </p>
                        <p className="text-xs text-[#9ca3af]">
                          {promotionKindLabel(row.kind)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-xs text-[#6b7280] sm:px-5">
                        {row.minOrderGhs != null ? (
                          <p>Min order {formatCedi(row.minOrderGhs)}</p>
                        ) : (
                          <p>No minimum</p>
                        )}
                        {row.kind === "percentage" && row.maxDiscountGhs != null ? (
                          <p className="mt-0.5">Max {formatCedi(row.maxDiscountGhs)}</p>
                        ) : null}
                        {row.endsAt ? (
                          <p className="mt-0.5">
                            Until {new Date(row.endsAt).toLocaleDateString()}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 tabular-nums sm:px-5">
                        <span className="font-medium text-[#374151]">
                          {row.usedCount}
                        </span>
                        {row.usageLimit != null ? (
                          <span className="text-[#9ca3af]"> / {row.usageLimit}</span>
                        ) : (
                          <span className="text-[#9ca3af]"> / ∞</span>
                        )}
                      </td>
                      <td className="px-4 py-4 sm:px-5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            row.active
                              ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80"
                              : "bg-[#f4f4f5] text-[#6b7280] ring-1 ring-[#e5e5e5]"
                          }`}
                        >
                          {row.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 sm:px-5">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn
                            label={`Copy ${row.code}`}
                            onClick={() => copyCode(row.code)}
                          >
                            <Copy className="h-4 w-4" strokeWidth={1.6} />
                          </IconBtn>
                          <IconBtn
                            label="Edit"
                            onClick={() => setEditTarget(row)}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.6} />
                          </IconBtn>
                          <IconBtn
                            label="Delete"
                            onClick={() => deletePromotion(row)}
                            danger
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-[#9ca3af]">
          Demo codes: <strong className="font-mono text-[#6b7280]">WELCOME10</strong>,{" "}
          <strong className="font-mono text-[#6b7280]">SAVE5</strong>,{" "}
          <strong className="font-mono text-[#6b7280]">LUNCH15</strong> — apply on the POS cart.
        </p>
      </div>

      <PromotionFormModal
        open={createOpen}
        onClose={() => onCreateOpenChange(false)}
        mode="create"
        initial={null}
        onSave={savePromotion}
      />
      <PromotionFormModal
        open={editTarget != null}
        onClose={() => setEditTarget(null)}
        mode="edit"
        initial={editTarget}
        onSave={savePromotion}
      />
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
        active
          ? "bg-[var(--foreground)] text-white shadow-sm"
          : "border border-[var(--pos-border)] bg-white text-[#374151] hover:bg-[#f9fafb]"
      }`}
    >
      {label}
    </button>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`rounded-lg p-2 transition-colors ${
        danger
          ? "text-[#ef4444] hover:bg-red-50"
          : "text-[#6b7280] hover:bg-[#f4f4f5] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}
