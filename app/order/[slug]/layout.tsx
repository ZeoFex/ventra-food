import type { Viewport } from "next";
import { OnlineOrderProvider } from "@/components/online-order/online-order-context";
import { RestaurantNotFound } from "@/components/online-order/restaurant-not-found";
import { getRestaurantBySlug } from "@/lib/restaurants";

export const viewport: Viewport = {
  themeColor: "#ff7f27",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = getRestaurantBySlug(slug);
  return {
    title: r ? `Order · ${r.name}` : "Restaurant not found",
    description: r
      ? `Order food from ${r.name} for delivery or pickup`
      : "Invalid restaurant link",
  };
}

export default async function RestaurantOrderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = getRestaurantBySlug(slug);

  if (!restaurant) {
    return <RestaurantNotFound slug={slug} />;
  }

  return (
    <OnlineOrderProvider restaurantSlug={restaurant.slug}>
      <div className="min-h-dvh bg-[#f4f2ed] text-[#1a1c23] md:bg-[linear-gradient(180deg,#f4f2ed_0%,#ebe8e2_100%)]">
        {children}
      </div>
    </OnlineOrderProvider>
  );
}
