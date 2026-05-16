import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s · Kitchen · Ventra Food",
    default: "Kitchen · Ventra Food",
  },
  robots: { index: false, follow: false },
};

export default function KitchenPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#0c0f14] font-sans text-slate-100 antialiased">
      {children}
    </div>
  );
}
