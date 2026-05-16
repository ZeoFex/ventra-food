import type { Metadata } from "next";
import { AppSidebar } from "@/components/pos/app-sidebar";

export const metadata: Metadata = {
  title: "Settings — Ventra Food",
  description: "Location and POS preferences",
};

export default function SettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-[var(--pos-border)] bg-white px-4 py-4 sm:px-6">
          <p className="text-xs font-medium text-[#9ca3af]">
            RestroBit <span className="px-1">•</span> Back office
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Settings
          </h1>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <p className="max-w-xl text-sm text-[var(--pos-muted)]">
            Configure outlet details, tax, printers, and roles here when you
            connect your backend. This screen is a placeholder for now.
          </p>
        </main>
      </div>
    </div>
  );
}
