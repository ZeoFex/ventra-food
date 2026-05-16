import { Plus, Search, Sun } from "lucide-react";

export function PosHeader({
  onOpenDraftList,
  onOpenQrMenuOrders,
}: {
  onOpenDraftList?: () => void;
  onOpenQrMenuOrders?: () => void;
} = {}) {
  return (
    <header className="shrink-0 border-b border-[var(--pos-border)] bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,280px)_minmax(240px,1fr)_minmax(0,auto)] lg:items-center lg:gap-6">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#9ca3af]">
            Dashboard <span className="px-1">•</span> Pos
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
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
            readOnly
            placeholder="Search (Ctrl+/)"
            className="w-full rounded-lg border border-[var(--pos-border)] bg-[#f9fafb] py-2.5 pl-9 pr-3 text-sm text-[#374151] outline-none ring-[var(--pos-primary)] placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:bg-white focus:ring-2"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-self-end lg:max-w-[640px] lg:justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--pos-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--pos-primary-hover)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            New
          </button>
          <button
            type="button"
            onClick={() => onOpenQrMenuOrders?.()}
            className="rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
          >
            QR Menu Orders
          </button>
          <button
            type="button"
            onClick={() => onOpenDraftList?.()}
            className="rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
          >
            Draft List
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
          >
            Table Order
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pos-border)] bg-white text-[#374151] hover:bg-[#f9fafb]"
            aria-label="Theme"
          >
            <Sun className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-100 text-xs font-semibold text-orange-800">
            NZ
          </div>
        </div>
      </div>
    </header>
  );
}
