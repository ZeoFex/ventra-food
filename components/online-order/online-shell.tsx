"use client";

import { useOnlineOrder } from "@/components/online-order/online-order-context";
import { formatCedi } from "@/lib/format-cedi";
import { ShoppingBag, User, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function navActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SHELL_WIDE =
  "mx-auto w-full max-w-lg md:max-w-3xl lg:max-w-6xl xl:max-w-7xl";
const SHELL_NARROW =
  "mx-auto w-full max-w-lg md:max-w-xl lg:max-w-2xl";

export function OnlineShell({
  children,
  title,
  subtitle,
  hideCartBar,
  backHref,
  /** wide = menu + catalog; narrow = cart, checkout, forms */
  layout = "narrow",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  hideCartBar?: boolean;
  backHref?: string;
  layout?: "wide" | "narrow";
}) {
  const pathname = usePathname();
  const { restaurant, basePath, cartCount, subtotalGhs } = useOnlineOrder();

  const cartPath = `${basePath}/cart`;
  const accountPath = `${basePath}/account`;
  const checkoutPrefix = `${basePath}/checkout`;
  const shellWidth = layout === "wide" ? SHELL_WIDE : SHELL_NARROW;

  const showMobileBar =
    !hideCartBar &&
    cartCount > 0 &&
    !pathname.startsWith(checkoutPrefix) &&
    pathname !== cartPath;

  const onMenu = pathname === basePath;

  return (
    <div className="flex min-h-dvh flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 shadow-sm backdrop-blur-md">
        <div
          className={`${shellWidth} px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] md:px-6 lg:px-8 lg:pb-4 lg:pt-5`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {backHref ? (
                <Link
                  href={backHref}
                  className="mb-1 inline-block text-xs font-semibold text-[var(--pos-primary)] md:text-sm"
                >
                  ← Back
                </Link>
              ) : (
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af] lg:text-xs">
                  Order online
                </p>
              )}
              <h1 className="truncate text-lg font-bold leading-tight text-[#1a1c23] md:text-xl lg:text-2xl">
                {title ?? restaurant.name}
              </h1>
              <p className="mt-0.5 text-xs text-[#6b7280] md:text-sm">
                {subtitle ?? restaurant.tagline}
              </p>
            </div>

            {/* Desktop / tablet top nav */}
            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Store navigation"
            >
              <DesktopNavLink
                href={basePath}
                label="Menu"
                active={onMenu}
              />
              <DesktopNavLink
                href={cartPath}
                label="Cart"
                active={navActive(pathname, cartPath)}
                badge={cartCount}
              />
              <DesktopNavLink
                href={accountPath}
                label="Account"
                active={navActive(pathname, accountPath)}
              />
            </nav>

            {/* Mobile cart shortcut */}
            <Link
              href={cartPath}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff4ec] text-[var(--pos-primary)] md:hidden"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.65} />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1a1c23] px-1 text-[10px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <main
        className={`${shellWidth} flex-1 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8`}
      >
        {children}
      </main>

      {/* Mobile floating cart — hidden when desktop sidebar or on checkout */}
      {showMobileBar ? (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-40 px-4 md:hidden">
          <Link
            href={cartPath}
            className="mx-auto flex max-w-lg items-center justify-between gap-2 rounded-2xl bg-[#1a1c23] px-4 py-3 text-white shadow-lg"
          >
            <span className="text-sm font-semibold">
              View cart · {cartCount} item{cartCount === 1 ? "" : "s"}
            </span>
            <span className="text-sm font-bold tabular-nums">
              {formatCedi(subtotalGhs)}
            </span>
          </Link>
        </div>
      ) : null}

      {/* Mobile bottom nav only */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white/95 backdrop-blur-md md:hidden"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-around px-6 py-2">
          <MobileNavTab
            href={basePath}
            label="Menu"
            icon={UtensilsCrossed}
            active={pathname === basePath}
          />
          <MobileNavTab
            href={cartPath}
            label="Cart"
            icon={ShoppingBag}
            active={navActive(pathname, cartPath)}
            badge={cartCount > 0 ? cartCount : undefined}
          />
          <MobileNavTab
            href={accountPath}
            label="Account"
            icon={User}
            active={navActive(pathname, accountPath)}
          />
        </div>
      </nav>
    </div>
  );
}

function DesktopNavLink({
  href,
  label,
  active,
  badge,
}: {
  href: string;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`relative rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-[#fff4ec] text-[var(--pos-primary)]"
          : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#1a1c23]"
      }`}
    >
      {label}
      {badge != null && badge > 0 ? (
        <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--pos-primary)] px-1 text-[10px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function MobileNavTab({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-[4.5rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-colors ${
        active
          ? "text-[var(--pos-primary)]"
          : "text-[#6b7280] hover:text-[#374151]"
      }`}
    >
      <span className="relative">
        <Icon className="h-5 w-5" strokeWidth={1.65} />
        {badge != null && badge > 0 ? (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--pos-primary)] px-0.5 text-[9px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
      {label}
    </Link>
  );
}
