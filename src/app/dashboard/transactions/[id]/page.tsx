import { TransactionDetailPage } from "@/components/features/dashboard/transactions/transaction-detail-page";

interface TransactionDetailRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TransactionDetailRoute({
  params,
}: TransactionDetailRouteProps) {
  const { id } = await params;
  return <TransactionDetailPage transactionId={id} />;
}
