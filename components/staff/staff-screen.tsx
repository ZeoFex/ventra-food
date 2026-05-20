"use client";

import { StaffHeader } from "@/components/layouts/staff-header";
import { StaffDirectory } from "@/components/staff/staff-directory";
import { AppSidebar } from "@/components/pos/app-sidebar";
import { useState } from "react";

export function StaffScreen() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <StaffHeader onAddClick={() => setCreateOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <StaffDirectory
            createOpen={createOpen}
            onCreateOpenChange={setCreateOpen}
          />
        </main>
      </div>
    </div>
  );
}
