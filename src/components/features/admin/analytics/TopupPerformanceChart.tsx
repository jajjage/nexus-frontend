"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CHART_COLORS_FALLBACK,
  transformOperatorDataForChart,
  useTopupOverview,
} from "@/hooks/admin/useAdminAnalytics";
import { DateRangeParams } from "@/types/admin/analytics.types";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface TopupPerformanceChartProps {
  dateRange?: DateRangeParams;
}

export function TopupPerformanceChart({
  dateRange,
}: TopupPerformanceChartProps) {
  const { data, isLoading, error } = useTopupOverview(dateRange);

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive py-8 text-center">
          Failed to load topup performance
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.byOperator
    ? transformOperatorDataForChart(data.byOperator)
    : [];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Operator Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-muted-foreground text-xs">Total Topups</p>
            <p className="text-xl font-bold">
              {(data?.totalTopups || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-muted-foreground text-xs">Total Value</p>
            <p className="text-xl font-bold">
              {formatCurrency(data?.totalValue || 0)}
            </p>
          </div>
        </div>

        {/* Pie Chart */}
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      CHART_COLORS_FALLBACK[
                        index % CHART_COLORS_FALLBACK.length
                      ]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), "Count"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-muted-foreground flex h-48 items-center justify-center">
            No operator data available
          </div>
        )}

        {/* Top Operator Badge */}
        {data?.topOperator && (
          <div className="bg-primary/10 text-primary mt-4 rounded-lg p-3 text-center text-sm">
            Top Operator: <span className="font-bold">{data.topOperator}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
