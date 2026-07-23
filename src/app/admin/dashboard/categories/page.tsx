import { CategoryManagementTable } from "@/components/features/admin/categories/CategoryManagementTable";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Category Management
        </h1>
        <p className="text-muted-foreground">
          Manage product categories shown across customer catalog surfaces.
        </p>
      </div>

      <CategoryManagementTable />
    </div>
  );
}
