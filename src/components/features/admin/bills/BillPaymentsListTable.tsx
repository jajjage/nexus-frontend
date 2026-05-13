"use client";

import { BillPaymentStatusBadge } from "@/components/features/admin/bills/BillPaymentStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminBillPayments } from "@/hooks/admin/useAdminBillPayments";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function BillPaymentsListTable() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryType, setCategoryType] = useState("all");
  const [sourceChannel, setSourceChannel] = useState("all");
  const debouncedSearch = useDebounce(searchInput, 500);
  const limit = 15;

  const params = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
      categoryType: categoryType === "all" ? undefined : categoryType,
      sourceChannel: sourceChannel === "all" ? undefined : sourceChannel,
    }),
    [categoryType, debouncedSearch, page, sourceChannel, status]
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useAdminBillPayments(params);

  const payments = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const resetPage = (callback: () => void) => {
    callback();
    setPage(1);
  };

  if (!data && isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Failed to load bill payments.</p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bill Payment History</CardTitle>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search customer, user, reference, biller..."
              value={searchInput}
              onChange={(event) =>
                resetPage(() => setSearchInput(event.target.value))
              }
              className="pl-9"
            />
          </div>
          <Select
            value={categoryType}
            onValueChange={(value) => resetPage(() => setCategoryType(value))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="electricity">Electricity</SelectItem>
              <SelectItem value="cable">Cable TV</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => resetPage(() => setStatus(value))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sourceChannel}
            onValueChange={(value) => resetPage(() => setSourceChannel(value))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="user_app">User App</SelectItem>
              <SelectItem value="reseller_api">Reseller API</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isFetching && (
          <p className="text-muted-foreground mb-3 text-xs">Refreshing...</p>
        )}

        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[1050px]">
            <TableHeader>
              <TableRow>
                <TableHead>Biller</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center">
                    No bill payments found.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {payment.billerName || payment.billerCode}
                        </p>
                        <Badge variant="outline" className="capitalize">
                          {payment.categoryType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {payment.customerName || "Unverified"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {payment.customerIdentifier}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {payment.userFullName || "Unknown"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {payment.userEmail || payment.userId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      {payment.supplierName || payment.supplierSlug || "-"}
                    </TableCell>
                    <TableCell>
                      <BillPaymentStatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(payment.createdAt), "PP p")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/dashboard/bills/${payment.id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Page {pagination.page} of {pagination.totalPages || 1} (
              {pagination.total} payments)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= (pagination.totalPages || 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
