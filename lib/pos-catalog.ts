/** Sellable dishes / POS catalog — ids stable for cart + QR name lookup */

export type PosProduct = {
  id: string;
  name: string;
  price: number;
  imageSrc: string;
  round: boolean;
  /** References `MenuCategory.id` from sellable menu context */
  categoryId: string;
  brand: "house" | "import";
  /** When false, dish is hidden from the POS grid (still editable on Menu page). */
  active?: boolean;
};

/** Default dishes — seed + fallback when storage is empty */
export const DEFAULT_SELLABLE_DISHES: PosProduct[] = [
  {
    id: "pos-jollof",
    name: "Jollof Rice Deluxe",
    price: 45,
    imageSrc:
      "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop",
    round: false,
    categoryId: "cat-rice",
    brand: "house",
    active: true,
  },
  {
    id: "pos-shrimp-salad",
    name: "Shrimp Basil Salad",
    price: 42,
    imageSrc:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    round: true,
    categoryId: "cat-salads",
    brand: "house",
    active: true,
  },
  {
    id: "pos-onion-rings",
    name: "Onion Rings",
    price: 28,
    imageSrc:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    round: false,
    categoryId: "cat-snacks",
    brand: "import",
    active: true,
  },
  {
    id: "pos-burger",
    name: "Grilled Burger",
    price: 55,
    imageSrc:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    round: true,
    categoryId: "cat-grill",
    brand: "import",
    active: true,
  },
  {
    id: "pos-garden-salad",
    name: "Garden Salad Bowl",
    price: 35,
    imageSrc:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop",
    round: false,
    categoryId: "cat-salads",
    brand: "house",
    active: true,
  },
  {
    id: "pos-chicken",
    name: "Crispy Chicken",
    price: 48,
    imageSrc:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop",
    round: true,
    categoryId: "cat-grill",
    brand: "house",
    active: true,
  },
  {
    id: "pos-pizza",
    name: "Margherita Pizza",
    price: 72,
    imageSrc:
      "https://images.unsplash.com/photo-1512627776951-a55541f7350d?w=400&h=300&fit=crop",
    round: false,
    categoryId: "cat-pizza",
    brand: "import",
    active: true,
  },
  {
    id: "pos-soup",
    name: "Tomato Soup",
    price: 25,
    imageSrc:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    round: true,
    categoryId: "cat-soup",
    brand: "house",
    active: true,
  },
  {
    id: "pos-drink",
    name: "Iced Beverage",
    price: 15,
    imageSrc:
      "https://images.unsplash.com/photo-1556679343-c7107240effb?w=400&h=300&fit=crop",
    round: false,
    categoryId: "cat-beverages",
    brand: "import",
    active: true,
  },
];

/** Alias for older imports — same as `DEFAULT_SELLABLE_DISHES` */
export const POS_PRODUCTS = DEFAULT_SELLABLE_DISHES;

export function isPosProductOnMenu(p: PosProduct): boolean {
  return p.active !== false;
}

export type PosCartLine = {
  id: string;
  name: string;
  unitPrice: number;
  qty: number;
  notes?: string;
  /** Set when the line came from a guest table / QR menu order (shown in cart). */
  qrOrderBadge?: string;
};

export function findPosProductById(
  products: PosProduct[],
  id: string,
): PosProduct | undefined {
  return products.find((p) => p.id === id);
}

export function findPosProductByName(
  products: PosProduct[],
  name: string,
): PosProduct | undefined {
  const n = name.trim().toLowerCase();
  return products.find((p) => p.name.toLowerCase() === n);
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}
