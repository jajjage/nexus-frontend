"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevenueMetrics } from "@/hooks/admin/useAdminAnalytics";
import { DateRangeParams } from "@/types/admin/analytics.types";
import { DollarSign, TrendingUp } from "lucide-react";

interface RevenueCardProps {
  dateRange?: DateRangeParams;
}

export function RevenueCard({ dateRange }: RevenueCardProps) {
  const { data, isLoading, error } = useRevenueMetrics(dateRange);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive py-8 text-center">
          Failed to load revenue metrics
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
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const revenue = data;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-green-600" />
          Revenue & Profit
        </CardTitle>
        {revenue?.period && (
          <p className="text-muted-foreground text-xs">
            {revenue.period.from} to {revenue.period.to}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-muted-foreground text-xs uppercase">GMV</p>
            <p className="text-lg font-bold">
              {formatCurrency(revenue?.gmv || 0)}
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20">
            <p className="text-xs text-green-700 uppercase dark:text-green-400">
              Revenue
            </p>
            <p className="text-lg font-bold text-green-700 dark:text-green-400">
              {formatCurrency(revenue?.revenue || 0)}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20">
            <p className="text-xs text-blue-700 uppercase dark:text-blue-400">
              Profit
            </p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(revenue?.profit || 0)}
            </p>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Profit Margin</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            {revenue?.profitMargin || "0%"}
          </span>
        </div>

        {/* Cost Breakdown */}
        {revenue?.costBreakdown && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              Cost Breakdown
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier Costs</span>
                <span>
                  {formatCurrency(revenue.costBreakdown.supplierCosts)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Fees</span>
                <span>{formatCurrency(revenue.costBreakdown.paymentFees)}</span>
              </div>
              {revenue.costBreakdown.otherCosts > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Other Costs</span>
                  <span>
                    {formatCurrency(revenue.costBreakdown.otherCosts)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Products by Revenue */}
        {revenue?.revenueByProduct && revenue.revenueByProduct.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              Top Products
            </p>
            <div className="space-y-1">
              {revenue.revenueByProduct.slice(0, 3).map((product, i) => (
                <div
                  key={i}
                  className="bg-muted/30 flex items-center justify-between rounded px-2 py-1 text-sm"
                >
                  <span>
                    {product.operator}{" "}
                    <span className="text-muted-foreground text-xs">
                      ({product.productType})
                    </span>
                  </span>
                  <span className="font-medium text-green-600">
                    {product.margin}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
