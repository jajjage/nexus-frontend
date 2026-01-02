import { TransactionDetailView } from "@/components/features/admin/transactions/TransactionDetailView";

/**
 * Admin Transaction Detail Page
 * Route: /admin/dashboard/transactions/[transactionId]
 */
export default async function AdminTransactionDetailPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = await params;

  return <TransactionDetailView transactionId={transactionId} />;
}
