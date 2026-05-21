import { OnlineOrderTrackPage } from "@/components/online-order/online-order-track-page";

export default async function RestaurantOrderTrackPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  return <OnlineOrderTrackPage orderRef={decodeURIComponent(ref)} />;
}
