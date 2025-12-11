"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteNotification,
  useMarkNotificationAsRead,
  useNotificationById,
} from "@/hooks/useNotifications";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Info,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

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

export default function NotificationDetailPage() {
  const params = useParams();
  const notificationId = params.notificationId as string;

  const {
    data: notificationResponse,
    isLoading,
    error,
    refetch,
  } = useNotificationById(notificationId);

  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const notification = notificationResponse?.data?.notifications?.[0];
  const notifData = notification?.notification;

  // Mark notification as read when viewing detail
  useEffect(() => {
    if (notification && !notification.read) {
      markAsRead(notificationId, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  }, [notification?.id]);

  const handleDelete = () => {
    deleteNotification(notificationId, {
      onSuccess: () => {
        // Navigate back to notifications list
        window.location.href = "/dashboard/notifications";
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col gap-4 p-4 pb-20">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !notification || !notifData) {
    return (
      <div className="flex min-h-screen w-full flex-col p-4">
        {/* Header */}
        <div className="bg-background border-b">
          <div className="flex items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/notifications">
                  <ChevronLeft className="size-5" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Notification</h1>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mt-8 flex items-center justify-center">
          <Card className="w-full max-w-md p-6 text-center">
            <AlertCircle className="mx-auto mb-4 size-12 text-red-500" />
            <h2 className="mb-2 font-semibold">Notification not found</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              The notification you're looking for doesn't exist or has been
              deleted.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/notifications">Back to Notifications</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const TypeIcon =
    typeConfig[notifData.type as keyof typeof typeConfig]?.icon || Info;
  const typeStyle =
    typeConfig[notifData.type as keyof typeof typeConfig] || typeConfig.info;

  const createdDate = new Date(notification.created_at);
  const formattedDate = createdDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = createdDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex min-h-screen w-full flex-col pb-20">
      {/* Header */}
      <div className="bg-background sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/notifications">
                <ChevronLeft className="size-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Notification</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 p-4">
        {/* Main Card */}
        <Card
          className={`overflow-hidden ${
            !notification.read ? "border-blue-200 bg-blue-50/30" : ""
          }`}
        >
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className={`rounded-lg p-2 ${typeStyle.bgColor} shrink-0`}>
                  <TypeIcon className={`size-6 ${typeStyle.color}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{notifData.title}</h2>
                  <p className="text-muted-foreground text-sm">
                    {formattedDate} at {formattedTime}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!notification.read && (
                  <Badge variant="default" className="bg-blue-500">
                    New
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`${typeStyle.color} border-current`}
                >
                  {notifData.type}
                </Badge>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-4">
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {notifData.body}
              </p>

              {/* Additional Info */}
              <div className="border-t pt-4">
                <dl className="space-y-2 text-sm">
                  {notifData.category && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground font-medium">
                        Category:
                      </dt>
                      <dd className="font-semibold">{notifData.category}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground font-medium">
                      Status:
                    </dt>
                    <dd className="font-semibold">
                      {notification.read ? "Read" : "Unread"}
                    </dd>
                  </div>
                  {notification.read_at && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground font-medium">
                        Read at:
                      </dt>
                      <dd className="font-semibold">
                        {new Date(notification.read_at).toLocaleString("en-US")}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <Link href="/dashboard/notifications">Back to Notifications</Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex-1"
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
