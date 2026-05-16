import type { Metadata } from "next";
import { AppSidebar } from "@/components/pos/app-sidebar";
import { TablesHeader } from "@/components/layouts/tables-header";
import { TablesFloor } from "@/components/tables/tables-floor";

export const metadata: Metadata = {
  title: "Tables — Ventra Food",
  description: "Restaurant floor and table status",
};

export default function TablesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TablesHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <TablesFloor />
        </main>
      </div>
    </div>
  );
}
