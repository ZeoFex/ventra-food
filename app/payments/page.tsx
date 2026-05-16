import type { Metadata } from "next";
import { PaymentsHeader } from "@/components/layouts/payments-header";
import { PaymentsActivity } from "@/components/payments/payments-activity";
import { AppSidebar } from "@/components/pos/app-sidebar";

export const metadata: Metadata = {
  title: "Payments — Ventra Food",
  description: "Payment ledger and settlement overview",
};

export default function PaymentsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PaymentsHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <PaymentsActivity />
        </main>
      </div>
    </div>
  );
}
