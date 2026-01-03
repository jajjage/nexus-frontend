/**
 * Admin Biometric Types
 * Based on ADMIN_GUIDE.md and API responses
 */

// ============= Biometric Stats =============

export interface BiometricStats {
  hoursBack: number;
  period_start: string;
  period_end: string;
  totalEnrollments?: number;
  totalVerifications?: number;
  successfulVerifications?: number;
  failedVerifications?: number;
  successRate?: number;
}

// ============= Audit Log =============

export interface BiometricAuditLogEntry {
  id: string;
  userId: string;
  action: string;
  status: "success" | "failure" | "pending";
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface BiometricAuditLogResponse {
  userId: string;
  logs: BiometricAuditLogEntry[];
  count: number;
}

// ============= Enrollments =============

export interface ActiveBiometricEnrollment {
  id: string;
  user_id: string;
  device_name: string | null;
  platform: string | null;
  browser: string | null;
  authenticator_attachment: string;
  user_verified: boolean;
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
  enrolled_at: string;
  enrollment_ip_address: string | null;
  enrollment_user_agent: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  created_at: string;
  updated_at: string;
  user_email: string;
  user_full_name: string;
}

export interface BiometricEnrollment {
  id: string;
  userId: string;
  type: string;
  deviceId?: string;
  deviceName?: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export interface BiometricEnrollmentsResponse {
  userId: string;
  enrollments: BiometricEnrollment[];
  count: number;
  active_count: number;
}

// ============= Active Enrollments List =============

export interface ActiveEnrollmentsPagination {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ActiveEnrollmentsListResponse {
  enrollments: ActiveBiometricEnrollment[];
  pagination: ActiveEnrollmentsPagination;
}

// ============= Revoke Response =============

export interface RevokeAllResponse {
  userId: string;
  revokedCount: number;
}

export interface RevokeEnrollmentResponse {
  id: string;
  revoked: boolean;
}

// ============= Query Parameters =============

export interface BiometricStatsParams {
  hoursBack?: number;
}

export interface BiometricAuditLogParams {
  limit?: number;
  offset?: number;
}

export interface ActiveEnrollmentsParams {
  limit?: number;
  offset?: number;
}
