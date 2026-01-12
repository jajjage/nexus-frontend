"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminNotification,
  useNotificationAnalytics,
} from "@/hooks/admin/useAdminNotifications";
import { NotificationType } from "@/types/admin/notification.types";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle,
  Info,
  MousePointerClick,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const typeIcons: Record<NotificationType, React.ReactNode> = {
  info: <Info className="h-5 w-5 text-blue-500" />,
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  alert: <Bell className="h-5 w-5 text-purple-500" />,
};

const typeColors: Record<NotificationType, string> = {
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  success:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  warning:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  alert:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

/**
 * Notification Detail Page
 * Route: /admin/dashboard/notifications/[id]
 */
export default function NotificationDetailPage() {
  const params = useParams();
  const notificationId = params.id as string;

  const { data, isLoading, isError } = useAdminNotification(notificationId);
  const { data: analyticsData, isLoading: isAnalyticsLoading } =
    useNotificationAnalytics(notificationId);

  const notification = data?.data?.notification;
  const analytics = analyticsData?.data;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError || !notification) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Notification not found or failed to load.
            </p>
            <Button asChild variant="outline">
              <Link href="/admin/dashboard/notifications">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Notifications
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const publishDate = notification.publish_at || notification.publishAt;
  const createdDate = notification.created_at || notification.createdAt;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/dashboard/notifications">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Notification Details</h1>
          <p className="text-muted-foreground text-sm">ID: {notification.id}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notification Content Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {typeIcons[notification.type]}
                <div>
                  <CardTitle className="text-xl">
                    {notification.title}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <Badge className={typeColors[notification.type]}>
                      {notification.type.charAt(0).toUpperCase() +
                        notification.type.slice(1)}
                    </Badge>
                    {notification.category && (
                      <Badge variant="outline">{notification.category}</Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div>
                {notification.sent ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Sent
                  </Badge>
                ) : publishDate ? (
                  <Badge variant="secondary">
                    <Calendar className="mr-1 h-3 w-3" />
                    Scheduled
                  </Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Body */}
            <div>
              <h3 className="text-muted-foreground mb-2 text-sm font-medium">
                Message Body
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="whitespace-pre-wrap">{notification.body}</p>
              </div>
            </div>

            {/* Target Criteria */}
            {(notification.target || notification.targetCriteria) && (
              <div>
                <h3 className="text-muted-foreground mb-2 text-sm font-medium">
                  Target Criteria
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="overflow-x-auto text-sm">
                    {JSON.stringify(
                      notification.target || notification.targetCriteria,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              {createdDate && (
                <div>
                  <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                    Created At
                  </h3>
                  <p className="text-sm">
                    {format(new Date(createdDate), "PPpp")}
                  </p>
                </div>
              )}
              {publishDate && (
                <div>
                  <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                    {notification.sent ? "Sent At" : "Scheduled For"}
                  </h3>
                  <p className="text-sm">
                    {format(new Date(publishDate), "PPpp")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analytics</CardTitle>
            <CardDescription>Delivery and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyticsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : analytics ? (
              <div className="space-y-4">
                {/* Sent */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Send className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total Sent</p>
                    <p className="text-xl font-bold">
                      {analytics.totalSent?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                {/* Delivered */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs">Delivered</p>
                    <p className="text-xl font-bold">
                      {analytics.totalDelivered?.toLocaleString() || 0}
                    </p>
                  </div>
                  {analytics.deliveryRate !== undefined && (
                    <Badge variant="secondary">
                      {(analytics.deliveryRate * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>

                {/* Read */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs">Read</p>
                    <p className="text-xl font-bold">
                      {analytics.totalRead?.toLocaleString() || 0}
                    </p>
                  </div>
                  {analytics.readRate !== undefined && (
                    <Badge variant="secondary">
                      {(analytics.readRate * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>

                {/* Clicked */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <MousePointerClick className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs">Clicked</p>
                    <p className="text-xl font-bold">
                      {analytics.totalClicked?.toLocaleString() || 0}
                    </p>
                  </div>
                  {analytics.clickRate !== undefined && (
                    <Badge variant="secondary">
                      {(analytics.clickRate * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No analytics available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground text-sm">Notification ID</dt>
              <dd className="font-mono text-sm">{notification.id}</dd>
            </div>
            {notification.created_by && (
              <div>
                <dt className="text-muted-foreground text-sm">Created By</dt>
                <dd className="font-mono text-sm">{notification.created_by}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground text-sm">Archived</dt>
              <dd>
                {notification.archived || notification.isArchived ? (
                  <Badge variant="secondary">Yes</Badge>
                ) : (
                  <Badge variant="outline">No</Badge>
                )}
              </dd>
            </div>
            {notification.updatedAt && (
              <div>
                <dt className="text-muted-foreground text-sm">Last Updated</dt>
                <dd className="text-sm">
                  {format(new Date(notification.updatedAt), "PPp")}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
