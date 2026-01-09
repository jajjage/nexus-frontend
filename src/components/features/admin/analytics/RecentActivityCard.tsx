"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentAuditLogs } from "@/hooks/admin/useAdminAudit";
import { getActionTypeLabel } from "@/types/admin/audit.types";
import { formatDistanceToNow } from "date-fns";
import { Clock, History } from "lucide-react";

interface RecentActivityCardProps {
  minutes?: number;
}

export function RecentActivityCard({ minutes = 60 }: RecentActivityCardProps) {
  const { data, isLoading, isError } = useRecentAuditLogs(minutes);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <History className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <History className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Unable to fetch recent activity
          </p>
        </CardContent>
      </Card>
    );
  }

  const entries = data.entries || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          Last {minutes} min
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-2 rounded-lg border p-2"
              >
                <div className="min-w-0 flex-1">
                  <Badge variant="outline" className="text-xs">
                    {getActionTypeLabel(entry.action_type)}
                  </Badge>
                  {entry.reason && (
                    <p className="text-muted-foreground mt-1 truncate text-xs">
                      {entry.reason}
                    </p>
                  )}
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatDistanceToNow(new Date(entry.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
