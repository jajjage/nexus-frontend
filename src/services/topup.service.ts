import apiClient from "@/lib/api-client";
import { TopupRequest, TopupResponse } from "@/types/topup.types";

export const topupService = {
  async initiateTopup(data: TopupRequest): Promise<TopupResponse> {
    // Debug: Log the complete payload being sent
    console.log("=".repeat(60));
    console.log("[TopupService] 🚀 TOPUP REQUEST DEBUG");
    console.log("=".repeat(60));
    console.log(
      "[TopupService] Full Payload:",
      JSON.stringify(
        {
          amount: data.amount,
          productCode: data.productCode,
          recipientPhone: data.recipientPhone,
          pin: data.pin ? "****" : undefined,
          verificationToken: data.verificationToken
            ? `${data.verificationToken.substring(0, 20)}...`
            : undefined,
          supplierSlug: data.supplierSlug,
          supplierMappingId: data.supplierMappingId,
          useCashback: data.useCashback,
          offerId: data.offerId,
        },
        null,
        2
      )
    );
    console.log(
      "[TopupService] Auth Method:",
      data.pin ? "PIN" : data.verificationToken ? "BIOMETRIC" : "NONE"
    );
    console.log("=".repeat(60));

    try {
      const response = await apiClient.post<TopupResponse>("/user/topup", data);
      console.log("[TopupService] ✅ API Response:", {
        status: response.status,
        success: response.data.success,
        message: response.data.message,
        transactionId: response.data.data?.transactionId,
      });
      return response.data;
    } catch (error: any) {
      console.log("[TopupService] ❌ API Error:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
      });
      throw error;
    }
  },
};
