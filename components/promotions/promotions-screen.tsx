"use client";

import { PromotionsHeader } from "@/components/layouts/promotions-header";
import { PromotionsDirectory } from "@/components/promotions/promotions-directory";
import { AppSidebar } from "@/components/pos/app-sidebar";
import { useState } from "react";

export function PromotionsScreen() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PromotionsHeader onAddClick={() => setCreateOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <PromotionsDirectory
            createOpen={createOpen}
            onCreateOpenChange={setCreateOpen}
          />
        </main>
      </div>
    </div>
  );
}
