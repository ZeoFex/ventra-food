import type { Metadata } from "next";
import { CustomersHeader } from "@/components/layouts/customers-header";
import { CustomersDirectory } from "@/components/customers/customers-directory";
import { AppSidebar } from "@/components/pos/app-sidebar";

export const metadata: Metadata = {
  title: "Customers — Ventra Food",
  description: "Customer profiles and loyalty overview",
};

export default function CustomersPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <CustomersHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <CustomersDirectory />
        </main>
      </div>
    </div>
  );
}
