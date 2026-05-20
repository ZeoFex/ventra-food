"use client";

import { useSellableMenu } from "@/components/sellable-menu/sellable-menu-context";
import Image from "next/image";
import { formatCedi } from "@/lib/format-cedi";
import {
  categorySubtreeIds,
  childCategories,
  rootCategories,
} from "@/lib/menu-categories";
import { isPosProductOnMenu, type PosProduct } from "@/lib/pos-catalog";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
}: ProductCatalogProps) {
  const { products, categories, hydrated } = useSellableMenu();
  const [filterRoot, setFilterRoot] = useState<string>("all");
  const [filterSub, setFilterSub] = useState<string>("all");

  const roots = useMemo(() => rootCategories(categories), [categories]);
  const subRowParent =
    filterRoot !== "all"
      ? roots.find((r) => r.id === filterRoot) ?? null
      : null;
  const subRowKids = subRowParent
    ? childCategories(categories, subRowParent.id)
    : [];

  useEffect(() => {
    setFilterSub("all");
  }, [filterRoot]);

  const onMenu = useMemo(
    () => products.filter(isPosProductOnMenu),
    [products],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return onMenu.filter((p) => {
      if (filterRoot !== "all") {
        if (filterSub === "all") {
          const subtree = categorySubtreeIds(categories, filterRoot);
          if (!subtree.has(p.categoryId)) return false;
        } else if (p.categoryId !== filterSub) return false;
      }
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [onMenu, categories, filterRoot, filterSub, searchQuery]);

  if (!hydrated) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-center bg-[var(--background)] text-sm text-[#9ca3af]">
        Loading menu…
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[var(--background)]">
      <div className="shrink-0 space-y-2 border-b border-[var(--pos-border)] bg-white px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-[#6b7280] sr-only">
            Section
          </label>
          <select
            value={filterRoot === "all" ? "all" : filterRoot}
            onChange={(e) =>
              setFilterRoot(e.target.value === "all" ? "all" : e.target.value)
            }
            className="cursor-pointer rounded-lg border border-[var(--pos-border)] bg-white px-2 py-1.5 text-[13px] text-[#374151]"
          >
            <option value="all">All sections</option>
            {roots.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          {filterRoot !== "all" && subRowKids.length > 0 ? (
            <select
              value={filterSub}
              onChange={(e) => setFilterSub(e.target.value)}
              className="cursor-pointer rounded-lg border border-[var(--pos-border)] bg-white px-2 py-1.5 text-[13px] text-[#374151]"
            >
              <option value="all">All in section</option>
              {subRowKids.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="pos-category-scroll -mx-1 overflow-x-auto pb-0.5">
          <div className="flex w-max min-w-full gap-1.5 px-1">
            <button
              type="button"
              onClick={() => setFilterRoot("all")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                filterRoot === "all"
                  ? "bg-[var(--pos-primary)] text-white shadow-sm"
                  : "border border-[var(--pos-border)] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
              }`}
            >
              All
            </button>
            {roots.map((r) => {
              const active = filterRoot === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setFilterRoot(r.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-[var(--pos-primary)] text-white shadow-sm"
                      : "border border-[var(--pos-border)] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {filterRoot !== "all" && subRowKids.length > 0 ? (
          <div className="pos-category-scroll -mx-1 overflow-x-auto pb-0.5">
            <div className="flex w-max min-w-full gap-1.5 px-1">
              <button
                type="button"
                onClick={() => setFilterSub("all")}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filterSub === "all"
                    ? "bg-[#1a1c23] text-white"
                    : "border border-[var(--pos-border)] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                }`}
              >
                All · {subRowParent?.label}
              </button>
              {subRowKids.map((ch) => {
                const active = filterSub === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setFilterSub(ch.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-[#1a1c23] text-white"
                        : "border border-[var(--pos-border)] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                    }`}
                  >
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#6b7280]">
            No dishes on the POS. Add items under{" "}
            <span className="font-semibold text-[var(--foreground)]">
              Menus → Dishes
            </span>{" "}
            or enable “Show on POS”.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filtered.map((p, i) => {
              const inCart = qtyByProductId[p.id] ?? 0;
              return (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-lg border border-[var(--pos-border)] bg-white px-2.5 pb-2.5 pt-3 shadow-[0_1px_6px_rgba(26,28,35,0.05)]"
                >
                  <div className="flex justify-center">
                    <div
                      className={`relative h-16 w-16 overflow-hidden bg-[#f3f4f6] shadow-[0_1px_6px_rgba(0,0,0,0.06)] ring-2 ring-white ${
                        p.round ? "rounded-full" : "rounded-xl"
                      }`}
                    >
                      <Image
                        src={p.imageSrc}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="64px"
                        priority={i < 4}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-1.5">
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-semibold leading-tight text-[var(--foreground)]">
                        {p.name}
                      </h3>
                      <p className="mt-0.5 text-[13px] font-semibold text-[var(--pos-primary)]">
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
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--pos-primary)] text-white shadow-sm transition-colors hover:bg-[var(--pos-primary-hover)]"
                      aria-label={`Add ${p.name} to cart`}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.2} />
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
