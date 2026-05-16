"use client";

import { ChefHat } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const SESSION_KEY = "ventra_kitchen_session";

export default function KitchenLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    sessionStorage.setItem(SESSION_KEY, "1");
    router.push("/kitchen/board");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-3 text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--pos-primary)]">
          <ChefHat className="h-7 w-7 text-white" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-lg font-bold tracking-tight">RestroBit Kitchen</p>
          <p className="text-xs text-slate-400">Staff sign-in · KLD</p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-[380px] rounded-2xl border border-white/10 bg-[#141922] p-6 shadow-2xl"
      >
        <h1 className="text-center text-lg font-semibold text-white">
          Log in to kitchen board
        </h1>
        <p className="mt-1 text-center text-xs text-slate-400">
          Demo: any phone + PIN submits — wire OTP or SSO later.
        </p>

        <label className="mt-6 block text-xs font-medium text-slate-400">
          Phone
          <input
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+233 24 …"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0c0f14] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[var(--pos-primary)] focus:ring-1 focus:ring-[var(--pos-primary)]"
          />
        </label>

        <label className="mt-4 block text-xs font-medium text-slate-400">
          PIN
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0c0f14] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[var(--pos-primary)] focus:ring-1 focus:ring-[var(--pos-primary)]"
          />
        </label>

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-[var(--pos-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--pos-primary-hover)]"
        >
          Sign in
        </button>
      </form>

      <p className="mt-8 text-center text-[11px] text-slate-500">
        Manage SMS and staff in{" "}
        <Link
          href="/kitchen-config"
          className="font-medium text-[var(--pos-primary)] hover:underline"
        >
          KLD config
        </Link>
        .
      </p>
    </div>
  );
}
