"use client";

import { formatCedi } from "@/lib/format-cedi";
import {
  GUEST_MENU_CATEGORIES,
  GUEST_MENU_ITEMS,
  type GuestMenuItem,
} from "@/lib/guest-menu-data";
import { appendGuestOrder, type GuestOrderPayload } from "@/lib/qr-guest-orders";
import { ChevronDown, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useMemo,
  useState,
} from "react";

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export function GuestMenuApp() {
  const searchParams = useSearchParams();
  const table = searchParams.get("table")?.trim() || "";
  const qrRelayToken = searchParams.get("qr_t")?.trim() || "";

  const [categoryId, setCategoryId] = useState("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [orderDone, setOrderDone] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GUEST_MENU_ITEMS.filter((item) => {
      const catOk =
        categoryId === "all" || item.categoryId === categoryId;
      if (!catOk) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q);
    });
  }, [categoryId, query]);

  const cartLines = useMemo(() => {
    const lines: { item: GuestMenuItem; qty: number }[] = [];
    for (const [id, qty] of Object.entries(cart)) {
      if (qty <= 0) continue;
      const item = GUEST_MENU_ITEMS.find((x) => x.id === id);
      if (item) lines.push({ item, qty });
    }
    return lines;
  }, [cart]);

  const subtotal = useMemo(
    () =>
      roundMoney(
        cartLines.reduce((s, { item, qty }) => s + item.price * qty, 0),
      ),
    [cartLines],
  );

  const cartCount = useMemo(
    () => cartLines.reduce((s, { qty }) => s + qty, 0),
    [cartLines],
  );

  const addOne = useCallback((id: string) => {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
    setOrderDone(null);
  }, []);

  const removeOne = useCallback((id: string) => {
    setCart((c) => {
      const next = { ...c };
      const q = (next[id] ?? 0) - 1;
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }, []);

  const placeOrder = useCallback(() => {
    if (cartLines.length === 0) return;
    const ref = `QM-${Date.now().toString(36).toUpperCase()}`;
    setOrderDone(ref);
    setSheetOpen(false);
    setCart({});
    try {
      const payload: GuestOrderPayload = {
        ref,
        table: table || null,
        items: cartLines.map(({ item, qty }) => ({
          id: item.id,
          name: item.name,
          qty,
          unitPrice: item.price,
        })),
        total: subtotal,
        at: new Date().toISOString(),
      };
      appendGuestOrder(payload);

      if (qrRelayToken) {
        void fetch("/api/qr-orders/push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-qr-relay-token": qrRelayToken,
          },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          if (!res.ok) {
            console.warn("[qr-relay] push failed", res.status);
          }
        });
      }
    } catch {
      /* ignore */
    }
  }, [cartLines, subtotal, table, qrRelayToken]);

  return (
    <div className="flex min-h-dvh flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-lg px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
                RestroBit
              </p>
              <h1 className="text-lg font-bold leading-tight text-[#1a1c23]">
                Table menu
              </h1>
              {table ? (
                <p className="mt-1 text-xs font-medium text-[var(--pos-primary)]">
                  Table {table}
                </p>
              ) : (
                <p className="mt-1 text-xs text-[#6b7280]">
                  Order here — staff will confirm
                </p>
              )}
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff4ec] text-[var(--pos-primary)]">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.65} />
            </div>
          </div>

          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
              strokeWidth={1.6}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes…"
              className="w-full rounded-xl border border-[#e8e4dc] bg-[#faf8f5] py-2.5 pl-9 pr-3 text-sm outline-none ring-[var(--pos-primary)] placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:bg-white focus:ring-2"
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
        </div>

        <div className="border-t border-black/[0.04] bg-white">
          <div className="mx-auto max-w-lg">
            <div className="flex gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {GUEST_MENU_CATEGORIES.map((c) => {
                const active = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-[var(--pos-primary)] text-white shadow-sm"
                        : "border border-[#e8e4dc] bg-[#faf8f5] text-[#4b5563]"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {orderDone && (
        <div className="mx-auto mt-3 w-full max-w-lg px-4">
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm">
            <p className="font-bold">Order sent · {orderDone}</p>
            <p className="mt-1 text-xs text-emerald-800/90">
              Show this code to your server. Kitchen will start after POS accepts
              the check.
            </p>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {filtered.map((item) => {
            const qty = cart[item.id] ?? 0;
            return (
              <article
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white shadow-[0_4px_20px_rgba(26,28,35,0.06)]"
              >
                <div className="relative aspect-square w-full bg-[#f0ece6]">
                  <Image
                    src={item.imageSrc}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 240px"
                  />
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h2 className="line-clamp-2 text-[13px] font-bold leading-snug text-[#1a1c23]">
                    {item.name}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-[var(--pos-primary)]">
                    {formatCedi(item.price)}
                  </p>
                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => addOne(item.id)}
                      className="mt-3 w-full rounded-xl bg-[var(--pos-primary)] py-2.5 text-xs font-bold text-white shadow-sm active:scale-[0.98]"
                    >
                      Add
                    </button>
                  ) : (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[#e8e4dc] bg-[#faf8f5] px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => removeOne(item.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#374151] shadow-sm active:bg-[#f3f4f6]"
                        aria-label="Decrease"
                      >
                        <Minus className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => addOne(item.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--pos-primary)] text-white shadow-sm active:opacity-90"
                        aria-label="Increase"
                      >
                        <Plus className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-[#6b7280]">
            Nothing matches that search.
          </p>
        )}
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 px-4 py-3 backdrop-blur-md"
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            disabled={cartCount === 0}
            className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-2xl bg-[#1a1c23] px-4 py-3.5 text-left text-white shadow-lg disabled:opacity-40"
          >
            <span className="flex min-w-0 items-center gap-2">
              <ShoppingBag className="h-5 w-5 shrink-0 opacity-90" strokeWidth={1.65} />
              <span className="min-w-0 truncate text-sm font-semibold">
                {cartCount === 0
                  ? "Your order"
                  : `${cartCount} item${cartCount === 1 ? "" : "s"}`}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums">
              {formatCedi(subtotal)}
              <ChevronDown
                className={`h-4 w-4 opacity-80 transition-transform ${sheetOpen ? "rotate-180" : ""}`}
                strokeWidth={2}
              />
            </span>
          </button>
        </div>
      </div>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 px-0 pt-12 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={() => setSheetOpen(false)}
        >
          <div
            className="mx-auto flex h-full max-h-[min(92dvh,640px)] max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#eee] px-4 py-3">
              <h3 className="text-base font-bold">Your order</h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6]"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {cartLines.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#6b7280]">
                  Cart is empty.
                </p>
              ) : (
                <ul className="space-y-3">
                  {cartLines.map(({ item, qty }) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 border-b border-[#f0f0f0] pb-3 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a1c23]">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#6b7280]">
                          {formatCedi(item.price)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeOne(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e5e5] bg-white"
                        >
                          <Minus className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => addOne(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--pos-primary)] text-white"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div
              className="border-t border-[#eee] px-4 pt-3"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
              }}
            >
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-[#6b7280]">Subtotal</span>
                <span className="text-lg font-bold tabular-nums text-[#1a1c23]">
                  {formatCedi(subtotal)}
                </span>
              </div>
              <button
                type="button"
                onClick={placeOrder}
                disabled={cartLines.length === 0}
                className="w-full rounded-2xl bg-[var(--pos-primary)] py-4 text-sm font-bold text-white shadow-md active:opacity-90 disabled:opacity-40"
              >
                Place order
              </button>
              <p className="mt-2 text-center text-[11px] text-[#9ca3af]">
                By ordering you agree we may contact you about this meal.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
