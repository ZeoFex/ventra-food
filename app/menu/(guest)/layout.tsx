import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Order · RestroBit",
  description: "Order food from your table — RestroBit QR menu",
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  themeColor: "#ff7f27",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function GuestMenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#f4f2ed] text-[#1a1c23]">{children}</div>
  );
}
