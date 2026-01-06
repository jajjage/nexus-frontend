"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useUserActivity } from "@/hooks/admin/useAdminAudit";
import {
  getUserActivityLabel,
  USER_ACTIVITY_LABELS,
  UserActivityQueryParams,
} from "@/types/admin/audit.types";
import { format } from "date-fns";
import {
  Activity,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface UserActivityTableProps {
  userId: string;
}

const PAGE_SIZES = [10, 25, 50];

export function UserActivityTable({ userId }: UserActivityTableProps) {
  const [params, setParams] = useState<UserActivityQueryParams>({
    page: 1,
    limit: 10,
  });
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const { data, isLoading, refetch } = useUserActivity(userId, params);

  const entries = data?.entries || [];
  const pagination = data?.pagination;

  const handleFilterChange = (
    key: keyof UserActivityQueryParams,
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

  // Parse user agent to extract readable device info
  const parseUserAgent = (ua: string | null): string => {
    if (!ua) return "—";
    // Simple parsing - extract browser name
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return ua.slice(0, 20) + "...";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            User Activity
          </CardTitle>
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
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Action Type Filter */}
          <Select
            value={params.actionType || ""}
            onValueChange={(value) => handleFilterChange("actionType", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              {Object.entries(USER_ACTIVITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* From Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[150px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, "PP") : "From"}
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
                className="w-[150px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.to ? format(dateRange.to, "PP") : "To"}
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
                <TableHead>Activity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <p className="text-muted-foreground">No activity found</p>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant="secondary">
                        {getUserActivityLabel(entry.action_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {entry.description || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {parseUserAgent(entry.user_agent)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.ip_address || "—"}
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
              Showing {entries.length} of {pagination.total}
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
                <SelectTrigger className="w-[70px]">
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
                {pagination.page} / {pagination.pages}
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
