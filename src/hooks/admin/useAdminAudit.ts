/**
 * Admin Audit Hooks
 * React Query hooks for audit log management
 */

import { adminAuditService } from "@/services/admin/audit.service";
import {
  AuditLogQueryParams,
  UserActivityQueryParams,
} from "@/types/admin/audit.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const auditKeys = {
  all: ["admin", "audit"] as const,
  logs: () => [...auditKeys.all, "logs"] as const,
  logList: (params: AuditLogQueryParams) =>
    [...auditKeys.logs(), params] as const,
  recentLogs: (minutes: number) =>
    [...auditKeys.all, "recent", minutes] as const,
  statistics: () => [...auditKeys.all, "statistics"] as const,
  systemHealth: () => [...auditKeys.all, "system-health"] as const,
  userActions: (userId: string) =>
    [...auditKeys.all, "user-actions", userId] as const,
  userActivity: (userId: string, params: UserActivityQueryParams) =>
    [...auditKeys.all, "user-activity", userId, params] as const,
};

/**
 * Hook to fetch paginated audit logs
 */
export function useAuditLogs(params: AuditLogQueryParams = {}) {
  return useQuery({
    queryKey: auditKeys.logList(params),
    queryFn: () => adminAuditService.getAuditLogs(params),
    select: (response) => response.data,
  });
}

/**
 * Hook to fetch recent audit log entries
 */
export function useRecentAuditLogs(minutes: number = 60) {
  return useQuery({
    queryKey: auditKeys.recentLogs(minutes),
    queryFn: () => adminAuditService.getRecentAuditLogs(minutes),
    select: (response) => response.data,
  });
}

/**
 * Hook to fetch audit log statistics
 */
export function useAuditLogStatistics() {
  return useQuery({
    queryKey: auditKeys.statistics(),
    queryFn: () => adminAuditService.getAuditLogStatistics(),
    select: (response) => response.data,
  });
}

/**
 * Hook to fetch system health status
 */
export function useSystemHealth() {
  return useQuery({
    queryKey: auditKeys.systemHealth(),
    queryFn: () => adminAuditService.getSystemHealth(),
    select: (response) => response.data,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

/**
 * Hook to fetch actions on a specific user (admin actions targeting user)
 */
export function useUserActions(userId: string) {
  return useQuery({
    queryKey: auditKeys.userActions(userId),
    queryFn: () => adminAuditService.getUserActions(userId),
    enabled: !!userId,
    select: (response) => response.data,
  });
}

/**
 * Hook to fetch a user's own activity log
 */
export function useUserActivity(
  userId: string,
  params: UserActivityQueryParams = {}
) {
  return useQuery({
    queryKey: auditKeys.userActivity(userId, params),
    queryFn: () => adminAuditService.getUserActivity(userId, params),
    enabled: !!userId,
    select: (response) => response.data,
  });
}

/**
 * Hook to export audit logs
 */
export function useExportAuditLogs() {
  return useMutation({
    mutationFn: async (params: AuditLogQueryParams) => {
      const blob = await adminAuditService.exportAuditLogs(params);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `audit-log-${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    },
    onSuccess: () => {
      toast.success("Audit log exported successfully");
    },
    onError: () => {
      toast.error("Failed to export audit log");
    },
  });
}
