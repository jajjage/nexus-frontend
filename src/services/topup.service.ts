import apiClient from "@/lib/api-client";
import { TopupRequest, TopupResponse } from "@/types/topup.types";

export const topupService = {
  async initiateTopup(data: TopupRequest): Promise<TopupResponse> {
    const response = await apiClient.post<TopupResponse>("/user/topup", data);
    return response.data;
  },
};
