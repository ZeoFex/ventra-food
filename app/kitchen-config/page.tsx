import type { Metadata } from "next";
import { KitchenConfigHeader } from "@/components/layouts/kitchen-config-header";
import { KitchenConfigHome } from "@/components/kitchen-config/kitchen-config-home";
import { AppSidebar } from "@/components/pos/app-sidebar";

export const metadata: Metadata = {
  title: "KLD config — Ventra Food",
  description: "Kitchen line display — SMS and staff dashboard",
};

export default function KitchenConfigPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <KitchenConfigHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <KitchenConfigHome />
        </main>
      </div>
    </div>
  );
}
