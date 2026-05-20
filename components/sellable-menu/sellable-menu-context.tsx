"use client";

import {
  MENU_CATEGORY_STORAGE_KEY,
  defaultMenuCategories,
  legacyCategoryLabelToId,
  newCategoryId,
  nextCategorySortOrder,
  sortCategories,
  type MenuCategory,
} from "@/lib/menu-categories";
import { DEFAULT_SELLABLE_DISHES, type PosProduct } from "@/lib/pos-catalog";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const DISH_STORAGE_KEY = "ventra_sellable_dishes_v1";

function normalizeProduct(
  p: unknown,
  validCategoryIds: Set<string>,
  fallbackCategoryId: string,
): PosProduct | null {
  if (typeof p !== "object" || p === null) return null;
  const o = p as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") return null;
  if (typeof o.price !== "number" || !Number.isFinite(o.price)) return null;
  if (typeof o.imageSrc !== "string") return null;
  if (typeof o.round !== "boolean") return null;

  let categoryId =
    typeof o.categoryId === "string" && o.categoryId.trim()
      ? o.categoryId.trim()
      : "";
  if (!categoryId || !validCategoryIds.has(categoryId)) {
    const legacy =
      typeof o.category === "string"
        ? legacyCategoryLabelToId(o.category)
        : null;
    categoryId =
      legacy && validCategoryIds.has(legacy)
        ? legacy
        : fallbackCategoryId;
  }

  const brand = o.brand === "import" ? "import" : "house";
  const active = o.active === false ? false : true;
  return {
    id: o.id,
    name: o.name,
    price: o.price,
    imageSrc: o.imageSrc,
    round: o.round,
    categoryId,
    brand,
    active,
  };
}

function loadCategoriesFromStorage(): MenuCategory[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MENU_CATEGORY_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    const out: MenuCategory[] = [];
    for (const row of data) {
      if (typeof row !== "object" || row === null) continue;
      const r = row as Record<string, unknown>;
      if (typeof r.id !== "string" || typeof r.label !== "string") continue;
      const parentId =
        r.parentId === null || typeof r.parentId === "string"
          ? r.parentId
          : null;
      const sortOrder =
        typeof r.sortOrder === "number" && Number.isFinite(r.sortOrder)
          ? r.sortOrder
          : out.length;
      out.push({
        id: r.id,
        label: r.label.trim() || "Untitled",
        parentId,
        sortOrder,
      });
    }
    return out.length > 0 ? sortCategories(out) : null;
  } catch {
    return null;
  }
}

function loadProductsFromStorage(validIds: Set<string>, fbCat: string): PosProduct[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DISH_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    const out = data
      .map((row) => normalizeProduct(row, validIds, fbCat))
      .filter(Boolean) as PosProduct[];
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export type SellableMenuContextValue = {
  products: PosProduct[];
  categories: MenuCategory[];
  hydrated: boolean;
  addProduct: (p: PosProduct) => void;
  updateProduct: (id: string, patch: Partial<PosProduct>) => void;
  removeProduct: (id: string) => void;
  replaceAll: (next: PosProduct[]) => void;
  addCategory: (input: { label: string; parentId: string | null }) => void;
  updateCategory: (
    id: string,
    patch: Partial<Pick<MenuCategory, "label" | "parentId" | "sortOrder">>,
  ) => void;
  removeCategory: (id: string) => boolean;
};

const SellableMenuContext = createContext<SellableMenuContextValue | null>(
  null,
);

export function SellableMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, setCategories] = useState<MenuCategory[]>(
    defaultMenuCategories(),
  );
  const [products, setProducts] = useState<PosProduct[]>(
    DEFAULT_SELLABLE_DISHES,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cats = loadCategoriesFromStorage() ?? defaultMenuCategories();
    const validIds = new Set(cats.map((c) => c.id));
    const fb =
      cats.find((c) => c.parentId === null)?.id ??
      cats[0]?.id ??
      "cat-grill";
    const stored = loadProductsFromStorage(validIds, fb);
    setCategories(cats);
    setProducts(stored ?? DEFAULT_SELLABLE_DISHES);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(MENU_CATEGORY_STORAGE_KEY, JSON.stringify(categories));
    } catch {
      /* quota */
    }
  }, [categories, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(DISH_STORAGE_KEY, JSON.stringify(products));
    } catch {
      /* quota */
    }
  }, [products, hydrated]);

  const addProduct = useCallback((p: PosProduct) => {
    setProducts((prev) => [p, ...prev]);
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<PosProduct>) => {
    setProducts((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    );
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const replaceAll = useCallback((next: PosProduct[]) => {
    setProducts(next);
  }, []);

  const addCategory = useCallback(
    (input: { label: string; parentId: string | null }) => {
      const label = input.label.trim();
      if (!label) return;
      setCategories((prev) => {
        const sortOrder = nextCategorySortOrder(prev);
        const row: MenuCategory = {
          id: newCategoryId(),
          label,
          parentId: input.parentId,
          sortOrder,
        };
        if (row.parentId !== null) {
          const parent = prev.some((c) => c.id === row.parentId);
          if (!parent) row.parentId = null;
        }
        return sortCategories([...prev, row]);
      });
    },
    [],
  );

  const updateCategory = useCallback(
    (
      id: string,
      patch: Partial<Pick<MenuCategory, "label" | "parentId" | "sortOrder">>,
    ) => {
      setCategories((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
        if (patch.parentId !== undefined && patch.parentId !== null) {
          let walk: string | null = patch.parentId;
          const byId = new Map(next.map((c) => [c.id, c]));
          while (walk) {
            if (walk === id) return prev;
            walk = byId.get(walk)?.parentId ?? null;
          }
        }
        return sortCategories(next);
      });
    },
    [],
  );

  const removeCategory = useCallback((id: string): boolean => {
    let reassignment: { from: string; to: string } | null = null;
    let ok = false;
    setCategories((prev) => {
      if (prev.some((c) => c.parentId === id)) return prev;
      if (!prev.some((c) => c.id === id)) return prev;
      const next = prev.filter((c) => c.id !== id);
      const fb =
        next.find((c) => c.parentId === null)?.id ??
        next[0]?.id ??
        "cat-grill";
      reassignment = { from: id, to: fb };
      ok = true;
      return sortCategories(next);
    });
    if (reassignment) {
      const { from, to } = reassignment;
      setProducts((prods) =>
        prods.map((p) =>
          p.categoryId === from ? { ...p, categoryId: to } : p,
        ),
      );
    }
    return ok;
  }, []);

  const value = useMemo(
    () => ({
      products,
      categories,
      hydrated,
      addProduct,
      updateProduct,
      removeProduct,
      replaceAll,
      addCategory,
      updateCategory,
      removeCategory,
    }),
    [
      products,
      categories,
      hydrated,
      addProduct,
      updateProduct,
      removeProduct,
      replaceAll,
      addCategory,
      updateCategory,
      removeCategory,
    ],
  );

  return (
    <SellableMenuContext.Provider value={value}>
      {children}
    </SellableMenuContext.Provider>
  );
}

export function useSellableMenu(): SellableMenuContextValue {
  const ctx = useContext(SellableMenuContext);
  if (!ctx) {
    throw new Error("useSellableMenu must be used within SellableMenuProvider");
  }
  return ctx;
}
