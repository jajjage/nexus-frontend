"use client";

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
import { useAdminTransactions } from "@/hooks/admin/useAdminTransactions";
import { AdminTransaction } from "@/types/admin/transaction.types";
import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

// Method display names
const methodLabels: Record<string, string> = {
  wallet: "Wallet",
  admin_credit: "Admin Credit",
  admin_debit: "Admin Debit",
  topup: "Topup",
  refund: "Refund",
};

// Related type display
const relatedTypeLabels: Record<string, string> = {
  topup_request: "Topup",
  admin: "Admin",
  refund: "Refund",
};

export function TransactionListTable() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [direction, setDirection] = useState<string>("all");
  const limit = 15;

  const { data, isLoading, isError, refetch } = useAdminTransactions({
    page,
    limit,
  });

  const allTransactions = data?.data?.transactions || [];
  const pagination = data?.data?.pagination;

  // Client-side filtering for direction and search
  const transactions = useMemo(() => {
    let filtered = allTransactions;

    // Filter by direction
    if (direction !== "all") {
      filtered = filtered.filter((tx) => tx.direction === direction);
    }

    // Filter by search (user name, email, product code, reference)
    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.user?.fullName?.toLowerCase().includes(searchLower) ||
          tx.user?.email?.toLowerCase().includes(searchLower) ||
          tx.productCode?.toLowerCase().includes(searchLower) ||
          tx.reference?.toLowerCase().includes(searchLower) ||
          tx.related?.operatorCode?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allTransactions, direction, searchInput]);

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
          <p className="text-muted-foreground">Failed to load transactions</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by user, product..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Direction</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center">
                    {searchInput || direction !== "all"
                      ? "No matching transactions"
                      : "No transactions found"}
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx: AdminTransaction) => (
                  <TableRow key={tx.id || tx.transactionId}>
                    {/* Direction */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.direction === "credit" ? (
                          <div className="flex items-center gap-1.5 text-green-600">
                            <ArrowDownRight className="h-4 w-4" />
                            <span className="text-sm font-medium">Credit</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-600">
                            <ArrowUpRight className="h-4 w-4" />
                            <span className="text-sm font-medium">Debit</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* User */}
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {tx.user?.fullName || "Unknown"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {tx.user?.email || tx.userId}
                        </p>
                      </div>
                    </TableCell>

                    {/* Product */}
                    <TableCell>
                      {tx.productCode ? (
                        <div>
                          <p className="text-sm font-medium">
                            {tx.productCode}
                          </p>
                          {tx.related?.operatorCode && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {tx.related.operatorCode}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Amount */}
                    <TableCell>
                      <div>
                        <span
                          className={`font-semibold ${
                            tx.direction === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {tx.direction === "credit" ? "+" : "-"}₦
                          {typeof tx.amount === "number"
                            ? tx.amount.toLocaleString()
                            : tx.amount}
                        </span>
                        {tx.balanceAfter !== undefined && (
                          <p className="text-muted-foreground text-xs">
                            Bal: ₦
                            {typeof tx.balanceAfter === "number"
                              ? tx.balanceAfter.toLocaleString()
                              : tx.balanceAfter}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Method */}
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {methodLabels[tx.method || ""] ||
                          relatedTypeLabels[tx.relatedType || ""] ||
                          tx.method ||
                          tx.relatedType ||
                          "—"}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {tx.related?.status ? (
                        <Badge
                          variant={
                            tx.related.status === "completed"
                              ? "default"
                              : tx.related.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className="capitalize"
                        >
                          {tx.related.status}
                        </Badge>
                      ) : tx.status ? (
                        <Badge
                          variant={
                            tx.status === "completed"
                              ? "default"
                              : tx.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className="capitalize"
                        >
                          {tx.status}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Completed
                        </Badge>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(tx.createdAt), "PP p")}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/admin/dashboard/transactions/${tx.id || tx.transactionId}`}
                        >
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

        {/* Pagination */}
        {pagination && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Page {pagination.page} of {pagination.totalPages} (
              {pagination.total} transactions)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNextPage}
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
