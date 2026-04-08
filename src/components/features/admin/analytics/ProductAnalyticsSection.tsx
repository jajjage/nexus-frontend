"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTopupProductDailySnapshot } from "@/hooks/admin/useAdminAnalytics";
import { DateRangeParams } from "@/types/admin/analytics.types";
import { BarChart3, RefreshCw, Trophy } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDateRange(): DateRangeParams {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - 6);

  return {
    fromDate: formatInputDate(fromDate),
    toDate: formatInputDate(toDate),
  };
}

function formatDisplayDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return value.toLocaleString();
}

export function ProductAnalyticsSection() {
  const defaultDateRange = getDefaultDateRange();
  const [fromDateInput, setFromDateInput] = useState(defaultDateRange.fromDate);
  const [toDateInput, setToDateInput] = useState(defaultDateRange.toDate);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeParams>(defaultDateRange);

  const { data, isLoading, error, isFetching } =
    useTopupProductDailySnapshot(dateRange);

  const validateDates = () => {
    if (!fromDateInput || !toDateInput) {
      return "Choose both from and to dates to load product analytics.";
    }

    if (!DATE_PATTERN.test(fromDateInput)) {
      return "fromDate must be in YYYY-MM-DD format.";
    }

    if (!DATE_PATTERN.test(toDateInput)) {
      return "toDate must be in YYYY-MM-DD format.";
    }

    if (fromDateInput > toDateInput) {
      return "fromDate cannot be greater than toDate.";
    }

    return null;
  };

  const handleApplyFilters = () => {
    const nextError = validateDates();

    if (nextError) {
      setValidationError(nextError);
      return;
    }

    setValidationError(null);
    setDateRange({
      fromDate: fromDateInput,
      toDate: toDateInput,
    });
  };

  const handleResetFilters = () => {
    const nextRange = getDefaultDateRange();
    setFromDateInput(nextRange.fromDate);
    setToDateInput(nextRange.toDate);
    setValidationError(null);
    setDateRange(nextRange);
  };

  const chartData =
    data?.dailySnapshots.map((snapshot) => ({
      date: new Date(`${snapshot.date}T00:00:00`).toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
      }),
      successfulTopups: snapshot.totalSuccessfulTopups,
      receivedTransactions: snapshot.totalReceivedTransactions,
    })) || [];

  const topProductInRange = data?.summary.topProducts[0] ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Product Analytics
          </CardTitle>
          <CardDescription>
            Date-range snapshot for successful topups, received transactions,
            and best-performing products.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="productAnalyticsFromDate">From Date</Label>
              <Input
                id="productAnalyticsFromDate"
                type="date"
                value={fromDateInput}
                onChange={(event) => setFromDateInput(event.target.value)}
                className="w-44"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="productAnalyticsToDate">To Date</Label>
              <Input
                id="productAnalyticsToDate"
                type="date"
                value={toDateInput}
                onChange={(event) => setToDateInput(event.target.value)}
                className="w-44"
              />
            </div>
            <Button onClick={handleApplyFilters} disabled={isFetching}>
              Apply
            </Button>
            <Button
              variant="ghost"
              onClick={handleResetFilters}
              disabled={isFetching}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          {validationError ? (
            <Alert>
              <AlertTitle>Invalid date range</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load product analytics</AlertTitle>
              <AlertDescription>
                The product daily snapshot endpoint could not be loaded.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardDescription>Total Successful Topups</CardDescription>
                <CardTitle className="text-2xl">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(data?.summary.totalSuccessfulTopups || 0)
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Across {dateRange.fromDate} to {dateRange.toDate}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardDescription>Total Received Transactions</CardDescription>
                <CardTitle className="text-2xl">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(data?.summary.totalReceivedTransactions || 0)
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Count only. This is not a currency amount.
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardDescription>Best Product in Range</CardDescription>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  {isLoading ? (
                    <Skeleton className="h-8 w-40" />
                  ) : (
                    topProductInRange?.productName || "No successful topups"
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {isLoading ? (
                  <Skeleton className="h-5 w-36" />
                ) : topProductInRange ? (
                  `${topProductInRange.operatorName} • ${formatNumber(
                    topProductInRange.successfulCount
                  )} sales • ${formatCurrency(topProductInRange.totalAmount)}`
                ) : (
                  "No ranked product for the selected period."
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Daily Trend</CardTitle>
            <CardDescription>
              Successful topups vs received transaction counts by day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="successfulTopups"
                    name="Successful Topups"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="receivedTransactions"
                    name="Received Transactions"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground flex h-[320px] items-center justify-center text-sm">
                No daily product analytics available for this date range.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Top Products in Range
            </CardTitle>
            <CardDescription>
              Ranked across the full selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.summary.topProducts.length ? (
              <div className="space-y-3">
                {data.summary.topProducts.slice(0, 5).map((product, index) => (
                  <div
                    key={product.productId}
                    className="bg-muted/40 flex items-center justify-between rounded-lg p-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {index + 1}. {product.productName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {product.operatorName}
                        {product.productCode ? ` • ${product.productCode}` : ""}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">
                        {formatNumber(product.successfulCount)} sales
                      </p>
                      <p className="text-muted-foreground">
                        {formatCurrency(product.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-10 text-center text-sm">
                No product rankings available for this range.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Daily Snapshot Table
          </CardTitle>
          <CardDescription>
            Best-performing product and daily counts from the selected range
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-12 w-full" />
              ))}
            </div>
          ) : data?.dailySnapshots.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Best Product</TableHead>
                  <TableHead className="text-right">Successful Topups</TableHead>
                  <TableHead className="text-right">
                    Received Transactions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.dailySnapshots.map((snapshot) => (
                  <TableRow key={snapshot.date}>
                    <TableCell>{formatDisplayDate(snapshot.date)}</TableCell>
                    <TableCell>
                      {snapshot.bestPerformingProduct?.productName ||
                        "No successful topups"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(snapshot.totalSuccessfulTopups)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(snapshot.totalReceivedTransactions)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground py-10 text-center text-sm">
              No daily snapshots available for this range.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Daily Product Drilldown
          </CardTitle>
          <CardDescription>
            Products are already sorted by best-selling first for each day
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-14 w-full" />
              ))}
            </div>
          ) : data?.dailySnapshots.length ? (
            <Accordion type="single" collapsible className="w-full">
              {data.dailySnapshots.map((snapshot) => (
                <AccordionItem key={snapshot.date} value={snapshot.date}>
                  <AccordionTrigger>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {formatDisplayDate(snapshot.date)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Best product:{" "}
                        {snapshot.bestPerformingProduct?.productName ||
                          "No successful topups"}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {snapshot.products.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Operator</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead className="text-right">Sales</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {snapshot.products.map((product, index) => (
                            <TableRow
                              key={`${snapshot.date}-${product.productId}`}
                            >
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium">
                                    {product.productName}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {product.productType}
                                    {product.productSlug
                                      ? ` • ${product.productSlug}`
                                      : ""}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{product.operatorName}</TableCell>
                              <TableCell>{product.productCode || "-"}</TableCell>
                              <TableCell className="text-right">
                                {formatNumber(product.successfulCount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(product.totalAmount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-muted-foreground py-6 text-center text-sm">
                        No product sales rows for this day.
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-muted-foreground py-10 text-center text-sm">
              No drilldown data available for this range.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
