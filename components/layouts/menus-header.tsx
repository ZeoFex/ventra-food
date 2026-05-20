import { Plus, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

export function MenusHeader({
  title = "Menu · dishes on sale",
  description = "Manage what staff sell on the POS and what guests see on the QR menu.",
  onCreateClick,
}: {
  title?: string;
  description?: string;
  onCreateClick?: () => void;
}) {
  return (
    <header className="shrink-0 border-b border-[var(--pos-border)] bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#9ca3af]">
            Ventra Food <span className="px-1">•</span> Menus
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--pos-muted)]">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm font-medium text-[#374151] shadow-sm transition-colors hover:bg-[#f9fafb]"
          >
            <UtensilsCrossed className="h-4 w-4" strokeWidth={1.65} />
            Open POS
          </Link>
          <Link
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm font-medium text-[#374151] shadow-sm transition-colors hover:bg-[#f9fafb]"
          >
            Preview guest menu
          </Link>
          {onCreateClick ? (
            <button
              type="button"
              onClick={() => onCreateClick()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--pos-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--pos-primary-hover)]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} />
              Add dish
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
