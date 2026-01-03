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
import { useAdminTopups } from "@/hooks/admin/useAdminTopups";
import { AdminTopupRequest, TopupStatus } from "@/types/admin/topup.types";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const statusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  success: "default",
  completed: "default",
  failed: "destructive",
  reversed: "outline",
  retry: "secondary",
  cancelled: "outline",
};

const operatorColors: Record<string, string> = {
  MTN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  AIRTEL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  GLO: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "9MOBILE":
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export function TopupListTable() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [operator, setOperator] = useState<string>("all");
  const limit = 15;

  // Filter change handlers that reset page
  const handleStatusChange = (value: string) => {
    console.log("Selected status:", value);
    setStatus(value);
    setPage(1);
  };

  const handleOperatorChange = (value: string) => {
    console.log("Selected operator:", value);
    setOperator(value);
    setPage(1);
  };

  // Use filters that API supports
  const { data, isLoading, isError, refetch } = useAdminTopups({
    page,
    limit,
    status: status !== "all" ? (status as TopupStatus) : undefined,
    operator: operator !== "all" ? operator : undefined,
  });

  // Debug log to see actual API response
  console.log("Topup API Response:", data);

  // Data access
  const allRequests = data?.data?.requests || [];
  const pagination = data?.data?.pagination;

  // Client-side search filtering
  const requests = useMemo(() => {
    if (!searchInput.trim()) {
      return allRequests;
    }
    const searchLower = searchInput.toLowerCase();
    return allRequests.filter(
      (req: AdminTopupRequest) =>
        req.user?.fullName?.toLowerCase().includes(searchLower) ||
        req.user?.email?.toLowerCase().includes(searchLower) ||
        req.recipientPhone?.includes(searchInput) ||
        req.operator?.code?.toLowerCase().includes(searchLower) ||
        req.operator?.name?.toLowerCase().includes(searchLower)
    );
  }, [allRequests, searchInput]);

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
          <p className="text-muted-foreground">Failed to load topup requests</p>
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
        <CardTitle>Topup Requests</CardTitle>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by user, phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
              <SelectItem value="retry">Retry</SelectItem>
            </SelectContent>
          </Select>
          <Select value={operator} onValueChange={handleOperatorChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operators</SelectItem>
              <SelectItem value="MTN">MTN</SelectItem>
              <SelectItem value="AIRTEL">Airtel</SelectItem>
              <SelectItem value="GLO">Glo</SelectItem>
              <SelectItem value="9MOBILE">9mobile</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center">
                    {searchInput || status !== "all" || operator !== "all"
                      ? "No matching topup requests"
                      : "No topup requests found"}
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req: AdminTopupRequest) => (
                  <TableRow key={req.id || req.requestId}>
                    {/* User */}
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {req.user?.fullName || "Unknown"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {req.user?.email || req.userId}
                        </p>
                      </div>
                    </TableCell>

                    {/* Recipient Phone */}
                    <TableCell>
                      {req.recipientPhone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="text-muted-foreground h-3 w-3" />
                          <span className="text-sm">{req.recipientPhone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Operator */}
                    <TableCell>
                      {req.operator ? (
                        <Badge
                          className={
                            operatorColors[req.operator.code] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {req.operator.code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Amount */}
                    <TableCell>
                      <div>
                        <p className="font-semibold">
                          ₦
                          {typeof req.amount === "number"
                            ? req.amount.toLocaleString()
                            : req.amount}
                        </p>
                        {req.cost && (
                          <p className="text-muted-foreground text-xs">
                            Cost: ₦
                            {typeof req.cost === "number"
                              ? req.cost.toLocaleString()
                              : req.cost}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {req.type || "airtime"}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={statusColors[req.status] || "secondary"}
                        className="capitalize"
                      >
                        {req.status}
                      </Badge>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(req.createdAt), "PP p")}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/admin/dashboard/topups/${req.id || req.requestId}`}
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
              {pagination.total} requests)
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
