"use client";

import { useCallback, useState } from "react";
import { AppSidebar } from "@/components/pos/app-sidebar";
import { OrderCartPanel } from "@/components/pos/order-cart-panel";
import { PosHeader } from "@/components/pos/pos-header";
import { ProductCatalog } from "@/components/pos/product-catalog";
import {
  QrMenuOrdersModal,
  type QrMenuOrder,
} from "@/components/pos/qr-menu-orders-modal";

export function PosHome() {
  const [draftOpen, setDraftOpen] = useState(false);
  const [qrOrdersOpen, setQrOrdersOpen] = useState(false);

  const handleAcceptQrToPos = useCallback((order: QrMenuOrder) => {
    if (process.env.NODE_ENV === "development") {
      console.info("[ventrafood] QR menu order accepted", order);
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PosHeader
          onOpenDraftList={() => setDraftOpen(true)}
          onOpenQrMenuOrders={() => setQrOrdersOpen(true)}
        />
        <div className="flex min-h-0 min-w-0 flex-1 items-stretch py-3 pr-3">
          <ProductCatalog />
          <OrderCartPanel draftOpen={draftOpen} onDraftOpenChange={setDraftOpen} />
        </div>
      </div>

      <QrMenuOrdersModal
        open={qrOrdersOpen}
        onClose={() => setQrOrdersOpen(false)}
        onAcceptToPos={handleAcceptQrToPos}
      />
    </div>
  );
}
