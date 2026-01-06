"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useAuditLogs, useExportAuditLogs } from "@/hooks/admin/useAdminAudit";
import {
  ACTION_TYPE_LABELS,
  AuditLogQueryParams,
  getActionTypeLabel,
} from "@/types/admin/audit.types";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  RefreshCw,
  Search,
} from "lucide-react";
import { useState } from "react";

const PAGE_SIZES = [10, 25, 50, 100];

export function AuditLogTable() {
  const [params, setParams] = useState<AuditLogQueryParams>({
    page: 1,
    limit: 25,
  });
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const { data, isLoading, refetch } = useAuditLogs(params);
  const exportMutation = useExportAuditLogs();

  const entries = data?.entries || [];
  const pagination = data?.pagination;

  const handleFilterChange = (
    key: keyof AuditLogQueryParams,
    value: string
  ) => {
    setParams((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const handleDateChange = (type: "from" | "to", date: Date | undefined) => {
    const newDateRange = { ...dateRange, [type]: date };
    setDateRange(newDateRange);
    setParams((prev) => ({
      ...prev,
      fromDate: newDateRange.from
        ? format(newDateRange.from, "yyyy-MM-dd")
        : undefined,
      toDate: newDateRange.to
        ? format(newDateRange.to, "yyyy-MM-dd")
        : undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  };

  const handleExport = () => {
    exportMutation.mutate(params);
  };

  const formatValue = (value: string | null): string => {
    if (!value) return "—";
    // Try to parse as number for wallet operations
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return `₦${num.toLocaleString()}`;
    }
    return value;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Log
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exportMutation.isPending}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Action Type Filter */}
          <Select
            value={params.actionType || ""}
            onValueChange={(value) => handleFilterChange("actionType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Admin ID Filter */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Admin ID..."
              className="pl-9"
              value={params.adminId || ""}
              onChange={(e) => handleFilterChange("adminId", e.target.value)}
            />
          </div>

          {/* From Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, "PPP") : "From Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => handleDateChange("from", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* To Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.to ? format(dateRange.to, "PPP") : "To Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => handleDateChange("to", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No audit entries found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant="secondary">
                        {getActionTypeLabel(entry.action_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.admin?.fullName || entry.admin_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {entry.targetUser?.fullName ||
                        entry.target_user_id?.slice(0, 8) ||
                        "—"}
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      <div className="text-xs">
                        {entry.old_value && (
                          <span className="text-red-500 line-through">
                            {formatValue(entry.old_value)}
                          </span>
                        )}
                        {entry.old_value && entry.new_value && " → "}
                        {entry.new_value && (
                          <span className="text-green-500">
                            {formatValue(entry.new_value)}
                          </span>
                        )}
                        {!entry.old_value && !entry.new_value && "—"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {entry.reason || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.ip_address}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(entry.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              Showing {entries.length} of {pagination.total} entries
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(params.limit)}
                onValueChange={(value) =>
                  setParams((prev) => ({
                    ...prev,
                    limit: parseInt(value),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
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
