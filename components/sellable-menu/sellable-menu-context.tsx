"use client";

import {
  DEFAULT_SELLABLE_DISHES,
  POS_CATEGORIES,
  type PosProduct,
  type PosShelfCategory,
} from "@/lib/pos-catalog";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "ventra_sellable_dishes_v1";

const VALID_SHELF = new Set<string>(
  POS_CATEGORIES.filter((c) => c !== "Show All"),
);

function normalizeProduct(p: unknown): PosProduct | null {
  if (typeof p !== "object" || p === null) return null;
  const o = p as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") return null;
  if (typeof o.price !== "number" || !Number.isFinite(o.price)) return null;
  if (typeof o.imageSrc !== "string") return null;
  if (typeof o.round !== "boolean") return null;
  const category: PosShelfCategory =
    typeof o.category === "string" && VALID_SHELF.has(o.category)
      ? (o.category as PosShelfCategory)
      : "Grill";
  const brand = o.brand === "import" ? "import" : "house";
  const active = o.active === false ? false : true;
  return {
    id: o.id,
    name: o.name,
    price: o.price,
    imageSrc: o.imageSrc,
    round: o.round,
    category,
    brand,
    active,
  };
}

function loadFromStorage(): PosProduct[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    const out = data.map(normalizeProduct).filter(Boolean) as PosProduct[];
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export type SellableMenuContextValue = {
  products: PosProduct[];
  hydrated: boolean;
  addProduct: (p: PosProduct) => void;
  updateProduct: (id: string, patch: Partial<PosProduct>) => void;
  removeProduct: (id: string) => void;
  replaceAll: (next: PosProduct[]) => void;
};

const SellableMenuContext = createContext<SellableMenuContextValue | null>(
  null,
);

export function SellableMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [products, setProducts] = useState<PosProduct[]>(
    DEFAULT_SELLABLE_DISHES,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage();
    setProducts(stored ?? DEFAULT_SELLABLE_DISHES);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch {
      /* ignore quota */
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

  const value = useMemo(
    () => ({
      products,
      hydrated,
      addProduct,
      updateProduct,
      removeProduct,
      replaceAll,
    }),
    [
      products,
      hydrated,
      addProduct,
      updateProduct,
      removeProduct,
      replaceAll,
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
