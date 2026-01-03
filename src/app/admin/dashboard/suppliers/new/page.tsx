import { CreateSupplierForm } from "@/components/features/admin/suppliers/CreateSupplierForm";

/**
 * Admin Create Supplier Page
 * Route: /admin/dashboard/suppliers/new
 */
export default function AdminCreateSupplierPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Supplier</h1>
        <p className="text-muted-foreground">
          Add a new data supplier to the system.
        </p>
      </div>
      <CreateSupplierForm />
    </div>
  );
}
