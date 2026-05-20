"use client";

import { AppSidebar } from "@/components/pos/app-sidebar";
import { MenusHeader } from "@/components/layouts/menus-header";

export function MenusShell({
  title,
  description,
  onCreateClick,
  showCreate = false,
  children,
}: {
  title: string;
  description: string;
  onCreateClick?: () => void;
  showCreate?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MenusHeader
          title={title}
          description={description}
          onCreateClick={showCreate ? onCreateClick : undefined}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

