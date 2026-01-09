"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSystemHealth } from "@/hooks/admin/useAdminAudit";
import { Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export function SystemHealthCard() {
  const { data: health, isLoading, isError } = useSystemHealth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <Activity className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-2 h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !health) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <XCircle className="text-destructive h-4 w-4" />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Unable to fetch health status
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      label: "All Systems Operational",
    },
    degraded: {
      icon: AlertTriangle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      label: "Degraded Performance",
    },
    unhealthy: {
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      label: "System Issues Detected",
    },
  };

  const config = statusConfig[health.status] || statusConfig.unhealthy;
  const StatusIcon = config.icon;

  const checks = Object.entries(health.checks || {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health</CardTitle>
        <StatusIcon className={`h-4 w-4 ${config.color}`} />
      </CardHeader>
      <CardContent>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${config.bgColor} ${config.color}`}
        >
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </div>

        {checks.length > 0 && (
          <div className="mt-4 space-y-2">
            {checks.map(([name, check]) => (
              <div
                key={name}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground capitalize">
                  {name.replace(/_/g, " ")}
                </span>
                <span
                  className={
                    check.status === "ok" ? "text-green-500" : "text-yellow-500"
                  }
                >
                  {check.value} {check.unit}
                </span>
              </div>
            ))}
          </div>
        )}

        {health.recentAlerts && health.recentAlerts.length > 0 && (
          <div className="bg-destructive/10 text-destructive mt-4 rounded-md p-2 text-sm">
            {health.recentAlerts.length} active alert(s)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
