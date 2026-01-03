/**
 * Admin Supplier Markup Service
 * API methods for supplier markup management based on ADMIN_GUIDE.md
 */

import apiClient from "@/lib/api-client";
import {
  CreateSupplierMarkupRequest,
  SupplierMarkup,
  SupplierMarkupListResponse,
  SupplierMarkupQueryParams,
  UpdateSupplierMarkupRequest,
} from "@/types/admin/supplier-markup.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/supplier-markups";

export const adminSupplierMarkupService = {
  /**
   * Get all supplier markups with pagination and filtering
   */
  getMarkups: async (
    params?: SupplierMarkupQueryParams
  ): Promise<ApiResponse<SupplierMarkupListResponse>> => {
    const response = await apiClient.get<
      ApiResponse<SupplierMarkupListResponse>
    >(BASE_PATH, { params });
    return response.data;
  },

  /**
   * Get a single markup by ID
   */
  getMarkupById: async (
    markupId: string
  ): Promise<ApiResponse<SupplierMarkup>> => {
    const response = await apiClient.get<ApiResponse<SupplierMarkup>>(
      `${BASE_PATH}/${markupId}`
    );
    return response.data;
  },

  /**
   * Create a new supplier markup
   */
  createMarkup: async (
    data: CreateSupplierMarkupRequest
  ): Promise<ApiResponse<{ markup: SupplierMarkup }>> => {
    const response = await apiClient.post<
      ApiResponse<{ markup: SupplierMarkup }>
    >(BASE_PATH, data);
    return response.data;
  },

  /**
   * Update a supplier markup
   */
  updateMarkup: async (
    markupId: string,
    data: UpdateSupplierMarkupRequest
  ): Promise<ApiResponse<{ markup: SupplierMarkup }>> => {
    const response = await apiClient.put<
      ApiResponse<{ markup: SupplierMarkup }>
    >(`${BASE_PATH}/${markupId}`, data);
    return response.data;
  },

  /**
   * Delete a supplier markup
   */
  deleteMarkup: async (markupId: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.delete<ApiResponse<unknown>>(
      `${BASE_PATH}/${markupId}`
    );
    return response.data;
  },

  /**
   * Activate a supplier markup
   */
  activateMarkup: async (
    markupId: string
  ): Promise<ApiResponse<{ markup: SupplierMarkup }>> => {
    const response = await apiClient.patch<
      ApiResponse<{ markup: SupplierMarkup }>
    >(`${BASE_PATH}/${markupId}/activate`);
    return response.data;
  },

  /**
   * Deactivate a supplier markup
   */
  deactivateMarkup: async (
    markupId: string
  ): Promise<ApiResponse<{ markup: SupplierMarkup }>> => {
    const response = await apiClient.patch<
      ApiResponse<{ markup: SupplierMarkup }>
    >(`${BASE_PATH}/${markupId}/deactivate`);
    return response.data;
  },
};
