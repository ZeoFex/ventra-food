"use client";

import {
  buildSaleEntry,
  DEFAULT_FINANCE_LEDGER,
  loadFinanceLedgerFromStorage,
  newLedgerEntryId,
  FINANCE_LEDGER_STORAGE_KEY,
  type ExpenseCategory,
  type FinanceLedgerEntry,
  type RecordSaleInput,
} from "@/lib/finance-ledger";
import { roundMoney } from "@/lib/pos-catalog";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AddExpenseInput = {
  amountGhs: number;
  category: ExpenseCategory;
  vendor?: string;
  note?: string;
};

export type FinanceContextValue = {
  entries: FinanceLedgerEntry[];
  hydrated: boolean;
  recordSale: (input: RecordSaleInput) => FinanceLedgerEntry;
  addExpense: (input: AddExpenseInput) => void;
  removeEntry: (id: string) => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<FinanceLedgerEntry[]>(
    DEFAULT_FINANCE_LEDGER,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(loadFinanceLedgerFromStorage() ?? DEFAULT_FINANCE_LEDGER);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(FINANCE_LEDGER_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* quota */
    }
  }, [entries, hydrated]);

  const recordSale = useCallback((input: RecordSaleInput) => {
    const row = buildSaleEntry(input);
    setEntries((prev) => [row, ...prev]);
    return row;
  }, []);

  const addExpense = useCallback((input: AddExpenseInput) => {
    if (!Number.isFinite(input.amountGhs) || input.amountGhs <= 0) return;
    const row: FinanceLedgerEntry = {
      id: newLedgerEntryId("exp"),
      kind: "expense",
      amountGhs: roundMoney(input.amountGhs),
      createdAt: new Date().toISOString(),
      category: input.category,
      vendor: input.vendor?.trim() || undefined,
      note: input.note?.trim() || undefined,
    };
    setEntries((prev) => [row, ...prev]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      entries,
      hydrated,
      recordSale,
      addExpense,
      removeEntry,
    }),
    [entries, hydrated, recordSale, addExpense, removeEntry],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error("useFinance must be used within FinanceProvider");
  }
  return ctx;
}
