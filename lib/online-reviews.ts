/** Product reviews for online menu (localStorage). */

export type ProductReview = {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
  verified?: boolean;
};

export const ONLINE_REVIEWS_STORAGE_KEY = "ventra_online_reviews_v1";

const SEED: ProductReview[] = [
  {
    id: "rev-jollof-1",
    productId: "pos-jollof",
    authorName: "Kofi M.",
    rating: 5,
    body: "Best jollof in Accra — smoky and generous portion.",
    createdAt: "2026-04-12T10:00:00.000Z",
    verified: true,
  },
  {
    id: "rev-jollof-2",
    productId: "pos-jollof",
    authorName: "Ama S.",
    rating: 4,
    body: "Loved it. Arrived hot on delivery.",
    createdAt: "2026-04-08T14:30:00.000Z",
    verified: true,
  },
  {
    id: "rev-burger-1",
    productId: "pos-burger",
    authorName: "Nana Y.",
    rating: 5,
    body: "Juicy patty, fries still crisp.",
    createdAt: "2026-05-01T18:00:00.000Z",
    verified: true,
  },
  {
    id: "rev-chicken-1",
    productId: "pos-chicken",
    authorName: "Esi O.",
    rating: 4,
    body: "Spicy but not overwhelming. Would order again.",
    createdAt: "2026-05-10T12:00:00.000Z",
    verified: true,
  },
];

function parseReviews(raw: string | null): ProductReview[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? (data as ProductReview[]) : [];
  } catch {
    return [];
  }
}

export function loadReviewsFromStorage(): ProductReview[] | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ONLINE_REVIEWS_STORAGE_KEY);
  if (!raw) return null;
  const parsed = parseReviews(raw);
  return parsed.length > 0 ? parsed : null;
}

export function readAllReviews(): ProductReview[] {
  if (typeof window === "undefined") return SEED;
  const stored = loadReviewsFromStorage();
  if (!stored) {
    try {
      localStorage.setItem(ONLINE_REVIEWS_STORAGE_KEY, JSON.stringify(SEED));
    } catch {
      /* quota */
    }
    return SEED;
  }
  return stored;
}

export function reviewsForProduct(productId: string): ProductReview[] {
  return readAllReviews()
    .filter((r) => r.productId === productId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function averageRating(productId: string): {
  avg: number;
  count: number;
} {
  const list = reviewsForProduct(productId);
  if (list.length === 0) return { avg: 0, count: 0 };
  const sum = list.reduce((s, r) => s + r.rating, 0);
  return { avg: Math.round((sum / list.length) * 10) / 10, count: list.length };
}

export function newReviewId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `rev-${Date.now().toString(36)}`;
}

export function appendReview(review: ProductReview): void {
  if (typeof window === "undefined") return;
  const all = readAllReviews();
  all.unshift(review);
  try {
    localStorage.setItem(ONLINE_REVIEWS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* quota */
  }
}
