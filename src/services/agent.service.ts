/**
 * Agent Service Layer
 * Handles all API calls to agent-related endpoints
 * Three categories: Public (signup validation), User (agent management), Admin (agent management)
 */

import apiClient from "@/lib/api-client";
import type {
  ActivateAgentResponse,
  Agent,
  AgentAccount,
  AgentCommission,
  AgentCustomer,
  AgentPaginatedResponse,
  AgentProduct,
  AgentStats,
  AgentValidationResponse,
  DeactivateAgentResponse,
  RegenerateCodeResponse,
  SetCommissionRequest,
  SetCommissionResponse,
  WithdrawCommissionsRequest,
  WithdrawCommissionsResponse,
} from "@/types/agent.types";
import type { ApiResponse } from "@/types/api.types";
import axios from "axios";

type UnknownRecord = Record<string, unknown>;

function toNumber(value: unknown, fallback: number = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toString(value: unknown, fallback: string = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

function normalizeAgent(raw: UnknownRecord | null | undefined): Agent {
  return {
    id: toString(raw?.id || raw?.agent_id),
    userId: toString(raw?.userId || raw?.user_id),
    agentCode: toString(raw?.agentCode || raw?.agent_code),
    email: toString(raw?.email),
    fullName: toString(raw?.fullName || raw?.full_name),
    phoneNumber: toString(raw?.phoneNumber || raw?.phone_number),
    isActive: Boolean(raw?.isActive ?? raw?.is_active),
    totalCustomers: toNumber(raw?.totalCustomers ?? raw?.total_customers),
    activeCustomers: toNumber(raw?.activeCustomers ?? raw?.active_customers),
    totalCommissionsEarned: toNumber(
      raw?.totalCommissionsEarned ?? raw?.total_commissions_earned
    ),
    withdrawnCommissionsAmount: toNumber(
      raw?.withdrawnCommissionsAmount ?? raw?.withdrawn_commissions_amount
    ),
    availableBalanceAmount: toNumber(
      raw?.availableBalanceAmount ?? raw?.available_balance_amount
    ),
    commissionCapType: toString(
      raw?.commissionCapType || raw?.commission_cap_type,
      "indefinite"
    ),
    commissionCapValue:
      raw?.commissionCapValue ?? raw?.commission_cap_value ?? null,
    commissionCapExpiresAt:
      raw?.commissionCapExpiresAt ?? raw?.commission_cap_expires_at ?? null,
    createdAt: toString(raw?.createdAt || raw?.created_at),
    updatedAt: toString(raw?.updatedAt || raw?.updated_at),
  };
}

function normalizeAgentCustomer(
  raw: UnknownRecord | null | undefined
): AgentCustomer {
  return {
    id: toString(raw?.id || raw?.customer_id),
    userId: toString(raw?.userId || raw?.user_id),
    email: toString(raw?.email),
    fullName: toString(raw?.fullName || raw?.full_name),
    phoneNumber: toString(raw?.phoneNumber || raw?.phone_number),
    signupDate: toString(
      raw?.signupDate || raw?.signup_date || raw?.createdAt || raw?.created_at
    ),
    lastPurchaseDate: raw?.lastPurchaseDate ?? raw?.last_purchase_date ?? null,
    totalPurchases: toNumber(raw?.totalPurchases ?? raw?.total_purchases),
    totalCommissionsEarned: toNumber(
      raw?.totalCommissionsEarned ?? raw?.total_commissions_earned
    ),
    status: toString(raw?.status, "inactive"),
  };
}

function normalizeAgentCommission(
  raw: UnknownRecord | null | undefined
): AgentCommission {
  return {
    id: toString(raw?.id),
    agentId: toString(raw?.agentId || raw?.agent_id),
    customerId: toString(raw?.customerId || raw?.customer_id),
    productId: toString(raw?.productId || raw?.product_id),
    productName: toString(raw?.productName || raw?.product_name),
    transactionDate: toString(
      raw?.transactionDate ||
        raw?.transaction_date ||
        raw?.createdAt ||
        raw?.created_at
    ),
    amount: toNumber(raw?.amount),
    commissionType: toString(
      raw?.commissionType || raw?.commission_type,
      "fixed"
    ),
    commissionValue: toNumber(raw?.commissionValue ?? raw?.commission_value),
    calculatedCommission: toNumber(
      raw?.calculatedCommission ?? raw?.calculated_commission
    ),
    status: toString(raw?.status, "pending"),
    claimedDate: raw?.claimedDate ?? raw?.claimed_date ?? null,
    withdrawnDate: raw?.withdrawnDate ?? raw?.withdrawn_date ?? null,
  };
}

function unwrapApiData<T>(payload: ApiResponse<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return (payload as ApiResponse<T>).data as T;
  }

  return payload as T;
}

function extractArrayFromObject<T>(
  value: unknown,
  depth: number = 0
): T[] | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidateKeys = [
    "data",
    "agents",
    "products",
    "customers",
    "commissions",
    "items",
    "results",
    "rows",
    "records",
    "list",
    "entries",
  ] as const;

  for (const key of candidateKeys) {
    if (key in value) {
      const candidate = (value as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) {
        return candidate as T[];
      }

      if (depth < 2) {
        const nested = extractArrayFromObject<T>(candidate, depth + 1);
        if (nested) {
          return nested;
        }
      }
    }
  }

  return null;
}

function extractPaginationFromObject<T>(
  value: unknown,
  fallbackLength: number
): AgentPaginatedResponse<T>["pagination"] {
  if (value && typeof value === "object") {
    if ("pagination" in value && value.pagination) {
      return value.pagination as AgentPaginatedResponse<T>["pagination"];
    }

    const nestedKeys = ["data", "agents", "items", "results", "rows"] as const;
    for (const key of nestedKeys) {
      if (key in value) {
        const nested = extractPaginationFromObject<T>(
          (value as Record<string, unknown>)[key],
          fallbackLength
        );
        if (nested.total > 0 || fallbackLength === 0) {
          return nested;
        }
      }
    }
  }

  return {
    page: 1,
    limit: fallbackLength,
    total: fallbackLength,
    totalPages: 1,
    hasMore: false,
  };
}

function normalizePaginatedResponse<T>(
  payload:
    | ApiResponse<AgentPaginatedResponse<T> | T[]>
    | AgentPaginatedResponse<T>
    | T[]
    | {
        data?: AgentPaginatedResponse<T> | T[];
        pagination?: AgentPaginatedResponse<T>["pagination"];
      }
): AgentPaginatedResponse<T> {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray(payload.data) &&
    "pagination" in payload &&
    payload.pagination
  ) {
    return payload as AgentPaginatedResponse<T>;
  }

  const unwrapped = unwrapApiData(payload);
  const extractedArray = extractArrayFromObject<T>(unwrapped);

  if (Array.isArray(unwrapped)) {
    return {
      success: true,
      message: "ok",
      data: unwrapped,
      pagination: {
        page: 1,
        limit: unwrapped.length,
        total: unwrapped.length,
        totalPages: 1,
        hasMore: false,
      },
    };
  }

  if (extractedArray) {
    const pagination = extractPaginationFromObject<T>(
      unwrapped,
      extractedArray.length
    );

    return {
      success:
        unwrapped &&
        typeof unwrapped === "object" &&
        "success" in unwrapped &&
        typeof unwrapped.success === "boolean"
          ? unwrapped.success
          : true,
      message:
        unwrapped &&
        typeof unwrapped === "object" &&
        "message" in unwrapped &&
        typeof unwrapped.message === "string"
          ? unwrapped.message
          : "ok",
      data: extractedArray,
      pagination,
    };
  }

  if (
    unwrapped &&
    typeof unwrapped === "object" &&
    "data" in unwrapped &&
    Array.isArray(unwrapped.data)
  ) {
    return {
      success:
        "success" in unwrapped && typeof unwrapped.success === "boolean"
          ? unwrapped.success
          : true,
      message:
        "message" in unwrapped && typeof unwrapped.message === "string"
          ? unwrapped.message
          : "ok",
      data: unwrapped.data,
      pagination:
        "pagination" in unwrapped && unwrapped.pagination
          ? unwrapped.pagination
          : {
              page: 1,
              limit: unwrapped.data.length,
              total: unwrapped.data.length,
              totalPages: 1,
              hasMore: false,
            },
    };
  }

  return {
    success: true,
    message: "ok",
    data: [],
    pagination: {
      page: 1,
      limit: 0,
      total: 0,
      totalPages: 1,
      hasMore: false,
    },
  };
}

function normalizeListResponse<T>(
  payload:
    | ApiResponse<T[]>
    | T[]
    | {
        data?: T[];
        products?: T[];
      }
): T[] {
  const unwrapped = unwrapApiData(payload);
  const extractedArray = extractArrayFromObject<T>(unwrapped);

  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }

  if (extractedArray) {
    return extractedArray;
  }

  if (
    unwrapped &&
    typeof unwrapped === "object" &&
    "data" in unwrapped &&
    Array.isArray(unwrapped.data)
  ) {
    return unwrapped.data;
  }

  if (
    unwrapped &&
    typeof unwrapped === "object" &&
    "products" in unwrapped &&
    Array.isArray(unwrapped.products)
  ) {
    return unwrapped.products;
  }

  return [];
}

/**
 * PUBLIC ENDPOINTS - No authentication required
 */
export const agentPublicService = {
  /**
   * Validate agent code before signup
   * GET /api/v1/agent/code/validate?code=AGENT-ABC123
   */
  validateCode: async (code: string): Promise<AgentValidationResponse> => {
    const response = await apiClient.get<AgentValidationResponse>(
      `/agent/code/validate?code=${encodeURIComponent(code)}`
    );
    return response.data;
  },
};

/**
 * USER ENDPOINTS - Authenticated user operations
 */
export const agentUserService = {
  /**
   * Activate agent account for current user
   * POST /api/v1/dashboard/agent/account/activate
   */
  activateAgent: async (): Promise<ActivateAgentResponse> => {
    const response = await apiClient.post<ActivateAgentResponse>(
      `/dashboard/agent/account/activate`
    );
    return response.data;
  },

  /**
   * Get current user's agent account details
   * GET /api/v1/dashboard/agent/account
   */
  getAgentAccount: async (): Promise<AgentAccount | null> => {
    try {
      const response = await apiClient.get<
        ApiResponse<AgentAccount> | AgentAccount
      >(`/dashboard/agent/account`);
      return unwrapApiData(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      throw error;
    }
  },

  /**
   * Deactivate agent account for current user
   * POST /api/v1/dashboard/agent/account/deactivate
   */
  deactivateAgent: async (): Promise<DeactivateAgentResponse> => {
    const response = await apiClient.post<DeactivateAgentResponse>(
      `/dashboard/agent/account/deactivate`
    );
    return response.data;
  },

  /**
   * Regenerate agent code for current user
   * POST /api/v1/dashboard/agent/account/regenerate-code
   */
  regenerateCode: async (): Promise<RegenerateCodeResponse> => {
    const response = await apiClient.post<RegenerateCodeResponse>(
      `/dashboard/agent/account/regenerate-code`
    );
    return response.data;
  },

  /**
   * Get agent statistics (customers, commissions, etc.)
   * GET /api/v1/dashboard/agent/stats
   */
  getAgentStats: async (): Promise<AgentStats> => {
    const response = await apiClient.get<ApiResponse<AgentStats> | AgentStats>(
      `/dashboard/agent/stats`
    );
    return unwrapApiData(response.data);
  },

  /**
   * Get list of customers referred by current agent
   * GET /api/v1/dashboard/agent/customers?page=1&limit=20
   */
  getAgentCustomers: async (
    page: number = 1,
    limit: number = 20
  ): Promise<AgentPaginatedResponse<AgentCustomer>> => {
    const response = await apiClient.get<AgentPaginatedResponse<AgentCustomer>>(
      `/dashboard/agent/customers?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  /**
   * Get list of commissions earned by current agent
   * GET /api/v1/dashboard/agent/commissions?page=1&limit=20
   */
  getAgentCommissions: async (
    page: number = 1,
    limit: number = 20
  ): Promise<AgentPaginatedResponse<AgentCommission>> => {
    const response = await apiClient.get<
      AgentPaginatedResponse<AgentCommission>
    >(`/dashboard/agent/commissions?page=${page}&limit=${limit}`);
    return response.data;
  },

  /**
   * Get available balance for withdrawal
   * GET /api/v1/dashboard/agent/available-balance
   */
  getAvailableBalance: async (): Promise<{ availableBalance: number }> => {
    const response = await apiClient.get<
      ApiResponse<{ availableBalance: number }> | { availableBalance: number }
    >(`/dashboard/agent/available-balance`);
    return unwrapApiData(response.data);
  },

  /**
   * Withdraw commissions
   * POST /api/v1/dashboard/agent/withdraw
   */
  withdrawCommissions: async (
    request: WithdrawCommissionsRequest
  ): Promise<WithdrawCommissionsResponse> => {
    const response = await apiClient.post<WithdrawCommissionsResponse>(
      `/dashboard/agent/withdraw`,
      request
    );
    return response.data;
  },
};

/**
 * ADMIN ENDPOINTS - Admin-only operations
 */
export const agentAdminService = {
  /**
   * Get all products with their commission rules
   * GET /api/v1/dashboard/agent/products
   */
  getProductCommissions: async (): Promise<AgentProduct[]> => {
    const response = await apiClient.get<
      ApiResponse<AgentProduct[]> | AgentProduct[]
    >(`/dashboard/agent/products`);
    return normalizeListResponse(response.data);
  },

  /**
   * Attach commission rule to a product
   * POST /api/v1/dashboard/agent/products/:productId/commission
   */
  attachProductCommission: async (
    productId: string,
    payload: SetCommissionRequest
  ): Promise<SetCommissionResponse> => {
    const response = await apiClient.post<SetCommissionResponse>(
      `/dashboard/agent/products/${productId}/commission`,
      payload
    );
    return response.data;
  },

  /**
   * Update commission rule for a product
   * PUT /api/v1/dashboard/agent/products/:productId/commission
   */
  updateProductCommission: async (
    productId: string,
    payload: Partial<SetCommissionRequest>
  ): Promise<SetCommissionResponse> => {
    const response = await apiClient.put<SetCommissionResponse>(
      `/dashboard/agent/products/${productId}/commission`,
      payload
    );
    return response.data;
  },

  /**
   * Remove commission rule from a product
   * DELETE /api/v1/dashboard/agent/products/:productId/commission
   */
  removeProductCommission: async (
    productId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/dashboard/agent/products/${productId}/commission`);
    return response.data;
  },

  /**
   * Get list of all agents
   * GET /api/v1/dashboard/agents?page=1&limit=20
   */
  getAgents: async (
    page: number = 1,
    limit: number = 20
  ): Promise<AgentPaginatedResponse<Agent>> => {
    const response = await apiClient.get<
      | ApiResponse<AgentPaginatedResponse<Agent> | Agent[]>
      | AgentPaginatedResponse<Agent>
      | Agent[]
    >(`/dashboard/agents?page=${page}&limit=${limit}`);
    const normalized = normalizePaginatedResponse<UnknownRecord>(response.data);
    return {
      ...normalized,
      data: normalized.data.map(normalizeAgent),
    };
  },

  /**
   * Get detailed information about a specific agent
   * GET /api/v1/dashboard/agents/:agentUserId/details
   */
  getAgentDetails: async (agentUserId: string): Promise<Agent> => {
    const response = await apiClient.get<ApiResponse<Agent> | Agent>(
      `/dashboard/agents/${agentUserId}/details`
    );
    return normalizeAgent(unwrapApiData<UnknownRecord>(response.data));
  },

  /**
   * Get customers of a specific agent
   * GET /api/v1/dashboard/agents/:agentUserId/customers
   */
  getAgentCustomersAdmin: async (
    agentUserId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<AgentPaginatedResponse<AgentCustomer>> => {
    const response = await apiClient.get<
      | ApiResponse<AgentPaginatedResponse<AgentCustomer> | AgentCustomer[]>
      | AgentPaginatedResponse<AgentCustomer>
      | AgentCustomer[]
    >(`/dashboard/agents/${agentUserId}/customers?page=${page}&limit=${limit}`);
    const normalized = normalizePaginatedResponse<UnknownRecord>(response.data);
    return {
      ...normalized,
      data: normalized.data.map(normalizeAgentCustomer),
    };
  },

  /**
   * Get commissions of a specific agent
   * GET /api/v1/dashboard/agents/:agentUserId/commissions
   */
  getAgentCommissionsAdmin: async (
    agentUserId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<AgentPaginatedResponse<AgentCommission>> => {
    const response = await apiClient.get<
      | ApiResponse<AgentPaginatedResponse<AgentCommission> | AgentCommission[]>
      | AgentPaginatedResponse<AgentCommission>
      | AgentCommission[]
    >(
      `/dashboard/agents/${agentUserId}/commissions?page=${page}&limit=${limit}`
    );
    const normalized = normalizePaginatedResponse<UnknownRecord>(response.data);
    return {
      ...normalized,
      data: normalized.data.map(normalizeAgentCommission),
    };
  },

  /**
   * Disable a specific agent
   * POST /api/v1/dashboard/agents/:agentUserId/disable
   */
  disableAgent: async (
    agentUserId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>(`/dashboard/agents/${agentUserId}/disable`);
    return response.data;
  },

  /**
   * Enable a specific agent
   * POST /api/v1/dashboard/agents/:agentUserId/enable
   */
  enableAgent: async (
    agentUserId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>(`/dashboard/agents/${agentUserId}/enable`);
    return response.data;
  },
};

/**
 * Unified export - use these namespaced services in your app
 */
export const agentService = {
  public: agentPublicService,
  user: agentUserService,
  admin: agentAdminService,
};
