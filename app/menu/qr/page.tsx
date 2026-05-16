import type { Metadata } from "next";
import { MenuQrSetup } from "@/components/menu-qr/menu-qr-setup";
import { AppSidebar } from "@/components/pos/app-sidebar";

export const metadata: Metadata = {
  title: "QR menu setup — Ventra Food",
  description: "Generate QR codes for guest table ordering",
};

export default function MenuQrStaffPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <MenuQrSetup />
      </div>
    </div>
  );
}
