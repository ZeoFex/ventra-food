"use client";

import {
  ArrowRight,
  CalendarDays,
  ChefHat,
  CreditCard,
  FileText,
  LayoutDashboard,
  MonitorSmartphone,
  QrCode,
  Settings,
  Table2,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function RestroBitMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <polygon
        points="18,3 32,11 32,25 18,33 4,25 4,11"
        fill="none"
        stroke="var(--pos-primary)"
        strokeWidth="2"
      />
      <path
        d="M14 14h8v8h-8z"
        fill="var(--pos-primary)"
        opacity="0.25"
      />
    </svg>
  );
}

function navActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  icon: Icon,
  label,
  href,
  badge,
  placeholderHint,
  navDisabled,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  href?: string;
  badge?: string;
  /** Shown when there is no `href` */
  placeholderHint?: string;
  /** When set (and no `href`), use a non-interactive / disabled control */
  navDisabled?: boolean;
}) {
  const pathname = usePathname();
  const active = href ? navActive(pathname, href) : false;

  const className = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
    active
      ? "bg-[var(--pos-sidebar-active)] font-bold text-[var(--foreground)]"
      : href
        ? "font-medium text-[#4b5563] hover:bg-white/70 hover:text-[var(--foreground)]"
        : navDisabled
          ? "cursor-not-allowed font-medium text-[#4b5563] opacity-55"
          : "font-medium text-[#4b5563] hover:bg-white/70 hover:text-[var(--foreground)]"
  }`;

  const content = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded bg-[var(--pos-badge-new)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {badge}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={navDisabled === true}
      title={placeholderHint ?? "Coming soon"}
    >
      {content}
    </button>
  );
}

function NavSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
      {children}
    </p>
  );
}

export function AppSidebar() {
  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-[var(--pos-border)] bg-white px-3 py-5">
      <div className="flex items-center gap-2.5 px-2 pb-6">
        <RestroBitMark />
        <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">
          RestroBit
        </span>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--pos-border)] bg-[#fafafa] px-3 py-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-50 text-sm font-semibold text-orange-700">
          NZ
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#111827]">
            Nahid Zaman
          </p>
          <p className="truncate text-xs text-[var(--pos-muted)]">
            Product Designer
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        <NavItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" />
        <NavItem icon={MonitorSmartphone} label="Pos" href="/" />
        <NavItem
          icon={Table2}
          label="Table"
          navDisabled
          placeholderHint="Tables — disabled for now"
        />
        <NavItem icon={CalendarDays} label="Reservations" href="/reservations" />

        <NavSectionTitle>Offering</NavSectionTitle>
        <NavItem icon={Truck} label="Delivery Executive" />
        <NavItem icon={CreditCard} label="Payments" badge="New" href="/payments" />
        <NavItem icon={Users} label="Customer" href="/customers" />
        <NavItem icon={FileText} label="Invoice" href="/invoices" />
        <NavItem icon={QrCode} label="QR menu" href="/menu/qr" />

        <NavSectionTitle>Kitchen (KLD)</NavSectionTitle>
        <NavItem icon={ChefHat} label="KLD config" href="/kitchen-config" />

        <NavSectionTitle>Back Office</NavSectionTitle>
        <NavItem icon={Settings} label="Setting" href="/settings" />
      </nav>

      <button
        type="button"
        className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-[var(--pos-border)] bg-white py-2.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
      >
        <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
        Login
      </button>
    </aside>
  );
}
