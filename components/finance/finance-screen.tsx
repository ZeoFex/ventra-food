"use client";

import { ExpenseFormModal } from "@/components/finance/expense-form-modal";
import { FinanceOverview } from "@/components/finance/finance-overview";
import { FinanceHeader } from "@/components/layouts/finance-header";
import { AppSidebar } from "@/components/pos/app-sidebar";
import { useState } from "react";

export function FinanceScreen() {
  const [expenseOpen, setExpenseOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <FinanceHeader onExpenseClick={() => setExpenseOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <FinanceOverview />
        </main>
      </div>
      <ExpenseFormModal open={expenseOpen} onClose={() => setExpenseOpen(false)} />
    </div>
  );
}
