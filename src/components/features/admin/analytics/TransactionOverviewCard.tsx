"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionOverview } from "@/hooks/admin/useAdminAnalytics";
import { DateRangeParams } from "@/types/admin/analytics.types";
import { CheckCircle, Clock, TrendingUp, XCircle } from "lucide-react";

interface TransactionOverviewCardProps {
  dateRange?: DateRangeParams;
}

export function TransactionOverviewCard({
  dateRange,
}: TransactionOverviewCardProps) {
  const { data, isLoading, error } = useTransactionOverview(dateRange);

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive py-8 text-center">
          Failed to load transaction overview
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
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
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

  const breakdown = data?.breakdownByStatus;
  const total =
    (breakdown?.successful || 0) +
    (breakdown?.failed || 0) +
    (breakdown?.pending || 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Transaction Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Total Volume
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(data?.totalValue || 0)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Transactions
            </p>
            <p className="text-2xl font-bold">
              {(data?.totalTransactions || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="flex items-center justify-between rounded-lg bg-green-500/10 p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm">Success Rate</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            {data?.successRate || "0%"}
          </span>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 flex flex-col items-center rounded-lg p-3">
            <CheckCircle className="mb-1 h-5 w-5 text-green-500" />
            <span className="text-lg font-bold">
              {breakdown?.successful?.toLocaleString() || 0}
            </span>
            <span className="text-muted-foreground text-xs">Successful</span>
          </div>
          <div className="bg-muted/50 flex flex-col items-center rounded-lg p-3">
            <XCircle className="mb-1 h-5 w-5 text-red-500" />
            <span className="text-lg font-bold">
              {breakdown?.failed?.toLocaleString() || 0}
            </span>
            <span className="text-muted-foreground text-xs">Failed</span>
          </div>
          <div className="bg-muted/50 flex flex-col items-center rounded-lg p-3">
            <Clock className="mb-1 h-5 w-5 text-amber-500" />
            <span className="text-lg font-bold">
              {breakdown?.pending?.toLocaleString() || 0}
            </span>
            <span className="text-muted-foreground text-xs">Pending</span>
          </div>
        </div>

        {/* Average */}
        <div className="text-muted-foreground text-center text-sm">
          Average: {formatCurrency(data?.averageAmount || 0)} per transaction
        </div>
      </CardContent>
    </Card>
  );
}
