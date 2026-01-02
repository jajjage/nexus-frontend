/**
 * Admin Role Management Types
 * Based on ADMIN_GUIDE.md Role Management section
 */

// ============= Role Types =============

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RolesListResponse {
  roles: Role[];
}

// ============= Request Types =============

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
}

export interface AssignRoleResponse {
  userId: string;
  roleId: string;
  roleName: string;
}
