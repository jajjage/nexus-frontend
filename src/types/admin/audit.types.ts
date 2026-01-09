/**
 * Audit Log Types
 * Types for the admin audit trail feature
 */

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id: string | null;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  ip_address: string;
  metadata: Record<string, any> | null;
  created_at: string;
  // Populated relations
  admin?: {
    id: string;
    fullName: string;
    email: string;
  };
  targetUser?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface AuditLogPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuditLogListResponse {
  entries: AuditLogEntry[];
  pagination: AuditLogPagination;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  adminId?: string;
  targetUserId?: string;
  actionType?: string;
  fromDate?: string;
  toDate?: string;
}

export interface UserActionsResponse {
  userId: string;
  entries: AuditLogEntry[];
}

export const ACTION_TYPE_LABELS: Record<string, string> = {
  create_user: "User Created",
  update_user: "User Updated",
  suspend_user: "User Suspended",
  unsuspend_user: "User Unsuspended",
  credit_wallet: "Wallet Credited",
  debit_wallet: "Wallet Debited",
  assign_role: "Role Assigned",
  disable_2fa: "2FA Disabled",
  create_provider: "Provider Created",
  update_provider: "Provider Updated",
  delete_provider: "Provider Deleted",
  create_supplier: "Supplier Created",
  update_supplier: "Supplier Updated",
  create_operator: "Operator Created",
  update_operator: "Operator Updated",
  create_product: "Product Created",
  update_product: "Product Updated",
  map_product: "Product Mapped",
};

export function getActionTypeLabel(actionType: string): string {
  return (
    ACTION_TYPE_LABELS[actionType] ||
    actionType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

// User Activity Log Types (for /admin/analytics/users/:userId/activity)
export interface UserActivityLogEntry {
  id: string;
  user_id: string;
  action_type: string;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface UserActivityQueryParams {
  page?: number;
  limit?: number;
  actionType?: string;
  fromDate?: string;
  toDate?: string;
}

export interface UserActivityResponse {
  entries: UserActivityLogEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// User activity action type labels
export const USER_ACTIVITY_LABELS: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  password_change: "Password Changed",
  profile_update: "Profile Updated",
  topup_initiated: "Top-up Initiated",
  topup_completed: "Top-up Completed",
  wallet_funded: "Wallet Funded",
  pin_setup: "PIN Setup",
  pin_change: "PIN Changed",
  biometric_enabled: "Biometric Enabled",
  biometric_disabled: "Biometric Disabled",
  two_fa_enabled: "2FA Enabled",
  two_fa_disabled: "2FA Disabled",
};

export function getUserActivityLabel(actionType: string): string {
  return (
    USER_ACTIVITY_LABELS[actionType] ||
    actionType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

// ============= Recent Audit Entries Types =============

export interface RecentAuditEntriesResponse {
  entries: AuditLogEntry[];
}

// ============= Audit Statistics Types =============

export interface TopAdmin {
  adminId: string;
  adminEmail: string;
  actionCount: number;
}

export interface TopTargetUser {
  userId: string;
  userEmail: string;
  actionCount: number;
}

export interface AuditLogStatistics {
  totalActions: number;
  actionsByType: Record<string, number>;
  topAdmins: TopAdmin[];
  topTargetUsers: TopTargetUser[];
}

// ============= System Health Types =============

export interface HealthCheck {
  value: number;
  unit: string;
  status: "ok" | "warning" | "error";
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, HealthCheck>;
  recentAlerts: any[];
}
