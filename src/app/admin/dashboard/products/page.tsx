import { ProductListTable } from "@/components/features/admin/products/ProductListTable";

/**
 * Admin Products List Page
 * Route: /admin/dashboard/products
 */
export default function AdminProductsPage() {
  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Product Management
        </h2>
        <p className="text-muted-foreground">
          Manage all products across operators.
        </p>
      </div>

      <ProductListTable />
    </div>
  );
}
