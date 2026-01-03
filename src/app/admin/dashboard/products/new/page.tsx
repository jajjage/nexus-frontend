import { CreateProductForm } from "@/components/features/admin/products/CreateProductForm";

/**
 * Admin Create Product Page
 * Route: /admin/dashboard/products/new
 */
export default function AdminCreateProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Product</h2>
        <p className="text-muted-foreground">
          Add a new product to the catalog.
        </p>
      </div>

      <CreateProductForm />
    </div>
  );
}
