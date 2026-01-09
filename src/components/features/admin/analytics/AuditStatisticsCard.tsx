"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogStatistics } from "@/hooks/admin/useAdminAudit";
import { getActionTypeLabel } from "@/types/admin/audit.types";
import { BarChart3, Shield, Users } from "lucide-react";

export function AuditStatisticsCard() {
  const { data: stats, isLoading, isError } = useAuditLogStatistics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Audit Statistics
          </CardTitle>
          <BarChart3 className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-4 h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !stats) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Audit Statistics
          </CardTitle>
          <BarChart3 className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Unable to fetch statistics
          </p>
        </CardContent>
      </Card>
    );
  }

  const topActions = Object.entries(stats.actionsByType || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Audit Statistics</CardTitle>
        <BarChart3 className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.totalActions}</div>
        <p className="text-muted-foreground text-xs">Total admin actions</p>

        {/* Actions by Type */}
        {topActions.length > 0 && (
          <div className="mt-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              Top Actions
            </p>
            <div className="flex flex-wrap gap-1">
              {topActions.map(([action, count]) => (
                <Badge key={action} variant="secondary" className="text-xs">
                  {getActionTypeLabel(action)}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Top Admins */}
        {stats.topAdmins && stats.topAdmins.length > 0 && (
          <div className="mt-4">
            <div className="text-muted-foreground mb-2 flex items-center gap-1 text-xs font-medium">
              <Shield className="h-3 w-3" />
              Top Admins
            </div>
            <div className="space-y-1">
              {stats.topAdmins.slice(0, 3).map((admin) => (
                <div
                  key={admin.adminId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground truncate">
                    {admin.adminEmail}
                  </span>
                  <Badge variant="outline">{admin.actionCount}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Target Users */}
        {stats.topTargetUsers && stats.topTargetUsers.length > 0 && (
          <div className="mt-4">
            <div className="text-muted-foreground mb-2 flex items-center gap-1 text-xs font-medium">
              <Users className="h-3 w-3" />
              Most Affected Users
            </div>
            <div className="space-y-1">
              {stats.topTargetUsers.slice(0, 3).map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground truncate">
                    {user.userEmail}
                  </span>
                  <Badge variant="outline">{user.actionCount}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
