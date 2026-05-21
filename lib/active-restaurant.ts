/**
 * Which restaurant this POS / back office installation serves.
 * Online orders from customers are filtered to this slug.
 */

import {
  DEFAULT_RESTAURANT_SLUG,
  getRestaurantBySlug,
  type Restaurant,
} from "@/lib/restaurants";

export const ACTIVE_RESTAURANT_SLUG_KEY = "ventra_active_restaurant_slug_v1";

export function readActiveRestaurantSlug(): string {
  if (typeof window === "undefined") return DEFAULT_RESTAURANT_SLUG;
  try {
    const raw = localStorage.getItem(ACTIVE_RESTAURANT_SLUG_KEY);
    if (raw && getRestaurantBySlug(raw)) return raw.trim().toLowerCase();
  } catch {
    /* ignore */
  }
  return DEFAULT_RESTAURANT_SLUG;
}

export function writeActiveRestaurantSlug(slug: string): void {
  if (typeof window === "undefined") return;
  const r = getRestaurantBySlug(slug);
  if (!r) return;
  try {
    localStorage.setItem(ACTIVE_RESTAURANT_SLUG_KEY, r.slug);
    window.dispatchEvent(new CustomEvent("ventra-active-restaurant-changed"));
  } catch {
    /* quota */
  }
}

export function readActiveRestaurant(): Restaurant {
  return (
    getRestaurantBySlug(readActiveRestaurantSlug()) ??
    getRestaurantBySlug(DEFAULT_RESTAURANT_SLUG)!
  );
}

export const ACTIVE_RESTAURANT_EVENT = "ventra-active-restaurant-changed";
