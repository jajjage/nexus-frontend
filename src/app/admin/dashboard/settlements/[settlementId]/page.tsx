import { SettlementDetailView } from "@/components/features/admin/settlements/SettlementDetailView";

/**
 * Admin Settlement Detail Page
 * Route: /admin/dashboard/settlements/[settlementId]
 */
export default async function AdminSettlementDetailPage({
  params,
}: {
  params: Promise<{ settlementId: string }>;
}) {
  const { settlementId } = await params;

  return <SettlementDetailView settlementId={settlementId} />;
}
