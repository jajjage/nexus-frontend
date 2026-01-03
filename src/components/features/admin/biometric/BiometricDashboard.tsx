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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useActiveEnrollments,
  useBiometricStats,
  useRevokeEnrollment,
} from "@/hooks/admin/useAdminBiometric";
import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  Fingerprint,
  Loader2,
  RefreshCw,
  Shield,
  ShieldOff,
  Smartphone,
  XCircle,
} from "lucide-react";
import { useState } from "react";

export function BiometricDashboard() {
  const [hoursBack, setHoursBack] = useState<number>(24);

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useBiometricStats({ hoursBack });

  const {
    data: activeData,
    isLoading: activeLoading,
    refetch: refetchActive,
  } = useActiveEnrollments({ limit: 50, offset: 0 });

  const revokeMutation = useRevokeEnrollment();

  const stats = statsData?.data;
  const activeEnrollments = activeData?.data?.enrollments || [];
  const pagination = activeData?.data?.pagination;

  const handleRevoke = (enrollmentId: string, userName: string) => {
    if (
      confirm(
        `Are you sure you want to revoke biometric enrollment for ${userName}?`
      )
    ) {
      revokeMutation.mutate({ enrollmentId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Biometric System Stats
            </CardTitle>
            <CardDescription>
              Overview of biometric verification activity
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(hoursBack)}
              onValueChange={(v) => setHoursBack(Number(v))}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 hour</SelectItem>
                <SelectItem value="6">Last 6 hours</SelectItem>
                <SelectItem value="24">Last 24 hours</SelectItem>
                <SelectItem value="48">Last 48 hours</SelectItem>
                <SelectItem value="168">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetchStats()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : stats || pagination ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <StatCard
                title="Active Enrollments"
                value={pagination?.total ?? stats?.totalEnrollments ?? 0}
                icon={<Smartphone className="h-4 w-4" />}
              />
              <StatCard
                title="Total Verifications"
                value={stats?.totalVerifications ?? 0}
                icon={<Fingerprint className="h-4 w-4" />}
              />
              <StatCard
                title="Successful"
                value={stats?.successfulVerifications ?? 0}
                icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                className="text-green-600"
              />
              <StatCard
                title="Failed"
                value={stats?.failedVerifications ?? 0}
                icon={<XCircle className="h-4 w-4 text-red-500" />}
                className="text-red-600"
              />
            </div>
          ) : (
            <p className="text-muted-foreground py-4 text-center">
              No stats available
            </p>
          )}
          {stats && stats.period_start && stats.period_end && (
            <div className="text-muted-foreground mt-4 flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              Period: {format(new Date(stats.period_start), "PP p")} —{" "}
              {format(new Date(stats.period_end), "PP p")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Enrollments List */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Active Enrollments
            </CardTitle>
            <CardDescription>
              All currently active biometric enrollments across users
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchActive()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {activeLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : activeEnrollments.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No active enrollments found
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {enrollment.user_full_name || "Unknown"}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {enrollment.user_email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Smartphone className="text-muted-foreground h-4 w-4" />
                            {enrollment.device_name || "Unknown Device"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {enrollment.platform || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {enrollment.is_active ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="mr-1 h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(enrollment.enrolled_at), "PP")}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {enrollment.last_used_at
                            ? format(new Date(enrollment.last_used_at), "PP")
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleRevoke(
                                enrollment.id,
                                enrollment.user_full_name
                              )
                            }
                            disabled={
                              revokeMutation.isPending || !enrollment.is_active
                            }
                          >
                            {revokeMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <ShieldOff className="mr-1 h-4 w-4" />
                                Revoke
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Info */}
              {pagination && (
                <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
                  <span>
                    Showing {activeEnrollments.length} of {pagination.total}{" "}
                    enrollments
                  </span>
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  className,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        {icon}
        {title}
      </div>
      <div className={`mt-2 text-2xl font-bold ${className || ""}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
