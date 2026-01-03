/**
 * Admin Operator Types
 * Based on ADMIN_GUIDE.md Operator Management section
 */

// ============= Operator Entity =============

export interface Operator {
  id: string;
  code: string;
  name: string;
  isoCountry: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============= API Responses =============

export interface OperatorListResponse {
  operators: Operator[];
}

// ============= Request Types =============

export interface CreateOperatorRequest {
  code: string;
  name: string;
  isoCountry: string;
}

export interface UpdateOperatorRequest {
  name?: string;
  isoCountry?: string;
}
