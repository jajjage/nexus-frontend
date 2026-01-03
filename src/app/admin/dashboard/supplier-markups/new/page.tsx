import { CreateSupplierMarkupForm } from "@/components/features/admin/supplier-markups/CreateSupplierMarkupForm";

/**
 * Admin Create Supplier Markup Page
 * Route: /admin/dashboard/supplier-markups/new
 */
export default function AdminCreateSupplierMarkupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Create Supplier Markup
        </h1>
        <p className="text-muted-foreground">
          Define a new markup for a supplier product.
        </p>
      </div>
      <CreateSupplierMarkupForm />
    </div>
  );
}
