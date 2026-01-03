import { OperatorDetailView } from "@/components/features/admin/operators/OperatorDetailView";

/**
 * Admin Operator Detail Page
 * Route: /admin/dashboard/operators/[operatorId]
 */
export default async function AdminOperatorDetailPage({
  params,
}: {
  params: Promise<{ operatorId: string }>;
}) {
  const { operatorId } = await params;

  return <OperatorDetailView operatorId={operatorId} />;
}
