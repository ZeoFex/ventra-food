/**
 * Restaurant venues — each has a public customer order URL: /order/{slug}
 * Staff POS is bound to one active slug (see active-restaurant.ts).
 */

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  city: string;
  /** Shown on customer storefront header */
  brandColor?: string;
};

/** Demo venues — replace with API / ventrapos businesses later */
export const RESTAURANTS: Restaurant[] = [
  {
    id: "rest-restrobit",
    slug: "restrobit",
    name: "RestroBit Kitchen",
    tagline: "Accra · Delivery & pickup",
    city: "Accra",
  },
  {
    id: "rest-osu-grill",
    slug: "osu-grill",
    name: "Osu Grill House",
    tagline: "Osu · Flame-grilled favourites",
    city: "Accra",
  },
  {
    id: "rest-airport-bites",
    slug: "airport-bites",
    name: "Airport Bites",
    tagline: "Near Kotoka · Quick bites",
    city: "Accra",
  },
];

export const DEFAULT_RESTAURANT_SLUG = RESTAURANTS[0].slug;

export function getRestaurantBySlug(slug: string): Restaurant | undefined {
  const s = slug.trim().toLowerCase();
  return RESTAURANTS.find((r) => r.slug === s);
}

export function isValidRestaurantSlug(slug: string): boolean {
  return Boolean(getRestaurantBySlug(slug));
}

/** Customer-facing path only — no origin (use on client with window.location.origin). */
export function customerOrderPath(slug: string): string {
  return `/order/${slug.trim().toLowerCase()}`;
}

export function customerOrderUrl(slug: string, origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${customerOrderPath(slug)}`;
}
