"use client";

import { OnlineShell } from "@/components/online-order/online-shell";
import { useOnlineOrder } from "@/components/online-order/online-order-context";
import { usePromotions } from "@/components/promotions/promotions-context";
import { formatCedi } from "@/lib/format-cedi";
import {
  ONLINE_DELIVERY_FEE_GHS,
  ONLINE_MIN_DELIVERY_SUBTOTAL_GHS,
  ONLINE_TAX_RATE,
} from "@/lib/online-menu-meta";
import type { OnlineFulfillment, OnlinePaymentMethod } from "@/lib/online-orders";
import { writeCheckoutDraft } from "@/lib/online-orders";
import { roundMoney } from "@/lib/pos-catalog";
import { gooeyToast } from "goey-toast";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function OnlineCheckoutPage() {
  const router = useRouter();
  const {
    basePath,
    restaurantSlug,
    cart,
    subtotalGhs,
    session,
    setSession,
    addresses,
    getDefaultAddress,
    hydrated,
  } = useOnlineOrder();
  const { validateForOrder, getPromotionByCode, hydrated: promosReady } =
    usePromotions();

  const lines = Object.values(cart);
  const [fulfillment, setFulfillment] = useState<OnlineFulfillment>("delivery");
  const [paymentMethod, setPaymentMethod] =
    useState<OnlinePaymentMethod>("momo");
  const [name, setName] = useState(session?.name ?? "");
  const [phone, setPhone] = useState(session?.phone ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [addressId, setAddressId] = useState(
    () => getDefaultAddress()?.id ?? "",
  );
  const [scheduledNote, setScheduledNote] = useState("ASAP");
  const [couponInput, setCouponInput] = useState("");
  const [discountGhs, setDiscountGhs] = useState(0);
  const [appliedPromotionId, setAppliedPromotionId] = useState<string>();

  const deliveryFee =
    fulfillment === "delivery" ? ONLINE_DELIVERY_FEE_GHS : 0;
  const taxGhs = roundMoney(subtotalGhs * ONLINE_TAX_RATE);
  const totalGhs = roundMoney(
    subtotalGhs - discountGhs + deliveryFee + taxGhs,
  );

  const deliveryOk = useMemo(() => {
    if (fulfillment !== "delivery") return true;
    return subtotalGhs >= ONLINE_MIN_DELIVERY_SUBTOTAL_GHS;
  }, [fulfillment, subtotalGhs]);

  const applyCoupon = () => {
    if (!promosReady) return;
    const promo = getPromotionByCode(couponInput);
    if (!promo) {
      gooeyToast.error("Invalid coupon code");
      return;
    }
    const result = validateForOrder(promo, subtotalGhs);
    if (!result.ok) {
      gooeyToast.error("Cannot apply coupon", { description: result.error });
      return;
    }
    setDiscountGhs(result.discountGhs);
    setAppliedPromotionId(promo.id);
    gooeyToast.success("Coupon applied");
  };

  const continueCheckout = () => {
    if (lines.length === 0) {
      gooeyToast.error("Cart is empty");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      gooeyToast.error("Name and phone are required");
      return;
    }
    if (fulfillment === "delivery" && !deliveryOk) {
      gooeyToast.error(
        `Minimum delivery order is ${formatCedi(ONLINE_MIN_DELIVERY_SUBTOTAL_GHS)}`,
      );
      return;
    }
    if (fulfillment === "delivery" && !addressId) {
      gooeyToast.error("Select a delivery address");
      return;
    }

    setSession({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
    });

    writeCheckoutDraft(restaurantSlug, {
      fulfillment,
      paymentMethod,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: email.trim() || undefined,
      addressId: fulfillment === "delivery" ? addressId : undefined,
      scheduledNote,
      couponCode: appliedPromotionId ? couponInput : undefined,
      discountGhs,
      appliedPromotionId,
    });

    if (paymentMethod === "cod") {
      router.push(`${basePath}/checkout/pay?mode=cod`);
    } else {
      router.push(`${basePath}/checkout/pay`);
    }
  };

  useEffect(() => {
    if (hydrated && lines.length === 0) router.replace(`${basePath}/cart`);
  }, [hydrated, lines.length, router, basePath]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[#6b7280]">
        Loading…
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[#6b7280]">
        Redirecting…
      </div>
    );
  }

  return (
    <OnlineShell title="Checkout" backHref={`${basePath}/cart`} hideCartBar layout="narrow">
      <section className="space-y-4 md:rounded-2xl md:border md:border-[#e8e4dc] md:bg-white md:p-6 md:shadow-sm lg:p-8">
        <Field label="Fulfillment">
          <div className="grid grid-cols-2 gap-2">
            {(["delivery", "pickup"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFulfillment(f)}
                className={`rounded-xl py-3 text-sm font-bold capitalize ${
                  fulfillment === f
                    ? "bg-[var(--pos-primary)] text-white"
                    : "border border-[#e8e4dc] bg-white text-[#374151]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Contact">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className={inputClass}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (+233 …)"
            className={`${inputClass} mt-2`}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            type="email"
            className={`${inputClass} mt-2`}
          />
        </Field>

        {fulfillment === "delivery" ? (
          <Field label="Delivery address">
            <div className="space-y-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${
                    addressId === a.id
                      ? "border-[var(--pos-primary)] bg-[#fff4ec]"
                      : "border-[#e8e4dc] bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="addr"
                    checked={addressId === a.id}
                    onChange={() => setAddressId(a.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-bold">{a.label}</p>
                    <p className="text-xs text-[#6b7280]">
                      {a.line1}, {a.area}, {a.city}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <a
              href={`${basePath}/account`}
              className="mt-2 inline-block text-xs font-semibold text-[var(--pos-primary)]"
            >
              Manage addresses →
            </a>
            {!deliveryOk ? (
              <p className="mt-2 text-xs text-red-600">
                Add {formatCedi(ONLINE_MIN_DELIVERY_SUBTOTAL_GHS - subtotalGhs)}{" "}
                more for delivery.
              </p>
            ) : null}
          </Field>
        ) : null}

        <Field label="When">
          <select
            value={scheduledNote}
            onChange={(e) => setScheduledNote(e.target.value)}
            className={inputClass}
          >
            <option value="ASAP">ASAP (~25 min)</option>
            <option value="In 45 minutes">In 45 minutes</option>
            <option value="In 1 hour">In 1 hour</option>
          </select>
        </Field>

        <Field label="Coupon">
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Code"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={applyCoupon}
              className="shrink-0 rounded-xl border border-[var(--pos-primary)] px-4 text-xs font-bold text-[var(--pos-primary)]"
            >
              Apply
            </button>
          </div>
        </Field>

        <Field label="Payment">
          <div className="space-y-2">
            {(
              [
                { id: "momo" as const, label: "Mobile money (MoMo)" },
                { id: "card" as const, label: "Card" },
                { id: "cod" as const, label: "Pay on delivery / pickup" },
              ] as const
            ).map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 ${
                  paymentMethod === p.id
                    ? "border-[var(--pos-primary)] bg-[#fff4ec]"
                    : "border-[#e8e4dc] bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === p.id}
                  onChange={() => setPaymentMethod(p.id)}
                />
                <span className="text-sm font-semibold">{p.label}</span>
              </label>
            ))}
          </div>
        </Field>

        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-4 text-sm">
          <Row label="Subtotal" value={formatCedi(subtotalGhs)} />
          {discountGhs > 0 ? (
            <Row label="Discount" value={`−${formatCedi(discountGhs)}`} />
          ) : null}
          {deliveryFee > 0 ? (
            <Row label="Delivery" value={formatCedi(deliveryFee)} />
          ) : null}
          {taxGhs > 0 ? <Row label="Tax" value={formatCedi(taxGhs)} /> : null}
          <div className="mt-2 flex justify-between border-t border-[#eee] pt-2 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums text-[var(--pos-primary)]">
              {formatCedi(totalGhs)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={continueCheckout}
          className="w-full rounded-2xl bg-[var(--pos-primary)] py-4 text-sm font-bold text-white shadow-md"
        >
          {paymentMethod === "cod" ? "Place order" : "Continue to payment"}
        </button>
      </section>
    </OnlineShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9ca3af]">
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-[#4b5563]">
      <span>{label}</span>
      <span className="font-medium tabular-nums text-[#1a1c23]">{value}</span>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#e8e4dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/25";
