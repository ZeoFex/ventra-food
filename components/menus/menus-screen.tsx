import { redirect } from "next/navigation";

/** @deprecated Use /menus/dishes — kept for imports that still reference MenusScreen */
export function MenusScreen() {
  redirect("/menus/dishes");
}
