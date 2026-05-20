"use client";

import { useSellableMenu } from "@/components/sellable-menu/sellable-menu-context";
import { childCategories, rootCategories } from "@/lib/menu-categories";
import { gooeyToast } from "goey-toast";
import { ChevronRight, FolderTree, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export function MenuCategoriesPanel() {
  const {
    categories,
    hydrated,
    addCategory,
    updateCategory,
    removeCategory,
  } = useSellableMenu();

  const [newRootLabel, setNewRootLabel] = useState("");
  const [subParentId, setSubParentId] = useState<string | null>(null);
  const [newSubLabel, setNewSubLabel] = useState("");

  const roots = useMemo(() => rootCategories(categories), [categories]);

  if (!hydrated) {
    return <p className="text-sm text-[#9ca3af]">Loading categories…</p>;
  }

  const addRoot = () => {
    const label = newRootLabel.trim();
    if (!label) return;
    addCategory({ label, parentId: null });
    setNewRootLabel("");
    gooeyToast.success("Section added", { description: label });
  };

  const addSub = () => {
    if (!subParentId) return;
    const label = newSubLabel.trim();
    if (!label) return;
    addCategory({ label, parentId: subParentId });
    setNewSubLabel("");
    gooeyToast.success("Submenu added", { description: label });
  };

  const tryRemove = (id: string, label: string) => {
    const hasKids = categories.some((c) => c.parentId === id);
    if (hasKids) {
      gooeyToast.error("Remove submenus first", {
        description: `"${label}" still has child sections.`,
      });
      return;
    }
    if (
      !window.confirm(
        `Delete section "${label}"? Dishes in this section move to your default section.`,
      )
    ) {
      return;
    }
    if (removeCategory(id)) {
      gooeyToast.info("Section removed", { description: label });
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--pos-border)] bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Menu sections & submenus
        </h2>
        <p className="mt-1 text-xs text-[var(--pos-muted)]">
          Top-level sections appear on the POS and guest menu. Add submenus to
          organize dishes within a section.
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {roots.length === 0 ? (
          <li className="rounded-lg border border-dashed border-[var(--pos-border)] px-4 py-8 text-center text-sm text-[var(--pos-muted)]">
            No sections yet. Add a top-level section below.
          </li>
        ) : (
          roots.map((root) => {
            const kids = childCategories(categories, root.id);
            return (
              <li
                key={root.id}
                className="rounded-xl border border-[var(--pos-border)] bg-[#fafafa]/80"
              >
                <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                  <FolderTree
                    className="h-4 w-4 shrink-0 text-[var(--pos-primary)]"
                    strokeWidth={1.6}
                  />
                  <input
                    type="text"
                    value={root.label}
                    onChange={(e) =>
                      updateCategory(root.id, { label: e.target.value })
                    }
                    className="min-w-[8rem] flex-1 rounded-lg border border-transparent bg-white px-2 py-1.5 text-sm font-semibold text-[var(--foreground)] outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
                    aria-label={`Section name ${root.label}`}
                  />
                  <button
                    type="button"
                    onClick={() => tryRemove(root.id, root.label)}
                    className="rounded-lg p-2 text-[#9ca3af] transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${root.label}`}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                  </button>
                </div>
                {kids.length > 0 ? (
                  <ul className="border-t border-[var(--pos-border)] px-2 py-2">
                    {kids.map((ch) => (
                      <li
                        key={ch.id}
                        className="flex items-center gap-2 rounded-lg py-1.5 pl-6 pr-1"
                      >
                        <ChevronRight
                          className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]"
                          strokeWidth={2}
                        />
                        <input
                          type="text"
                          value={ch.label}
                          onChange={(e) =>
                            updateCategory(ch.id, { label: e.target.value })
                          }
                          className="min-w-0 flex-1 rounded-lg border border-transparent bg-white px-2 py-1.5 text-sm text-[#374151] outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
                          aria-label={`Submenu name ${ch.label}`}
                        />
                        <button
                          type="button"
                          onClick={() => tryRemove(ch.id, ch.label)}
                          className="rounded-lg p-1.5 text-[#9ca3af] hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${ch.label}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })
        )}
      </ul>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--pos-border)] bg-[#fafafa] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
            New section
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newRootLabel}
              onChange={(e) => setNewRootLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRoot()}
              placeholder="e.g. Grill"
              className="min-w-0 flex-1 rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
            />
            <button
              type="button"
              onClick={addRoot}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--pos-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--pos-primary-hover)]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} />
              Add
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--pos-border)] bg-[#fafafa] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
            New submenu
          </p>
          <select
            value={subParentId ?? ""}
            onChange={(e) =>
              setSubParentId(e.target.value ? e.target.value : null)
            }
            className="mt-2 w-full rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
          >
            <option value="">Parent section…</option>
            {roots.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newSubLabel}
              onChange={(e) => setNewSubLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSub()}
              placeholder="e.g. Burgers"
              disabled={!subParentId}
              className="min-w-0 flex-1 rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={addSub}
              disabled={!subParentId}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f4f4f5] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} />
              Add
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
