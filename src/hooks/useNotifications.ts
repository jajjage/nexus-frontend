import { notificationsService } from "@/services/notifications.service";
import { NotificationsResponse } from "@/types/notification.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationsKeys.all, "list"] as const,
  detail: (id: string) => [...notificationsKeys.all, "detail", id] as const,
  unreadCount: () => [...notificationsKeys.all, "unread-count"] as const,
};

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: notificationsKeys.list(),
    queryFn: () => notificationsService.getNotifications(),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    enabled,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationsKeys.unreadCount(),
    queryFn: () => notificationsService.unreadNotificationsCount(),
    staleTime: 10 * 1000, // 10 seconds - more frequent for bell icon
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}

export function useNotificationById(notificationId: string) {
  return useQuery({
    queryKey: notificationsKeys.detail(notificationId),
    queryFn: () => notificationsService.getNotificationById(notificationId),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    enabled: !!notificationId, // Only run query if notificationId is provided
  });
}

export function useMarkNotificationAsRead() {
  return useMutation<NotificationsResponse, AxiosError<any>, string>({
    mutationFn: (notificationId) =>
      notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      toast.success("Notification marked as read");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to mark notification as read";
      toast.error(errorMessage);
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  return useMutation<NotificationsResponse, AxiosError<any>>({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      toast.success("All notifications marked as read");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to mark all as read";
      toast.error(errorMessage);
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation<NotificationsResponse, AxiosError<any>, string>({
    mutationFn: (notificationId) =>
      notificationsService.deleteNotification(notificationId),
    onSuccess: () => {
      // Invalidate queries to refetch notifications
      queryClient.invalidateQueries({ queryKey: notificationsKeys.list() });
      toast.success("Notification deleted");
    },
    onError: (error) => {
      // Handle 404 errors gracefully - notification may have been deleted elsewhere
      if (error.response?.status === 404) {
        console.warn(
          "Notification not found - may have been deleted elsewhere"
        );
        // Still invalidate to refresh the list
        queryClient.invalidateQueries({ queryKey: notificationsKeys.list() });
        toast.info("Notification was already deleted");
      } else {
        const errorMessage =
          error.response?.data?.message || "Failed to delete notification";
        toast.error(errorMessage);
      }
    },
  });
}
