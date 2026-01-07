import { SettlementListTable } from "@/components/features/admin/settlements/SettlementListTable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

// Loading skeleton for settlements table
function SettlementTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Admin Settlements List Page
 * Route: /admin/dashboard/settlements
 */
export default function AdminSettlementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Settlement Management
        </h1>
        <p className="text-muted-foreground">
          View and manage provider settlements.
        </p>
      </div>
      <Suspense fallback={<SettlementTableSkeleton />}>
        <SettlementListTable />
      </Suspense>
    </div>
  );
}
