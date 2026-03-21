import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionListTable } from "@/components/features/admin/transactions/TransactionListTable";

/**
 * Admin Transactions List Page
 * Route: /admin/dashboard/transactions
 */
export default function AdminTransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          View and monitor all platform transactions.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <TransactionListTable />
      </Suspense>
    </div>
  );
}
