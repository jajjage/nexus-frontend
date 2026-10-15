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
  role: "admin" | "staff" | "user" | "reseller" | "api_user";
}

export interface UpdateUserRequest {
  fullName?: string;
  phoneNumber?: string;
  twoFactorEnabled?: boolean;
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
  twoFactorEnabled?: boolean;
  balance: string;
  createdAt?: string;
  updatedAt?: string;
  lifecycleSegment?: UserLifecycleSegment | null;
  activatedAt?: string | null;
  lastMeaningfulActivityAt?: string | null;
  daysInactive?: number | null;
  lastReactivatedAt?: string | null;
  lifecycleHistory?: UserLifecycleTransition[];
}

export type UserLifecycleSegment =
  | "never_activated"
  | "active"
  | "at_risk"
  | "churned"
  | "dormant";

export interface UserLifecycleTransition {
  fromSegment: UserLifecycleSegment | null;
  toSegment: UserLifecycleSegment;
  transitionedAt: string;
}

export type UserLifecycleCounts = Record<UserLifecycleSegment, number>;

export interface AdminUserListResponse {
  users: AdminUser[];
  pagination: PaginationInfo;
  lifecycleCounts: UserLifecycleCounts;
  lifecycleTimezone: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UserAgent {
  type: string;
  browser: string;
  os: string;
  device: string;
  parsed?: {
    os?: { name: string; version: string };
    browser?: { name: string; version: string };
  };
}

export interface UserSession {
  id: string;
  userAgent: UserAgent;
  ipAddress?: string;
  createdAt: string;
  lastActiveAt?: string;
  expiresAt?: string;
  isCurrent?: boolean;
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
  lifecycleSegment?: UserLifecycleSegment;
}

// ============= 2FA Types =============

export interface AdminSetup2FAResponse {
  secret: string;
  qrCode: string; // data:image/png;base64,...
  backupCodes: string[];
}
