"use client";

import { OnlineShell } from "@/components/online-order/online-shell";
import { useOnlineOrder } from "@/components/online-order/online-order-context";
import { useSellableMenu } from "@/components/sellable-menu/sellable-menu-context";
import { formatCedi } from "@/lib/format-cedi";
import { getOnlineDishMeta } from "@/lib/online-menu-meta";
import {
  appendReview,
  averageRating,
  newReviewId,
  reviewsForProduct,
} from "@/lib/online-reviews";
import { findPosProductById } from "@/lib/pos-catalog";
import { Clock, Minus, Plus, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { gooeyToast } from "goey-toast";

export function OnlineItemDetail({ productId }: { productId: string }) {
  const router = useRouter();
  const { products, hydrated } = useSellableMenu();
  const { basePath, cart, addToCart, setQty, session } = useOnlineOrder();
  const product = findPosProductById(products, productId);
  const meta = getOnlineDishMeta(productId);
  const [reviews, setReviews] = useState(() => reviewsForProduct(productId));
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");

  const qty = cart[productId]?.qty ?? 0;
  const { avg, count } = averageRating(productId);

  const submitReview = useCallback(() => {
    const body = reviewBody.trim();
    if (!body) {
      gooeyToast.error("Write a short review first");
      return;
    }
    const author = session?.name?.trim() || "Guest";
    appendReview({
      id: newReviewId(),
      productId,
      authorName: author,
      rating,
      body,
      createdAt: new Date().toISOString(),
      verified: false,
    });
    setReviews(reviewsForProduct(productId));
    setReviewBody("");
    gooeyToast.success("Thanks for your review!");
  }, [productId, rating, reviewBody, session]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[#6b7280]">
        Loading…
      </div>
    );
  }

  if (!product) {
    return (
      <OnlineShell title="Not found" backHref={basePath}>
        <p className="text-sm text-[#6b7280]">This dish is not on the menu.</p>
        <button
          type="button"
          onClick={() => router.push(basePath)}
          className="mt-4 text-sm font-semibold text-[var(--pos-primary)]"
        >
          Back to menu
        </button>
      </OnlineShell>
    );
  }

  return (
    <OnlineShell title={product.name} backHref={basePath} hideCartBar layout="narrow">
      <div className="overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white shadow-sm lg:grid lg:grid-cols-2 lg:gap-0">
        <div className="relative aspect-[4/3] w-full bg-[#f0ece6] lg:aspect-auto lg:min-h-[360px]">
          <Image
            src={product.imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
        <div className="p-4 md:p-6 lg:flex lg:flex-col lg:justify-center">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-[var(--pos-primary)]">
                {formatCedi(product.price)}
              </p>
              {count > 0 ? (
                <p className="mt-1 flex items-center gap-1 text-sm text-[#6b7280]">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-[#1a1c23]">{avg}</span>
                  <span>· {count} reviews</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-[#9ca3af]">No reviews yet</p>
              )}
            </div>
            <p className="flex items-center gap-1 rounded-lg bg-[#faf8f5] px-2 py-1 text-xs font-medium text-[#6b7280]">
              <Clock className="h-3.5 w-3.5" />
              ~{meta.prepMinutes} min
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">
            {meta.description}
          </p>
          {meta.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {meta.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[#fff4ec] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--pos-primary)]"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center md:mt-6">
        {qty === 0 ? (
          <button
            type="button"
            onClick={() =>
              addToCart({
                productId: product.id,
                name: product.name,
                unitPrice: product.price,
                imageSrc: product.imageSrc,
              })
            }
            className="flex-1 rounded-2xl bg-[var(--pos-primary)] py-3.5 text-sm font-bold text-white shadow-md"
          >
            Add to cart
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-2xl border border-[#e8e4dc] bg-white px-3 py-2">
              <button
                type="button"
                onClick={() => setQty(product.id, qty - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e5e5]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-lg font-bold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(product.id, qty + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pos-primary)] text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => router.push(`${basePath}/cart`)}
              className="flex-1 rounded-2xl bg-[#1a1c23] py-3.5 text-sm font-bold text-white"
            >
              View cart
            </button>
          </>
        )}
      </div>

      <section className="mt-8 md:mt-10">
        <h3 className="text-base font-bold text-[#1a1c23] md:text-lg">Reviews</h3>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-[#e8e4dc] bg-white p-3 md:p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{r.authorName}</span>
                <span className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "opacity-25"}`}
                    />
                  ))}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#4b5563]">{r.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl border border-dashed border-[#e8e4dc] bg-[#faf8f5] p-3 md:p-4">
          <p className="text-xs font-semibold text-[#6b7280]">Leave a review</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-0.5"
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
            rows={3}
            placeholder="How was this dish?"
            className="mt-2 w-full rounded-lg border border-[#e8e4dc] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/25"
          />
          <button
            type="button"
            onClick={submitReview}
            className="mt-2 w-full rounded-xl border border-[var(--pos-primary)] bg-white py-2 text-xs font-bold text-[var(--pos-primary)]"
          >
            Submit review
          </button>
        </div>
      </section>
    </OnlineShell>
  );
}
