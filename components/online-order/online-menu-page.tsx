"use client";

import { OnlineCartSidebar } from "@/components/online-order/online-cart-sidebar";
import { OnlineShell } from "@/components/online-order/online-shell";
import { useOnlineOrder } from "@/components/online-order/online-order-context";
import { useSellableMenu } from "@/components/sellable-menu/sellable-menu-context";
import { formatCedi } from "@/lib/format-cedi";
import { averageRating } from "@/lib/online-reviews";
import {
  categorySubtreeIds,
  rootCategories,
} from "@/lib/menu-categories";
import { isPosProductOnMenu } from "@/lib/pos-catalog";
import { Minus, Plus, Search, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export function OnlineMenuPage() {
  const { products, categories, hydrated: menuHydrated } = useSellableMenu();
  const { basePath, cart, addToCart, setQty, hydrated: cartHydrated } =
    useOnlineOrder();
  const [categoryId, setCategoryId] = useState("all");
  const [query, setQuery] = useState("");

  const menuCategories = useMemo(
    () => [
      { id: "all", label: "All" },
      ...rootCategories(categories).map((c) => ({
        id: c.id,
        label: c.label,
      })),
    ],
    [categories],
  );

  const items = useMemo(() => {
    return products.filter(isPosProductOnMenu);
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (categoryId !== "all") {
        const subtree = categorySubtreeIds(categories, categoryId);
        if (!subtree.has(p.categoryId)) return false;
      }
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, categoryId, query, categories]);

  if (!menuHydrated || !cartHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[#6b7280]">
        Loading menu…
      </div>
    );
  }

  return (
    <OnlineShell layout="wide">
      <div className="md:flex md:items-start md:gap-8 lg:gap-10">
        <div className="min-w-0 flex-1">
          <div className="relative mb-4 md:mb-5">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af] md:left-4 md:h-5 md:w-5"
              strokeWidth={1.6}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes…"
              className="w-full rounded-xl border border-[#e8e4dc] bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-[var(--pos-primary)] placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:ring-2 md:py-3 md:pl-11 md:text-base"
            />
          </div>

          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:gap-2.5 [&::-webkit-scrollbar]:hidden">
            {menuCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors md:text-sm ${
                  categoryId === c.id
                    ? "bg-[var(--pos-primary)] text-white shadow-sm"
                    : "border border-[#e8e4dc] bg-white text-[#4b5563] hover:border-[var(--pos-primary)]/30"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => {
              const qty = cart[item.id]?.qty ?? 0;
              const { avg, count } = averageRating(item.id);
              return (
                <article
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white shadow-[0_4px_20px_rgba(26,28,35,0.06)] transition-shadow hover:shadow-[0_8px_28px_rgba(26,28,35,0.1)]"
                >
                  <Link
                    href={`${basePath}/items/${item.id}`}
                    className="relative block aspect-square bg-[#f0ece6] md:aspect-[4/3]"
                  >
                    <Image
                      src={item.imageSrc}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col p-3 md:p-4">
                    <Link href={`${basePath}/items/${item.id}`}>
                      <h2 className="line-clamp-2 text-[13px] font-bold leading-snug text-[#1a1c23] md:text-sm">
                        {item.name}
                      </h2>
                    </Link>
                    {count > 0 ? (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[#6b7280]">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-[#374151]">
                          {avg}
                        </span>
                        <span>({count})</span>
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm font-bold text-[var(--pos-primary)] md:text-base">
                      {formatCedi(item.price)}
                    </p>
                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            productId: item.id,
                            name: item.name,
                            unitPrice: item.price,
                            imageSrc: item.imageSrc,
                          })
                        }
                        className="mt-3 w-full rounded-xl bg-[var(--pos-primary)] py-2.5 text-xs font-bold text-white shadow-sm active:scale-[0.98] md:py-3 md:text-sm"
                      >
                        Add
                      </button>
                    ) : (
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[#e8e4dc] bg-[#faf8f5] px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => setQty(item.id, qty - 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm"
                          aria-label="Decrease"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-bold tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(item.id, qty + 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--pos-primary)] text-white"
                          aria-label="Increase"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-[#6b7280] md:text-base">
              Nothing matches that search.
            </p>
          ) : null}
        </div>

        <OnlineCartSidebar />
      </div>
    </OnlineShell>
  );
}
