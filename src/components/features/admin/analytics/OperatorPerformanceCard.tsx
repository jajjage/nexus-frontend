"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOperatorPerformance } from "@/hooks/admin/useAdminAnalytics";
import { DateRangeParams } from "@/types/admin/analytics.types";
import { Activity } from "lucide-react";

interface OperatorPerformanceCardProps {
  dateRange?: DateRangeParams;
}

export function OperatorPerformanceCard({
  dateRange,
}: OperatorPerformanceCardProps) {
  const { data, isLoading, error } = useOperatorPerformance(dateRange);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);

  const getSuccessRateColor = (rate: string) => {
    const value = parseFloat(rate);
    if (value >= 95) return "text-green-600 bg-green-100 dark:bg-green-900/30";
    if (value >= 90) return "text-amber-600 bg-amber-100 dark:bg-amber-900/30";
    return "text-red-600 bg-red-100 dark:bg-red-900/30";
  };

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive py-8 text-center">
          Failed to load operator performance
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
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const operators = data?.operators || [];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-purple-600" />
          Operator Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {operators.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No operator data available
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-center">Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operators.map((op) => (
                  <TableRow key={op.name}>
                    <TableCell className="font-medium">
                      {op.name}
                      <span className="text-muted-foreground block text-xs">
                        {op.supplierSlug}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {op.transactions.total.toLocaleString()}
                      <span className="text-muted-foreground block text-xs">
                        {op.transactions.failed} failed
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(op.volume.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getSuccessRateColor(op.transactions.successRate)}`}
                      >
                        {op.transactions.successRate}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
