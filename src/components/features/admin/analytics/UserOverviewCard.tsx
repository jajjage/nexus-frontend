"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserOverview } from "@/hooks/admin/useAdminAnalytics";
import { TrendingUp, UserCheck, Users, UserX } from "lucide-react";

export function UserOverviewCard() {
  const { data, isLoading, error } = useUserOverview();

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive py-8 text-center">
          Failed to load user overview
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Total Users",
      value: data?.totalUsers?.toLocaleString() || "0",
      icon: <Users className="text-primary h-4 w-4" />,
    },
    {
      label: "New This Month",
      value: data?.newUsersThisMonth?.toLocaleString() || "0",
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
    },
    {
      label: "New This Week",
      value: data?.newUsersThisWeek?.toLocaleString() || "0",
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
    },
    {
      label: "Active This Week",
      value: data?.activeUsersThisWeek?.toLocaleString() || "0",
      icon: <UserCheck className="h-4 w-4 text-blue-500" />,
    },
    {
      label: "Suspended",
      value: data?.suspendedUsers?.toLocaleString() || "0",
      icon: <UserX className="h-4 w-4 text-red-500" />,
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">User Overview</CardTitle>
        {data?.trends && (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <TrendingUp className="h-3 w-3" />
            {data.trends.userGrowthRate}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border-border/50 flex items-center justify-between border-b py-2 last:border-0"
            >
              <div className="flex items-center gap-2">
                {stat.icon}
                <span className="text-muted-foreground text-sm">
                  {stat.label}
                </span>
              </div>
              <span className="font-semibold">{stat.value}</span>
            </div>
          ))}
        </div>
        {data?.trends?.weekOverWeek && (
          <div className="mt-4 rounded-lg bg-green-500/10 p-3 text-center text-sm text-green-600">
            {data.trends.weekOverWeek} this week
          </div>
        )}
      </CardContent>
    </Card>
  );
}
