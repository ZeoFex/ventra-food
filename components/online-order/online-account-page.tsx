"use client";

import { OnlineShell } from "@/components/online-order/online-shell";
import { useOnlineOrder } from "@/components/online-order/online-order-context";
import { formatCedi } from "@/lib/format-cedi";
import type { CustomerAddress } from "@/lib/online-account";
import { readAllOnlineOrders } from "@/lib/online-orders";
import { gooeyToast } from "goey-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function OnlineAccountPage() {
  const {
    basePath,
    restaurantSlug,
    session,
    setSession,
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
  } = useOnlineOrder();

  const [name, setName] = useState(session?.name ?? "");
  const [phone, setPhone] = useState(session?.phone ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [editingAddr, setEditingAddr] = useState<CustomerAddress | null>(null);
  const [showAddrForm, setShowAddrForm] = useState(false);

  const myOrders = useMemo(() => {
    if (!session?.phone) return [];
    const phone = session.phone.replace(/\s/g, "");
    return readAllOnlineOrders().filter(
      (o) =>
        o.restaurantSlug === restaurantSlug &&
        o.customerPhone.replace(/\s/g, "") === phone,
    );
  }, [session, restaurantSlug]);

  const saveProfile = () => {
    if (!name.trim() || !phone.trim()) {
      gooeyToast.error("Name and phone required");
      return;
    }
    setSession({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
    });
    gooeyToast.success("Profile saved");
  };

  const signOut = () => {
    setSession(null);
    setName("");
    setPhone("");
    setEmail("");
    gooeyToast.success("Signed out");
  };

  return (
    <OnlineShell title="Account" subtitle="Profile, addresses & orders" layout="narrow">
      <section className="rounded-2xl border border-[#e8e4dc] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1a1c23]">Your details</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className={inputClass + " mt-3"}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className={inputClass + " mt-2"}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={inputClass + " mt-2"}
        />
        <button
          type="button"
          onClick={saveProfile}
          className="mt-3 w-full rounded-xl bg-[var(--pos-primary)] py-2.5 text-xs font-bold text-white"
        >
          Save profile
        </button>
        {session ? (
          <button
            type="button"
            onClick={signOut}
            className="mt-2 w-full text-xs font-semibold text-[#6b7280]"
          >
            Sign out
          </button>
        ) : null}
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1a1c23]">Addresses</h2>
          <button
            type="button"
            onClick={() => {
              setEditingAddr(null);
              setShowAddrForm(true);
            }}
            className="flex items-center gap-1 text-xs font-bold text-[var(--pos-primary)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-[#e8e4dc] bg-white p-3"
            >
              <div>
                <p className="text-sm font-bold">
                  {a.label}
                  {a.isDefault ? (
                    <span className="ml-2 text-[10px] font-semibold text-[var(--pos-primary)]">
                      Default
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-[#6b7280]">
                  {a.line1}, {a.area}, {a.city}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddr(a);
                    setShowAddrForm(true);
                  }}
                  className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f3f4f6]"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteAddress(a.id);
                    gooeyToast.success("Address removed");
                  }}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {showAddrForm ? (
        <AddressFormModal
          initial={editingAddr}
          onClose={() => setShowAddrForm(false)}
          onSave={(data) => {
            if (editingAddr) {
              updateAddress(editingAddr.id, data);
              gooeyToast.success("Address updated");
            } else {
              addAddress(data);
              gooeyToast.success("Address added");
            }
            setShowAddrForm(false);
          }}
        />
      ) : null}

      <section className="mt-6">
        <h2 className="text-sm font-bold text-[#1a1c23]">Order history</h2>
        {!session ? (
          <p className="mt-2 text-xs text-[#6b7280]">
            Save your profile to see orders linked to your phone.
          </p>
        ) : myOrders.length === 0 ? (
          <p className="mt-2 text-xs text-[#6b7280]">No orders yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {myOrders.map((o) => (
              <li key={o.ref}>
                <Link
                  href={`${basePath}/orders/${o.ref}`}
                  className="flex items-center justify-between rounded-xl border border-[#e8e4dc] bg-white px-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-bold">{o.ref}</p>
                    <p className="text-xs capitalize text-[#6b7280]">
                      {o.status.replace(/_/g, " ")} · {o.fulfillment}
                    </p>
                  </div>
                  <span className="font-bold tabular-nums text-[var(--pos-primary)]">
                    {formatCedi(o.totalGhs)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </OnlineShell>
  );
}

function AddressFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial: CustomerAddress | null;
  onClose: () => void;
  onSave: (data: Omit<CustomerAddress, "id">) => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "Home");
  const [line1, setLine1] = useState(initial?.line1 ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [city, setCity] = useState(initial?.city ?? "Accra");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white p-4 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold">
          {initial ? "Edit address" : "New address"}
        </h3>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (Home, Office…)"
          className={inputClass + " mt-3"}
        />
        <input
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          placeholder="Street / building"
          className={inputClass + " mt-2"}
        />
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Area / neighbourhood"
          className={inputClass + " mt-2"}
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className={inputClass + " mt-2"}
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Delivery notes (optional)"
          className={inputClass + " mt-2"}
        />
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Default address
        </label>
        <button
          type="button"
          onClick={() => {
            if (!line1.trim() || !area.trim()) {
              gooeyToast.error("Street and area required");
              return;
            }
            onSave({
              label: label.trim() || "Address",
              line1: line1.trim(),
              area: area.trim(),
              city: city.trim() || "Accra",
              notes: notes.trim() || undefined,
              isDefault,
            });
          }}
          className="mt-4 w-full rounded-2xl bg-[var(--pos-primary)] py-3 text-sm font-bold text-white"
        >
          Save
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#e8e4dc] bg-[#faf8f5] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/25";
