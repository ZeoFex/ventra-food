"use client";

import { CloseShiftModal } from "@/components/staff/close-shift-modal";
import { OpenShiftModal } from "@/components/staff/open-shift-modal";
import { ShiftReconciliationPanel } from "@/components/staff/shift-reconciliation-panel";
import { useStaff } from "@/components/staff/staff-context";
import { StaffFormModal } from "@/components/staff/staff-form-modal";
import { AppSidebar } from "@/components/pos/app-sidebar";
import { formatCedi } from "@/lib/format-cedi";
import { staffRoleLabel } from "@/lib/staff";
import type { StaffMember } from "@/lib/staff";
import {
  formatShiftDuration,
  formatShiftWhen,
  reconcileShift,
  type StaffShift,
} from "@/lib/staff-shifts";
import { ChevronDown, ChevronLeft, Pencil, Play, Square } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

function ShiftCard({ shift }: { shift: StaffShift }) {
  const [expanded, setExpanded] = useState(shift.status === "open");
  const r = reconcileShift(shift);
  const statusBadge =
    shift.status === "open"
      ? "bg-sky-50 text-sky-800 ring-sky-200"
      : r.varianceLabel === "balanced"
        ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
        : r.varianceLabel === "over"
          ? "bg-amber-50 text-amber-900 ring-amber-200"
          : r.varianceLabel === "short"
            ? "bg-red-50 text-red-800 ring-red-200"
            : "bg-[#f4f4f5] text-[#57534e] ring-[#e7e5e4]";

  const statusText =
    shift.status === "open"
      ? "Open"
      : r.varianceLabel === "balanced"
        ? "Balanced"
        : r.varianceLabel === "over"
          ? "Over"
          : r.varianceLabel === "short"
            ? "Short"
            : "Closed";

  return (
    <div className="rounded-xl border border-[var(--pos-border)] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#9ca3af] transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--foreground)]">
            {formatShiftWhen(shift.startedAt)}
            {shift.endedAt ? ` → ${formatShiftWhen(shift.endedAt)}` : " → now"}
          </p>
          <p className="mt-0.5 text-xs text-[#6b7280]">
            {formatShiftDuration(shift.startedAt, shift.endedAt)} · Total sales{" "}
            {formatCedi(r.totalSalesGhs)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${statusBadge}`}
        >
          {statusText}
        </span>
      </button>
      {expanded ? (
        <div className="border-t border-[var(--pos-border)] px-4 pb-4 pt-2 sm:px-5">
          <ShiftReconciliationPanel shift={shift} />
        </div>
      ) : null}
    </div>
  );
}

export function StaffDetailScreen({ staffId }: { staffId: string }) {
  const {
    hydrated,
    getMemberById,
    getShiftsForStaff,
    getOpenShiftForStaff,
    updateMember,
    members,
    addMember,
  } = useStaff();

  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [closeShiftModal, setCloseShiftModal] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const member = getMemberById(staffId);
  const shifts = useMemo(
    () => (hydrated ? getShiftsForStaff(staffId) : []),
    [hydrated, getShiftsForStaff, staffId],
  );
  const openShift = useMemo(
    () => (hydrated ? getOpenShiftForStaff(staffId) : undefined),
    [hydrated, getOpenShiftForStaff, staffId],
  );

  const saveMember = (m: StaffMember) => {
    const exists = members.some((x) => x.id === m.id);
    if (exists) updateMember(m.id, m);
    else {
      const { id, createdAt, ...rest } = m;
      addMember(rest);
    }
  };

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-[#9ca3af]">
        Loading…
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-[#6b7280]">Staff member not found.</p>
        <Link
          href="/staff"
          className="text-sm font-semibold text-[var(--pos-primary)] hover:underline"
        >
          Back to staff list
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-[var(--pos-border)] bg-white px-4 py-4 sm:px-6">
          <Link
            href="/staff"
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[#6b7280] hover:text-[var(--foreground)]"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            All staff
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[#9ca3af]">
                {member.staffNumber} · {staffRoleLabel(member.roleId)}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight">
                {member.name}
              </h1>
              <p className="mt-1 text-sm text-[var(--pos-muted)]">
                {member.phone}
                {member.email ? ` · ${member.email}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
              >
                <Pencil className="h-4 w-4" strokeWidth={1.6} />
                Edit profile
              </button>
              {openShift ? (
                <button
                  type="button"
                  onClick={() => setCloseShiftModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a1c23] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d3039]"
                >
                  <Square className="h-4 w-4" strokeWidth={2} />
                  Close shift
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenShiftModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--pos-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--pos-primary-hover)]"
                >
                  <Play className="h-4 w-4" strokeWidth={2} />
                  Start shift
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {openShift ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
                <p className="font-semibold">Shift in progress</p>
                <p className="mt-1 text-xs text-sky-900/90">
                  Started {formatShiftWhen(openShift.startedAt)} · Opening float{" "}
                  {formatCedi(openShift.openingCashGhs)}. Close the shift when
                  you count the drawer.
                </p>
              </div>
            ) : null}

            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Shift history
              </h2>
              <p className="mt-1 text-xs text-[#6b7280]">
                Tap a shift to see the full cash reconciliation (opening float,
                sales, expected vs counted).
              </p>
              <div className="mt-4 space-y-3">
                {shifts.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--pos-border)] bg-white px-4 py-10 text-center text-sm text-[#6b7280]">
                    No shifts yet. Start a shift to record opening cash and close
                    with a drawer count.
                  </p>
                ) : (
                  shifts.map((s) => <ShiftCard key={s.id} shift={s} />)
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <OpenShiftModal
        open={openShiftModal}
        onClose={() => setOpenShiftModal(false)}
        staffId={staffId}
      />
      {openShift ? (
        <CloseShiftModal
          open={closeShiftModal}
          onClose={() => setCloseShiftModal(false)}
          shift={openShift}
        />
      ) : null}
      <StaffFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        initial={member}
        onSave={saveMember}
      />
    </div>
  );
}
