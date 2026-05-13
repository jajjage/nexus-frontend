import apiClient from "@/lib/api-client";
import {
  BillCategory,
  Biller,
  BillPayment,
  BillPaymentRequest,
  BillValidationRequest,
  BillValidationResult,
  BillVariation,
} from "@/types/bill-payment.types";
import { ApiResponse } from "@/types/api.types";

export const billPaymentService = {
  async getCategories(): Promise<ApiResponse<BillCategory[]>> {
    const response =
      await apiClient.get<ApiResponse<BillCategory[]>>("/bills/categories");
    return response.data;
  },

  async getBillers(category?: string): Promise<ApiResponse<Biller[]>> {
    const response = await apiClient.get<ApiResponse<Biller[]>>(
      "/bills/billers",
      { params: category ? { category } : undefined }
    );
    return response.data;
  },

  async getVariations(
    billerCode: string
  ): Promise<ApiResponse<BillVariation[]>> {
    const response = await apiClient.get<ApiResponse<BillVariation[]>>(
      `/bills/billers/${billerCode}/variations`
    );
    return response.data;
  },

  async validateCustomer(
    data: BillValidationRequest
  ): Promise<ApiResponse<BillValidationResult>> {
    const response = await apiClient.post<ApiResponse<BillValidationResult>>(
      "/bills/validate",
      data
    );
    return response.data;
  },

  async payBill(data: BillPaymentRequest): Promise<ApiResponse<BillPayment>> {
    const response = await apiClient.post<ApiResponse<BillPayment>>(
      "/bills/pay",
      data,
      data.idempotencyKey
        ? { headers: { "X-Idempotency-Key": data.idempotencyKey } }
        : undefined
    );
    return response.data;
  },

  async getPayment(paymentId: string): Promise<ApiResponse<BillPayment>> {
    const response = await apiClient.get<ApiResponse<BillPayment>>(
      `/bills/payments/${paymentId}`
    );
    return response.data;
  },
};
