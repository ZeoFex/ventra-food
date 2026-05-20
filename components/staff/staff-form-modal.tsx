"use client";

import { useStaff } from "@/components/staff/staff-context";
import { newStaffId, nextStaffNumber, type StaffMember } from "@/lib/staff";
import { gooeyToast } from "goey-toast";
import { X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export function StaffFormModal({
  open,
  onClose,
  mode,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial: StaffMember | null;
  onSave: (member: StaffMember) => void;
}) {
  const { members, roles } = useStaff();
  const titleId = useId();
  const defaultRoleId = roles[0]?.id ?? "pos-attendant";

  const [staffNumber, setStaffNumber] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(defaultRoleId);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setStaffNumber(initial.staffNumber);
      setName(initial.name);
      setPhone(initial.phone);
      setEmail(initial.email ?? "");
      setRoleId(initial.roleId);
      setActive(initial.active);
    } else {
      setStaffNumber(nextStaffNumber(members));
      setName("");
      setPhone("");
      setEmail("");
      setRoleId(defaultRoleId);
      setActive(true);
    }
  }, [open, mode, initial, members, defaultRoleId]);

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
      const num = staffNumber.trim().toUpperCase();
      const n = name.trim();
      const ph = phone.trim();
      const em = email.trim();

      if (!num) {
        gooeyToast.warning("Staff number required");
        return;
      }
      if (!n) {
        gooeyToast.warning("Name required");
        return;
      }
      if (!ph) {
        gooeyToast.warning("Phone required");
        return;
      }
      if (!roles.some((r) => r.id === roleId)) {
        gooeyToast.warning("Pick a role");
        return;
      }
      if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
        gooeyToast.warning("Invalid email");
        return;
      }

      const duplicateNum = members.some(
        (m) =>
          m.staffNumber.toUpperCase() === num &&
          (mode !== "edit" || m.id !== initial?.id),
      );
      if (duplicateNum) {
        gooeyToast.error("Staff number already in use", { description: num });
        return;
      }

      const member: StaffMember = {
        id: mode === "edit" && initial ? initial.id : newStaffId(),
        staffNumber: num,
        name: n,
        phone: ph,
        email: em || undefined,
        roleId,
        active,
        createdAt:
          mode === "edit" && initial
            ? initial.createdAt
            : new Date().toISOString(),
      };
      onSave(member);
      onClose();
      gooeyToast.success(mode === "edit" ? "Staff updated" : "Staff added", {
        description: n,
      });
    },
    [
      staffNumber,
      name,
      phone,
      email,
      roleId,
      active,
      roles,
      members,
      mode,
      initial,
      onSave,
      onClose,
    ],
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-[var(--pos-border)] bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--pos-border)] px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-[var(--foreground)]">
            {mode === "edit" ? "Edit staff" : "Add staff"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#9ca3af] hover:bg-[#f4f4f5]"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.6} />
          </button>
        </div>

        <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Staff number
            </span>
            <input
              type="text"
              value={staffNumber}
              onChange={(e) => setStaffNumber(e.target.value)}
              placeholder="STF-003"
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Full name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Phone
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233 …"
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Email <span className="font-normal normal-case">(optional)</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@restaurant.com"
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Role
            </span>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/20"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--pos-border)] text-[var(--pos-primary)]"
            />
            <span className="text-sm font-medium text-[#374151]">Active on roster</span>
          </label>
        </div>

        <div className="flex gap-2 border-t border-[var(--pos-border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--pos-border)] py-2.5 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-[var(--pos-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--pos-primary-hover)]"
          >
            {mode === "edit" ? "Save changes" : "Add staff"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
