"use client";

import { GooeyToaster } from "goey-toast";
import { SellableMenuProvider } from "@/components/sellable-menu/sellable-menu-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SellableMenuProvider>
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
    </SellableMenuProvider>
  );
}
