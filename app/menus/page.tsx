import type { Metadata } from "next";
import { MenusScreen } from "@/components/menus/menus-screen";

export const metadata: Metadata = {
  title: "Menu — Ventra Food",
  description: "Dishes on sale: what staff sees on the POS. Hide, edit, or add items.",
};

export default function MenusPage() {
  return <MenusScreen />;
}
