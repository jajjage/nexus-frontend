"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodaySnapshot } from "@/hooks/admin/useAdminAnalytics";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export function TodaySnapshotCard() {
  const { data, isLoading, error } = useTodaySnapshot();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number) => value.toLocaleString();

  const getDeltaColor = (percent: string) => {
    if (percent.startsWith("+")) return "text-green-600";
    if (percent.startsWith("-")) return "text-red-600";
    return "text-muted-foreground";
  };

  const getDeltaIcon = (percent: string) => {
    if (percent.startsWith("+"))
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (percent.startsWith("-"))
      return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return null;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive py-8 text-center">
          Failed to load today&apos;s snapshot
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const snapshot = data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="text-primary h-5 w-5" />
          Today&apos;s Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Transactions */}
          <div className="bg-muted/50 space-y-1 rounded-lg p-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Transactions
            </p>
            <p className="text-2xl font-bold">
              {formatNumber(snapshot?.transactions.count || 0)}
            </p>
            <div className="flex items-center gap-1 text-sm">
              {getDeltaIcon(
                snapshot?.comparedToYesterday.transactionsDeltaPercent || "0%"
              )}
              <span
                className={getDeltaColor(
                  snapshot?.comparedToYesterday.transactionsDeltaPercent || "0%"
                )}
              >
                {snapshot?.comparedToYesterday.transactionsDeltaPercent || "0%"}
              </span>
              <span className="text-muted-foreground">vs yesterday</span>
            </div>
          </div>

          {/* Volume */}
          <div className="bg-muted/50 space-y-1 rounded-lg p-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Volume
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(snapshot?.transactions.volume || 0)}
            </p>
            <div className="flex items-center gap-1 text-sm">
              {getDeltaIcon(
                snapshot?.comparedToYesterday.volumeDeltaPercent || "0%"
              )}
              <span
                className={getDeltaColor(
                  snapshot?.comparedToYesterday.volumeDeltaPercent || "0%"
                )}
              >
                {snapshot?.comparedToYesterday.volumeDeltaPercent || "0%"}
              </span>
              <span className="text-muted-foreground">vs yesterday</span>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-muted/50 space-y-1 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                Revenue Est.
              </p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(snapshot?.revenueEstimate || 0)}
            </p>
            <p className="text-muted-foreground text-xs">
              Profit: {formatCurrency(snapshot?.transactions.profit || 0)}
            </p>
          </div>

          {/* Users */}
          <div className="bg-muted/50 space-y-1 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                Users
              </p>
            </div>
            <p className="text-2xl font-bold">
              {formatNumber(snapshot?.activeUsers || 0)}
              <span className="text-muted-foreground text-sm font-normal">
                {" "}
                active
              </span>
            </p>
            <p className="text-xs text-blue-600">
              +{formatNumber(snapshot?.newUsers || 0)} new today
            </p>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Success/Failed/Pending */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <span className="text-sm font-bold text-green-600">
                {snapshot?.transactions.successful || 0}
              </span>
            </div>
            <span className="text-muted-foreground text-sm">Successful</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <span className="text-sm font-bold text-red-600">
                {snapshot?.transactions.failed || 0}
              </span>
            </div>
            <span className="text-muted-foreground text-sm">Failed</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <span className="text-sm font-bold text-amber-600">
                {snapshot?.transactions.pending || 0}
              </span>
            </div>
            <span className="text-muted-foreground text-sm">Pending</span>
          </div>

          {/* Wallet Flow */}
          <div className="flex items-center gap-2">
            <Wallet className="text-muted-foreground h-4 w-4" />
            <span className="text-sm">
              <span className="text-green-600">
                +{formatCurrency(snapshot?.walletDeposits || 0)}
              </span>
              {" / "}
              <span className="text-red-600">
                -{formatCurrency(snapshot?.walletWithdrawals || 0)}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
