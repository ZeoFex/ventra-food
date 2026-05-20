"use client";

import { MinusCircle } from "lucide-react";
import Link from "next/link";

export function FinanceHeader({ onExpenseClick }: { onExpenseClick: () => void }) {
  return (
    <header className="shrink-0 border-b border-[var(--pos-border)] bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#9ca3af]">
            Ventra Food <span className="px-1">•</span> Back office
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Finances
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--pos-muted)]">
            Revenue from POS sales, expenses, and net position. Settled orders
            post here automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/payments"
            className="rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm font-medium text-[#374151] shadow-sm hover:bg-[#f9fafb]"
          >
            Payments
          </Link>
          <Link
            href="/invoices"
            className="rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm font-medium text-[#374151] shadow-sm hover:bg-[#f9fafb]"
          >
            Invoices
          </Link>
          <button
            type="button"
            onClick={onExpenseClick}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--pos-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--pos-primary-hover)]"
          >
            <MinusCircle className="h-4 w-4" strokeWidth={2.2} />
            Record expense
          </button>
        </div>
      </div>
    </header>
  );
}
