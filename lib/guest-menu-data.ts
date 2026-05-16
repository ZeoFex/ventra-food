/** Shared catalog for guest QR menu (server-safe). */

export type GuestMenuCategory = {
  id: string;
  label: string;
};

export type GuestMenuItem = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  imageSrc: string;
  roundImage?: boolean;
};

export const GUEST_MENU_CATEGORIES: GuestMenuCategory[] = [
  { id: "all", label: "All" },
  { id: "salads", label: "Salads" },
  { id: "mains", label: "Mains" },
  { id: "pizza", label: "Pizza" },
  { id: "sides", label: "Sides" },
  { id: "soup", label: "Soup" },
  { id: "drinks", label: "Drinks" },
];

export const GUEST_MENU_ITEMS: GuestMenuItem[] = [
  {
    id: "gm-1",
    name: "Shrimp Basil Salad",
    price: 45,
    categoryId: "salads",
    imageSrc:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    roundImage: true,
  },
  {
    id: "gm-2",
    name: "Garden Salad Bowl",
    price: 38,
    categoryId: "salads",
    imageSrc:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop",
    roundImage: false,
  },
  {
    id: "gm-3",
    name: "Grilled Burger",
    price: 55,
    categoryId: "mains",
    imageSrc:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    roundImage: true,
  },
  {
    id: "gm-4",
    name: "Crispy Chicken",
    price: 52,
    categoryId: "mains",
    imageSrc:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop",
    roundImage: true,
  },
  {
    id: "gm-5",
    name: "Margherita Pizza",
    price: 68,
    categoryId: "pizza",
    imageSrc:
      "https://images.unsplash.com/photo-1512627776951-a55541f7350d?w=400&h=300&fit=crop",
    roundImage: false,
  },
  {
    id: "gm-6",
    name: "Onion Rings",
    price: 22,
    categoryId: "sides",
    imageSrc:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    roundImage: false,
  },
  {
    id: "gm-7",
    name: "Tomato Soup",
    price: 28,
    categoryId: "soup",
    imageSrc:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    roundImage: true,
  },
  {
    id: "gm-8",
    name: "Tropical Juice",
    price: 18,
    categoryId: "drinks",
    imageSrc:
      "https://images.unsplash.com/photo-1556679343-c7107240effb?w=400&h=300&fit=crop",
    roundImage: false,
  },
];
