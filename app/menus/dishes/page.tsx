import type { Metadata } from "next";
import { MenusDishesScreen } from "@/components/menus/menus-dishes-screen";

export const metadata: Metadata = {
  title: "Dishes — Ventra Food",
  description: "Manage sellable dishes for POS and guest QR menu.",
};

export default function MenusDishesPage() {
  return <MenusDishesScreen />;
}
