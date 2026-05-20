"use client";

import { UserPlus } from "lucide-react";

export function StaffHeader({ onAddClick }: { onAddClick: () => void }) {
  return (
    <header className="shrink-0 border-b border-[var(--pos-border)] bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#9ca3af]">
            Ventra Food <span className="px-1">•</span> Team
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Staff
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--pos-muted)]">
            Roster for POS, kitchen, and floor. Saved in this browser until you
            connect your HR or auth API.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[var(--pos-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--pos-primary-hover)] sm:self-center"
        >
          <UserPlus className="h-4 w-4" strokeWidth={2.2} />
          Add staff
        </button>
      </div>
    </header>
  );
}
