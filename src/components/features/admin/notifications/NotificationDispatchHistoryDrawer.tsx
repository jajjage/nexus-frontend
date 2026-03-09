"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNotificationDispatches } from "@/hooks/admin/useAdminNotifications";
import { NotificationDispatchStatus } from "@/types/admin/notification.types";
import { format } from "date-fns";
import { useState } from "react";

interface NotificationDispatchHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificationId: string | null;
}

const PAGE_SIZE = 50;

const statusBadgeClass: Record<NotificationDispatchStatus, string> = {
  queued: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  processing:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  retrying:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  sent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  cancelled:
    "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "PPpp");
};

export function NotificationDispatchHistoryDrawer({
  open,
  onOpenChange,
  notificationId,
}: NotificationDispatchHistoryDrawerProps) {
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data, isLoading, isFetching, isError, refetch } =
    useNotificationDispatches(notificationId || "", {
      limit,
      offset: 0,
    });

  const items = data?.data?.dispatches ?? [];
  const hasMore = (() => {
    if (data?.data?.hasMore !== undefined) return data.data.hasMore;
    if (typeof data?.data?.total === "number") {
      return items.length < data.data.total;
    }
    return items.length >= limit;
  })();

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setLimit(PAGE_SIZE);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Dispatch History</SheetTitle>
          <SheetDescription>
            Delivery attempts for this notification (initial, resend, and legacy).
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4">
          {isLoading && items.length === 0 ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="space-y-3 rounded-md border p-4">
              <p className="text-sm">Failed to load dispatch history.</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-md border p-6 text-center text-sm">
              No dispatches yet.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Last Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((dispatch) => (
                      <TableRow key={dispatch.id}>
                        <TableCell className="capitalize">
                          {dispatch.trigger}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass[dispatch.status]}>
                            {dispatch.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(dispatch.scheduledFor)}</TableCell>
                        <TableCell>{formatDateTime(dispatch.sentAt)}</TableCell>
                        <TableCell>
                          {dispatch.attempts}/{dispatch.maxAttempts}
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate">
                          {dispatch.lastError || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  {items.length} dispatch{items.length === 1 ? "" : "es"} loaded
                </p>
                {hasMore ? (
                  <Button
                    variant="outline"
                    onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
                    disabled={isFetching}
                  >
                    {isFetching ? "Loading..." : "Load more"}
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
