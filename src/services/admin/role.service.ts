/**
 * Admin Role Management Service
 * API methods for role management
 */

import apiClient from "@/lib/api-client";
import {
  AssignRoleRequest,
  AssignRoleResponse,
  RolesListResponse,
} from "@/types/admin/role.types";
import { ApiResponse } from "@/types/api.types";

const BASE_PATH = "/admin";

export const adminRoleService = {
  /**
   * Get all available roles
   */
  getRoles: async (): Promise<ApiResponse<RolesListResponse>> => {
    const response = await apiClient.get<ApiResponse<RolesListResponse>>(
      `${BASE_PATH}/roles`
    );
    return response.data;
  },

  /**
   * Assign a role to a user
   */
  assignRole: async (
    data: AssignRoleRequest
  ): Promise<ApiResponse<AssignRoleResponse>> => {
    const response = await apiClient.post<ApiResponse<AssignRoleResponse>>(
      `${BASE_PATH}/assign-role`,
      data
    );
    return response.data;
  },
};
