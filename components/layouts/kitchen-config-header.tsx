import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function KitchenConfigHeader() {
  return (
    <header className="shrink-0 border-b border-[var(--pos-border)] bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#9ca3af]">
            RestroBit <span className="px-1">•</span> Kitchen line display
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            KLD config
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--pos-muted)]">
            Route fired KOTs to the kitchen by SMS and to the live dashboard
            staff open on phones, tablets, or a pass-through screen.
          </p>
        </div>
        <Link
          href="/kitchen/login"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-sm font-medium text-[#374151] shadow-sm transition-colors hover:bg-[#f9fafb]"
        >
          Open staff login
          <ExternalLink className="h-3.5 w-3.5 opacity-60" strokeWidth={1.75} />
        </Link>
      </div>
    </header>
  );
}
