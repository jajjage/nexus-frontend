import { TopupDetailView } from "@/components/features/admin/topups/TopupDetailView";

/**
 * Admin Topup Request Detail Page
 * Route: /admin/dashboard/topups/[requestId]
 */
export default async function AdminTopupDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  return <TopupDetailView requestId={requestId} />;
}
