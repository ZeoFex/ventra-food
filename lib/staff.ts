/** Staff directory — roles and members (localStorage until API). */

export type StaffRole = {
  id: string;
  label: string;
};

export const DEFAULT_STAFF_ROLES: StaffRole[] = [
  { id: "pos-attendant", label: "POS attendant" },
  { id: "kitchen-staff", label: "Kitchen staff" },
  { id: "server", label: "Server" },
  { id: "cashier", label: "Cashier" },
  { id: "manager", label: "Manager" },
  { id: "supervisor", label: "Supervisor" },
];

export type StaffMember = {
  id: string;
  /** Display ID e.g. STF-001 */
  staffNumber: string;
  name: string;
  phone: string;
  email?: string;
  roleId: string;
  active: boolean;
  createdAt: string;
};

export const STAFF_STORAGE_KEY = "ventra_staff_v1";

export function staffRoleLabel(roleId: string): string {
  return (
    DEFAULT_STAFF_ROLES.find((r) => r.id === roleId)?.label ?? "Other"
  );
}

export function newStaffId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `staff-${Date.now().toString(36)}`;
}

/** Next sequential staff number from existing rows (STF-001, STF-002, …). */
export function nextStaffNumber(members: StaffMember[]): string {
  let max = 0;
  for (const m of members) {
    const match = /^STF-(\d+)$/i.exec(m.staffNumber.trim());
    if (match) {
      const n = Number.parseInt(match[1], 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `STF-${String(max + 1).padStart(3, "0")}`;
}

export const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  {
    id: "staff-seed-1",
    staffNumber: "STF-001",
    name: "Owusu Kenneth",
    phone: "+233 24 000 1001",
    email: "kenneth@example.com",
    roleId: "manager",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "staff-seed-2",
    staffNumber: "STF-002",
    name: "Ama Boateng",
    phone: "+233 20 000 2002",
    roleId: "kitchen-staff",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

function normalizeMember(row: unknown): StaffMember | null {
  if (typeof row !== "object" || row === null) return null;
  const o = row as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.staffNumber !== "string") return null;
  if (typeof o.name !== "string" || typeof o.phone !== "string") return null;
  if (typeof o.roleId !== "string") return null;
  const email =
    typeof o.email === "string" && o.email.trim() ? o.email.trim() : undefined;
  const active = o.active === false ? false : true;
  const createdAt =
    typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString();
  return {
    id: o.id,
    staffNumber: o.staffNumber.trim(),
    name: o.name.trim(),
    phone: o.phone.trim(),
    email,
    roleId: o.roleId,
    active,
    createdAt,
  };
}

export function loadStaffFromStorage(): StaffMember[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    const out = data.map(normalizeMember).filter(Boolean) as StaffMember[];
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}
