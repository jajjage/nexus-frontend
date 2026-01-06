/**
 * Admin Provider Service
 * API methods for payment provider management
 */

import apiClient from "@/lib/api-client";
import {
  CreateProviderRequest,
  Provider,
  ProviderListResponse,
  UpdateProviderRequest,
} from "@/types/admin/provider.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/providers";

export const adminProviderService = {
  /**
   * Get all providers
   * GET /api/v1/admin/providers
   */
  getProviders: async (): Promise<ApiResponse<ProviderListResponse>> => {
    const response =
      await apiClient.get<ApiResponse<ProviderListResponse>>(BASE_PATH);
    return response.data;
  },

  /**
   * Get a single provider by ID
   * GET /api/v1/admin/providers/:providerId
   */
  getProviderById: async (
    providerId: string
  ): Promise<ApiResponse<Provider>> => {
    const response = await apiClient.get<ApiResponse<Provider>>(
      `${BASE_PATH}/${providerId}`
    );
    return response.data;
  },

  /**
   * Create a new provider
   * POST /api/v1/admin/providers
   */
  createProvider: async (
    data: CreateProviderRequest
  ): Promise<ApiResponse<{ provider: Provider }>> => {
    const response = await apiClient.post<ApiResponse<{ provider: Provider }>>(
      BASE_PATH,
      data
    );
    return response.data;
  },

  /**
   * Update a provider
   * PUT /api/v1/admin/providers/:providerId
   */
  updateProvider: async (
    providerId: string,
    data: UpdateProviderRequest
  ): Promise<ApiResponse<{ provider: Provider }>> => {
    const response = await apiClient.put<ApiResponse<{ provider: Provider }>>(
      `${BASE_PATH}/${providerId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a provider
   * DELETE /api/v1/admin/providers/:providerId
   */
  deleteProvider: async (
    providerId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `${BASE_PATH}/${providerId}`
    );
    return response.data;
  },
};
