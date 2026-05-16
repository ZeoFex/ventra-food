import { Grid3x3, Plus, Search } from "lucide-react";
import Link from "next/link";

export function TablesHeader() {
  return (
    <header className="shrink-0 border-b border-[var(--pos-border)] bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#9ca3af]">
            RestroBit <span className="px-1">•</span> Floor
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Tables
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs lg:flex-initial">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
              strokeWidth={1.6}
            />
            <input
              type="search"
              readOnly
              placeholder="Find table…"
              className="w-full rounded-lg border border-[var(--pos-border)] bg-[#f9fafb] py-2.5 pl-9 pr-3 text-sm text-[#374151] outline-none placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--pos-primary)]/25"
            />
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm font-medium text-[#374151] shadow-sm transition-colors hover:bg-[#f9fafb]"
          >
            <Grid3x3 className="h-4 w-4" strokeWidth={1.6} />
            POS
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--pos-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--pos-primary-hover)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            Quick seat
          </button>
        </div>
      </div>
    </header>
  );
}
