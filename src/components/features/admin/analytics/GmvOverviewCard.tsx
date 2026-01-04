"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGmvOverview } from "@/hooks/admin/useAdminAnalytics";
import { DateRangeParams } from "@/types/admin/analytics.types";
import { DollarSign, ShoppingCart, TrendingUp } from "lucide-react";

interface GmvOverviewCardProps {
  dateRange?: DateRangeParams;
}

export function GmvOverviewCard({ dateRange }: GmvOverviewCardProps) {
  const { data, isLoading, error } = useGmvOverview(dateRange);

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive py-8 text-center">
          Failed to load GMV overview
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
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <DollarSign className="h-5 w-5 text-green-500" />
          Gross Merchandise Volume
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          Based on Face Value (amount), not Net Revenue (cost)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total GMV - Hero Stat */}
        <div className="rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 text-center">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Total GMV
          </p>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(data?.totalGMV || 0)}
          </p>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 flex flex-col items-center rounded-lg p-3">
            <ShoppingCart className="mb-1 h-5 w-5 text-blue-500" />
            <span className="text-lg font-bold">
              {(data?.totalTransactions || 0).toLocaleString()}
            </span>
            <span className="text-muted-foreground text-xs">Transactions</span>
          </div>
          <div className="bg-muted/50 flex flex-col items-center rounded-lg p-3">
            <TrendingUp className="mb-1 h-5 w-5 text-purple-500" />
            <span className="text-lg font-bold">
              {formatCurrency(data?.averageOrderValue || 0)}
            </span>
            <span className="text-muted-foreground text-xs">
              Avg Order Value
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
