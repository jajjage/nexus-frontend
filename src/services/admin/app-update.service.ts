import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";

export interface AppVersionConfig {
  latestVersion: string;
  minVersion: string;
  title: string;
  subtitle: string;
  releaseNotes: string;
  iosUrl: string;
  androidUrl: string;
  updatedAt?: string;
}

const BASE_PATH = "/admin/app-version";

export const adminAppUpdateService = {
  getAppVersion: async (): Promise<ApiResponse<AppVersionConfig>> => {
    const response =
      await apiClient.get<ApiResponse<AppVersionConfig>>(BASE_PATH);
    return response.data;
  },

  updateAppVersion: async (
    data: AppVersionConfig
  ): Promise<ApiResponse<AppVersionConfig>> => {
    const response = await apiClient.put<ApiResponse<AppVersionConfig>>(
      BASE_PATH,
      data
    );
    return response.data;
  },
};
