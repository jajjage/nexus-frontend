"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSupplierErrorStats } from "@/hooks/admin/useAdminSupplierErrors";
import { format } from "date-fns";
import {
  AlertTriangle,
  Server,
  Database,
  Cpu,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

interface ErrorStatsDashboardProps {
  fromDate?: string;
  toDate?: string;
}

const COLORS = [
  "#f59e0b", // Amber (Infrastructure)
  "#8b5cf6", // Purple (Supplier Resource)
  "#3b82f6", // Blue (Business Logic)
  "#ef4444", // Red
  "#10b981", // Green
  "#ec4899", // Pink
];

export function ErrorStatsDashboard({
  fromDate,
  toDate,
}: ErrorStatsDashboardProps) {
  const { data, isLoading, error } = useAdminSupplierErrorStats({
    fromDate,
    toDate,
  });

  if (error) {
    return (
      <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-lg border p-4 text-center text-sm font-medium">
        Failed to load supplier error statistics. Please refresh to retry.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* KPI skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-1 h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="h-64">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="h-64">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = data;
  const totalErrors = stats?.totalErrors || 0;

  // 1. Types breakdown
  const infraCount = stats?.errorsByType?.["infrastructure"] || 0;
  const resourceCount = stats?.errorsByType?.["supplier_resource"] || 0;
  const bizCount = stats?.errorsByType?.["business_logic"] || 0;

  // 2. Suppliers breakdown for pie chart
  const supplierChartData = Object.entries(stats?.errorsBySupplier || {}).map(
    ([name, count]) => ({
      name: name.toUpperCase(),
      value: count,
    })
  );

  // 3. Types breakdown for bar chart
  const typeChartData = [
    { name: "Timeout / Connection", count: infraCount, fill: "#f59e0b" },
    { name: "Out of SIMs", count: resourceCount, fill: "#8b5cf6" },
    { name: "Bad Request", count: bizCount, fill: "#3b82f6" },
  ];

  // 4. Daily trends for line chart
  const trendChartData =
    stats?.dailyTrends?.map((item) => ({
      date: format(new Date(item.date), "MMM d"),
      failures: item.count,
    })) || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Errors */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Total Failures
            </CardTitle>
            <AlertTriangle className="text-destructive h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {totalErrors}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Total supplier transactions rejected
            </p>
          </CardContent>
        </Card>

        {/* Infrastructure Failures */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Timeout / Connection
            </CardTitle>
            <Server className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {infraCount}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {totalErrors > 0
                ? `${Math.round((infraCount / totalErrors) * 100)}%`
                : "0%"}{" "}
              of total failures
            </p>
          </CardContent>
        </Card>

        {/* Out of SIMs */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              SIM Pool Depleted
            </CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
              {resourceCount}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {totalErrors > 0
                ? `${Math.round((resourceCount / totalErrors) * 100)}%`
                : "0%"}{" "}
              of total failures
            </p>
          </CardContent>
        </Card>

        {/* Business Logic */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Bad Request / Logic
            </CardTitle>
            <Cpu className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {bizCount}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {totalErrors > 0
                ? `${Math.round((bizCount / totalErrors) * 100)}%`
                : "0%"}{" "}
              of total failures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Trend Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4" /> Failure Volume Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {trendChartData.length === 0 ? (
              <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                No trend data available for this range
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    strokeOpacity={0.4}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: 10 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: 10 }}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: "hsl(var(--destructive))" }}
                    labelClassName="font-medium text-xs"
                  />
                  <Line
                    type="monotone"
                    dataKey="failures"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2.5}
                    dot={{ strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Supplier Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4" /> Failures by Supplier
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-80 flex-col justify-between">
            {supplierChartData.length === 0 ? (
              <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                No supplier logs found
              </div>
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={supplierChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {supplierChartData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                  {supplierChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="max-w-[80px] truncate" title={item.name}>
                        {item.name}
                      </span>
                      <span className="text-muted-foreground ml-auto font-semibold">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
