"use client";

import { StaffFormModal } from "@/components/staff/staff-form-modal";
import { useStaff } from "@/components/staff/staff-context";
import { staffRoleLabel } from "@/lib/staff";
import type { StaffMember } from "@/lib/staff";
import { gooeyToast } from "goey-toast";
import { Mail, Pencil, Phone, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export function StaffDirectory({
  createOpen,
  onCreateOpenChange,
}: {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { members, roles, hydrated, addMember, updateMember, removeMember } =
    useStaff();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== "all" && m.roleId !== roleFilter) return false;
      if (!q) return true;
      const hay = [
        m.name,
        m.phone,
        m.email ?? "",
        m.staffNumber,
        staffRoleLabel(m.roleId),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [members, query, roleFilter]);

  const summary = useMemo(() => {
    const active = members.filter((m) => m.active).length;
    const kitchen = members.filter((m) => m.roleId === "kitchen-staff").length;
    const pos = members.filter((m) => m.roleId === "pos-attendant").length;
    return { total: members.length, active, kitchen, pos };
  }, [members]);

  const saveMember = useCallback(
    (member: StaffMember) => {
      const exists = members.some((m) => m.id === member.id);
      if (exists) {
        updateMember(member.id, member);
      } else {
        const { id, createdAt, ...rest } = member;
        addMember(rest);
      }
    },
    [members, addMember, updateMember],
  );

  const deleteMember = useCallback(
    (m: StaffMember) => {
      if (
        !window.confirm(
          `Remove ${m.name} (${m.staffNumber}) from the roster?`,
        )
      ) {
        return;
      }
      removeMember(m.id);
      gooeyToast.info("Staff removed", { description: m.name });
    },
    [removeMember],
  );

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center p-16 text-sm text-[#9ca3af]">
        Loading staff…
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="On roster" value={String(summary.total)} />
          <SummaryCard label="Active" value={String(summary.active)} />
          <SummaryCard label="Kitchen" value={String(summary.kitchen)} />
          <SummaryCard label="POS attendants" value={String(summary.pos)} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="relative min-w-0 sm:max-w-md sm:flex-1 lg:max-w-lg">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
              strokeWidth={1.6}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, number, phone, role…"
              className="w-full rounded-lg border border-[var(--pos-border)] bg-white py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-[#9ca3af] focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/25"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              active={roleFilter === "all"}
              onClick={() => setRoleFilter("all")}
              label="All roles"
            />
            {roles.map((r) => (
              <FilterPill
                key={r.id}
                active={roleFilter === r.id}
                onClick={() => setRoleFilter(r.id)}
                label={r.label}
              />
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--pos-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--pos-border)] bg-[#fafafa] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  <th className="px-4 py-3 font-medium sm:px-5">Staff</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Contact</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Role</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Status</th>
                  <th className="px-4 py-3 text-right font-medium sm:px-5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-[var(--pos-border)] last:border-b-0 hover:bg-[#fafafa]"
                    onClick={() => router.push(`/staff/${row.id}`)}
                  >
                    <td className="px-4 py-3.5 sm:px-5">
                      <Link
                        href={`/staff/${row.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-[var(--foreground)] hover:text-[var(--pos-primary)] hover:underline"
                      >
                        {row.name}
                      </Link>
                      <p className="text-[11px] font-medium text-[#9ca3af]">
                        {row.staffNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <span className="flex items-center gap-1.5 text-xs text-[#374151]">
                        <Phone
                          className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]"
                          strokeWidth={1.6}
                        />
                        {row.phone}
                      </span>
                      {row.email ? (
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-[#6b7280]">
                          <Mail
                            className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]"
                            strokeWidth={1.6}
                          />
                          {row.email}
                        </span>
                      ) : (
                        <span className="mt-1 text-[11px] text-[#9ca3af]">
                          No email
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <span className="inline-flex rounded-md border border-[var(--pos-border)] bg-[#f9fafb] px-2 py-0.5 text-[11px] font-semibold text-[#475569]">
                        {staffRoleLabel(row.roleId)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          row.active
                            ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                            : "bg-[#f4f4f5] text-[#57534e] ring-1 ring-[#e7e5e4]"
                        }`}
                      >
                        {row.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/staff/${row.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center rounded-lg border border-[var(--pos-border)] bg-white px-2 py-1.5 text-[11px] font-semibold text-[var(--pos-primary)] hover:bg-[#f9fafb]"
                        >
                          Shifts
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTarget(row);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--pos-border)] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[#f9fafb]"
                        >
                          <Pencil className="h-3 w-3" strokeWidth={1.6} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMember(row);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100/80"
                        >
                          <Trash2 className="h-3 w-3" strokeWidth={1.6} />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visible.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-[#6b7280]">
              No staff match this filter.
            </p>
          ) : null}
        </div>

        <p className="text-xs text-[#9ca3af]">
          Default roles: {roles.map((r) => r.label).join(" · ")}. Custom roles
          can be added when you connect auth.
        </p>
      </div>

      <StaffFormModal
        open={createOpen}
        onClose={() => onCreateOpenChange(false)}
        mode="create"
        initial={null}
        onSave={saveMember}
      />
      <StaffFormModal
        open={editTarget != null}
        onClose={() => setEditTarget(null)}
        mode="edit"
        initial={editTarget}
        onSave={saveMember}
      />
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
        active
          ? "bg-[var(--foreground)] text-white shadow-sm"
          : "border border-[var(--pos-border)] bg-white text-[#374151] hover:bg-[#f9fafb]"
      }`}
    >
      {label}
    </button>
  );
}
