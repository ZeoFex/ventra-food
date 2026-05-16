"use client";

import { formatCedi, formatCediWhole } from "@/lib/format-cedi";
import {
  Banknote,
  CreditCard,
  Delete,
  Smartphone,
  Timer,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const ORANGE = "#ff7a1a";
const NAVY = "#1a2233";
const BORDER = "#e0e0e0";

export type PaymentMethodId = "cash" | "card" | "momo" | "due";

export type PaymentResult =
  | {
      kind: "settled";
      orderNumber: string | number;
      mode: "full" | "split";
      method: PaymentMethodId;
      totalDue: number;
      /** Amount customer tendered this step */
      tendered: number;
      /** Amount applied to the bill (≤ remaining before this step) */
      appliedToBill: number;
      /** Cash back / overpay */
      change: number;
      /** Running total now on the bill after this step */
      paidSoFar: number;
      /** Still owed after this step */
      stillDue: number;
      done: boolean;
    }
  | {
      kind: "deferred";
      orderNumber: string | number;
      totalDue: number;
      deferredAmount: number;
    };

const METHODS: {
  id: PaymentMethodId;
  label: string;
  Icon: typeof Banknote;
}[] = [
  { id: "cash", label: "Cash", Icon: Banknote },
  { id: "card", label: "Card", Icon: CreditCard },
  { id: "momo", label: "MoMo", Icon: Smartphone },
  { id: "due", label: "DUE", Icon: Timer },
];

const QUICK_AMOUNTS = [50, 65, 75, 85] as const;

const PAD_ROWS: (string | "back")[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "back"],
];

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseTender(raw: string): number {
  if (raw === "" || raw === ".") return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? roundMoney(n) : 0;
}

export type CollectPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  onComplete?: (result: PaymentResult) => void;
  orderNumber: string | number;
  totalDue: number;
};

export function CollectPaymentModal({
  open,
  onClose,
  onComplete,
  orderNumber,
  totalDue,
}: CollectPaymentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"full" | "split">("full");
  const [method, setMethod] = useState<PaymentMethodId>("cash");
  const [rawInput, setRawInput] = useState("");
  /** Confirmed payments already applied (split bill) */
  const [settledRunning, setSettledRunning] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      const whole = Math.max(0, Math.trunc(totalDue));
      setRawInput(String(whole));
      setMode("full");
      setMethod("cash");
      setSettledRunning(0);
      setError(null);
    }
  }, [open, totalDue]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const remainingBeforeKeypad = roundMoney(totalDue - settledRunning);
  const tender = useMemo(() => parseTender(rawInput), [rawInput]);
  const appliedThisStep = roundMoney(
    Math.min(Math.max(tender, 0), remainingBeforeKeypad),
  );
  const amountTowardBill = roundMoney(settledRunning + appliedThisStep);
  const dueAmount = roundMoney(Math.max(0, remainingBeforeKeypad - tender));
  const changeCash = roundMoney(
    method === "cash" ? Math.max(0, tender - remainingBeforeKeypad) : 0,
  );

  const syncInputToRemaining = useCallback(
    (nextRemaining: number) => {
      const r = Math.max(0, nextRemaining);
      setRawInput(r === 0 ? "0" : String(Math.trunc(r) === r ? Math.trunc(r) : r));
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
  }, [mode, method, rawInput, open]);

  const appendKey = (key: string) => {
    if (method === "due") return;
    if (key === ".") {
      if (rawInput.includes(".")) return;
      setRawInput((s) => (s === "" ? "0." : `${s}.`));
      return;
    }
    if (rawInput.includes(".")) {
      const [, frac = ""] = rawInput.split(".");
      if (frac.length >= 2) return;
    }
    setRawInput((s) => {
      if (s === "0" && key !== ".") return key;
      return s + key;
    });
  };

  const backspace = () => {
    if (method === "due") return;
    setRawInput((s) => s.slice(0, -1));
  };

  const applyQuick = (n: number) => {
    if (method === "due") return;
    setRawInput((s) => {
      const cur = parseTender(s);
      const next = roundMoney(cur + n);
      return String(Math.min(next, 999_999.99));
    });
  };

  const handleModeChange = (next: "full" | "split") => {
    setMode(next);
    setSettledRunning(0);
    setError(null);
    const whole = Math.max(0, Math.trunc(totalDue));
    setRawInput(String(whole));
  };

  const handleComplete = () => {
    setError(null);
    const remaining = roundMoney(totalDue - settledRunning);

    if (method === "due") {
      if (remaining <= 0) {
        setError("No balance left to defer.");
        return;
      }
      onComplete?.({
        kind: "deferred",
        orderNumber,
        totalDue,
        deferredAmount: remaining,
      });
      onClose();
      return;
    }

    if (tender <= 0) {
      setError("Enter an amount.");
      return;
    }

    if (mode === "full") {
      if (tender + 1e-9 < remaining) {
        setError(`Need at least ${formatCedi(remaining)} for full payment.`);
        return;
      }
      const applied = remaining;
      const change = roundMoney(tender - applied);
      const paidSoFar = roundMoney(settledRunning + applied);
      onComplete?.({
        kind: "settled",
        orderNumber,
        mode: "full",
        method,
        totalDue,
        tendered: tender,
        appliedToBill: applied,
        change,
        paidSoFar,
        stillDue: 0,
        done: true,
      });
      onClose();
      return;
    }

    /* Split: apply one tender, stay open until paid */
    const applied = Math.min(tender, remaining);
    const newSettled = roundMoney(settledRunning + applied);
    const nextDue = roundMoney(totalDue - newSettled);
    const done = nextDue <= 0.001;

    onComplete?.({
      kind: "settled",
      orderNumber,
      mode: "split",
      method,
      totalDue,
      tendered: tender,
      appliedToBill: applied,
      change: roundMoney(Math.max(0, tender - applied)),
      paidSoFar: newSettled,
      stillDue: Math.max(0, nextDue),
      done,
    });

    if (done) {
      onClose();
    } else {
      setSettledRunning(newSettled);
      syncInputToRemaining(nextDue);
    }
  };

  if (!mounted || !open) return null;

  const node = (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden bg-black/35"
      style={{
        WebkitBackdropFilter: "blur(20px)",
        backdropFilter: "blur(20px)",
      }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex min-h-[100dvh] w-full justify-center px-4 pb-10 pt-8"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="flex w-full max-w-[400px] shrink-0 flex-col rounded-[10px] bg-white shadow-[0_8px_40px_rgba(26,34,51,0.18)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="collect-payment-title"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <header
            className="flex items-start justify-between gap-4 border-b px-5 py-4"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center gap-3">
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border bg-white"
                style={{ borderColor: `${ORANGE}55`, color: ORANGE }}
              >
                <Banknote className="h-5 w-5" strokeWidth={1.75} />
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-[#ff7a1a]"
                  aria-hidden
                />
              </span>
              <h2
                id="collect-payment-title"
                className="text-[15px] font-bold leading-tight text-[#1a2233]"
              >
                Collect Payment
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium leading-tight text-[#6b7280]">
                Order #{orderNumber}
              </p>
              {mode === "split" && settledRunning > 0 ? (
                <>
                  <p
                    className="mt-0.5 text-[17px] font-bold tabular-nums leading-tight"
                    style={{ color: ORANGE }}
                  >
                    {formatCedi(remainingBeforeKeypad)}
                  </p>
                  <p className="text-[10px] font-medium text-[#9ca3af]">
                    due now · {formatCedi(totalDue)} total
                  </p>
                </>
              ) : (
                <p
                  className="mt-0.5 text-[17px] font-bold tabular-nums leading-tight"
                  style={{ color: ORANGE }}
                >
                  {formatCedi(totalDue)}
                </p>
              )}
            </div>
          </header>

          <div className="flex gap-2 px-5 pt-4">
            <button
              type="button"
              onClick={() => handleModeChange("full")}
              className="h-11 flex-1 rounded-[8px] text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-[0.97]"
              style={{ backgroundColor: mode === "full" ? ORANGE : NAVY }}
            >
              Full Payment
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("split")}
              className="h-11 flex-1 rounded-[8px] text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-[0.97]"
              style={{ backgroundColor: mode === "split" ? ORANGE : NAVY }}
            >
              Split Bill
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 px-5 pt-3">
            {METHODS.map(({ id, label, Icon }) => {
              const active = method === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMethod(id);
                    if (id === "due") {
                      setRawInput("0");
                      setError(null);
                    } else if (rawInput === "" || rawInput === "0") {
                      syncInputToRemaining(remainingBeforeKeypad);
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-[8px] border bg-white py-2.5 text-[11px] font-semibold transition-colors"
                  style={{
                    borderColor: active ? ORANGE : BORDER,
                    color: active ? ORANGE : "#374151",
                    backgroundColor: active ? "#fff8f3" : "#ffffff",
                  }}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.65} />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="px-5 pt-3">
            <div
              className={`flex min-h-[72px] items-center justify-center rounded-[8px] border bg-white py-4 ${
                method === "due" ? "opacity-60" : ""
              }`}
              style={{ borderColor: BORDER }}
            >
              <span className="text-[32px] font-bold tabular-nums tracking-tight text-[#1a2233]">
                {method === "due" ? "—" : rawInput || "0"}
              </span>
            </div>
            {method === "due" && (
              <p className="mt-1.5 text-center text-[11px] text-[#6b7280]">
                Deferred balance will be recorded for the full remaining amount.
              </p>
            )}
          </div>

          <div className="space-y-1.5 px-5 pt-3 text-[13px] leading-relaxed">
            <div className="flex justify-between text-[#6b7280]">
              <span>Total bill</span>
              <span className="font-semibold text-[#1a2233]">
                {formatCedi(totalDue)}
              </span>
            </div>
            {method === "due" ? (
              <div className="flex justify-between font-semibold text-amber-800">
                <span>Will defer</span>
                <span className="tabular-nums">
                  {formatCedi(remainingBeforeKeypad)}
                </span>
              </div>
            ) : (
              <>
                {mode === "split" && settledRunning > 0 && (
                  <div className="flex justify-between text-[#6b7280]">
                    <span>Paid so far</span>
                    <span className="font-semibold tabular-nums text-[#1a2233]">
                      {formatCedi(settledRunning)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#6b7280]">
                  <span>Customer tender</span>
                  <span className="font-semibold tabular-nums text-[#1a2233]">
                    {formatCedi(tender)}
                  </span>
                </div>
                {(mode !== "full" || appliedThisStep < tender - 1e-9) &&
                  remainingBeforeKeypad > 0 && (
                    <div className="flex justify-between text-[11px] text-[#9ca3af]">
                      <span>Applied this step</span>
                      <span className="tabular-nums">
                        {formatCedi(appliedThisStep)}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between text-[#6b7280]">
                  <span>On the bill</span>
                  <span className="font-semibold tabular-nums text-[#1a2233]">
                    {formatCedi(amountTowardBill)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-red-600">
                  <span>Balance due</span>
                  <span className="tabular-nums">{formatCedi(dueAmount)}</span>
                </div>
                {changeCash > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-700">
                    <span>Change due</span>
                    <span className="tabular-nums">{formatCedi(changeCash)}</span>
                  </div>
                )}
              </>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700">
                {error}
              </p>
            )}
            {method !== "due" &&
              mode === "split" &&
              settledRunning > 0 &&
              dueAmount > 0.001 && (
                <p className="text-[11px] text-[#6b7280]">
                  Split: apply this tender, then take the next payment until the
                  balance is clear.
                </p>
              )}
          </div>

          <div className="grid grid-cols-4 gap-2 px-5 pt-3">
            {QUICK_AMOUNTS.map((n) => (
              <button
                key={n}
                type="button"
                disabled={method === "due"}
                onClick={() => applyQuick(n)}
                className="h-9 rounded-[8px] border bg-white text-[11px] font-semibold text-[#374151] transition-colors hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: BORDER }}
              >
                {formatCediWhole(n)}
              </button>
            ))}
          </div>

          <div className="grid gap-2 px-5 py-3">
            {PAD_ROWS.map((row, ri) => (
              <div key={ri} className="grid grid-cols-3 gap-2">
                {row.map((cell) =>
                  cell === "back" ? (
                    <button
                      key="back"
                      type="button"
                      disabled={method === "due"}
                      onClick={backspace}
                      className="flex h-11 items-center justify-center rounded-[8px] border bg-white text-[#6b7280] hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ borderColor: BORDER }}
                      aria-label="Backspace"
                    >
                      <Delete className="h-[18px] w-[18px]" strokeWidth={1.5} />
                    </button>
                  ) : (
                    <button
                      key={cell}
                      type="button"
                      disabled={method === "due"}
                      onClick={() => appendKey(cell)}
                      className="h-11 rounded-[8px] border bg-white text-[17px] font-semibold text-[#1a2233] hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ borderColor: BORDER }}
                    >
                      {cell}
                    </button>
                  ),
                )}
              </div>
            ))}
          </div>

          <footer
            className="mt-auto flex gap-3 border-t px-5 py-4"
            style={{ borderColor: BORDER }}
          >
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-[8px] border bg-white text-[13px] font-semibold text-[#1a2233] hover:bg-[#fafafa]"
              style={{ borderColor: BORDER }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleComplete}
              className="h-12 flex-[1.45] rounded-[8px] text-[13px] font-semibold text-white hover:opacity-[0.97]"
              style={{ backgroundColor: ORANGE }}
            >
              {method === "due" ? (
                "Record balance (DUE)"
              ) : mode === "split" &&
                settledRunning > 0 &&
                dueAmount > 0.001 ? (
                "Apply payment"
              ) : (
                "Complete payment"
              )}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
