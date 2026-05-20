"use client";

import {
  DEFAULT_PROMOTIONS,
  loadPromotionsFromStorage,
  newPromotionId,
  normalizePromotionCode,
  PROMOTIONS_STORAGE_KEY,
  validatePromotionForOrder,
  type Promotion,
  type ValidatePromotionResult,
} from "@/lib/promotions";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type PromotionsContextValue = {
  promotions: Promotion[];
  hydrated: boolean;
  addPromotion: (input: Omit<Promotion, "id" | "usedCount" | "createdAt">) => void;
  updatePromotion: (id: string, patch: Partial<Promotion>) => void;
  removePromotion: (id: string) => void;
  getPromotionById: (id: string) => Promotion | undefined;
  getPromotionByCode: (code: string) => Promotion | undefined;
  validateForOrder: (
    promo: Promotion,
    subtotal: number,
  ) => ValidatePromotionResult;
  recordPromotionUse: (id: string) => void;
};

const PromotionsContext = createContext<PromotionsContextValue | null>(null);

export function PromotionsProvider({ children }: { children: React.ReactNode }) {
  const [promotions, setPromotions] = useState<Promotion[]>(DEFAULT_PROMOTIONS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPromotions(loadPromotionsFromStorage() ?? DEFAULT_PROMOTIONS);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(promotions));
    } catch {
      /* quota */
    }
  }, [promotions, hydrated]);

  const addPromotion = useCallback(
    (input: Omit<Promotion, "id" | "usedCount" | "createdAt">) => {
      setPromotions((prev) => [
        {
          ...input,
          code: normalizePromotionCode(input.code),
          id: newPromotionId(),
          usedCount: 0,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [],
  );

  const updatePromotion = useCallback((id: string, patch: Partial<Promotion>) => {
    setPromotions((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...patch };
        if (patch.code != null) {
          next.code = normalizePromotionCode(patch.code);
        }
        return next;
      }),
    );
  }, []);

  const removePromotion = useCallback((id: string) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPromotionById = useCallback(
    (id: string) => promotions.find((p) => p.id === id),
    [promotions],
  );

  const getPromotionByCode = useCallback(
    (code: string) => {
      const normalized = normalizePromotionCode(code);
      if (!normalized) return undefined;
      return promotions.find((p) => p.code === normalized);
    },
    [promotions],
  );

  const validateForOrder = useCallback(
    (promo: Promotion, subtotal: number) =>
      validatePromotionForOrder(promo, subtotal),
    [],
  );

  const recordPromotionUse = useCallback((id: string) => {
    setPromotions((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, usedCount: p.usedCount + 1 } : p,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      promotions,
      hydrated,
      addPromotion,
      updatePromotion,
      removePromotion,
      getPromotionById,
      getPromotionByCode,
      validateForOrder,
      recordPromotionUse,
    }),
    [
      promotions,
      hydrated,
      addPromotion,
      updatePromotion,
      removePromotion,
      getPromotionById,
      getPromotionByCode,
      validateForOrder,
      recordPromotionUse,
    ],
  );

  return (
    <PromotionsContext.Provider value={value}>
      {children}
    </PromotionsContext.Provider>
  );
}

export function usePromotions(): PromotionsContextValue {
  const ctx = useContext(PromotionsContext);
  if (!ctx) {
    throw new Error("usePromotions must be used within PromotionsProvider");
  }
  return ctx;
}
