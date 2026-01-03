"use client";

import {
  PermissionGuard,
  RoleGuard,
} from "@/components/features/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const DashboardContent = () => {
  const {
    user,
    isAuthenticated,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  } = useAuth();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {isAuthenticated && user && (
        <div className="mb-6 rounded-lg bg-gray-100 p-4">
          <p>
            <strong>Welcome:</strong> {user.fullName}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
          <p>
            <strong>Account Number:</strong> {user.accountNumber}
          </p>
          <p>
            <strong>Balance:</strong> {user.balance}
          </p>
        </div>
      )}

      {/* Admin-only content */}
      <RoleGuard
        roles={["admin"]}
        fallback={<p>Admin access required to see this content.</p>}
      >
        <div className="rounded-lg bg-blue-100 p-4">
          <h2 className="mb-2 text-xl font-semibold">Admin Section</h2>
          <p>This content is only visible to administrators.</p>
          <Button className="mt-2">Manage Users</Button>
        </div>
      </RoleGuard>

      {/* Permission-based content */}
      <PermissionGuard
        permission="transaction:write"
        fallback={<p>You don't have permission to create transactions.</p>}
      >
        <div className="rounded-lg bg-green-100 p-4">
          <h2 className="mb-2 text-xl font-semibold">Transaction Creator</h2>
          <p>You have permission to create transactions.</p>
          <Button className="mt-2">Create Transaction</Button>
        </div>
      </PermissionGuard>

      {/* Multiple permissions - any required */}
      <PermissionGuard
        permissions={["admin:read", "user:write"]}
        requireAll={false}
        fallback={<p>You need either admin:read or user:write permission.</p>}
      >
        <div className="rounded-lg bg-yellow-100 p-4">
          <h2 className="mb-2 text-xl font-semibold">Special Feature</h2>
          <p>You have either admin:read or user:write permission.</p>
          <Button className="mt-2">Access Special Feature</Button>
        </div>
      </PermissionGuard>

      {/* Multiple permissions - all required */}
      <PermissionGuard
        permissions={["transaction:read", "wallet:read"]}
        requireAll={true}
        fallback={
          <p>You need both transaction:read AND wallet:read permissions.</p>
        }
      >
        <div className="rounded-lg bg-purple-100 p-4">
          <h2 className="mb-2 text-xl font-semibold">Advanced Feature</h2>
          <p>You have both transaction:read and wallet:read permissions.</p>
          <Button className="mt-2">Access Advanced Feature</Button>
        </div>
      </PermissionGuard>

      {/* Content that checks permissions in code */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h2 className="mb-2 text-xl font-semibold">Permission Status</h2>
        <div className="space-y-2">
          <p>
            Can read transactions:{" "}
            {hasPermission("transaction:read") ? "Yes" : "No"}
          </p>
          <p>
            Can write transactions:{" "}
            {hasPermission("transaction:write") ? "Yes" : "No"}
          </p>
          <p>
            Has admin or write permission:{" "}
            {hasAnyPermission(["admin:read", "transaction:write"])
              ? "Yes"
              : "No"}
          </p>
          <p>
            Has both read permissions:{" "}
            {hasAllPermissions(["transaction:read", "wallet:read"])
              ? "Yes"
              : "No"}
          </p>
          <p>Is admin: {isAdmin ? "Yes" : "No"}</p>
        </div>
      </div>
    </div>
  );
};
