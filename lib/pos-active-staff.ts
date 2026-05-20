/** Which staff member is operating the POS on this device (session). */

export const ACTIVE_POS_STAFF_KEY = "ventra_active_pos_staff_id";

export function readActivePosStaffId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const id = sessionStorage.getItem(ACTIVE_POS_STAFF_KEY)?.trim();
    return id || null;
  } catch {
    return null;
  }
}

export function writeActivePosStaffId(staffId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!staffId) sessionStorage.removeItem(ACTIVE_POS_STAFF_KEY);
    else sessionStorage.setItem(ACTIVE_POS_STAFF_KEY, staffId);
  } catch {
    /* ignore */
  }
}
