"use client";

import { OnlineShell } from "@/components/online-order/online-shell";
import { useOnlineOrder } from "@/components/online-order/online-order-context";
import { formatCedi } from "@/lib/format-cedi";
import { formatAddressOneLine } from "@/lib/online-account";
import {
  appendReview,
  newReviewId,
} from "@/lib/online-reviews";
import {
  customerStatusSteps,
  ONLINE_ORDERS_EVENT,
  readOnlineOrderByRef,
  type OnlineOrder,
} from "@/lib/online-orders";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { gooeyToast } from "goey-toast";

export function OnlineOrderTrackPage({ orderRef }: { orderRef: string }) {
  const { basePath, restaurantSlug } = useOnlineOrder();
  const [order, setOrder] = useState<OnlineOrder | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");

  const refresh = useCallback(() => {
    const o = readOnlineOrderByRef(orderRef);
    if (o && o.restaurantSlug === restaurantSlug) setOrder(o);
    else setOrder(null);
  }, [orderRef, restaurantSlug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const fn = () => refresh();
    window.addEventListener(ONLINE_ORDERS_EVENT, fn);
    const id = window.setInterval(refresh, 2000);
    return () => {
      window.removeEventListener(ONLINE_ORDERS_EVENT, fn);
      window.clearInterval(id);
    };
  }, [refresh]);

  const submitOrderReview = () => {
    if (!order || order.status !== "completed") return;
    const body = reviewBody.trim();
    if (!body) return;
    const productId = order.lines[0]?.productId;
    if (!productId) return;
    appendReview({
      id: newReviewId(),
      productId,
      authorName: order.customerName,
      rating,
      body,
      createdAt: new Date().toISOString(),
      verified: true,
    });
    setReviewBody("");
    gooeyToast.success("Review submitted");
  };

  if (!order) {
    return (
      <OnlineShell title="Order" backHref={basePath}>
        <p className="text-sm text-[#6b7280]">Order not found.</p>
        <Link
          href={basePath}
          className="mt-4 text-sm font-bold text-[var(--pos-primary)]"
        >
          Back to menu
        </Link>
      </OnlineShell>
    );
  }

  const steps = customerStatusSteps(order);

  return (
    <OnlineShell title={`Order ${order.ref}`} backHref={basePath} hideCartBar layout="narrow">
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <p className="font-bold">
          {order.status === "cancelled"
            ? "Order cancelled"
            : order.status === "completed"
              ? "Order complete — thank you!"
              : "We’re on it"}
        </p>
        <p className="mt-1 text-xs opacity-90">
          {order.fulfillment === "delivery" ? "Delivery" : "Pickup"} ·{" "}
          {order.scheduledNote ?? "ASAP"}
        </p>
      </div>

      <ol className="mt-6 space-y-0">
        {steps.map((step, i) => (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  step.done
                    ? "bg-emerald-500 text-white"
                    : step.active
                      ? "bg-[var(--pos-primary)] text-white"
                      : "border border-[#e5e5e5] bg-white text-[#9ca3af]"
                }`}
              >
                {step.done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              {i < steps.length - 1 ? (
                <span
                  className={`my-1 w-0.5 flex-1 min-h-[1.5rem] ${
                    step.done ? "bg-emerald-300" : "bg-[#e5e5e5]"
                  }`}
                />
              ) : null}
            </div>
            <div className="pb-6 pt-1">
              <p
                className={`text-sm font-semibold ${
                  step.active ? "text-[var(--pos-primary)]" : "text-[#374151]"
                }`}
              >
                {step.label}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-[#e8e4dc] bg-white p-4 text-sm">
        <p className="font-bold text-[#1a1c23]">Items</p>
        <ul className="mt-2 space-y-2">
          {order.lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-2">
              <span>
                {l.qty}× {l.name}
              </span>
              <span className="tabular-nums font-medium">
                {formatCedi(l.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t border-[#eee] pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-[var(--pos-primary)] tabular-nums">
            {formatCedi(order.totalGhs)}
          </span>
        </div>
        <p className="mt-2 text-xs text-[#6b7280]">
          {order.customerName} · {order.customerPhone}
        </p>
        {order.address ? (
          <p className="mt-1 text-xs text-[#6b7280]">
            {formatAddressOneLine(order.address)}
          </p>
        ) : null}
      </div>

      {order.status === "completed" ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#e8e4dc] bg-[#faf8f5] p-3">
          <p className="text-xs font-semibold text-[#6b7280]">Rate your meal</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} stars`}
              >
                <Star
                  className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-[#d1d5db]"}`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={reviewBody}
            onChange={(e) => setReviewBody(e.target.value)}
            rows={2}
            placeholder="How was everything?"
            className="mt-2 w-full rounded-lg border border-[#e8e4dc] bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={submitOrderReview}
            className="mt-2 w-full rounded-xl bg-[var(--pos-primary)] py-2 text-xs font-bold text-white"
          >
            Submit review
          </button>
        </div>
      ) : null}

      <Link
        href={basePath}
        className="mt-6 block text-center text-sm font-bold text-[var(--pos-primary)]"
      >
        Order again
      </Link>
    </OnlineShell>
  );
}
