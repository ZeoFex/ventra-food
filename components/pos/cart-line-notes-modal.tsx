"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

const MAX_LEN = 300;

export type CartLineNotesModalProps = {
  open: boolean;
  lineName: string;
  initialNotes: string;
  onClose: () => void;
  onSave: (notesTrimmed: string) => void;
};

export function CartLineNotesModal({
  open,
  lineName,
  initialNotes,
  onClose,
  onSave,
}: CartLineNotesModalProps) {
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setText(initialNotes.slice(0, MAX_LEN));
    }
  }, [open, initialNotes]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSave = useCallback(() => {
    onSave(text.trim());
    onClose();
  }, [text, onSave, onClose]);

  if (!mounted || !open) return null;

  const node = (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center p-4 sm:items-center"
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
        className="w-full max-w-md rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-base font-bold text-[#1a2233]"
            >
              Line notes
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-[#6b7280]">
              {lineName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e5e5e5] bg-white p-2 text-[#64748b] hover:bg-[#f8fafc]"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <label htmlFor="line-notes-field" className="sr-only">
          Notes for this line
        </label>
        <textarea
          id="line-notes-field"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          placeholder='e.g. "No onions", "Extra spicy", allergy info…'
          rows={4}
          className="mt-4 w-full resize-y rounded-xl border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5 text-sm text-[#1a2233] outline-none placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--pos-primary)]/25"
        />
        <p className="mt-1 text-right text-[11px] text-[#9ca3af]">
          {text.length}/{MAX_LEN}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e5e5e5] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-[var(--pos-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--pos-primary-hover)]"
          >
            Save notes
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
