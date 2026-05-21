"use client";

import { Plus, Search, Sun } from "lucide-react";

export function PosHeader({
  searchQuery,
  onSearchChange,
  onNewOrder,
  onOpenDraftList,
  onOpenQrMenuOrders,
  onOpenOnlineOrders,
  qrOrdersPendingCount = 0,
  onlineOrdersPendingCount = 0,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewOrder?: () => void;
  onOpenDraftList?: () => void;
  onOpenQrMenuOrders?: () => void;
  onOpenOnlineOrders?: () => void;
  /** Guest orders still in shared queue (not yet cleared at POS) */
  qrOrdersPendingCount?: number;
  onlineOrdersPendingCount?: number;
}) {
  return (
    <header className="shrink-0 border-b border-[var(--pos-border)] bg-white px-3 py-2 sm:px-4">
      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,200px)_minmax(200px,1fr)_minmax(0,auto)] lg:items-center lg:gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#9ca3af]">
            Dashboard <span className="px-1">•</span> Pos
          </p>
          <h1 className="mt-0.5 text-base font-semibold tracking-tight text-[var(--foreground)]">
            Point of Sale (POS)
          </h1>
        </div>

        <div className="relative w-full max-w-xl justify-self-center lg:max-w-none">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
            strokeWidth={1.6}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products (same as catalog)"
            className="w-full rounded-lg border border-[var(--pos-border)] bg-[#f9fafb] py-2 pl-8 pr-3 text-[13px] text-[#374151] outline-none ring-[var(--pos-primary)] placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:bg-white focus:ring-2"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 justify-self-end lg:max-w-[560px] lg:justify-end">
          <button
            type="button"
            onClick={() => onNewOrder?.()}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--pos-primary)] px-3 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[var(--pos-primary-hover)]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
            New
          </button>
          <button
            type="button"
            onClick={() => onOpenOnlineOrders?.()}
            className="relative rounded-lg border border-[var(--pos-border)] bg-white px-2.5 py-2 pr-3.5 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
          >
            Online orders
            {onlineOrdersPendingCount > 0 ? (
              <span
                className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--pos-primary)] px-1 text-[10px] font-bold text-white shadow-sm"
                aria-label={`${onlineOrdersPendingCount} pending online orders`}
              >
                {onlineOrdersPendingCount > 9 ? "9+" : onlineOrdersPendingCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onOpenQrMenuOrders?.()}
            className="relative rounded-lg border border-[var(--pos-border)] bg-white px-2.5 py-2 pr-3.5 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
          >
            QR Menu Orders
            {qrOrdersPendingCount > 0 ? (
              <span
                className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--pos-primary)] px-1 text-[10px] font-bold text-white shadow-sm"
                aria-label={`${qrOrdersPendingCount} pending guest orders`}
              >
                {qrOrdersPendingCount > 9 ? "9+" : qrOrdersPendingCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onOpenDraftList?.()}
            className="rounded-lg border border-[var(--pos-border)] bg-white px-2.5 py-2 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
          >
            Draft List
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--pos-border)] bg-white px-2.5 py-2 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
          >
            Table Order
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pos-border)] bg-white text-[#374151] hover:bg-[#f9fafb]"
            aria-label="Theme"
          >
            <Sun className="h-4 w-4" strokeWidth={1.6} />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-100 text-[10px] font-semibold text-orange-800">
            OK
          </div>
        </div>
      </div>
    </header>
  );
}
