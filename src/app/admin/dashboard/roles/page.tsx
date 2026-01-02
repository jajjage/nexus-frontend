import { RoleListTable } from "@/components/features/admin/roles/RoleListTable";

/**
 * Admin Roles List Page
 * Route: /admin/dashboard/roles
 */
export default function AdminRolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
        <p className="text-muted-foreground">
          View available roles and their permissions.
        </p>
      </div>
      <RoleListTable />
    </div>
  );
}
