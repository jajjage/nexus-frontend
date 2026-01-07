import { SupplierMarkupListTable } from "@/components/features/admin/supplier-markups/SupplierMarkupListTable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

// Loading skeleton for supplier markups table
function SupplierMarkupTableSkeleton() {
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
 * Admin Supplier Markups List Page
 * Route: /admin/dashboard/supplier-markups
 */
export default function AdminSupplierMarkupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Supplier Markup Management
        </h1>
        <p className="text-muted-foreground">
          Manage markup percentages for supplier products.
        </p>
      </div>
      <Suspense fallback={<SupplierMarkupTableSkeleton />}>
        <SupplierMarkupListTable />
      </Suspense>
    </div>
  );
}
