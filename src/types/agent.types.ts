/**
 * Agent System Types
 * Defines TypeScript interfaces for agent-related data structures
 */

export interface AgentAccount {
  id: string;
  userId: string;
  agentCode: string;
  isActive: boolean;
  commissionCapType: "indefinite" | "time_limited" | "purchase_limited";
  commissionCapValue: number | null;
  commissionCapExpiresAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentStats {
  totalCustomers: number;
  activeCustomers: number;
  totalCommissionsEarned: number;
  claimedCommissionsAmount: number;
  withdrawnCommissionsAmount: number;
  availableBalanceAmount: number;
}

export interface AgentValidationResponse {
  success: boolean;
  message: string;
  data: {
    agentCode: string;
    agentUserId: string;
    isValid: boolean;
  };
}

export interface AgentCustomer {
  id: string;
  userId: string;
  agentCode: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  signupDate: string;
  lastPurchaseDate: string | null;
  totalPurchases: number;
  totalCommissionsEarned: number;
  status: "active" | "inactive";
  isActive: boolean;
  isVerified: boolean;
  isSuspended: boolean;
  profilePictureUrl: string | null;
}

export interface AgentCommission {
  id: string;
  agentId: string;
  customerId: string;
  productId: string;
  productName: string;
  transactionDate: string;
  amount: number;
  commissionType: "fixed" | "percentage";
  commissionValue: number;
  calculatedCommission: number;
  status: "pending" | "claimed" | "withdrawn";
  claimedDate: string | null;
  withdrawnDate: string | null;
}

export interface AgentProductCommissionConfig {
  id: string;
  productId?: string;
  commissionType: "fixed" | "percentage";
  commissionValue: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentProduct {
  id: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  name?: string;
  productType?: string;
  isActive?: boolean;
  commissionType?: "fixed" | "percentage";
  commissionValue?: number;
  createdAt?: string;
  updatedAt?: string;
  commissionConfig?: AgentProductCommissionConfig | null;
}

export interface Agent {
  id: string;
  userId: string;
  agentCode: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  totalCustomers: number;
  activeCustomers: number;
  totalCommissionsEarned: number;
  withdrawnCommissionsAmount: number;
  availableBalanceAmount: number;
  commissionCapType: "indefinite" | "time_limited" | "purchase_limited";
  commissionCapValue: number | null;
  commissionCapExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ActivateAgentRequest = Record<string, never>;

export interface ActivateAgentResponse {
  success: boolean;
  message: string;
  data: AgentAccount;
}

export type DeactivateAgentRequest = Record<string, never>;

export interface DeactivateAgentResponse {
  success: boolean;
  message: string;
}

export interface RegenerateCodeResponse {
  success: boolean;
  message: string;
  data: {
    agentCode: string;
  };
}

export interface WithdrawCommissionsRequest {
  amount: number;
}

export interface WithdrawCommissionsResponse {
  success: boolean;
  message: string;
  data: {
    transactionId: string;
    amount: number;
    newAvailableBalance: number;
    withdrawDate: string;
  };
}

export interface SetCommissionRequest {
  commissionType: "fixed" | "percentage";
  commissionValue: number;
}

export interface SetCommissionResponse {
  success: boolean;
  message: string;
  data: AgentProduct;
}

export interface AgentPaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
