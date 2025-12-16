"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from "@/hooks/useNotifications";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCheck,
  CheckCircle,
  Info,
  Trash2,
} from "lucide-react";
import Link from "next/link";

const typeConfig = {
  info: { icon: Info, color: "text-blue-500", bgColor: "bg-blue-50" },
  success: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
  },
  error: { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-50" },
  alert: { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-50" },
};

export default function NotificationsPage() {
  const {
    data: notificationsResponse,
    isLoading,
    refetch,
  } = useNotifications();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();

  const notifications = notificationsResponse?.data?.notifications || [];
  const unreadCount = notificationsResponse?.data?.unreadCount || 0;

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleDelete = (notificationId: string) => {
    deleteNotification(notificationId, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead(undefined, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col gap-4 p-4 pb-20">
        <Skeleton className="h-16 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col pb-20">
      {/* Header */}
      <div className="bg-background sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <header className="flex items-center gap-4">
              <Button asChild variant="outline" size="icon">
                <Link href="/dashboard">
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              {/* <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
                  {backLabel}
                </h1> */}
            </header>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-muted-foreground text-sm">
                  {unreadCount} unread notification
                  {unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="whitespace-nowrap"
            >
              <CheckCheck className="mr-2 size-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3 p-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Bell className="text-muted-foreground size-12" />
            <div>
              <h3 className="font-semibold">No notifications</h3>
              <p className="text-muted-foreground text-sm">
                You're all caught up! Check back later.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notification) => {
            const notifData = notification.notification;
            const TypeIcon =
              typeConfig[notifData.type as keyof typeof typeConfig]?.icon ||
              Info;
            const typeStyle =
              typeConfig[notifData.type as keyof typeof typeConfig] ||
              typeConfig.info;

            return (
              <Card
                key={notification.id}
                className={`overflow-hidden transition-colors ${
                  !notification.read ? "border-blue-200 bg-blue-50/30" : ""
                }`}
              >
                <div className="flex gap-4 p-4">
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeStyle.bgColor}`}
                  >
                    <TypeIcon className={`size-5 ${typeStyle.color}`} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">
                            {notifData.title}
                          </h3>
                          {!notification.read && (
                            <Badge
                              variant="secondary"
                              className="h-5 bg-blue-100 px-1.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900/20"
                            >
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {notifData.body}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 gap-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <CheckCheck className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          title="Delete"
                        >
                          <Trash2 className="text-destructive size-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <p className="text-muted-foreground mt-2 text-xs">
                      {new Date(notification.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
