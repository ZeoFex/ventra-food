import { RESTAURANTS, customerOrderPath } from "@/lib/restaurants";
import Link from "next/link";

export const metadata = {
  title: "Find a restaurant · Ventra Food",
  description:
    "Customers order from their restaurant’s own link — not from the staff POS.",
};

/**
 * Public index — real users should open /order/{slug} from the restaurant.
 * This page is only for demos and mistaken visits to /order.
 */
export default function OrderIndexPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6 py-12 md:max-w-2xl lg:max-w-3xl lg:px-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
        For customers
      </p>
      <h1 className="mt-2 text-2xl font-bold text-[#1a1c23]">
        Order from your restaurant’s link
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">
        Each restaurant has its own URL (for example{" "}
        <code className="rounded bg-white px-1.5 py-0.5 text-xs text-[#374151]">
          /order/your-restaurant
        </code>
        ). Ask the venue for their link — you don’t order from the staff POS
        screen.
      </p>

      <p className="mt-8 text-xs font-bold uppercase tracking-wide text-[#9ca3af]">
        Demo restaurants
      </p>
      <ul className="mt-3 space-y-2">
        {RESTAURANTS.map((r) => (
          <li key={r.slug}>
            <Link
              href={customerOrderPath(r.slug)}
              className="flex items-center justify-between rounded-2xl border border-[#e8e4dc] bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <p className="font-bold text-[#1a1c23]">{r.name}</p>
                <p className="text-xs text-[#6b7280]">{r.tagline}</p>
              </div>
              <span className="text-xs font-semibold text-[var(--pos-primary)]">
                Order →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-center text-xs text-[#9ca3af]">
        Restaurant staff: manage orders in the POS under{" "}
        <strong>Online orders</strong> and copy your link in{" "}
        <Link href="/settings" className="font-semibold text-[var(--pos-primary)]">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
