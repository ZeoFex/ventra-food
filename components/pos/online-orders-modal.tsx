"use client";

import { useFinance } from "@/components/finance/finance-context";
import {
  ACTIVE_RESTAURANT_EVENT,
  readActiveRestaurant,
  readActiveRestaurantSlug,
} from "@/lib/active-restaurant";
import { formatCedi } from "@/lib/format-cedi";
import { customerOrderPath } from "@/lib/restaurants";
import { pushKitchenTicketForOnlineOrder } from "@/lib/kitchen-board-queue";
import {
  ONLINE_ORDERS_EVENT,
  readPosOnlineQueue,
  removeFromPosQueue,
  updateOnlineOrderStatus,
  type OnlineOrder,
  type OnlineOrderStatus,
} from "@/lib/online-orders";
import { roundMoney } from "@/lib/pos-catalog";
import { playPosBeep } from "@/lib/pos-beep";
import type { FinancePayMethod } from "@/lib/finance-ledger";
import {
  Check,
  ChefHat,
  Package,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { gooeyToast } from "goey-toast";

const BORDER = "#e0e0e0";

function payMethodFromOnline(m: OnlineOrder["paymentMethod"]): FinancePayMethod {
  if (m === "card") return "card";
  if (m === "momo") return "momo";
  return "due";
}

function nextStaffAction(
  order: OnlineOrder,
): { label: string; next: OnlineOrderStatus } | null {
  switch (order.status) {
    case "placed":
      return { label: "Confirm order", next: "confirmed" };
    case "confirmed":
      return { label: "Start preparing", next: "preparing" };
    case "preparing":
      return order.fulfillment === "delivery"
        ? { label: "Out for delivery", next: "out_for_delivery" }
        : { label: "Ready for pickup", next: "ready" };
    case "ready":
      return { label: "Complete (picked up)", next: "completed" };
    case "out_for_delivery":
      return { label: "Mark delivered", next: "completed" };
    default:
      return null;
  }
}

export type OnlineOrdersModalProps = {
  open: boolean;
  onClose: () => void;
  onAcceptToPos?: (order: OnlineOrder) => void;
};

export function OnlineOrdersModal({
  open,
  onClose,
  onAcceptToPos,
}: OnlineOrdersModalProps) {
  const { recordSale } = useFinance();
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const titleId = useId();

  const restaurantSlug = readActiveRestaurantSlug();
  const restaurant = readActiveRestaurant();

  const orders = useMemo(
    () => (open ? readPosOnlineQueue(restaurantSlug) : []),
    [open, tick, restaurantSlug],
  );

  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    bump();
  }, [open, bump]);

  useEffect(() => {
    const fn = () => bump();
    window.addEventListener(ONLINE_ORDERS_EVENT, fn);
    const id = window.setInterval(bump, 1500);
    return () => {
      window.removeEventListener(ONLINE_ORDERS_EVENT, fn);
      window.clearInterval(id);
    };
  }, [bump]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const pendingCount = orders.length;

  const advance = useCallback(
    (order: OnlineOrder) => {
      const action = nextStaffAction(order);
      if (!action) return;

      const updated = updateOnlineOrderStatus(order.ref, action.next);
      if (!updated) return;

      if (action.next === "confirmed") {
        pushKitchenTicketForOnlineOrder(updated);
        playPosBeep("newOrder");
        gooeyToast.success("Online order confirmed", {
          description: updated.ref,
        });
      }

      if (action.next === "completed") {
        const itemCount = updated.lines.reduce((s, l) => s + l.qty, 0);
        recordSale({
          orderNumber: updated.ref,
          subtotalGhs: updated.subtotalGhs,
          discountGhs: updated.discountGhs,
          totalGhs: updated.totalGhs,
          method: payMethodFromOnline(updated.paymentMethod),
          channel: `Online · ${updated.fulfillment}`,
          itemCount,
          couponCode: updated.couponCode,
        });
        removeFromPosQueue(updated.ref);
        gooeyToast.success("Sale recorded", { description: updated.ref });
      }

      bump();
    },
    [recordSale, bump],
  );

  const cancel = useCallback(
    (order: OnlineOrder) => {
      updateOnlineOrderStatus(order.ref, "cancelled");
      removeFromPosQueue(order.ref);
      bump();
      gooeyToast.info("Order cancelled", { description: order.ref });
    },
    [bump],
  );

  const loadToPos = useCallback(
    (order: OnlineOrder) => {
      onAcceptToPos?.(order);
      removeFromPosQueue(order.ref);
      bump();
      onClose();
    },
    [onAcceptToPos, bump, onClose],
  );

  const content = useMemo(() => {
    if (!open || !mounted) return null;

    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        onMouseDown={onClose}
      >
        <div
          className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: BORDER }}
          >
            <div>
              <h2 id={titleId} className="text-base font-bold text-[#1a1c23]">
                Online orders
              </h2>
              <p className="text-xs text-[#6b7280]">
                {restaurant.name}
                {pendingCount === 0
                  ? " · no active web orders"
                  : ` · ${pendingCount} active`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {orders.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#6b7280]">
                Customers order at{" "}
                <span className="font-semibold text-[var(--pos-primary)]">
                  {customerOrderPath(restaurantSlug)}
                </span>
                . Copy the link in Settings.
              </p>
            ) : (
              <ul className="space-y-3">
                {orders.map((order) => {
                  const action = nextStaffAction(order);
                  return (
                    <li
                      key={order.ref}
                      className="rounded-xl border border-[var(--pos-border)] bg-[#fafafa] p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold">{order.ref}</p>
                          <p className="text-xs capitalize text-[#6b7280]">
                            {order.status.replace(/_/g, " ")} ·{" "}
                            {order.fulfillment}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-[var(--pos-primary)] tabular-nums">
                          {formatCedi(order.totalGhs)}
                        </p>
                      </div>
                      <p className="mt-2 text-xs text-[#374151]">
                        {order.customerName} · {order.customerPhone}
                      </p>
                      <ul className="mt-2 space-y-0.5 text-xs text-[#6b7280]">
                        {order.lines.map((l) => (
                          <li key={l.productId}>
                            {l.qty}× {l.name}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {action ? (
                          <button
                            type="button"
                            onClick={() => advance(order)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[var(--pos-primary)] px-3 py-2 text-xs font-bold text-white"
                          >
                            {action.next === "confirmed" ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : action.next === "preparing" ? (
                              <ChefHat className="h-3.5 w-3.5" />
                            ) : action.next === "out_for_delivery" ? (
                              <Truck className="h-3.5 w-3.5" />
                            ) : action.next === "ready" ? (
                              <Package className="h-3.5 w-3.5" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            {action.label}
                          </button>
                        ) : null}
                        {onAcceptToPos && order.status === "placed" ? (
                          <button
                            type="button"
                            onClick={() => loadToPos(order)}
                            className="rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-xs font-semibold text-[#374151]"
                          >
                            Load to POS cart
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => cancel(order)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }, [
    open,
    mounted,
    orders,
    pendingCount,
    titleId,
    onClose,
    advance,
    cancel,
    loadToPos,
    onAcceptToPos,
  ]);

  if (!mounted) return null;
  return createPortal(content, document.body);
}

export function useOnlineOrdersPendingCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const tick = () =>
      setCount(readPosOnlineQueue(readActiveRestaurantSlug()).length);
    tick();
    window.addEventListener(ONLINE_ORDERS_EVENT, tick);
    window.addEventListener(ACTIVE_RESTAURANT_EVENT, tick);
    const id = window.setInterval(tick, 1500);
    return () => {
      window.removeEventListener(ONLINE_ORDERS_EVENT, tick);
      window.removeEventListener(ACTIVE_RESTAURANT_EVENT, tick);
      window.clearInterval(id);
    };
  }, []);

  return count;
}
