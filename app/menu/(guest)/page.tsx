import { GuestMenuApp } from "@/components/guest-menu/guest-menu-app";
import { Suspense } from "react";

export default function GuestMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-[#6b7280]">
          Loading menu…
        </div>
      }
    >
      <GuestMenuApp />
    </Suspense>
  );
}
