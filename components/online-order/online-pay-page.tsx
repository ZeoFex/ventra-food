"use client";

import { OnlineShell } from "@/components/online-order/online-shell";
import { useOnlineOrder } from "@/components/online-order/online-order-context";
import { usePromotions } from "@/components/promotions/promotions-context";
import { formatCedi } from "@/lib/format-cedi";
import {
  ONLINE_DELIVERY_FEE_GHS,
  ONLINE_TAX_RATE,
} from "@/lib/online-menu-meta";
import {
  createOnlineOrder,
  markOnlineOrderPaid,
  readCheckoutDraft,
  writeCheckoutDraft,
  type OnlineOrderLine,
} from "@/lib/online-orders";
import { roundMoney } from "@/lib/pos-catalog";
import { gooeyToast } from "goey-toast";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function OnlinePayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCod = searchParams.get("mode") === "cod";
  const {
    basePath,
    restaurantSlug,
    cart,
    subtotalGhs,
    clearCart,
    addresses,
  } = useOnlineOrder();
  const { recordPromotionUse } = usePromotions();
  const [paying, setPaying] = useState(false);
  const [draft] = useState(() => readCheckoutDraft(restaurantSlug));
  const codPlacedRef = useRef(false);

  const lines = Object.values(cart);

  const placeOrder = useCallback(
    async (paid: boolean) => {
      if (!draft || lines.length === 0) {
        router.replace(`${basePath}/checkout`);
        return;
      }

      const deliveryFee =
        draft.fulfillment === "delivery" ? ONLINE_DELIVERY_FEE_GHS : 0;
      const taxGhs = roundMoney(subtotalGhs * ONLINE_TAX_RATE);
      const totalGhs = roundMoney(
        subtotalGhs - draft.discountGhs + deliveryFee + taxGhs,
      );

      const address = draft.addressId
        ? addresses.find((a) => a.id === draft.addressId)
        : undefined;

      const orderLines: OnlineOrderLine[] = lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        qty: l.qty,
        unitPrice: l.unitPrice,
        lineTotal: roundMoney(l.unitPrice * l.qty),
      }));

      if (paid) {
        setPaying(true);
        await new Promise((r) => setTimeout(r, 1400));
        setPaying(false);
      }

      const order = createOnlineOrder({
        restaurantSlug,
        fulfillment: draft.fulfillment,
        paymentMethod: draft.paymentMethod,
        paymentStatus: paid ? "paid" : "cod",
        customerName: draft.customerName,
        customerPhone: draft.customerPhone,
        customerEmail: draft.customerEmail,
        address,
        scheduledNote: draft.scheduledNote,
        lines: orderLines,
        subtotalGhs,
        discountGhs: draft.discountGhs,
        deliveryFeeGhs: deliveryFee,
        taxGhs,
        totalGhs,
        couponCode: draft.couponCode,
        status: "placed",
      });

      if (paid) {
        markOnlineOrderPaid(order.ref);
      }

      if (draft.appliedPromotionId) {
        recordPromotionUse(draft.appliedPromotionId);
      }

      writeCheckoutDraft(restaurantSlug, null);
      clearCart();
      gooeyToast.success("Order placed!", { description: order.ref });
      router.replace(`${basePath}/orders/${order.ref}`);
    },
    [
      draft,
      lines,
      subtotalGhs,
      addresses,
      clearCart,
      recordPromotionUse,
      router,
      basePath,
      restaurantSlug,
    ],
  );

  useEffect(() => {
    if (
      isCod &&
      draft &&
      lines.length > 0 &&
      !paying &&
      !codPlacedRef.current
    ) {
      codPlacedRef.current = true;
      void placeOrder(false);
    }
  }, [isCod, draft, lines.length, paying, placeOrder]);

  if (!draft || lines.length === 0) {
    return (
      <OnlineShell title="Payment" backHref={`${basePath}/checkout`} hideCartBar layout="narrow">
        <p className="text-sm text-[#6b7280]">
          Nothing to pay. Start checkout again.
        </p>
      </OnlineShell>
    );
  }

  if (isCod) {
    return (
      <OnlineShell title="Placing order…" hideCartBar layout="narrow">
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--pos-primary)]" />
          <p className="mt-4 text-sm text-[#6b7280]">Confirming your order…</p>
        </div>
      </OnlineShell>
    );
  }

  const deliveryFee =
    draft.fulfillment === "delivery" ? ONLINE_DELIVERY_FEE_GHS : 0;
  const totalGhs = roundMoney(
    subtotalGhs - draft.discountGhs + deliveryFee,
  );

  return (
    <OnlineShell title="Payment" backHref={`${basePath}/checkout`} hideCartBar layout="narrow">
      <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5 text-center shadow-sm">
        <p className="text-sm text-[#6b7280]">
          {draft.paymentMethod === "momo"
            ? "Mobile money"
            : "Card"}{" "}
          · demo gateway
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--pos-primary)]">
          {formatCedi(totalGhs)}
        </p>
        <p className="mt-2 text-xs text-[#9ca3af]">
          Simulated payment — no real charge in development.
        </p>
      </div>

      <button
        type="button"
        disabled={paying}
        onClick={() => void placeOrder(true)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pos-primary)] py-4 text-sm font-bold text-white shadow-md disabled:opacity-60"
      >
        {paying ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing…
          </>
        ) : (
          "Pay now"
        )}
      </button>
    </OnlineShell>
  );
}
