"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  ChefHat,
  Copy,
  MessageSquare,
  MonitorSmartphone,
  Plus,
  Smartphone,
} from "lucide-react";

type KitchenStaff = {
  id: string;
  name: string;
  phone: string;
  role: string;
  sms: boolean;
  active: boolean;
};

const STAFF_INITIAL: KitchenStaff[] = [
  {
    id: "ks-1",
    name: "Kwame Boateng",
    phone: "+233 24 100 2200",
    role: "Head line · Pass",
    sms: true,
    active: true,
  },
  {
    id: "ks-2",
    name: "Akosua Frimpong",
    phone: "+233 55 882 9101",
    role: "Grill",
    sms: true,
    active: true,
  },
  {
    id: "ks-3",
    name: "Yaw Darko",
    phone: "+233 20 441 5599",
    role: "Cold / salad",
    sms: false,
    active: true,
  },
];

const STATIONS = [
  { id: "pass", label: "Pass / expedite", sms: true },
  { id: "grill", label: "Grill", sms: true },
  { id: "cold", label: "Cold & dessert", sms: true },
  { id: "bar", label: "Bar", sms: false },
] as const;

function CopyField({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  const copy = useCallback(() => {
    void navigator.clipboard.writeText(value).then(() => {
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    });
  }, [value]);

  return (
    <div className="rounded-lg border border-[var(--pos-border)] bg-[#fafafa] px-3 py-2">
      {label ? (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">
          {label}
        </p>
      ) : null}
      <div className={label ? "mt-1 flex items-center gap-2" : "flex items-center gap-2"}>
        <code className="min-w-0 flex-1 truncate text-xs font-medium text-[#1a2233]">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center gap-1 rounded-md border border-[var(--pos-border)] bg-white px-2 py-1 text-[11px] font-semibold text-[#374151] hover:bg-[#f9fafb]"
        >
          <Copy className="h-3.5 w-3.5" strokeWidth={1.6} />
          {done ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function CopyInviteLink({ loginUrl }: { loginUrl: string }) {
  const [done, setDone] = useState(false);
  const copy = useCallback(() => {
    void navigator.clipboard.writeText(loginUrl).then(() => {
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    });
  }, [loginUrl]);

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-lg border border-[var(--pos-border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#374151] shadow-sm hover:bg-[#f9fafb]"
    >
      <Copy className="h-3.5 w-3.5" strokeWidth={1.6} />
      {done ? "Copied link" : "Login link"}
    </button>
  );
}

export function KitchenConfigHome() {
  const [smsOnNewKot, setSmsOnNewKot] = useState(true);
  const [smsRetry, setSmsRetry] = useState(true);
  const [staff, setStaff] = useState<KitchenStaff[]>(STAFF_INITIAL);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const boardUrl = origin ? `${origin}/kitchen/board` : "/kitchen/board";
  const loginUrl = origin ? `${origin}/kitchen/login` : "/kitchen/login";

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <MessageSquare
              className="h-5 w-5 text-[var(--pos-primary)]"
              strokeWidth={1.6}
            />
            <h2 className="text-sm font-semibold">SMS on new KOT</h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--pos-muted)]">
            When POS prints or sends a KOT, we can text linked kitchen numbers
            with order summary (uses your SMS provider in production).
          </p>
          <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[var(--pos-border)] bg-[#fafafa] px-3 py-2.5">
            <span className="text-sm font-medium text-[#374151]">Enable</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--pos-border)] text-[var(--pos-primary)]"
              checked={smsOnNewKot}
              onChange={(e) => setSmsOnNewKot(e.target.checked)}
            />
          </label>
          <label className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[var(--pos-border)] bg-[#fafafa] px-3 py-2.5">
            <span className="text-sm font-medium text-[#374151]">
              Retry on failure
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--pos-border)] text-[var(--pos-primary)]"
              checked={smsRetry}
              onChange={(e) => setSmsRetry(e.target.checked)}
            />
          </label>
        </div>

        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <MonitorSmartphone
              className="h-5 w-5 text-[var(--pos-primary)]"
              strokeWidth={1.6}
            />
            <h2 className="text-sm font-semibold">Kitchen dashboard</h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--pos-muted)]">
            Staff sign in on this URL for a live ticket list (phones, tablets,
            or wall display).
          </p>
          <div className="mt-4 space-y-2">
            <CopyField label="Staff login URL" value={loginUrl} />
            <CopyField label="Live board URL (after sign-in)" value={boardUrl} />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <Bell className="h-5 w-5 text-[var(--pos-primary)]" strokeWidth={1.6} />
            <h2 className="text-sm font-semibold">SMS template (preview)</h2>
          </div>
          <p className="mt-2 text-xs text-[var(--pos-muted)]">
            Placeholders: {"{venue}"}, {"{order}"}, {"{table}"}, {"{items}"},{" "}
            {"{link}"}
          </p>
          <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-[var(--pos-border)] bg-[#0f172a] p-3 text-[11px] leading-relaxed text-[#e2e8f0]">
            {`[{venue}] NEW KOT #{order} · {table}
{items}
Open kitchen: {link}`}
          </pre>
          <p className="mt-2 text-[11px] text-[#9ca3af]">
            Wire template + provider (Hubtel, mNotify, Twilio, etc.) in backend.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Provider credentials
        </h2>
        <p className="mt-1 text-xs text-[var(--pos-muted)]">
          Stored encrypted server-side in production — never in the browser.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
              Sender ID
            </label>
            <input
              readOnly
              value="RESTROBIT"
              className="mt-1 w-full rounded-lg border border-[var(--pos-border)] bg-[#f9fafb] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
              API key
            </label>
            <input
              readOnly
              value="••••••••••••••••"
              className="mt-1 w-full rounded-lg border border-[var(--pos-border)] bg-[#f9fafb] px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="button"
          className="mt-4 rounded-lg border border-[var(--pos-border)] bg-white px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
        >
          Save provider (API)
        </button>
      </div>

      <div className="rounded-xl border border-[var(--pos-border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ChefHat
              className="h-5 w-5 text-[var(--pos-primary)]"
              strokeWidth={1.6}
            />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Stations &amp; SMS routing
            </h2>
          </div>
        </div>
        <p className="mt-1 text-xs text-[var(--pos-muted)]">
          Toggle which prep areas receive an SMS copy when a ticket hits their
          course group.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {STATIONS.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-[var(--pos-border)] px-3 py-2.5"
            >
              <span className="text-sm font-medium text-[#374151]">
                {s.label}
              </span>
              <label className="flex items-center gap-2 text-xs text-[#6b7280]">
                SMS
                <input
                  type="checkbox"
                  defaultChecked={s.sms}
                  className="h-4 w-4 rounded border-[var(--pos-border)]"
                />
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[var(--pos-border)] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pos-border)] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Smartphone
              className="h-5 w-5 text-[var(--pos-primary)]"
              strokeWidth={1.6}
            />
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Kitchen staff accounts
              </h2>
              <p className="text-xs text-[var(--pos-muted)]">
                Phone is used for SMS alerts; PIN set on first login in production.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setStaff((s) => [
                ...s,
                {
                  id: `ks-${Date.now()}`,
                  name: "New staff",
                  phone: "+233 …",
                  role: "Assign role",
                  sms: true,
                  active: true,
                },
              ])
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--pos-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--pos-primary-hover)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            Add staff
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pos-border)] bg-[#fafafa] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                <th className="px-4 py-3 font-medium sm:px-5">Name</th>
                <th className="px-4 py-3 font-medium sm:px-5">Phone (SMS)</th>
                <th className="px-4 py-3 font-medium sm:px-5">Role / station</th>
                <th className="px-4 py-3 font-medium sm:px-5">SMS</th>
                <th className="px-4 py-3 font-medium sm:px-5">Status</th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">
                  Invite
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--pos-border)] last:border-b-0"
                >
                  <td className="px-4 py-3.5 font-medium text-[var(--foreground)] sm:px-5">
                    {row.name}
                  </td>
                  <td className="px-4 py-3.5 text-[#374151] tabular-nums sm:px-5">
                    {row.phone}
                  </td>
                  <td className="px-4 py-3.5 text-[#374151] sm:px-5">
                    {row.role}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <input
                      type="checkbox"
                      checked={row.sms}
                      onChange={(e) =>
                        setStaff((list) =>
                          list.map((x) =>
                            x.id === row.id
                              ? { ...x, sms: e.target.checked }
                              : x,
                          ),
                        )
                      }
                      className="h-4 w-4 rounded border-[var(--pos-border)]"
                    />
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        row.active
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {row.active ? "Active" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right sm:px-5">
                    <CopyInviteLink loginUrl={loginUrl} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-[var(--pos-border)] px-4 py-3 text-center text-[11px] text-[#9ca3af] sm:px-5">
          Demo UI — persist staff and secrets via your Ventra Food API.
        </p>
      </div>

      <p className="text-xs text-[var(--pos-muted)]">
        Typical flow: POS fires a KOT → your API creates a ticket → SMS goes
        to selected numbers and the same ticket appears in real time on the
        kitchen board (WebSocket or similar).
      </p>
    </div>
  );
}
