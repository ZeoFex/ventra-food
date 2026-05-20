/** Hierarchical menu sections (root + submenu) for POS and guest menu. */

export type MenuCategory = {
  id: string;
  label: string;
  parentId: string | null;
  sortOrder: number;
};

export const MENU_CATEGORY_STORAGE_KEY = "ventra_menu_categories_v1";

const LEGACY_LABEL_TO_ID: Record<string, string> = {
  Grill: "cat-grill",
  Salads: "cat-salads",
  Rice: "cat-rice",
  Snacks: "cat-snacks",
  Drinks: "cat-drinks",
};

export function legacyCategoryLabelToId(label: string): string | null {
  return LEGACY_LABEL_TO_ID[label.trim()] ?? null;
}

export function defaultMenuCategories(): MenuCategory[] {
  return sortCategories([
    { id: "cat-grill", label: "Grill", parentId: null, sortOrder: 0 },
    { id: "cat-salads", label: "Salads", parentId: null, sortOrder: 1 },
    { id: "cat-rice", label: "Rice", parentId: null, sortOrder: 2 },
    { id: "cat-snacks", label: "Snacks", parentId: null, sortOrder: 3 },
    { id: "cat-pizza", label: "Pizza", parentId: null, sortOrder: 4 },
    { id: "cat-soup", label: "Soup", parentId: null, sortOrder: 5 },
    { id: "cat-beverages", label: "Beverages", parentId: null, sortOrder: 6 },
    { id: "cat-drinks", label: "Drinks", parentId: null, sortOrder: 7 },
  ]);
}

export function sortCategories(cats: MenuCategory[]): MenuCategory[] {
  return [...cats].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });
}

export function newCategoryId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `cat-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `cat-${Date.now().toString(36)}`;
}

export function nextCategorySortOrder(cats: MenuCategory[]): number {
  if (cats.length === 0) return 0;
  return Math.max(...cats.map((c) => c.sortOrder)) + 1;
}

export function rootCategories(cats: MenuCategory[]): MenuCategory[] {
  return sortCategories(cats.filter((c) => c.parentId === null));
}

export function childCategories(
  cats: MenuCategory[],
  parentId: string,
): MenuCategory[] {
  return sortCategories(cats.filter((c) => c.parentId === parentId));
}

export function categorySubtreeIds(
  cats: MenuCategory[],
  rootId: string,
): Set<string> {
  const out = new Set<string>([rootId]);
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const ch of childCategories(cats, id)) {
      if (!out.has(ch.id)) {
        out.add(ch.id);
        queue.push(ch.id);
      }
    }
  }
  return out;
}

export function categoryOptionLabel(
  cats: MenuCategory[],
  categoryId: string,
): string {
  const byId = new Map(cats.map((c) => [c.id, c]));
  const parts: string[] = [];
  let walk: string | null = categoryId;
  const seen = new Set<string>();
  while (walk && !seen.has(walk)) {
    seen.add(walk);
    const row = byId.get(walk);
    if (!row) break;
    parts.unshift(row.label);
    walk = row.parentId;
  }
  return parts.length > 0 ? parts.join(" › ") : "Uncategorized";
}
