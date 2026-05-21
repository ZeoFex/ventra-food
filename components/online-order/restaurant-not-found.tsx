import Link from "next/link";

export function RestaurantNotFound({ slug }: { slug: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f4f2ed] px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#9ca3af]">
        Restaurant not found
      </p>
      <h1 className="mt-2 text-xl font-bold text-[#1a1c23]">
        No menu for &ldquo;{slug}&rdquo;
      </h1>
      <p className="mt-3 max-w-sm text-sm text-[#6b7280]">
        Use the order link your restaurant shared with you (e.g. from WhatsApp or
        a QR code). If you run a venue, set up your storefront in Ventra Food
        settings.
      </p>
      <Link
        href="/order"
        className="mt-6 text-sm font-bold text-[var(--pos-primary)]"
      >
        Browse demo restaurants
      </Link>
    </div>
  );
}
