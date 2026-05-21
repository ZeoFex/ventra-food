import { OnlineItemDetail } from "@/components/online-order/online-item-detail";

export default async function RestaurantOrderItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OnlineItemDetail productId={id} />;
}
