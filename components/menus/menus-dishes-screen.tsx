"use client";

import { MenusShell } from "@/components/menus/menus-shell";
import { SellableDishesManager } from "@/components/menus/sellable-dishes-manager";
import { useState } from "react";

export function MenusDishesScreen() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <MenusShell
      title="Dishes"
      description="Add and edit sellable items, set prices, and control what appears on the POS and guest menu."
      showCreate
      onCreateClick={() => setCreateOpen(true)}
    >
      <SellableDishesManager
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
      />
    </MenusShell>
  );
}
