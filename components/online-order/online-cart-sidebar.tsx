"use client";

import { useOnlineOrder } from "@/components/online-order/online-order-context";
import { formatCedi } from "@/lib/format-cedi";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/** Sticky cart panel — desktop / tablet landscape menu only */
export function OnlineCartSidebar() {
  const { basePath, cart, cartCount, subtotalGhs, setQty } = useOnlineOrder();
  const lines = Object.values(cart);

  return (
    <aside className="sticky top-24 hidden h-fit w-full max-w-[320px] shrink-0 rounded-2xl border border-[#e8e4dc] bg-white shadow-[0_8px_30px_rgba(26,28,35,0.08)] md:block">
      <div className="border-b border-[#f0f0f0] px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingBag
            className="h-5 w-5 text-[var(--pos-primary)]"
            strokeWidth={1.65}
          />
          <h2 className="text-sm font-bold text-[#1a1c23]">Your order</h2>
          {cartCount > 0 ? (
            <span className="ml-auto rounded-full bg-[#1a1c23] px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
              {cartCount}
            </span>
          ) : null}
        </div>
      </div>

      <div className="max-h-[min(50vh,420px)] overflow-y-auto px-4 py-3">
        {lines.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#9ca3af]">
            Add dishes from the menu
          </p>
        ) : (
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.productId} className="flex gap-2.5">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f0ece6]">
                  <Image
                    src={line.imageSrc}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-semibold text-[#1a1c23]">
                    {line.name}
                  </p>
                  <p className="text-[11px] text-[#6b7280]">
                    {formatCedi(line.unitPrice)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQty(line.productId, line.qty - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e5e5e5] bg-white"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold tabular-nums">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(line.productId, line.qty + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--pos-primary)] text-white"
                      aria-label="Increase"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <p className="shrink-0 text-xs font-bold tabular-nums text-[#374151]">
                  {formatCedi(line.unitPrice * line.qty)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-[#f0f0f0] px-4 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6b7280]">Subtotal</span>
          <span className="font-bold tabular-nums text-[#1a1c23]">
            {formatCedi(subtotalGhs)}
          </span>
        </div>
        <Link
          href={`${basePath}/checkout`}
          className={`mt-3 flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold transition-opacity ${
            cartCount === 0
              ? "pointer-events-none bg-[#e5e5e5] text-[#9ca3af]"
              : "bg-[var(--pos-primary)] text-white shadow-md hover:opacity-95"
          }`}
          aria-disabled={cartCount === 0}
        >
          {cartCount === 0 ? "Cart is empty" : "Checkout"}
        </Link>
        {cartCount > 0 ? (
          <Link
            href={`${basePath}/cart`}
            className="mt-2 block text-center text-xs font-semibold text-[var(--pos-primary)]"
          >
            View full cart
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
