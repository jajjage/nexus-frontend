"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSegments } from "@/hooks/admin/useAdminAnalytics";
import { Users } from "lucide-react";

export function UserSegmentsCard() {
  const { data, isLoading, error } = useUserSegments();

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive py-8 text-center">
          Failed to load user segments
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const segments = data;

  // Calculate totals for percentages
  const activityTotal = segments
    ? segments.byActivity.superActive +
      segments.byActivity.active +
      segments.byActivity.occasional +
      segments.byActivity.dormant +
      segments.byActivity.churned
    : 0;

  const spendTotal = segments
    ? segments.bySpend.highValue +
      segments.bySpend.medium +
      segments.bySpend.low
    : 0;

  const getPercent = (value: number, total: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-blue-600" />
          User Segments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* By Activity */}
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            By Activity Level
          </p>
          <div className="space-y-2">
            <SegmentBar
              label="Super Active"
              value={segments?.byActivity.superActive || 0}
              percent={getPercent(
                segments?.byActivity.superActive || 0,
                activityTotal
              )}
              color="bg-green-500"
            />
            <SegmentBar
              label="Active"
              value={segments?.byActivity.active || 0}
              percent={getPercent(
                segments?.byActivity.active || 0,
                activityTotal
              )}
              color="bg-blue-500"
            />
            <SegmentBar
              label="Occasional"
              value={segments?.byActivity.occasional || 0}
              percent={getPercent(
                segments?.byActivity.occasional || 0,
                activityTotal
              )}
              color="bg-amber-500"
            />
            <SegmentBar
              label="Dormant"
              value={segments?.byActivity.dormant || 0}
              percent={getPercent(
                segments?.byActivity.dormant || 0,
                activityTotal
              )}
              color="bg-gray-400"
            />
            <SegmentBar
              label="Churned"
              value={segments?.byActivity.churned || 0}
              percent={getPercent(
                segments?.byActivity.churned || 0,
                activityTotal
              )}
              color="bg-red-500"
            />
          </div>
        </div>

        {/* By Spend */}
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            By Spending Level
          </p>
          <div className="space-y-2">
            <SegmentBar
              label="High Value (>₦50k/mo)"
              value={segments?.bySpend.highValue || 0}
              percent={getPercent(segments?.bySpend.highValue || 0, spendTotal)}
              color="bg-purple-500"
            />
            <SegmentBar
              label="Medium (₦10k-50k/mo)"
              value={segments?.bySpend.medium || 0}
              percent={getPercent(segments?.bySpend.medium || 0, spendTotal)}
              color="bg-blue-500"
            />
            <SegmentBar
              label="Low (<₦10k/mo)"
              value={segments?.bySpend.low || 0}
              percent={getPercent(segments?.bySpend.low || 0, spendTotal)}
              color="bg-gray-400"
            />
          </div>
        </div>

        {/* By Registration */}
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            By Registration Date
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-muted/50 rounded p-2 text-center">
              <p className="font-bold">
                {segments?.byRegistration.last7Days || 0}
              </p>
              <p className="text-muted-foreground text-xs">Last 7 days</p>
            </div>
            <div className="bg-muted/50 rounded p-2 text-center">
              <p className="font-bold">
                {segments?.byRegistration.last30Days || 0}
              </p>
              <p className="text-muted-foreground text-xs">Last 30 days</p>
            </div>
            <div className="bg-muted/50 rounded p-2 text-center">
              <p className="font-bold">
                {segments?.byRegistration.last90Days || 0}
              </p>
              <p className="text-muted-foreground text-xs">Last 90 days</p>
            </div>
            <div className="bg-muted/50 rounded p-2 text-center">
              <p className="font-bold">{segments?.byRegistration.older || 0}</p>
              <p className="text-muted-foreground text-xs">Older</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SegmentBar({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value: number;
  percent: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value.toLocaleString()} ({percent}%)
        </span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className={`h-full transition-all ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
