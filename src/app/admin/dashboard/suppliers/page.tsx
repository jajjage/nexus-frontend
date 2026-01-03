import { SupplierListTable } from "@/components/features/admin/suppliers/SupplierListTable";

/**
 * Admin Suppliers List Page
 * Route: /admin/dashboard/suppliers
 */
export default function AdminSuppliersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Supplier Management
        </h1>
        <p className="text-muted-foreground">
          Manage data suppliers and their configurations.
        </p>
      </div>
      <SupplierListTable />
    </div>
  );
}
