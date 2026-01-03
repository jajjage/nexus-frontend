import { SupplierMarkupListTable } from "@/components/features/admin/supplier-markups/SupplierMarkupListTable";

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
      <SupplierMarkupListTable />
    </div>
  );
}
