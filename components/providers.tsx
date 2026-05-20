"use client";

import { GooeyToaster } from "goey-toast";
import { FinanceProvider } from "@/components/finance/finance-context";
import { PromotionsProvider } from "@/components/promotions/promotions-context";
import { SellableMenuProvider } from "@/components/sellable-menu/sellable-menu-context";
import { StaffProvider } from "@/components/staff/staff-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SellableMenuProvider>
      <StaffProvider>
        <PromotionsProvider>
        <FinanceProvider>
        {children}
        <GooeyToaster
        position="bottom-right"
        theme="light"
        preset="smooth"
        offset="20px"
        gap={12}
        closeOnEscape
        swipeToDismiss
        />
        </FinanceProvider>
        </PromotionsProvider>
      </StaffProvider>
    </SellableMenuProvider>
  );
}
