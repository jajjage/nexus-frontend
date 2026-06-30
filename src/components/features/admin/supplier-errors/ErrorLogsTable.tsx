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
import { useAdminSupplierErrors } from "@/hooks/admin/useAdminSupplierErrors";
import {
  SupplierErrorsQueryParams,
  SupplierErrorLog,
} from "@/types/admin/supplierErrors.types";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileWarning,
  RefreshCw,
  Search,
  Eye,
  Server,
  Cpu,
  Database,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ErrorDetailDialog } from "./ErrorDetailDialog";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZES = [10, 25, 50, 100];

export function ErrorLogsTable() {
  const [params, setParams] = useState<SupplierErrorsQueryParams>({
    page: 1,
    limit: 25,
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchInput = useDebounce(searchInput, 500);

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const [selectedLog, setSelectedLog] = useState<SupplierErrorLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useAdminSupplierErrors(params);

  const entries = data?.entries || [];
  const pagination = data?.pagination;

  // Search filter implementation (local search for now, or can be extended)
  // Let's filter local entries if debounced search is active
  const filteredEntries = entries.filter((entry) => {
    if (!debouncedSearchInput) return true;
    const search = debouncedSearchInput.toLowerCase();
    return (
      entry.supplier_slug.toLowerCase().includes(search) ||
      entry.raw_message.toLowerCase().includes(search) ||
      entry.user_friendly_message.toLowerCase().includes(search) ||
      entry.layman_explanation.toLowerCase().includes(search) ||
      (entry.metadata?.phone && String(entry.metadata.phone).includes(search))
    );
  });

  const handleFilterChange = (
    key: keyof SupplierErrorsQueryParams,
    value: string
  ) => {
    setParams((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value || undefined,
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

  const handlePageSizeChange = (newSize: string) => {
    setParams((prev) => ({ ...prev, limit: parseInt(newSize, 10), page: 1 }));
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "infrastructure":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300";
      case "supplier_resource":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300";
      case "business_logic":
      default:
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "infrastructure":
        return <Server className="mr-1 h-3 w-3" />;
      case "supplier_resource":
        return <Database className="mr-1 h-3 w-3" />;
      case "business_logic":
      default:
        return <Cpu className="mr-1 h-3 w-3" />;
    }
  };

  const getStatusBadgeColor = (code?: number | null) => {
    if (!code)
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    if (code >= 500)
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (code >= 400)
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  };

  const viewDetails = (log: SupplierErrorLog) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="text-destructive h-5 w-5" />
              Supplier Failure Logs
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Search raw logs, numbers..."
                className="pl-8"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Supplier select */}
            <Select
              value={params.supplierSlug || ""}
              onValueChange={(value) =>
                handleFilterChange("supplierSlug", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                <SelectItem value="smeplug">SMEPlug</SelectItem>
                <SelectItem value="giftbills">GiftBills</SelectItem>
                <SelectItem value="vtpass">VTPass</SelectItem>
                <SelectItem value="alrahuz">Al-Rahuz</SelectItem>
                <SelectItem value="mssdatasub">MssDataSub</SelectItem>
              </SelectContent>
            </Select>

            {/* Error Type select */}
            <Select
              value={params.errorType || ""}
              onValueChange={(value) => handleFilterChange("errorType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Error Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Error Types</SelectItem>
                <SelectItem value="infrastructure">
                  Infrastructure (Timeout/Offline)
                </SelectItem>
                <SelectItem value="supplier_resource">
                  Supplier Resource (No SIM)
                </SelectItem>
                <SelectItem value="business_logic">
                  Business Logic (Bad Request)
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Date ranges */}
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start px-2 text-left text-xs font-normal"
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {dateRange.from
                      ? format(dateRange.from, "MMM d, yyyy")
                      : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => handleDateChange("from", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start px-2 text-left text-xs font-normal"
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {dateRange.to
                      ? format(dateRange.to, "MMM d, yyyy")
                      : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => handleDateChange("to", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Error Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Explanation</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-60" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-8 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No supplier failure logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((log) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => viewDetails(log)}
                    >
                      <TableCell className="text-xs">
                        {format(
                          new Date(log.created_at),
                          "yyyy-MM-dd HH:mm:ss"
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-semibold capitalize">
                        {log.supplier_slug}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getTypeBadgeColor(log.error_type)}
                        >
                          <span className="flex items-center">
                            {getTypeIcon(log.error_type)}
                          </span>
                          {log.error_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(log.status_code)}>
                          {log.status_code || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground max-w-[280px] truncate text-xs"
                        title={log.layman_explanation}
                      >
                        {log.layman_explanation}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.metadata?.phone ? (
                          <div className="flex flex-col">
                            <span>Phone: {log.metadata.phone}</span>
                            {log.metadata.productCode && (
                              <span className="text-muted-foreground text-[10px]">
                                Plan: {log.metadata.productCode}
                              </span>
                            )}
                          </div>
                        ) : log.metadata?.billerCode ? (
                          <div className="flex flex-col">
                            <span>Biller: {log.metadata.billerCode}</span>
                            {log.metadata.amount && (
                              <span className="text-muted-foreground text-[10px]">
                                Amount: ₦{log.metadata.amount}
                              </span>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewDetails(log)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <span>Show</span>
                <Select
                  value={String(params.limit)}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={String(params.limit)} />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>entries</span>
                <span className="ml-4">
                  Showing {(params.page! - 1) * params.limit! + 1} to{" "}
                  {Math.min(params.page! * params.limit!, pagination.total)} of{" "}
                  {pagination.total} entries
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(params.page! - 1)}
                  disabled={params.page === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show current page, and up to 2 pages around it
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    Math.abs(pageNum - params.page!) <= 1
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          params.page === pageNum ? "default" : "outline"
                        }
                        className="h-8 w-8"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  if (pageNum === 2 || pageNum === pagination.totalPages - 1) {
                    return (
                      <span
                        key={pageNum}
                        className="text-muted-foreground px-1"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(params.page! + 1)}
                  disabled={params.page === pagination.totalPages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ErrorDetailDialog
        errorLog={selectedLog}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
