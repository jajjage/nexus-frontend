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
import { useUnmatchedWebhooks } from "@/hooks/admin/useAdminWebhooks";
import {
  WebhookQueryParams,
  WebhookReconciliationRecord,
  WebhookStatus,
} from "@/types/admin/webhook.types";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const statusColors: Record<WebhookStatus, string> = {
  MATCHED: "bg-green-100 text-green-800",
  UNMATCHED: "bg-orange-100 text-orange-800",
  PENDING: "bg-blue-100 text-blue-800",
  REVIEWED: "bg-purple-100 text-purple-800",
  FAILED: "bg-red-100 text-red-800",
};

export function WebhookListTable() {
  const [params, setParams] = useState<WebhookQueryParams>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError, refetch } = useUnmatchedWebhooks(params);

  const webhooks = data?.data?.webhooks || [];
  const totalPages = data?.data?.totalPages || 1;
  const currentPage = data?.data?.page || 1;

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setParams((prev) => ({
      ...prev,
      status: status === "all" ? undefined : (status as WebhookStatus),
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
          <p className="text-muted-foreground">Failed to load webhooks</p>
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
        <div className="flex items-center justify-between">
          <CardTitle>Webhook Records</CardTitle>
          <div className="flex gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Search by reference..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-64"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button variant="outline" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select
              value={params.status || "all"}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="MATCHED">Matched</SelectItem>
                <SelectItem value="UNMATCHED">Unmatched</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {webhooks.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No webhooks found
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook: WebhookReconciliationRecord) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-mono text-sm">
                      {webhook.externalReference
                        ? webhook.externalReference.length > 16
                          ? `${webhook.externalReference.slice(0, 16)}...`
                          : webhook.externalReference
                        : "-"}
                    </TableCell>
                    <TableCell>{webhook.supplierName || "-"}</TableCell>
                    <TableCell>
                      ₦{(webhook.amount ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell>{webhook.phoneNumber || "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[webhook.status] || ""}>
                        {webhook.status || "UNKNOWN"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {webhook.createdAt
                        ? format(new Date(webhook.createdAt), "PP")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/dashboard/webhooks/${webhook.id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-muted-foreground text-sm">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
