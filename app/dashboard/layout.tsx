import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Ventra Food",
  description: "Restaurant overview and operations",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
