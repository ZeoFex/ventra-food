import Image from "next/image";
import { formatCedi } from "@/lib/format-cedi";
import { Plus, Search } from "lucide-react";

const CATEGORIES = [
  "Show All",
  "Rice",
  "Beverages",
  "Salads",
  "Soup",
  "Pizza",
] as const;

const PRODUCTS = [
  {
    name: "Shrimp Basil Salad",
    price: 10,
    src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    round: true,
  },
  {
    name: "Onion Rings",
    price: 10,
    src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    round: false,
  },
  {
    name: "Grilled Burger",
    price: 10,
    src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    round: true,
  },
  {
    name: "Garden Salad Bowl",
    price: 10,
    src: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop",
    round: false,
  },
  {
    name: "Crispy Chicken",
    price: 10,
    src: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop",
    round: true,
  },
  {
    name: "Margherita Pizza",
    price: 10,
    src: "https://images.unsplash.com/photo-1512627776951-a55541f7350d?w=400&h=300&fit=crop",
    round: false,
  },
  {
    name: "Tomato Soup",
    price: 10,
    src: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    round: true,
  },
  {
    name: "Iced Beverage",
    price: 10,
    src: "https://images.unsplash.com/photo-1556679343-c7107240effb?w=400&h=300&fit=crop",
    round: false,
  },
] as const;

export function ProductCatalog() {
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[var(--background)]">
      <div className="shrink-0 space-y-4 border-b border-[var(--pos-border)] bg-white px-6 py-4">
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
            strokeWidth={1.6}
          />
          <input
            type="search"
            readOnly
            placeholder="Search in products"
            className="w-full rounded-lg border border-[var(--pos-border)] bg-[#f9fafb] py-2.5 pl-9 pr-3 text-sm outline-none ring-[var(--pos-primary)] placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:bg-white focus:ring-2"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            disabled
            className="rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-sm text-[#374151]"
            defaultValue="all"
          >
            <option value="all">All Category</option>
          </select>
          <select
            disabled
            className="rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-sm text-[#374151]"
            defaultValue="brand"
          >
            <option value="brand">Select Brand</option>
          </select>
        </div>

        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex w-max min-w-full gap-2 px-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  c === "Show All"
                    ? "bg-[var(--pos-primary)] text-white shadow-sm"
                    : "border border-[var(--pos-border)] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((p, i) => (
            <article
              key={`${p.name}-${i}`}
              className="overflow-hidden rounded-xl border border-[var(--pos-border)] bg-white px-4 pb-4 pt-5 shadow-[0_2px_10px_rgba(26,28,35,0.06)]"
            >
              <div className="flex justify-center">
                <div
                  className={`relative h-[7.5rem] w-[7.5rem] overflow-hidden bg-[#f3f4f6] shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-[3px] ring-white ${
                    p.round ? "rounded-full" : "rounded-2xl"
                  }`}
                >
                  <Image
                    src={p.src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                    priority={i < 4}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-[var(--pos-primary)]">
                    {formatCedi(p.price)}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-primary)] text-white shadow-sm transition-colors hover:bg-[var(--pos-primary-hover)]"
                  aria-label="Add to cart"
                >
                  <Plus className="h-5 w-5" strokeWidth={2.2} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
