"use client";

import { AppSidebar } from "@/components/pos/app-sidebar";
import { MenusHeader } from "@/components/layouts/menus-header";
import { SellableDishesManager } from "@/components/menus/sellable-dishes-manager";
import { useState } from "react";

export function MenusScreen() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MenusHeader onCreateClick={() => setCreateOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <SellableDishesManager
            createOpen={createOpen}
            onCreateOpenChange={setCreateOpen}
          />
        </main>
      </div>
    </div>
  );
}
