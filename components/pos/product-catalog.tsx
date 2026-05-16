"use client";

import { useSellableMenu } from "@/components/sellable-menu/sellable-menu-context";
import Image from "next/image";
import { formatCedi } from "@/lib/format-cedi";
import {
  POS_CATEGORIES,
  isPosProductOnMenu,
  type PosCategory,
  type PosProduct,
} from "@/lib/pos-catalog";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

export type ProductCatalogProps = {
  onAddToCart: (product: PosProduct) => void;
  qtyByProductId: Record<string, number>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
};

export function ProductCatalog({
  onAddToCart,
  qtyByProductId,
  searchQuery,
  onSearchChange,
}: ProductCatalogProps) {
  const { products, hydrated } = useSellableMenu();
  const [category, setCategory] = useState<PosCategory>("Show All");

  const onMenu = useMemo(
    () => products.filter(isPosProductOnMenu),
    [products],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return onMenu.filter((p) => {
      if (category !== "Show All" && p.category !== category) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [onMenu, category, searchQuery]);

  if (!hydrated) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-center bg-[var(--background)] text-sm text-[#9ca3af]">
        Loading menu…
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[var(--background)]">
      <div className="shrink-0 space-y-4 border-b border-[var(--pos-border)] bg-white px-6 py-4">
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
            strokeWidth={1.6}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search in products"
            className="w-full rounded-lg border border-[var(--pos-border)] bg-[#f9fafb] py-2.5 pl-9 pr-3 text-sm outline-none ring-[var(--pos-primary)] placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:bg-white focus:ring-2"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={category === "Show All" ? "all" : category}
            onChange={(e) => {
              const v = e.target.value;
              setCategory(v === "all" ? "Show All" : (v as PosCategory));
            }}
            className="cursor-pointer rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-sm text-[#374151]"
          >
            <option value="all">All Category</option>
            {POS_CATEGORIES.filter((c) => c !== "Show All").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex w-max min-w-full gap-2 px-1">
            {POS_CATEGORIES.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--pos-primary)] text-white shadow-sm"
                      : "border border-[var(--pos-border)] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#6b7280]">
            No dishes on the POS. Add items under{" "}
            <span className="font-semibold text-[var(--foreground)]">Menu</span>{" "}
            or enable “Show on POS”.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p, i) => {
              const inCart = qtyByProductId[p.id] ?? 0;
              return (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-[var(--pos-border)] bg-white px-4 pb-4 pt-5 shadow-[0_2px_10px_rgba(26,28,35,0.06)]"
                >
                  <div className="flex justify-center">
                    <div
                      className={`relative h-[7.5rem] w-[7.5rem] overflow-hidden bg-[#f3f4f6] shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-[3px] ring-white ${
                        p.round ? "rounded-full" : "rounded-2xl"
                      }`}
                    >
                      <Image
                        src={p.imageSrc}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="120px"
                        priority={i < 4}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--foreground)]">
                        {p.name}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-[var(--pos-primary)]">
                        {formatCedi(p.price)}
                      </p>
                      {inCart > 0 ? (
                        <p className="mt-0.5 text-xs font-medium text-[#6b7280]">
                          In cart: {inCart}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddToCart(p)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-primary)] text-white shadow-sm transition-colors hover:bg-[var(--pos-primary-hover)]"
                      aria-label={`Add ${p.name} to cart`}
                    >
                      <Plus className="h-5 w-5" strokeWidth={2.2} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
