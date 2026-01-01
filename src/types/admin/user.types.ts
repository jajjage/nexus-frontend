/**
 * Admin User Management Types
 * Based on ADMIN_GUIDE.md API specifications
 */

// ============= Request Types =============

export interface CreateUserRequest {
  email: string;
  password: string;
  phoneNumber: string;
  fullName: string;
  role: "admin" | "staff" | "user";
}

export interface UpdateUserRequest {
  fullName?: string;
  phoneNumber?: string;
}

export interface WalletTransactionRequest {
  amount: number;
}

// ============= Response Types =============

export interface AdminUser {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  isVerified: boolean;
  isSuspended: boolean;
  balance: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UserSession {
  id: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: string;
  lastActiveAt?: string;
}

export interface UserSessionsResponse {
  sessions: UserSession[];
}

// ============= Query Params =============

export interface AdminUserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: "active" | "suspended";
}
