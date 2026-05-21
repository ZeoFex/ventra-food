"use client";

import {
  ACTIVE_RESTAURANT_EVENT,
  readActiveRestaurant,
  readActiveRestaurantSlug,
  writeActiveRestaurantSlug,
} from "@/lib/active-restaurant";
import {
  RESTAURANTS,
  customerOrderPath,
  customerOrderUrl,
} from "@/lib/restaurants";
import { gooeyToast } from "goey-toast";
import { Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function StorefrontSettings() {
  const [slug, setSlug] = useState(readActiveRestaurantSlug);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    const onChange = () => setSlug(readActiveRestaurantSlug());
    window.addEventListener(ACTIVE_RESTAURANT_EVENT, onChange);
    return () => window.removeEventListener(ACTIVE_RESTAURANT_EVENT, onChange);
  }, []);

  const restaurant = readActiveRestaurant();
  const orderPath = customerOrderPath(slug);
  const fullUrl = origin ? customerOrderUrl(slug, origin) : orderPath;

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      gooeyToast.success("Customer order link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      gooeyToast.error("Could not copy — select the link and copy manually");
    }
  }, [fullUrl]);

  return (
    <div className="max-w-xl space-y-6">
      <section className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <h2 className="text-sm font-bold text-[#1a1c23]">
          Customer order link
        </h2>
        <p className="mt-1 text-sm text-[var(--pos-muted)]">
          Share this URL with diners (WhatsApp, Instagram, QR, website). They
          order on their phone — you see incoming orders under{" "}
          <strong>Online orders</strong> on the POS.
        </p>

        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-[#9ca3af]">
          This POS location
        </label>
        <select
          value={slug}
          onChange={(e) => {
            writeActiveRestaurantSlug(e.target.value);
            setSlug(e.target.value);
            gooeyToast.success("Active restaurant updated");
          }}
          className="mt-1 w-full rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/25"
        >
          {RESTAURANTS.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>

        <p className="mt-4 rounded-lg bg-[#faf8f5] px-3 py-2.5 font-mono text-xs text-[#374151] break-all">
          {fullUrl}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyUrl()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--pos-primary)] px-3 py-2 text-xs font-bold text-white"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy link"}
          </button>
          <Link
            href={orderPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-xs font-semibold text-[#374151] hover:bg-[#f9fafb]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview as customer
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-[var(--pos-border)] bg-[#fafafa] p-4 text-sm text-[var(--pos-muted)]">
        <p>
          <strong className="text-[#374151]">{restaurant.name}</strong> — orders
          from <code className="text-xs">{orderPath}</code> only appear on this
          POS when that slug is selected above.
        </p>
      </section>
    </div>
  );
}
