/** Extended menu copy for online storefront (keyed by sellable dish id). */

export type OnlineDishMeta = {
  description: string;
  prepMinutes: number;
  calories?: number;
  tags?: string[];
  spicyLevel?: 0 | 1 | 2 | 3;
};

const DEFAULT_META: OnlineDishMeta = {
  description:
    "Prepared fresh to order in our kitchen. Ingredients may vary slightly by season.",
  prepMinutes: 20,
  tags: ["Chef's pick"],
};

export const ONLINE_DISH_META: Record<string, OnlineDishMeta> = {
  "pos-jollof": {
    description:
      "Smoky party jollof with grilled chicken, shito, and salad. A RestroBit favourite.",
    prepMinutes: 25,
    calories: 680,
    tags: ["Popular", "Gluten-free option"],
    spicyLevel: 2,
  },
  "pos-shrimp-salad": {
    description:
      "Wild shrimp, Thai basil, citrus dressing, and mixed greens. Light and bright.",
    prepMinutes: 15,
    calories: 320,
    tags: ["Healthy"],
    spicyLevel: 1,
  },
  "pos-onion-rings": {
    description: "Beer-battered rings with house ranch. Perfect sharing starter.",
    prepMinutes: 12,
    calories: 410,
    tags: ["Starter"],
  },
  "pos-burger": {
    description:
      "Char-grilled beef patty, cheddar, pickles, and brioche bun. Served with fries.",
    prepMinutes: 18,
    calories: 890,
    tags: ["Popular"],
  },
  "pos-garden-salad": {
    description: "Seasonal vegetables, seeds, and lemon vinaigrette.",
    prepMinutes: 10,
    calories: 240,
    tags: ["Vegan", "Healthy"],
  },
  "pos-chicken": {
    description: "Crispy fried chicken with honey-hot glaze and slaw.",
    prepMinutes: 22,
    calories: 720,
    tags: ["Popular"],
    spicyLevel: 2,
  },
  "pos-pizza": {
    description: "Stone-baked margherita — tomato, mozzarella, basil.",
    prepMinutes: 20,
    calories: 810,
    tags: ["Vegetarian"],
  },
  "pos-soup": {
    description: "Slow-cooked tomato soup with herbs and croutons.",
    prepMinutes: 8,
    calories: 180,
    tags: ["Starter"],
  },
  "pos-drink": {
    description: "House iced tea or seasonal soft drink — ask staff for today's brew.",
    prepMinutes: 3,
    calories: 90,
    tags: ["Beverage"],
  },
};

export function getOnlineDishMeta(productId: string): OnlineDishMeta {
  return ONLINE_DISH_META[productId] ?? DEFAULT_META;
}

export const ONLINE_DELIVERY_FEE_GHS = 12;
export const ONLINE_MIN_DELIVERY_SUBTOTAL_GHS = 35;
export const ONLINE_TAX_RATE = 0;
