"use client";

import { Minus, Plus } from "lucide-react";

/** Terracotta / amber — matches price line and + control */
const ACCENT = "#d97706";

export function QuantityStepper({
  value,
  active = true,
}: {
  value: number;
  active?: boolean;
}) {
  if (active) {
    return (
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[#4b5563] transition-colors hover:bg-[#e5e7eb]"
          aria-label="Decrease quantity"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <span className="min-w-[1.25rem] text-center text-sm font-medium tabular-nums text-[#4b5563]">
          {value}
        </span>
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
          aria-label="Increase quantity"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[#d1d5db]"
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <span className="min-w-[1.25rem] text-center text-sm font-medium tabular-nums text-[#9ca3af]">
        {value}
      </span>
      <button
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] text-[#d1d5db]"
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
