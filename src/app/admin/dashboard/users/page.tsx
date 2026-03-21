import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserListTable } from "@/components/features/admin/users/UserListTable";

/**
 * Admin Users List Page
 * Route: /admin/dashboard/users
 */
export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all users in the system.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <UserListTable />
      </Suspense>
    </div>
  );
}
