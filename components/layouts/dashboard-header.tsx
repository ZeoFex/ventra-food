import { Bell, Search } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="shrink-0 border-b border-[var(--pos-border)] bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#9ca3af]">
            RestroBit <span className="px-1">•</span> Dashboard
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Good evening, Nahid
          </h1>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2 sm:max-w-xl sm:justify-end lg:max-w-2xl">
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
              strokeWidth={1.6}
            />
            <input
              type="search"
              readOnly
              placeholder="Search orders, tables, customers…"
              className="w-full rounded-lg border border-[var(--pos-border)] bg-[#f9fafb] py-2.5 pl-9 pr-3 text-sm text-[#374151] outline-none placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--pos-primary)]/25"
            />
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--pos-border)] bg-white text-[#374151] transition-colors hover:bg-[#f9fafb]"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-100 text-xs font-semibold text-orange-800">
            NZ
          </div>
        </div>
      </div>
    </header>
  );
}
