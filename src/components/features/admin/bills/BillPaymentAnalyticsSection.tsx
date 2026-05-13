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
import { useBillPaymentDailySnapshot } from "@/hooks/admin/useAdminAnalytics";
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
  }).format(value || 0);
}

function formatNumber(value: number) {
  return (value || 0).toLocaleString();
}

export function BillPaymentAnalyticsSection() {
  const defaultDateRange = getDefaultDateRange();
  const [fromDateInput, setFromDateInput] = useState(defaultDateRange.fromDate);
  const [toDateInput, setToDateInput] = useState(defaultDateRange.toDate);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeParams>(defaultDateRange);

  const { data, isLoading, error, isFetching } =
    useBillPaymentDailySnapshot(dateRange);

  const validateDates = () => {
    if (!fromDateInput || !toDateInput) return "Choose both dates.";
    if (!DATE_PATTERN.test(fromDateInput))
      return "fromDate must be YYYY-MM-DD.";
    if (!DATE_PATTERN.test(toDateInput)) return "toDate must be YYYY-MM-DD.";
    if (fromDateInput > toDateInput) {
      return "fromDate cannot be greater than toDate.";
    }
    return null;
  };

  const applyFilters = () => {
    const nextError = validateDates();
    if (nextError) {
      setValidationError(nextError);
      return;
    }
    setValidationError(null);
    setDateRange({ fromDate: fromDateInput, toDate: toDateInput });
  };

  const resetFilters = () => {
    const nextRange = getDefaultDateRange();
    setFromDateInput(nextRange.fromDate);
    setToDateInput(nextRange.toDate);
    setDateRange(nextRange);
    setValidationError(null);
  };

  const chartData =
    data?.dailySnapshots.map((snapshot) => ({
      date: new Date(`${snapshot.date}T00:00:00`).toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
      }),
      electricity: snapshot.electricity.amount,
      cable: snapshot.cable.amount,
      successful: snapshot.totalSuccessfulPayments,
    })) || [];

  const topBiller = data?.summary.topBillers[0] || null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Bill Payment Analytics
          </CardTitle>
          <CardDescription>
            Daily electricity and cable payment volume, success counts, and
            best-performing billers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="billAnalyticsFromDate">From Date</Label>
              <Input
                id="billAnalyticsFromDate"
                type="date"
                value={fromDateInput}
                onChange={(event) => setFromDateInput(event.target.value)}
                className="w-44"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="billAnalyticsToDate">To Date</Label>
              <Input
                id="billAnalyticsToDate"
                type="date"
                value={toDateInput}
                onChange={(event) => setToDateInput(event.target.value)}
                className="w-44"
              />
            </div>
            <Button onClick={applyFilters} disabled={isFetching}>
              Apply
            </Button>
            <Button
              variant="ghost"
              onClick={resetFilters}
              disabled={isFetching}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          {validationError && (
            <Alert>
              <AlertTitle>Invalid date range</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Unable to load bill analytics</AlertTitle>
              <AlertDescription>
                The bill payment daily snapshot endpoint could not be loaded.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <MetricCard
              label="Attempted"
              value={formatNumber(data?.summary.totalAttemptedPayments || 0)}
              loading={isLoading}
            />
            <MetricCard
              label="Successful"
              value={formatNumber(data?.summary.totalSuccessfulPayments || 0)}
              loading={isLoading}
            />
            <MetricCard
              label="Successful Volume"
              value={formatCurrency(data?.summary.totalAmount || 0)}
              loading={isLoading}
            />
            <MetricCard
              label="Best Biller"
              value={topBiller?.billerName || "No biller yet"}
              loading={isLoading}
              icon={<Trophy className="h-5 w-5 text-amber-500" />}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Volume</CardTitle>
            <CardDescription>Successful amount by category</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Bar
                    dataKey="electricity"
                    name="Electricity"
                    fill="#2563eb"
                  />
                  <Bar dataKey="cable" name="Cable TV" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground flex h-[320px] items-center justify-center text-sm">
                No bill payment analytics available.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Billers</CardTitle>
            <CardDescription>Ranked across the selected range</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.summary.topBillers.length ? (
              <div className="space-y-3">
                {data.summary.topBillers.slice(0, 6).map((biller, index) => (
                  <div
                    key={biller.billerId}
                    className="bg-muted/40 flex items-center justify-between rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {index + 1}. {biller.billerName}
                      </p>
                      <p className="text-muted-foreground text-xs capitalize">
                        {biller.categoryType} • {biller.billerCode}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">
                        {formatNumber(biller.successfulCount)} paid
                      </p>
                      <p className="text-muted-foreground">
                        {formatCurrency(biller.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No biller rankings available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Snapshot</CardTitle>
          <CardDescription>
            Counts, volume, and best biller for each day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : data?.dailySnapshots.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Best Biller</TableHead>
                  <TableHead className="text-right">Attempted</TableHead>
                  <TableHead className="text-right">Successful</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.dailySnapshots.map((snapshot) => (
                  <TableRow key={snapshot.date}>
                    <TableCell>{formatDisplayDate(snapshot.date)}</TableCell>
                    <TableCell>
                      {snapshot.bestPerformingBiller?.billerName || "None"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(snapshot.totalAttemptedPayments)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(snapshot.totalSuccessfulPayments)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(snapshot.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(snapshot.totalProfit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No daily snapshots for this range.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Biller Drilldown</CardTitle>
          <CardDescription>Provider-level rows per day.</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.dailySnapshots.length ? (
            <Accordion type="single" collapsible>
              {data.dailySnapshots.map((snapshot) => (
                <AccordionItem key={snapshot.date} value={snapshot.date}>
                  <AccordionTrigger>
                    {formatDisplayDate(snapshot.date)} •{" "}
                    {formatNumber(snapshot.totalSuccessfulPayments)} successful
                  </AccordionTrigger>
                  <AccordionContent>
                    {snapshot.billers.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Biller</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">
                              Success
                            </TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Failed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {snapshot.billers.map((biller) => (
                            <TableRow
                              key={`${snapshot.date}-${biller.billerId}`}
                            >
                              <TableCell>{biller.billerName}</TableCell>
                              <TableCell className="capitalize">
                                {biller.categoryType}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(biller.successfulCount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(biller.totalAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(biller.failedCount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground py-6 text-center text-sm">
                        No billers for this day.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No drilldown data available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  loading,
  icon,
}: {
  label: string;
  value: string;
  loading: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="flex items-center gap-2 text-2xl">
          {icon}
          {loading ? <Skeleton className="h-8 w-24" /> : value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
