"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Admin Dashboard
 * Main dashboard view for admin users
 * Sidebar navigation is provided by the layout.tsx wrapper
 */
export function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  // Additional security check - redirect if not admin
  if (!user.role || user.role.toLowerCase() !== "admin") {
    router.push("/dashboard");
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50">
      {/* Page Content */}
      <div className="p-6">
        {/* Page Content */}
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome, {user.fullName}!
              </h1>
              <p className="mt-2 text-slate-600">
                Here's an overview of your admin dashboard.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-600">
                  Total Users
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">--</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-600">
                  Total Transactions
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">--</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-600">
                  Total Volume
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">--</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-600">
                  Active Sessions
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">--</p>
              </div>
            </div>

            {/* Admin Sections */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Users Management */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                  User Management
                </h3>
                <p className="mb-4 text-slate-600">
                  Manage user accounts, permissions, and account status.
                </p>
                <Link href="/admin/users">
                  <Button className="w-full">Manage Users</Button>
                </Link>
              </div>

              {/* Transactions Management */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                  Transactions
                </h3>
                <p className="mb-4 text-slate-600">
                  View and manage all transactions in the system.
                </p>
                <Link href="/admin/transactions">
                  <Button className="w-full">View Transactions</Button>
                </Link>
              </div>

              {/* Reports */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                  Reports & Analytics
                </h3>
                <p className="mb-4 text-slate-600">
                  Generate and view system reports and analytics.
                </p>
                <Button variant="outline" className="w-full">
                  View Reports
                </Button>
              </div>

              {/* System Settings */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                  System Settings
                </h3>
                <p className="mb-4 text-slate-600">
                  Configure system settings and parameters.
                </p>
                <Link href="/admin/settings">
                  <Button variant="outline" className="w-full">
                    Settings
                  </Button>
                </Link>
              </div>
            </div>

            {/* Admin Info Section */}
            <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Admin Information
              </h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">Email:</span>{" "}
                  {user.email}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">
                    Full Name:
                  </span>{" "}
                  {user.fullName}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Role:</span>{" "}
                  {user.role}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Account:</span>{" "}
                  {user.accountNumber}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
