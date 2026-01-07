import { TransactionDetailPage } from "@/components/features/dashboard/transactions/transaction-detail-page";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

interface TransactionDetailRouteProps {
  params: Promise<{
    id: string;
  }>;
}

// Loading skeleton for transaction detail
function TransactionDetailSkeleton() {
  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card className="h-96">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function TransactionDetailRoute({
  params,
}: TransactionDetailRouteProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<TransactionDetailSkeleton />}>
      <TransactionDetailPage transactionId={id} />
    </Suspense>
  );
}
