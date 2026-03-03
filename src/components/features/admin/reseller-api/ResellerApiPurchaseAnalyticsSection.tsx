"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminResellerPurchaseAnalyticsOverview } from "@/hooks/admin/useAdminResellerApi";
import { AdminResellerPurchaseAnalyticsQueryParams } from "@/types/admin/reseller-api.types";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useState } from "react";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

export function ResellerApiPurchaseAnalyticsSection() {
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [filters, setFilters] =
    useState<AdminResellerPurchaseAnalyticsQueryParams>({});

  const { data, isLoading, isError, error } =
    useAdminResellerPurchaseAnalyticsOverview(filters);

  const analytics = data?.data;

  const validateDates = () => {
    if (fromDateInput && !DATE_PATTERN.test(fromDateInput)) {
      return "fromDate must be in YYYY-MM-DD format.";
    }

    if (toDateInput && !DATE_PATTERN.test(toDateInput)) {
      return "toDate must be in YYYY-MM-DD format.";
    }

    if (fromDateInput && toDateInput && fromDateInput > toDateInput) {
      return "fromDate cannot be greater than toDate.";
    }

    return null;
  };

  const applyFilters = () => {
    const dateError = validateDates();
    if (dateError) {
      setValidationError(dateError);
      return;
    }

    setValidationError(null);
    setFilters({
      fromDate: fromDateInput || undefined,
      toDate: toDateInput || undefined,
      userId: userIdInput.trim() || undefined,
    });
  };

  const clearFilters = () => {
    setFromDateInput("");
    setToDateInput("");
    setUserIdInput("");
    setValidationError(null);
    setFilters({});
  };

  const statusCountData = analytics
    ? [
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
      ]
    : [];

  const amountData = analytics
    ? [
        {
          name: "Success",
          key: "success",
          amount: analytics.amountByStatus.success,
        },
        {
          name: "Failed",
          key: "failed",
          amount: analytics.amountByStatus.failed,
        },
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
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reseller Purchase Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="adminFromDate">From Date</Label>
            <Input
              id="adminFromDate"
              type="date"
              value={fromDateInput}
              onChange={(event) => setFromDateInput(event.target.value)}
              className="w-44"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="adminToDate">To Date</Label>
            <Input
              id="adminToDate"
              type="date"
              value={toDateInput}
              onChange={(event) => setToDateInput(event.target.value)}
              className="w-44"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="analyticsUserId">User ID (optional)</Label>
            <Input
              id="analyticsUserId"
              value={userIdInput}
              onChange={(event) => setUserIdInput(event.target.value)}
              placeholder="reseller-user-id"
              className="w-64"
            />
          </div>

          <Button onClick={applyFilters}>Apply</Button>
          <Button variant="ghost" onClick={clearFilters}>
            Clear
          </Button>
        </div>

        {validationError ? (
          <Alert>
            <AlertTitle>Invalid date range</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        ) : null}

        {!data && isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-72 w-full" />
          </div>
        ) : isError ? (
          <Alert>
            <AlertTitle>Failed to load analytics</AlertTitle>
            <AlertDescription>
              {(error as any)?.response?.data?.message ??
                (error as Error)?.message ??
                "Unable to fetch analytics data."}
            </AlertDescription>
          </Alert>
        ) : analytics ? (
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
                  <CardTitle className="text-sm font-medium">
                    Total Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(analytics.totals.totalAmount)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {analytics.derived.successRate}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusCountData.map((item) => (
                <Badge key={item.key} variant="outline">
                  {item.name}: {item.value.toLocaleString()}
                </Badge>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-72 rounded-lg border p-2">
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
                            STATUS_COLORS[
                              item.key as keyof typeof STATUS_COLORS
                            ]
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

              <div className="h-72 rounded-lg border p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={amountData}>
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {amountData.map((item) => (
                        <Cell
                          key={item.key}
                          fill={
                            STATUS_COLORS[
                              item.key as keyof typeof STATUS_COLORS
                            ]
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
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No analytics data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
