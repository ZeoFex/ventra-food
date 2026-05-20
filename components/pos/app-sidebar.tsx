"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChefHat,
  ChevronDown,
  CreditCard,
  FileText,
  LayoutDashboard,
  MonitorSmartphone,
  PieChart,
  Settings,
  Table2,
  Tag,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MENUS_PREFIXES = ["/menus", "/menu/qr"] as const;

function VentraFoodMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 36 36" aria-hidden className="shrink-0">
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

  const className = `flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] transition-colors ${
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
    <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
      {children}
    </p>
  );
}

function menusSectionActive(pathname: string) {
  return MENUS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function NavSubLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = navActive(pathname, href);
  return (
    <Link
      href={href}
      className={`flex w-full items-center rounded-lg py-2 pl-9 pr-3 text-left text-[13px] transition-colors ${
        active
          ? "bg-[var(--pos-sidebar-active)] font-semibold text-[var(--foreground)]"
          : "font-medium text-[#6b7280] hover:bg-white/70 hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </Link>
  );
}

function NavMenusGroup() {
  const pathname = usePathname();
  const sectionActive = menusSectionActive(pathname);
  const [open, setOpen] = useState(sectionActive);

  useEffect(() => {
    if (sectionActive) setOpen(true);
  }, [sectionActive]);

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] transition-colors ${
          sectionActive
            ? "bg-[var(--pos-sidebar-active)] font-bold text-[var(--foreground)]"
            : "font-medium text-[#4b5563] hover:bg-white/70 hover:text-[var(--foreground)]"
        }`}
      >
        <BookOpen className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
        <span className="flex-1">Menus</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#9ca3af] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>
      {open ? (
        <div className="space-y-0.5 pb-1">
          <NavSubLink href="/menus/dishes" label="Dishes" />
          <NavSubLink href="/menus/categories" label="Categories" />
          <NavSubLink href="/menu/qr" label="QR codes" />
        </div>
      ) : null}
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="flex h-full w-[200px] shrink-0 flex-col border-r border-[var(--pos-border)] bg-white px-2 py-3">
      <div className="flex items-center gap-2 px-1.5 pb-3">
        <VentraFoodMark />
        <span className="text-base font-bold tracking-tight text-[var(--foreground)]">
          Ventra Food
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--pos-border)] bg-[#fafafa] px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-50 text-xs font-semibold text-orange-700">
          OK
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#111827]">
            Owusu Kenneth
          </p>
          <p className="truncate text-xs text-[var(--pos-muted)]">
            Staff
          </p>
        </div>
      </div>

      <nav className="pos-sidebar-scroll flex-1 space-y-0.5 overflow-y-auto pr-0.5">
        <NavItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" />
        <NavItem icon={MonitorSmartphone} label="Pos" href="/" />
        <NavItem
          icon={Table2}
          label="Table"
          navDisabled
          placeholderHint="Tables — disabled for now"
        />
        <NavItem icon={CalendarDays} label="Reservations" href="/reservations" />

        <NavSectionTitle>Team</NavSectionTitle>
        <NavItem icon={UserCog} label="Staff" href="/staff" />

        <NavSectionTitle>Offering</NavSectionTitle>
        <NavItem icon={Tag} label="Discounts" href="/discounts" />
        <NavItem icon={CreditCard} label="Payments" badge="New" href="/payments" />
        <NavItem icon={Users} label="Customer" href="/customers" />
        <NavItem icon={FileText} label="Invoice" href="/invoices" />
        <NavMenusGroup />

        <NavSectionTitle>Kitchen (KLD)</NavSectionTitle>
        <NavItem icon={ChefHat} label="KLD config" href="/kitchen-config" />

        <NavSectionTitle>Back Office</NavSectionTitle>
        <NavItem icon={PieChart} label="Finances" href="/finances" />
        <NavItem icon={Settings} label="Setting" href="/settings" />
      </nav>

      <button
        type="button"
        className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-[var(--pos-border)] bg-white py-2 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
      >
        <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
        Login
      </button>
    </aside>
  );
}
