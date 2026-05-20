import { StaffDetailScreen } from "@/components/staff/staff-detail-screen";

type PageProps = {
  params: Promise<{ staffId: string }>;
};

export default async function StaffDetailPage({ params }: PageProps) {
  const { staffId } = await params;
  return <StaffDetailScreen staffId={staffId} />;
}
