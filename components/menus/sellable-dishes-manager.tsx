"use client";

import { useSellableMenu } from "@/components/sellable-menu/sellable-menu-context";
import { MenuCategoriesPanel } from "@/components/menus/menu-categories-panel";
import { formatCedi } from "@/lib/format-cedi";
import {
  categoryOptionLabel,
  categorySubtreeIds,
  childCategories,
  rootCategories,
} from "@/lib/menu-categories";
import { isPosProductOnMenu, roundMoney, type PosProduct } from "@/lib/pos-catalog";
import { gooeyToast } from "goey-toast";
import { Pencil, Search, Trash2, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

type TabId = "all" | "on_pos" | "hidden";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All dishes" },
  { id: "on_pos", label: "On POS" },
  { id: "hidden", label: "Hidden" },
];

function DishFormModal({
  open,
  onClose,
  mode,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial: PosProduct | null;
  onSave: (p: PosProduct) => void;
}) {
  const { categories } = useSellableMenu();
  const titleId = useId();
  const roots = useMemo(() => rootCategories(categories), [categories]);
  const defaultCatId = roots[0]?.id ?? categories[0]?.id ?? "";

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCatId);
  const [imageSrc, setImageSrc] = useState("");
  const [round, setRound] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setName(initial.name);
      setPrice(String(initial.price));
      setCategoryId(initial.categoryId);
      setImageSrc(initial.imageSrc);
      setRound(initial.round);
      setActive(initial.active !== false);
    } else {
      setName("");
      setPrice("");
      setCategoryId(defaultCatId);
      setImageSrc(
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
      );
      setRound(false);
      setActive(true);
    }
  }, [open, mode, initial, defaultCatId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const n = name.trim();
      if (!n) {
        gooeyToast.warning("Name required", {
          description: "Enter a dish name.",
        });
        return;
      }
      const pNum = Number.parseFloat(price);
      if (!Number.isFinite(pNum) || pNum < 0) {
        gooeyToast.warning("Invalid price", {
          description: "Use a positive number (GHS).",
        });
        return;
      }
      if (!categoryId || !categories.some((c) => c.id === categoryId)) {
        gooeyToast.warning("Pick a category", {
          description: "Add a menu section under “Menu sections” first.",
        });
        return;
      }
      const url = imageSrc.trim();
      if (!url) {
        gooeyToast.warning("Image URL required", {
          description: "Paste an image link (e.g. Unsplash).",
        });
        return;
      }
      try {
        // eslint-disable-next-line no-new
        new URL(url);
      } catch {
        gooeyToast.error("Bad image URL", {
          description: "Use a full https:// image address.",
        });
        return;
      }

      const dish: PosProduct = {
        id:
          mode === "edit" && initial
            ? initial.id
            : `pos-${Date.now().toString(36)}`,
        name: n,
        price: roundMoney(pNum),
        imageSrc: url,
        round,
        categoryId,
        brand: initial?.brand ?? "house",
        active,
      };
      onSave(dish);
      onClose();
      gooeyToast.success(mode === "edit" ? "Dish updated" : "Dish added", {
        description: n,
      });
    },
    [
      name,
      price,
      categoryId,
      categories,
      imageSrc,
      round,
      active,
      mode,
      initial,
      onSave,
      onClose,
    ],
  );

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center p-4 sm:items-center"
      style={{
        backgroundColor: "rgba(15,23,42,0.35)",
        WebkitBackdropFilter: "blur(8px)",
        backdropFilter: "blur(8px)",
      }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--pos-border)] bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-bold text-[var(--foreground)]"
        >
          {mode === "edit" ? "Edit dish" : "Add dish"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] bg-[#fafafa] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--pos-primary)]/25"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                Price (GHS)
              </label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] bg-[#fafafa] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--pos-primary)]/25"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1.5 w-full cursor-pointer rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm text-[#374151] outline-none"
              >
                {roots.map((r) => (
                  <Fragment key={r.id}>
                    <option value={r.id}>{r.label}</option>
                    {childCategories(categories, r.id).map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {"  └ "}
                        {ch.label}
                      </option>
                    ))}
                  </Fragment>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Image URL
            </label>
            <input
              value={imageSrc}
              onChange={(e) => setImageSrc(e.target.value)}
              placeholder="https://…"
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] bg-[#fafafa] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--pos-primary)]/25"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#374151]">
            <input
              type="checkbox"
              checked={round}
              onChange={(e) => setRound(e.target.checked)}
              className="rounded border-[var(--pos-border)]"
            />
            Round photo (circle)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#374151]">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-[var(--pos-border)]"
            />
            Show on POS
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--pos-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--pos-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--pos-primary-hover)]"
            >
              {mode === "edit" ? "Save" : "Add dish"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export function SellableDishesManager({
  createOpen,
  onCreateOpenChange,
  showCategoriesPanel = false,
}: {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  /** When true, shows category editor above the dish list (legacy combined view). */
  showCategoriesPanel?: boolean;
}) {
  const {
    products,
    categories,
    hydrated,
    addProduct,
    updateProduct,
    removeProduct,
  } = useSellableMenu();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("all");
  const [filterRoot, setFilterRoot] = useState<string>("all");
  const [filterSub, setFilterSub] = useState<string>("all");
  const [editTarget, setEditTarget] = useState<PosProduct | null>(null);

  const roots = useMemo(() => rootCategories(categories), [categories]);
  const subRowParent =
    filterRoot !== "all"
      ? roots.find((r) => r.id === filterRoot) ?? null
      : null;
  const subRowKids = subRowParent
    ? childCategories(categories, subRowParent.id)
    : [];

  useEffect(() => {
    setFilterSub("all");
  }, [filterRoot]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (tab === "on_pos" && !isPosProductOnMenu(p)) return false;
      if (tab === "hidden" && isPosProductOnMenu(p)) return false;

      if (filterRoot !== "all") {
        if (filterSub === "all") {
          const subtree = categorySubtreeIds(categories, filterRoot);
          if (!subtree.has(p.categoryId)) return false;
        } else if (p.categoryId !== filterSub) return false;
      }

      if (!q) return true;
      const path = categoryOptionLabel(categories, p.categoryId).toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        path.includes(q)
      );
    });
  }, [products, query, tab, filterRoot, filterSub, categories]);

  const onPosCount = useMemo(
    () => products.filter(isPosProductOnMenu).length,
    [products],
  );

  const saveDish = useCallback(
    (p: PosProduct) => {
      const exists = products.some((x) => x.id === p.id);
      if (exists) updateProduct(p.id, p);
      else addProduct(p);
    },
    [products, addProduct, updateProduct],
  );

  const deleteDish = useCallback(
    (p: PosProduct) => {
      if (
        !window.confirm(
          `Remove “${p.name}” from the menu? It will disappear from the POS.`,
        )
      ) {
        return;
      }
      removeProduct(p.id);
      gooeyToast.info("Dish removed", { description: p.name });
    },
    [removeProduct],
  );

  const togglePos = useCallback(
    (p: PosProduct) => {
      const on = isPosProductOnMenu(p);
      updateProduct(p.id, { active: !on });
      gooeyToast.success(!on ? "Shown on POS" : "Hidden from POS", {
        description: p.name,
      });
    },
    [updateProduct],
  );

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center p-16 text-sm text-[#9ca3af]">
        Loading menu…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {showCategoriesPanel ? <MenuCategoriesPanel /> : null}

        {!showCategoriesPanel ? (
          <p className="text-sm text-[var(--pos-muted)]">
            Organize items under{" "}
            <Link
              href="/menus/categories"
              className="font-semibold text-[var(--pos-primary)] hover:underline"
            >
              Categories
            </Link>{" "}
            (sections and submenus).
          </p>
        ) : null}

        <div className="rounded-xl border border-[var(--pos-border)] bg-white px-4 py-3 text-sm text-[var(--pos-muted)] shadow-sm">
          <strong className="text-[var(--foreground)]">{onPosCount}</strong> of{" "}
          <strong>{products.length}</strong> dishes visible on the POS grid.
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
              strokeWidth={1.6}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes…"
              className="w-full rounded-lg border border-[var(--pos-border)] bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-[var(--pos-primary)] placeholder:text-[#9ca3af] focus:ring-2"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === t.id
                    ? "bg-[var(--pos-primary)] text-white shadow-sm"
                    : "border border-[var(--pos-border)] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
            Filter by menu section
          </p>
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="flex w-max min-w-full gap-2 px-1">
              <button
                type="button"
                onClick={() => setFilterRoot("all")}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filterRoot === "all"
                    ? "bg-[#1a1c23] text-white"
                    : "border border-[var(--pos-border)] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                }`}
              >
                All sections
              </button>
              {roots.map((r) => {
                const active = filterRoot === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setFilterRoot(r.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-[#1a1c23] text-white"
                        : "border border-[var(--pos-border)] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
          {filterRoot !== "all" && subRowKids.length > 0 ? (
            <div className="-mx-1 overflow-x-auto pb-1">
              <div className="flex w-max min-w-full gap-2 px-1">
                <button
                  type="button"
                  onClick={() => setFilterSub("all")}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    filterSub === "all"
                      ? "bg-[var(--pos-primary)] text-white"
                      : "border border-[var(--pos-border)] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                  }`}
                >
                  All in {subRowParent?.label ?? "section"}
                </button>
                {subRowKids.map((ch) => {
                  const active = filterSub === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setFilterSub(ch.id)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        active
                          ? "bg-[var(--pos-primary)] text-white"
                          : "border border-[var(--pos-border)] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                      }`}
                    >
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--pos-border)] bg-white px-6 py-16 text-center">
            <UtensilsCrossed
              className="mx-auto h-10 w-10 text-[var(--pos-primary)]"
              strokeWidth={1.4}
            />
            <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
              No dishes match
            </p>
            <p className="mt-1 text-sm text-[var(--pos-muted)]">
              Adjust filters or add a dish for the POS.
            </p>
            <button
              type="button"
              onClick={() => onCreateOpenChange(true)}
              className="mt-6 rounded-lg bg-[var(--pos-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--pos-primary-hover)]"
            >
              Add dish
            </button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <li
                key={p.id}
                className="flex gap-4 rounded-2xl border border-[var(--pos-border)] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]"
              >
                <div
                  className={`relative h-24 w-24 shrink-0 overflow-hidden bg-[#f3f4f6] ${
                    p.round ? "rounded-full" : "rounded-xl"
                  }`}
                >
                  <Image
                    src={p.imageSrc}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-[var(--foreground)]">
                        {p.name}
                      </h3>
                      <p className="text-sm font-semibold text-[var(--pos-primary)]">
                        {formatCedi(p.price)}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#9ca3af]">
                        {categoryOptionLabel(categories, p.categoryId)} · {p.id}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isPosProductOnMenu(p)
                          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                          : "bg-[#f4f4f5] text-[#57534e] ring-1 ring-[#e7e5e4]"
                      }`}
                    >
                      {isPosProductOnMenu(p) ? "On POS" : "Hidden"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => togglePos(p)}
                      className="rounded-lg border border-[var(--pos-border)] bg-[#fafafa] px-2 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[#f4f4f5]"
                    >
                      {isPosProductOnMenu(p) ? "Hide from POS" : "Show on POS"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTarget(p)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--pos-border)] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[#f9fafb]"
                    >
                      <Pencil className="h-3 w-3" strokeWidth={1.6} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDish(p)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100/80"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={1.6} />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DishFormModal
        open={createOpen}
        onClose={() => onCreateOpenChange(false)}
        mode="create"
        initial={null}
        onSave={saveDish}
      />
      <DishFormModal
        open={editTarget != null}
        onClose={() => setEditTarget(null)}
        mode="edit"
        initial={editTarget}
        onSave={saveDish}
      />
    </div>
  );
}
