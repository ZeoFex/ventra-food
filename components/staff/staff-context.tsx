"use client";

import {
  DEFAULT_STAFF_MEMBERS,
  DEFAULT_STAFF_ROLES,
  loadStaffFromStorage,
  newStaffId,
  STAFF_STORAGE_KEY,
  type StaffMember,
  type StaffRole,
} from "@/lib/staff";
import {
  defaultStaffShifts,
  loadShiftsFromStorage,
  newShiftId,
  STAFF_SHIFTS_STORAGE_KEY,
  type StaffShift,
} from "@/lib/staff-shifts";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type StaffContextValue = {
  members: StaffMember[];
  shifts: StaffShift[];
  roles: StaffRole[];
  hydrated: boolean;
  addMember: (input: Omit<StaffMember, "id" | "createdAt">) => void;
  updateMember: (id: string, patch: Partial<StaffMember>) => void;
  removeMember: (id: string) => void;
  getMemberById: (id: string) => StaffMember | undefined;
  getShiftsForStaff: (staffId: string) => StaffShift[];
  getOpenShiftForStaff: (staffId: string) => StaffShift | undefined;
  openShift: (
    staffId: string,
    input: { openingCashGhs: number; notes?: string },
  ) => { ok: true } | { ok: false; error: string };
  closeShift: (
    shiftId: string,
    input: {
      cashSalesGhs: number;
      cardSalesGhs: number;
      momoSalesGhs: number;
      creditSalesGhs: number;
      cashPayOutsGhs: number;
      cashPayInsGhs: number;
      closingCountedCashGhs: number;
      notes?: string;
    },
  ) => { ok: true } | { ok: false; error: string };
};

const StaffContext = createContext<StaffContextValue | null>(null);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<StaffMember[]>(DEFAULT_STAFF_MEMBERS);
  const [shifts, setShifts] = useState<StaffShift[]>(defaultStaffShifts());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMembers(loadStaffFromStorage() ?? DEFAULT_STAFF_MEMBERS);
    const storedShifts = loadShiftsFromStorage();
    setShifts(
      storedShifts != null && storedShifts.length > 0
        ? storedShifts
        : defaultStaffShifts(),
    );
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(members));
    } catch {
      /* quota */
    }
  }, [members, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(STAFF_SHIFTS_STORAGE_KEY, JSON.stringify(shifts));
    } catch {
      /* quota */
    }
  }, [shifts, hydrated]);

  const addMember = useCallback(
    (input: Omit<StaffMember, "id" | "createdAt">) => {
      setMembers((prev) => [
        {
          ...input,
          id: newStaffId(),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [],
  );

  const updateMember = useCallback((id: string, patch: Partial<StaffMember>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  }, []);

  const removeMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setShifts((prev) => prev.filter((s) => s.staffId !== id));
  }, []);

  const getMemberById = useCallback(
    (id: string) => members.find((m) => m.id === id),
    [members],
  );

  const getShiftsForStaff = useCallback(
    (staffId: string) =>
      shifts
        .filter((s) => s.staffId === staffId)
        .sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        ),
    [shifts],
  );

  const getOpenShiftForStaff = useCallback(
    (staffId: string) =>
      shifts.find((s) => s.staffId === staffId && s.status === "open"),
    [shifts],
  );

  const openShift = useCallback(
    (
      staffId: string,
      input: { openingCashGhs: number; notes?: string },
    ): { ok: true } | { ok: false; error: string } => {
      if (!members.some((m) => m.id === staffId)) {
        return { ok: false, error: "Staff member not found." };
      }
      if (shifts.some((s) => s.staffId === staffId && s.status === "open")) {
        return {
          ok: false,
          error: "Close the current open shift before starting a new one.",
        };
      }
      if (!Number.isFinite(input.openingCashGhs) || input.openingCashGhs < 0) {
        return { ok: false, error: "Opening cash must be zero or greater." };
      }
      const row: StaffShift = {
        id: newShiftId(),
        staffId,
        status: "open",
        startedAt: new Date().toISOString(),
        openingCashGhs: input.openingCashGhs,
        cashSalesGhs: 0,
        cardSalesGhs: 0,
        momoSalesGhs: 0,
        creditSalesGhs: 0,
        cashPayOutsGhs: 0,
        cashPayInsGhs: 0,
        notes: input.notes?.trim() || undefined,
      };
      setShifts((prev) => [row, ...prev]);
      return { ok: true };
    },
    [members, shifts],
  );

  const closeShift = useCallback(
    (
      shiftId: string,
      input: {
        cashSalesGhs: number;
        cardSalesGhs: number;
        momoSalesGhs: number;
        creditSalesGhs: number;
        cashPayOutsGhs: number;
        cashPayInsGhs: number;
        closingCountedCashGhs: number;
        notes?: string;
      },
    ): { ok: true } | { ok: false; error: string } => {
      const shift = shifts.find((s) => s.id === shiftId);
      if (!shift) return { ok: false, error: "Shift not found." };
      if (shift.status !== "open") {
        return { ok: false, error: "This shift is already closed." };
      }
      const amounts = [
        input.cashSalesGhs,
        input.cardSalesGhs,
        input.momoSalesGhs,
        input.creditSalesGhs,
        input.cashPayOutsGhs,
        input.cashPayInsGhs,
        input.closingCountedCashGhs,
      ];
      if (amounts.some((n) => !Number.isFinite(n) || n < 0)) {
        return { ok: false, error: "All amounts must be zero or greater." };
      }
      setShifts((prev) =>
        prev.map((s) =>
          s.id === shiftId
            ? {
                ...s,
                status: "closed" as const,
                endedAt: new Date().toISOString(),
                cashSalesGhs: input.cashSalesGhs,
                cardSalesGhs: input.cardSalesGhs,
                momoSalesGhs: input.momoSalesGhs,
                creditSalesGhs: input.creditSalesGhs,
                cashPayOutsGhs: input.cashPayOutsGhs,
                cashPayInsGhs: input.cashPayInsGhs,
                closingCountedCashGhs: input.closingCountedCashGhs,
                notes: input.notes?.trim() || s.notes,
              }
            : s,
        ),
      );
      return { ok: true };
    },
    [shifts],
  );

  const value = useMemo(
    () => ({
      members,
      shifts,
      roles: DEFAULT_STAFF_ROLES,
      hydrated,
      addMember,
      updateMember,
      removeMember,
      getMemberById,
      getShiftsForStaff,
      getOpenShiftForStaff,
      openShift,
      closeShift,
    }),
    [
      members,
      shifts,
      hydrated,
      addMember,
      updateMember,
      removeMember,
      getMemberById,
      getShiftsForStaff,
      getOpenShiftForStaff,
      openShift,
      closeShift,
    ],
  );

  return (
    <StaffContext.Provider value={value}>{children}</StaffContext.Provider>
  );
}

export function useStaff(): StaffContextValue {
  const ctx = useContext(StaffContext);
  if (!ctx) {
    throw new Error("useStaff must be used within StaffProvider");
  }
  return ctx;
}
