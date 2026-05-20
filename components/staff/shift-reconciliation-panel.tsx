"use client";

import { formatCedi } from "@/lib/format-cedi";
import {
  reconcileShift,
  SHIFT_BALANCE_TOLERANCE_GHS,
  type StaffShift,
} from "@/lib/staff-shifts";
import { AlertTriangle, CheckCircle2, Scale } from "lucide-react";

function ReconLine({
  label,
  value,
  bold,
  prefix,
}: {
  label: string;
  value: string;
  bold?: boolean;
  prefix?: "+" | "−" | "=";
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 text-sm ${
        bold ? "font-semibold text-[var(--foreground)]" : "text-[#374151]"
      }`}
    >
      <span className="min-w-0">
        {prefix ? (
          <span className="mr-1.5 inline-block w-3 font-mono text-[#9ca3af]">
            {prefix}
          </span>
        ) : null}
        {label}
      </span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}

export function ShiftReconciliationPanel({
  shift,
  compact,
}: {
  shift: StaffShift;
  compact?: boolean;
}) {
  const r = reconcileShift(shift);

  const varianceUi =
    r.varianceLabel === "pending"
      ? null
      : r.varianceLabel === "balanced"
        ? {
            icon: CheckCircle2,
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            title: "Drawer balanced",
            body: `Within ${formatCedi(SHIFT_BALANCE_TOLERANCE_GHS)} of expected.`,
          }
        : r.varianceLabel === "over"
          ? {
              icon: Scale,
              className: "border-amber-200 bg-amber-50 text-amber-950",
              title: "Cash over",
              body: `${formatCedi(r.varianceGhs ?? 0)} more than expected in drawer.`,
            }
          : {
              icon: AlertTriangle,
              className: "border-red-200 bg-red-50 text-red-900",
              title: "Cash short",
              body: `${formatCedi(Math.abs(r.varianceGhs ?? 0))} missing from drawer.`,
            };

  return (
    <div
      className={`rounded-xl border border-[var(--pos-border)] bg-[#fafafa] ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
        Cash drawer
      </p>
      <div className="mt-3 space-y-1.5">
        <ReconLine
          label="Opening float"
          value={formatCedi(r.openingCashGhs)}
        />
        <ReconLine
          prefix="+"
          label="Cash sales"
          value={formatCedi(r.cashSalesGhs)}
        />
        <ReconLine
          prefix="+"
          label="Cash paid in (top-up)"
          value={formatCedi(r.cashPayInsGhs)}
        />
        <ReconLine
          prefix="−"
          label="Cash paid out"
          value={formatCedi(r.cashPayOutsGhs)}
        />
        <ReconLine
          prefix="="
          label="Expected in drawer"
          value={formatCedi(r.expectedCashInDrawerGhs)}
          bold
        />
        {r.closingCountedCashGhs != null ? (
          <>
            <ReconLine
              label="Counted at close"
              value={formatCedi(r.closingCountedCashGhs)}
              bold
            />
            <ReconLine
              label="Over / short"
              value={
                r.varianceGhs != null
                  ? `${r.varianceGhs >= 0 ? "+" : "−"}${formatCedi(Math.abs(r.varianceGhs))}`
                  : "—"
              }
              bold
            />
          </>
        ) : (
          <p className="pt-1 text-xs text-[#6b7280]">
            Close the shift and enter a physical cash count to reconcile.
          </p>
        )}
      </div>

      {!compact ? (
        <>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
            Sales (all payment types)
          </p>
          

          <div className="mt-3 space-y-1.5">
            <ReconLine label="Cash" value={formatCedi(r.cashSalesGhs)} />
            <ReconLine label="Card" value={formatCedi(r.cardSalesGhs)} />
            <ReconLine label="Mobile money" value={formatCedi(r.momoSalesGhs)} />
            <ReconLine label="Credit / due" value={formatCedi(r.creditSalesGhs)} />
            <ReconLine
              prefix="="
              label="Total sales"
              value={formatCedi(r.totalSalesGhs)}
              bold
            />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[#6b7280]">
            Card, MoMo, and credit do not sit in the cash drawer. Only opening
            float, cash sales, pay-ins, and pay-outs affect the expected cash
            count.
          </p>
        </>
      ) : null}

      {varianceUi ? (
        <div
          className={`mt-4 flex gap-3 rounded-lg border px-3 py-2.5 ${varianceUi.className}`}
        >
          <varianceUi.icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
          <div>
            <p className="text-sm font-semibold">{varianceUi.title}</p>
            <p className="mt-0.5 text-xs opacity-90">{varianceUi.body}</p>
          </div>
        </div>
      ) : null}

      {shift.notes?.trim() ? (
        <p className="mt-3 text-xs text-[#6b7280]">
          <span className="font-semibold text-[#374151]">Note:</span>{" "}
          {shift.notes}
        </p>
      ) : null}
    </div>
  );
}
