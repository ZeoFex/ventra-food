import type { Metadata } from "next";
import { ReservationsHeader } from "@/components/layouts/reservations-header";
import { ReservationsBoard } from "@/components/reservations/reservations-board";
import { AppSidebar } from "@/components/pos/app-sidebar";

export const metadata: Metadata = {
  title: "Reservations — Ventra Food",
  description: "Restaurant reservations and guest list",
};

export default function ReservationsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ReservationsHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <ReservationsBoard />
        </main>
      </div>
    </div>
  );
}
