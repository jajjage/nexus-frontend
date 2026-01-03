"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAdminSettlements } from "@/hooks/admin/useAdminSettlements";
import { Settlement } from "@/types/admin/settlement.types";
import { format } from "date-fns";
import { Eye, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

export function SettlementListTable() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse URL params
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const providerId = searchParams.get("providerId") || undefined;

  // Local state for filter inputs
  const [localDateFrom, setLocalDateFrom] = useState(dateFrom);
  const [localDateTo, setLocalDateTo] = useState(dateTo);

  const { data, isLoading, isError, refetch } = useAdminSettlements({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    providerId,
  });

  const settlements = data?.data?.settlements || [];

  // URL state helpers
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (localDateFrom) params.set("dateFrom", localDateFrom);
    if (localDateTo) params.set("dateTo", localDateTo);
    router.push(`?${params.toString()}`);
  }, [router, localDateFrom, localDateTo]);

  const clearFilters = useCallback(() => {
    setLocalDateFrom("");
    setLocalDateTo("");
    router.push("?");
  }, [router]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load settlements</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>All Settlements</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/dashboard/settlements/new">
              <Plus className="mr-2 h-4 w-4" />
              New Settlement
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="dateFrom">From Date</Label>
            <Input
              id="dateFrom"
              type="date"
              value={localDateFrom}
              onChange={(e) => setLocalDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dateTo">To Date</Label>
            <Input
              id="dateTo"
              type="date"
              value={localDateTo}
              onChange={(e) => setLocalDateTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={applyFilters}>Apply Filters</Button>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Fees</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    No settlements found
                  </TableCell>
                </TableRow>
              ) : (
                settlements.map((settlement: Settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {settlement.providerName || settlement.providerId}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(settlement.settlementDate), "PP")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(settlement.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {formatCurrency(settlement.fees)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(settlement.netAmount)}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate font-mono text-sm">
                      {settlement.reference}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link
                          href={`/admin/dashboard/settlements/${settlement.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {settlements.length > 0 && (
          <div className="flex justify-end gap-6 pt-2 text-sm">
            <div>
              <span className="text-muted-foreground">Total Amount:</span>{" "}
              <span className="font-medium">
                {formatCurrency(
                  settlements.reduce((sum, s) => sum + s.amount, 0)
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Fees:</span>{" "}
              <span className="font-medium">
                {formatCurrency(
                  settlements.reduce((sum, s) => sum + s.fees, 0)
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Net:</span>{" "}
              <span className="font-medium text-green-600">
                {formatCurrency(
                  settlements.reduce((sum, s) => sum + s.netAmount, 0)
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
