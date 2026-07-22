import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";

export interface AdminActivityOverview {
  currentWalletBalance: number;
  todaySnapshot: any;
  sevenDayTotals: {
    topupsCount: number;
    topupsAmount: number;
    paymentEventsCount: number;
    paymentEventsAmount: number;
  };
  lifetimeTotals: {
    topupsCount: number;
    topupsAmount: number;
    paymentEventsCount: number;
    paymentEventsAmount: number;
  };
  latestTopups: any[];
  latestPaymentEvents: any[];
}

export const adminUserActivityService = {
  getOverview: async (
    userId: string
  ): Promise<ApiResponse<AdminActivityOverview>> => {
    const response = await apiClient.get(
      `/admin/users/${userId}/activity/overview`
    );
    return response.data;
  },

  getTopups: async (
    userId: string,
    params?: { page?: number; perPage?: number; status?: string }
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(
      `/admin/users/${userId}/activity/topups`,
      { params }
    );
    return response.data;
  },

  getPaymentEvents: async (
    userId: string,
    params?: { page?: number; perPage?: number }
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(
      `/admin/users/${userId}/activity/payment-events`,
      { params }
    );
    return response.data;
  },

  getWalletLedger: async (
    userId: string,
    params?: { page?: number; perPage?: number; direction?: string }
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(
      `/admin/users/${userId}/activity/wallet-ledger`,
      { params }
    );
    return response.data;
  },

  getSnapshots: async (
    userId: string,
    params?: { page?: number; perPage?: number }
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(
      `/admin/users/${userId}/activity/snapshots`,
      { params }
    );
    return response.data;
  },
};
