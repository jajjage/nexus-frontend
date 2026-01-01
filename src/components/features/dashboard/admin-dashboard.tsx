"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDashboardStats,
  useFailedJobs,
} from "@/hooks/admin/useAdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  RefreshCw,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

/**
 * Admin Dashboard
 * Displays real-time stats from backend API
 */
export function AdminDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const { data: statsData, isLoading: isStatsLoading } = useDashboardStats();
  const { data: failedJobsData, isLoading: isJobsLoading } = useFailedJobs({
    page: 1,
    limit: 5,
  });

  const stats = statsData?.data;
  const failedJobs = failedJobsData?.data?.jobs || [];

  if (isAuthLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!user || user.role?.toLowerCase() !== "admin") {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user.fullName}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your admin dashboard.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={
            isStatsLoading ? undefined : stats?.totalUsers?.toString() || "0"
          }
          icon={<Users className="text-muted-foreground h-4 w-4" />}
          href="/admin/dashboard/users"
        />
        <StatCard
          title="Transactions"
          value={
            isStatsLoading
              ? undefined
              : stats?.totalTransactions?.toString() || "0"
          }
          icon={<CreditCard className="text-muted-foreground h-4 w-4" />}
          href="/admin/dashboard/transactions"
        />
        <StatCard
          title="Topup Requests"
          value={
            isStatsLoading
              ? undefined
              : stats?.totalTopupRequests?.toString() || "0"
          }
          icon={<Activity className="text-muted-foreground h-4 w-4" />}
          href="/admin/dashboard/topups"
        />
        <StatCard
          title="Failed Jobs"
          value={isJobsLoading ? undefined : failedJobs.length.toString()}
          icon={<AlertTriangle className="text-muted-foreground h-4 w-4" />}
          variant={failedJobs.length > 0 ? "warning" : "default"}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <QuickLink
              href="/admin/dashboard/users"
              label="Manage Users"
              description="View, create, and manage user accounts"
            />
            <QuickLink
              href="/admin/dashboard/users/new"
              label="Create User"
              description="Add a new user to the system"
            />
            <QuickLink
              href="/admin/dashboard/transactions"
              label="View Transactions"
              description="Monitor all platform transactions"
            />
          </CardContent>
        </Card>

        {/* Failed Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Failed Jobs</CardTitle>
              <CardDescription>Recent failed background tasks</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/dashboard/jobs">
                View All
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isJobsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : failedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <RefreshCw className="text-muted-foreground mb-2 h-8 w-8" />
                <p className="text-muted-foreground text-sm">No failed jobs</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Failed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedJobs.slice(0, 5).map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.type}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
                        {job.error}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(job.failedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  href,
  variant = "default",
}: {
  title: string;
  value?: string;
  icon: React.ReactNode;
  href?: string;
  variant?: "default" | "warning";
}) {
  const content = (
    <Card
      className={`hover:bg-muted/50 transition-colors ${
        variant === "warning" && value !== "0" ? "border-amber-500/50" : ""
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {value === undefined ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{value}</span>
            {variant === "warning" && value !== "0" && (
              <Badge variant="destructive" className="ml-auto">
                Needs Attention
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// Quick Link Component
function QuickLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
    >
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <ArrowUpRight className="text-muted-foreground h-4 w-4" />
    </Link>
  );
}
