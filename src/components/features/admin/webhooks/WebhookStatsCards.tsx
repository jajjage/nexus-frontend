"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebhookStats } from "@/hooks/admin/useAdminWebhooks";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Link2Off,
  Webhook,
} from "lucide-react";

export function WebhookStatsCards() {
  const { data, isLoading, isError } = useWebhookStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-red-500">
          Failed to load webhook statistics
        </CardContent>
      </Card>
    );
  }

  // Safely extract stats with defaults
  const stats = {
    total: data.data?.total ?? 0,
    matched: data.data?.matched ?? 0,
    unmatched: data.data?.unmatched ?? 0,
    pending: data.data?.pending ?? 0,
    failed: data.data?.failed ?? 0,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
          <Webhook className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.total.toLocaleString()}
          </div>
          <p className="text-muted-foreground text-xs">All incoming webhooks</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Matched</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.matched.toLocaleString()}
          </div>
          <p className="text-muted-foreground text-xs">
            Successfully reconciled
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unmatched</CardTitle>
          <Link2Off className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">
            {stats.unmatched.toLocaleString()}
          </div>
          <p className="text-muted-foreground text-xs">Needs manual matching</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-500">
            {stats.pending.toLocaleString()}
          </div>
          <p className="text-muted-foreground text-xs">Awaiting processing</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {stats.failed.toLocaleString()}
          </div>
          <p className="text-muted-foreground text-xs">Requires attention</p>
        </CardContent>
      </Card>
    </div>
  );
}
