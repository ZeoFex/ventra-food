"use client";

import { MenuCategoriesPanel } from "@/components/menus/menu-categories-panel";
import { MenusShell } from "@/components/menus/menus-shell";

export function MenusCategoriesScreen() {
  return (
    <MenusShell
      title="Categories"
      description="Create menu sections and submenus. Assign dishes to a section when editing them under Dishes."
    >
      <div className="p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <MenuCategoriesPanel />
        </div>
      </div>
    </MenusShell>
  );
}
