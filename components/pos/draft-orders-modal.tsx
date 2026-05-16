"use client";

import { formatCedi } from "@/lib/format-cedi";
import {
  Clock,
  FileText,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

const BORDER = "#e0e0e0";
const ORANGE = "#ff7a1a";
const NAVY = "#1a2233";

export type DraftTicket = {
  id: string;
  title: string;
  lineCount: number;
  total: number;
  savedAtLabel: string;
};

const INITIAL_DRAFTS: DraftTicket[] = [
  {
    id: "drf-demo-1",
    title: "Table 8 · Esi & party",
    lineCount: 4,
    total: 268.5,
    savedAtLabel: "Today · 13:05",
  },
  {
    id: "drf-demo-2",
    title: "Bar · open tab",
    lineCount: 2,
    total: 45.0,
    savedAtLabel: "Today · 12:18",
  },
  {
    id: "drf-demo-3",
    title: "Takeaway · no name",
    lineCount: 6,
    total: 132.0,
    savedAtLabel: "Yesterday",
  },
];

export type DraftOrdersModalProps = {
  open: boolean;
  onClose: () => void;
  activeOrderNumber: string | number;
  activeLineCount: number;
  activeTotal: number;
  /** Called when staff taps Resume; wire to load cart from API later */
  onResumeDraft?: (draft: DraftTicket) => void;
};

export function DraftOrdersModal({
  open,
  onClose,
  activeOrderNumber,
  activeLineCount,
  activeTotal,
  onResumeDraft,
}: DraftOrdersModalProps) {
  const [mounted, setMounted] = useState(false);
  const [drafts, setDrafts] = useState<DraftTicket[]>(INITIAL_DRAFTS);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

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

  const saveCurrentOrder = useCallback(() => {
    if (activeLineCount <= 0 || activeTotal <= 0) return;
    const now = new Date();
    const id = `drf-${now.getTime().toString(36)}`;
    const savedAtLabel = now.toLocaleString("en-GH", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    });
    const next: DraftTicket = {
      id,
      title: `Order #${activeOrderNumber} (saved)`,
      lineCount: activeLineCount,
      total: activeTotal,
      savedAtLabel,
    };
    setDrafts((d) => [next, ...d]);
  }, [activeLineCount, activeOrderNumber, activeTotal]);

  const removeDraft = useCallback((id: string) => {
    setDrafts((d) => d.filter((x) => x.id !== id));
  }, []);

  const resumeDraft = useCallback(
    (draft: DraftTicket) => {
      onResumeDraft?.(draft);
      onClose();
    },
    [onClose, onResumeDraft],
  );

  if (!mounted || !open) return null;

  const canSaveCurrent = activeLineCount > 0 && activeTotal > 0;

  const node = (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden bg-black/35"
      style={{
        WebkitBackdropFilter: "blur(20px)",
        backdropFilter: "blur(20px)",
      }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex min-h-[100dvh] w-full justify-center px-4 pb-10 pt-8"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="flex w-full max-w-[440px] shrink-0 flex-col rounded-[10px] bg-white shadow-[0_8px_40px_rgba(26,34,51,0.18)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <header
            className="flex items-start justify-between gap-3 border-b px-5 py-4"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border bg-white"
                style={{ borderColor: `${NAVY}33`, color: NAVY }}
              >
                <FileText className="h-5 w-5" strokeWidth={1.65} />
              </span>
              <div>
                <h2
                  id={titleId}
                  className="text-[15px] font-bold leading-tight text-[#1a2233]"
                >
                  Draft list
                </h2>
                <p className="mt-0.5 text-xs text-[#6b7280]">
                  Park checks and resume later · Order #{activeOrderNumber} on
                  screen
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e5e5] bg-white p-2 text-[#64748b] hover:bg-[#f8fafc]"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </header>

          <div className="border-b px-5 py-3" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={saveCurrentOrder}
              disabled={!canSaveCurrent}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-[0.97] disabled:cursor-not-allowed disabled:opacity-45"
              style={{ backgroundColor: ORANGE }}
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Save current order as draft
            </button>
            {!canSaveCurrent && (
              <p className="mt-2 text-center text-[11px] text-[#9ca3af]">
                Add items with a total above zero to save this ticket.
              </p>
            )}
          </div>

          <div className="max-h-[min(60dvh,420px)] min-h-[200px] overflow-y-auto px-2 py-2">
            {drafts.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[#6b7280]">
                No drafts saved in this session.
              </p>
            ) : (
              <ul className="space-y-2 p-2">
                {drafts.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-xl border border-[#eaeaea] bg-[#fafafa] p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a2233]">
                          {d.title}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-[#6b7280]">
                          <Clock className="h-3.5 w-3.5" strokeWidth={1.6} />
                          {d.savedAtLabel}
                        </p>
                        <p className="mt-2 text-xs text-[#64748b]">
                          {d.lineCount} line{d.lineCount === 1 ? "" : "s"} ·{" "}
                          <span className="font-bold text-[#1a2233]">
                            {formatCedi(d.total)}
                          </span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => resumeDraft(d)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-white"
                          style={{ backgroundColor: NAVY }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                          Resume
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDraft(d.id)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#e5e5e5] bg-white px-2.5 py-2 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                          Discard
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer
            className="mt-auto border-t px-5 py-4"
            style={{ borderColor: BORDER }}
          >
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-full rounded-[8px] border bg-white text-[13px] font-semibold text-[#1a2233] hover:bg-[#fafafa]"
              style={{ borderColor: BORDER }}
            >
              Close
            </button>
          </footer>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
