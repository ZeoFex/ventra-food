import type { Metadata } from "next";
import { PromotionsScreen } from "@/components/promotions/promotions-screen";

export const metadata: Metadata = {
  title: "Discounts & coupons — Ventra Food",
  description: "Create and manage coupon codes for the POS.",
};

export default function DiscountsPage() {
  return <PromotionsScreen />;
}
