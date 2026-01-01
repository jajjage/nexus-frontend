/**
 * Admin Dashboard Types
 * Based on ADMIN_GUIDE.md API specifications
 */

// ============= Dashboard Stats =============

export interface DashboardStats {
  totalUsers: number;
  totalTransactions: number;
  totalTopupRequests: number;
}

// ============= Failed Jobs =============

export interface FailedJob {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  error: string;
  failedAt: string;
  retries: number;
}

export interface FailedJobsResponse {
  jobs: FailedJob[];
  pagination: DashboardPagination;
}

export interface FailedJobsParams {
  page?: number;
  limit?: number;
}

// ============= Analytics Types =============

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  verifiedUsers: number;
  suspendedUsers: number;
}

export interface TransactionAnalytics {
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageAmount: number;
}

export interface TransactionTrendItem {
  date: string;
  count: number;
  amount: number;
}

export interface TransactionTrendsResponse {
  trends: TransactionTrendItem[];
}

export interface TopupAnalytics {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  failedRequests: number;
  totalAmount: number;
}

export interface WalletAnalytics {
  totalBalance: number;
  totalCredits: number;
  totalDebits: number;
  averageBalance: number;
}

// ============= System Health =============

export interface SystemHealth {
  database: ServiceStatus;
  redis: ServiceStatus;
  queue: ServiceStatus;
  uptime: number;
  memoryUsage: number;
}

export interface ServiceStatus {
  status: "healthy" | "degraded" | "down";
  latencyMs?: number;
  message?: string;
}

// ============= Audit Log =============

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail?: string;
  actionType: string;
  targetUserId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  pagination: DashboardPagination;
}

export interface AuditLogParams {
  adminId?: string;
  actionType?: string;
  targetUserId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogStats {
  totalActions: number;
  actionsByType: Record<string, number>;
  mostActiveAdmins: Array<{
    adminId: string;
    email: string;
    actionCount: number;
  }>;
}

// ============= Analytics Query Params =============

export interface DateRangeParams {
  fromDate?: string;
  toDate?: string;
}

// ============= Shared =============

export interface DashboardPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
