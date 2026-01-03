"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CHART_COLORS_FALLBACK,
  useTransactionsByType,
} from "@/hooks/admin/useAdminAnalytics";
import { DateRangeParams } from "@/types/admin/analytics.types";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TransactionTypeChartProps {
  dateRange?: DateRangeParams;
}

export function TransactionTypeChart({ dateRange }: TransactionTypeChartProps) {
  const { data, isLoading, error } = useTransactionsByType(dateRange);

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive py-8 text-center">
          Failed to load transaction data
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
        <CardContent className="h-64">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  // Transform data for Recharts
  const chartData =
    data?.labels?.map((label, index) => ({
      name: label,
      count: data.datasets?.[0]?.data?.[index] || 0,
      fill: CHART_COLORS_FALLBACK[index % CHART_COLORS_FALLBACK.length],
    })) || [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Transactions by Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    value.toLocaleString(),
                    "Count",
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Summary Table */}
            {data?.summary && data.summary.length > 0 && (
              <div className="mt-4 space-y-2">
                {data.summary.slice(0, 4).map((item, index) => (
                  <div
                    key={item.type}
                    className="border-border/30 flex items-center justify-between border-b py-1 text-sm last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            CHART_COLORS_FALLBACK[
                              index % CHART_COLORS_FALLBACK.length
                            ],
                        }}
                      />
                      <span className="text-muted-foreground">
                        {item.displayName || item.type}
                      </span>
                    </div>
                    <span className="font-medium">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-muted-foreground flex h-48 items-center justify-center">
            No transaction data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
