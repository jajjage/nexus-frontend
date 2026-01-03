"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useKeyMetrics } from "@/hooks/admin/useAdminAnalytics";
import { DollarSign, TrendingDown, TrendingUp, Users } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  isLoading?: boolean;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  isLoading,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-1 h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg">
      <div className="from-primary/5 absolute inset-0 bg-gradient-to-br to-transparent" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <div className="bg-primary/10 text-primary rounded-full p-2">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && trend !== "neutral" && (
            <span
              className={`flex items-center text-xs ${
                trend === "up" ? "text-green-500" : "text-red-500"
              }`}
            >
              {trend === "up" ? (
                <TrendingUp className="mr-0.5 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-0.5 h-3 w-3" />
              )}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function KeyMetricsCards() {
  const { data, isLoading, error } = useKeyMetrics();

  if (error) {
    return (
      <div className="text-destructive py-4 text-center">
        Failed to load key metrics
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="ARPU (Monthly)"
        value={isLoading ? "" : formatCurrency(data?.arpu || 0)}
        subtitle="Average Revenue Per User"
        icon={<DollarSign className="h-4 w-4" />}
        trend="up"
        isLoading={isLoading}
      />
      <MetricCard
        title="Lifetime Value"
        value={isLoading ? "" : formatCurrency(data?.ltv || 0)}
        subtitle="Customer LTV"
        icon={<TrendingUp className="h-4 w-4" />}
        trend="up"
        isLoading={isLoading}
      />
      <MetricCard
        title="Churn Rate"
        value={isLoading ? "" : data?.churnRate || "0%"}
        subtitle="Inactive > 30 days"
        icon={<TrendingDown className="h-4 w-4" />}
        trend="down"
        isLoading={isLoading}
      />
      <MetricCard
        title="Paying Users"
        value={isLoading ? "" : (data?.payingUsers || 0).toLocaleString()}
        subtitle="At least 1 payment"
        icon={<Users className="h-4 w-4" />}
        trend="up"
        isLoading={isLoading}
      />
    </div>
  );
}
