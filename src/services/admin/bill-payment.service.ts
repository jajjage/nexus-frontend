import apiClient from "@/lib/api-client";
import {
  AdminBillCategory,
  AdminBiller,
  AdminBillPaymentDetail,
  AdminBillPaymentsListResponse,
  AdminBillPaymentsQueryParams,
  AdminBillVariation,
  AdminSupplierBillerMapping,
  SupplierBillerMappingPayload,
} from "@/types/admin/bill-payment.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin/bills";

export const adminBillPaymentService = {
  getPayments: async (
    params?: AdminBillPaymentsQueryParams
  ): Promise<ApiResponse<AdminBillPaymentsListResponse>> => {
    const response = await apiClient.get<
      ApiResponse<AdminBillPaymentsListResponse>
    >(`${BASE_PATH}/payments`, { params });
    return response.data;
  },

  getPayment: async (
    paymentId: string
  ): Promise<ApiResponse<AdminBillPaymentDetail>> => {
    const response = await apiClient.get<ApiResponse<AdminBillPaymentDetail>>(
      `${BASE_PATH}/payments/${paymentId}`
    );
    return response.data;
  },

  getCategories: async (): Promise<ApiResponse<AdminBillCategory[]>> => {
    const response = await apiClient.get<ApiResponse<AdminBillCategory[]>>(
      `${BASE_PATH}/categories`
    );
    return response.data;
  },

  getBillers: async (
    category?: string
  ): Promise<ApiResponse<AdminBiller[]>> => {
    const response = await apiClient.get<ApiResponse<AdminBiller[]>>(
      `${BASE_PATH}/billers`,
      { params: category ? { category } : undefined }
    );
    return response.data;
  },

  getVariations: async (
    billerIdOrCode: string
  ): Promise<ApiResponse<AdminBillVariation[]>> => {
    const response = await apiClient.get<ApiResponse<AdminBillVariation[]>>(
      `${BASE_PATH}/billers/${billerIdOrCode}/variations`
    );
    return response.data;
  },

  getSupplierMappings: async (params?: {
    supplierId?: string;
    billerId?: string;
    categoryType?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<AdminSupplierBillerMapping[]>> => {
    const response = await apiClient.get<
      ApiResponse<AdminSupplierBillerMapping[]>
    >(`${BASE_PATH}/supplier-mappings`, { params });
    return response.data;
  },

  createSupplierMapping: async (
    data: SupplierBillerMappingPayload
  ): Promise<ApiResponse<AdminSupplierBillerMapping>> => {
    const response = await apiClient.post<
      ApiResponse<AdminSupplierBillerMapping>
    >(`${BASE_PATH}/supplier-mappings`, data);
    return response.data;
  },

  updateSupplierMapping: async (
    mappingId: string,
    data: Partial<SupplierBillerMappingPayload>
  ): Promise<ApiResponse<AdminSupplierBillerMapping>> => {
    const response = await apiClient.put<
      ApiResponse<AdminSupplierBillerMapping>
    >(`${BASE_PATH}/supplier-mappings/${mappingId}`, data);
    return response.data;
  },
};
