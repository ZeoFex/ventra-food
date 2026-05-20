import type { Metadata } from "next";
import { MenusCategoriesScreen } from "@/components/menus/menus-categories-screen";

export const metadata: Metadata = {
  title: "Categories — Ventra Food",
  description: "Menu sections and submenus for organizing dishes.",
};

export default function MenusCategoriesPage() {
  return <MenusCategoriesScreen />;
}
