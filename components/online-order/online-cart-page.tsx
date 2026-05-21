"use client";

import { OnlineShell } from "@/components/online-order/online-shell";
import { useOnlineOrder } from "@/components/online-order/online-order-context";
import { formatCedi } from "@/lib/format-cedi";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function OnlineCartPage() {
  const router = useRouter();
  const { basePath, cart, cartCount, subtotalGhs, setQty, hydrated } =
    useOnlineOrder();
  const lines = Object.values(cart);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[#6b7280]">
        Loading cart…
      </div>
    );
  }

  return (
    <OnlineShell title="Your cart" hideCartBar layout="narrow">
      {lines.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[#6b7280]">Your cart is empty.</p>
          <Link
            href={basePath}
            className="mt-4 inline-block text-sm font-bold text-[var(--pos-primary)]"
          >
            Browse menu
          </Link>
        </div>
      ) : (
        <>
          <div className="md:flex md:items-start md:gap-8">
          <ul className="min-w-0 flex-1 space-y-3">
            {lines.map((line) => (
              <li
                key={line.productId}
                className="flex gap-3 rounded-2xl border border-[#e8e4dc] bg-white p-3 shadow-sm"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f0ece6]">
                  <Image
                    src={line.imageSrc}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`${basePath}/items/${line.productId}`}
                    className="text-sm font-bold text-[#1a1c23]"
                  >
                    {line.name}
                  </Link>
                  <p className="text-xs text-[#6b7280]">
                    {formatCedi(line.unitPrice)} each
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQty(line.productId, line.qty - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e5e5]"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(line.productId, line.qty + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--pos-primary)] text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-bold tabular-nums text-[#1a1c23]">
                  {formatCedi(line.unitPrice * line.qty)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 shrink-0 md:mt-0 md:w-full md:max-w-sm">
          <div className="rounded-2xl border border-[#e8e4dc] bg-white p-4 md:sticky md:top-24 md:p-5">
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-[#6b7280]">
                Subtotal ({cartCount} items)
              </span>
              <span className="font-bold tabular-nums">
                {formatCedi(subtotalGhs)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-[#9ca3af] md:text-xs">
              Tax and delivery calculated at checkout.
            </p>
            <button
              type="button"
              onClick={() => router.push(`${basePath}/checkout`)}
              className="mt-4 w-full rounded-2xl bg-[var(--pos-primary)] py-4 text-sm font-bold text-white shadow-md md:py-3.5"
            >
              Proceed to checkout
            </button>
          </div>
          </div>
          </div>
        </>
      )}
    </OnlineShell>
  );
}
