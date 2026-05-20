import type { Metadata } from "next";
import { FinanceScreen } from "@/components/finance/finance-screen";

export const metadata: Metadata = {
  title: "Finances — Ventra Food",
  description: "Revenue, expenses, and financial ledger.",
};

export default function FinancesPage() {
  return <FinanceScreen />;
}
