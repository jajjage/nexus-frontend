/**
 * Admin Biometric Management Hooks
 * React Query hooks for biometric stats, active list, audit logs, enrollments, and revocation
 */

"use client";

import { adminBiometricService } from "@/services/admin/biometric.service";
import {
  ActiveEnrollmentsParams,
  BiometricAuditLogParams,
  BiometricStatsParams,
} from "@/types/admin/biometric.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// Query keys for cache management
export const biometricKeys = {
  all: ["admin", "biometric"] as const,
  stats: (params?: BiometricStatsParams) =>
    [...biometricKeys.all, "stats", params] as const,
  activeList: (params?: ActiveEnrollmentsParams) =>
    [...biometricKeys.all, "active-list", params] as const,
  auditLog: (userId: string, params?: BiometricAuditLogParams) =>
    [...biometricKeys.all, "audit-log", userId, params] as const,
  enrollments: (userId: string) =>
    [...biometricKeys.all, "enrollments", userId] as const,
};

/**
 * Fetch biometric system statistics
 */
export function useBiometricStats(params?: BiometricStatsParams) {
  return useQuery({
    queryKey: biometricKeys.stats(params),
    queryFn: () => adminBiometricService.getStats(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Fetch all active biometric enrollments
 */
export function useActiveEnrollments(params?: ActiveEnrollmentsParams) {
  return useQuery({
    queryKey: biometricKeys.activeList(params),
    queryFn: () => adminBiometricService.getActiveList(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Fetch biometric audit log for a specific user
 */
export function useBiometricAuditLog(
  userId: string,
  params?: BiometricAuditLogParams
) {
  return useQuery({
    queryKey: biometricKeys.auditLog(userId, params),
    queryFn: () => adminBiometricService.getAuditLog(userId, params),
    enabled: !!userId,
  });
}

/**
 * Fetch biometric enrollments for a specific user
 */
export function useBiometricEnrollments(userId: string) {
  return useQuery({
    queryKey: biometricKeys.enrollments(userId),
    queryFn: () => adminBiometricService.getEnrollments(userId),
    enabled: !!userId,
  });
}

/**
 * Revoke a specific biometric enrollment
 */
export function useRevokeEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      reason,
    }: {
      enrollmentId: string;
      reason?: string;
    }) => adminBiometricService.revokeEnrollment(enrollmentId, reason),
    onSuccess: (response) => {
      toast.success(response.message || "Enrollment revoked successfully");
      queryClient.invalidateQueries({ queryKey: biometricKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message || "Failed to revoke enrollment"
      );
    },
  });
}

/**
 * Revoke all biometric enrollments for a user
 */
export function useRevokeAllBiometrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminBiometricService.revokeAll(userId),
    onSuccess: (response, userId) => {
      toast.success(
        response.message ||
          `Revoked ${response.data?.revokedCount || 0} biometric enrollments`
      );
      queryClient.invalidateQueries({
        queryKey: biometricKeys.enrollments(userId),
      });
      queryClient.invalidateQueries({ queryKey: biometricKeys.all });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to revoke biometric enrollments"
      );
    },
  });
}
