"use client";

import { CloseShiftModal } from "@/components/staff/close-shift-modal";
import { OpenShiftModal } from "@/components/staff/open-shift-modal";
import { useStaff } from "@/components/staff/staff-context";
import { formatCedi } from "@/lib/format-cedi";
import {
  readActivePosStaffId,
  writeActivePosStaffId,
} from "@/lib/pos-active-staff";
import { staffRoleLabel } from "@/lib/staff";
import { formatShiftWhen } from "@/lib/staff-shifts";
import { Square, UserCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function PosShiftGate({ children }: { children: React.ReactNode }) {
  const { hydrated, members, getMemberById, getOpenShiftForStaff } = useStaff();

  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);
  const [startShiftOpen, setStartShiftOpen] = useState(false);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const [tick, setTick] = useState(0);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!hydrated) return;
    setActiveStaffId(readActivePosStaffId());
  }, [hydrated, tick]);

  const activeMember = activeStaffId
    ? getMemberById(activeStaffId)
    : undefined;
  const openShift = activeStaffId
    ? getOpenShiftForStaff(activeStaffId)
    : undefined;

  const activeStaff = members.filter((m) => m.active);

  const selectStaff = (id: string) => {
    writeActivePosStaffId(id);
    setActiveStaffId(id);
    bump();
  };

  const clearStaff = () => {
    writeActivePosStaffId(null);
    setActiveStaffId(null);
    bump();
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center bg-[var(--background)] p-6">
        <p className="text-sm text-[var(--pos-muted)]">Loading…</p>
      </div>
    );
  }

  if (!activeStaffId || !activeMember) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center bg-[var(--background)] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[var(--pos-border)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[var(--pos-primary)]">
              <UserCircle className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Who is on POS?
              </h2>
              <p className="mt-0.5 text-sm text-[var(--pos-muted)]">
                Select yourself before selling. Your shift controls the cash
                drawer for this session.
              </p>
            </div>
          </div>
          <ul className="mt-5 max-h-[50vh] space-y-2 overflow-y-auto">
            {activeStaff.length === 0 ? (
              <li className="text-sm text-[#6b7280]">
                No active staff. Add team under Staff in the sidebar.
              </li>
            ) : (
              activeStaff.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => selectStaff(m.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--pos-border)] bg-[#fafafa] px-4 py-3 text-left transition-colors hover:border-[var(--pos-primary)] hover:bg-white"
                  >
                    <span>
                      <span className="font-semibold text-[var(--foreground)]">
                        {m.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#6b7280]">
                        {m.staffNumber} · {staffRoleLabel(m.roleId)}
                      </span>
                    </span>
                    {getOpenShiftForStaff(m.id) ? (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-800">
                        Shift open
                      </span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    );
  }

  if (!openShift) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center bg-[var(--background)] p-6">
          <div className="w-full max-w-md rounded-2xl border border-[var(--pos-border)] bg-white p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold">Start your shift</h2>
            <p className="mt-2 text-sm text-[var(--pos-muted)]">
              {activeMember.name}, count the cash in the drawer and record the
              opening float before taking sales.
            </p>
            <button
              type="button"
              onClick={() => setStartShiftOpen(true)}
              className="mt-5 rounded-lg bg-[var(--pos-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--pos-primary-hover)]"
            >
              Enter opening float
            </button>
            <button
              type="button"
              onClick={clearStaff}
              className="mt-3 text-sm font-medium text-[#6b7280] hover:text-[var(--foreground)]"
            >
              Not you? Choose someone else
            </button>
          </div>
        </div>
        <OpenShiftModal
          open={startShiftOpen}
          onClose={() => setStartShiftOpen(false)}
          staffId={activeStaffId}
          onSuccess={bump}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-sky-200/80 bg-sky-50 px-3 py-1.5 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-sky-950">
            <span className="font-semibold">{activeMember.name}</span>
            <span className="text-sky-800/80">
              {" "}
              · Shift since {formatShiftWhen(openShift.startedAt)} · Float{" "}
              {formatCedi(openShift.openingCashGhs)}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCloseShiftOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a1c23] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2d3039]"
            >
              <Square className="h-3.5 w-3.5" strokeWidth={2} />
              End shift
            </button>
            <button
              type="button"
              onClick={clearStaff}
              className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-900 hover:bg-sky-100/50"
            >
              Switch user
            </button>
          </div>
        </div>
      </div>

      {children}

      <CloseShiftModal
        open={closeShiftOpen}
        onClose={() => setCloseShiftOpen(false)}
        shift={openShift}
        onSuccess={() => {
          bump();
          clearStaff();
        }}
      />
    </div>
  );
}
