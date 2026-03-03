"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useResellerPurchaseAnalyticsOverview } from "@/hooks/useReseller";
import type { ResellerPurchaseAnalyticsQueryParams } from "@/types/reseller.types";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ResellerPurchaseAnalyticsPanelProps {
  params?: ResellerPurchaseAnalyticsQueryParams;
}

const STATUS_COLORS = {
  success: "#22c55e",
  failed: "#ef4444",
  pending: "#f59e0b",
  reversed: "#8b5cf6",
} as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value);

export function ResellerPurchaseAnalyticsPanel({
  params,
}: ResellerPurchaseAnalyticsPanelProps) {
  const { data, isLoading, isError, error } =
    useResellerPurchaseAnalyticsOverview(params);

  const analytics = data?.data;

  if (!data && isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isError) {
    const message =
      (error as any)?.response?.data?.message ??
      (error as Error)?.message ??
      "Failed to load reseller purchase analytics.";

    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No analytics available.</p>
        </CardContent>
      </Card>
    );
  }

  const statusCountData = [
    {
      name: "Success",
      key: "success",
      value: analytics.breakdownByStatus.success,
    },
    {
      name: "Failed",
      key: "failed",
      value: analytics.breakdownByStatus.failed,
    },
    {
      name: "Pending",
      key: "pending",
      value: analytics.breakdownByStatus.pending,
    },
    {
      name: "Reversed",
      key: "reversed",
      value: analytics.breakdownByStatus.reversed,
    },
  ];

  const amountData = [
    {
      name: "Success",
      key: "success",
      amount: analytics.amountByStatus.success,
    },
    { name: "Failed", key: "failed", amount: analytics.amountByStatus.failed },
    {
      name: "Pending",
      key: "pending",
      amount: analytics.amountByStatus.pending,
    },
    {
      name: "Reversed",
      key: "reversed",
      amount: analytics.amountByStatus.reversed,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analytics.totals.totalRequests.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(analytics.totals.totalAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analytics.derived.successRate}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {statusCountData.map((item) => (
              <Badge key={item.key} variant="outline">
                {item.name}: {item.value.toLocaleString()}
              </Badge>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusCountData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    innerRadius={55}
                    paddingAngle={3}
                  >
                    {statusCountData.map((item) => (
                      <Cell
                        key={item.key}
                        fill={
                          STATUS_COLORS[item.key as keyof typeof STATUS_COLORS]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString()}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={amountData}>
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {amountData.map((item) => (
                      <Cell
                        key={item.key}
                        fill={
                          STATUS_COLORS[item.key as keyof typeof STATUS_COLORS]
                        }
                      />
                    ))}
                  </Bar>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Status: ${label}`}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
