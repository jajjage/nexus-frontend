"use client";

import { adminUserActivityService } from "@/services/admin/userActivity.service";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const adminUserActivityKeys = {
  all: (userId: string) => ["admin", "users", userId, "activity"] as const,
  overview: (userId: string) =>
    [...adminUserActivityKeys.all(userId), "overview"] as const,
  topups: (userId: string, params?: any) =>
    [...adminUserActivityKeys.all(userId), "topups", params] as const,
  paymentEvents: (userId: string, params?: any) =>
    [...adminUserActivityKeys.all(userId), "paymentEvents", params] as const,
  walletLedger: (userId: string, params?: any) =>
    [...adminUserActivityKeys.all(userId), "walletLedger", params] as const,
  snapshots: (userId: string, params?: any) =>
    [...adminUserActivityKeys.all(userId), "snapshots", params] as const,
};

export function useAdminActivityOverview(userId: string) {
  return useQuery({
    queryKey: adminUserActivityKeys.overview(userId),
    queryFn: () => adminUserActivityService.getOverview(userId),
    enabled: !!userId,
  });
}

export function useAdminUserTopups(
  userId: string,
  params?: { page?: number; perPage?: number; status?: string }
) {
  return useQuery({
    queryKey: adminUserActivityKeys.topups(userId, params),
    queryFn: () => adminUserActivityService.getTopups(userId, params),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });
}

export function useAdminUserPaymentEvents(
  userId: string,
  params?: { page?: number; perPage?: number }
) {
  return useQuery({
    queryKey: adminUserActivityKeys.paymentEvents(userId, params),
    queryFn: () => adminUserActivityService.getPaymentEvents(userId, params),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });
}

export function useAdminUserWalletLedger(
  userId: string,
  params?: { page?: number; perPage?: number; direction?: string }
) {
  return useQuery({
    queryKey: adminUserActivityKeys.walletLedger(userId, params),
    queryFn: () => adminUserActivityService.getWalletLedger(userId, params),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });
}

export function useAdminUserSnapshots(
  userId: string,
  params?: { page?: number; perPage?: number }
) {
  return useQuery({
    queryKey: adminUserActivityKeys.snapshots(userId, params),
    queryFn: () => adminUserActivityService.getSnapshots(userId, params),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });
}
