import { Suspense } from "react";
import { OnlinePayPage } from "@/components/online-order/online-pay-page";

export default function RestaurantOrderPayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-[#6b7280]">
          Loading…
        </div>
      }
    >
      <OnlinePayPage />
    </Suspense>
  );
}
