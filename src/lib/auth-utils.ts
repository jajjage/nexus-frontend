import { User } from "@/types/api.types";

// Define permission types
export type Permission =
  | "user:read"
  | "user:write"
  | "admin:read"
  | "admin:write"
  | "transaction:read"
  | "transaction:write"
  | "wallet:read"
  | "wallet:write"
  | string; // Allow custom permissions

// Role-based permissions mapping
const rolePermissions: Record<string, Permission[]> = {
  user: ["user:read", "user:write", "transaction:read", "wallet:read"],
  admin: [
    "user:read",
    "user:write",
    "admin:read",
    "admin:write",
    "transaction:read",
    "transaction:write",
    "wallet:read",
    "wallet:write",
  ],
  // Add more roles as needed
};

// Check if user has a specific permission
export const hasPermission = (
  user: User | null,
  permission: Permission
): boolean => {
  if (!user) return false;

  // If user has explicit permissions, check against them
  if (user.permissions && user.permissions.length > 0) {
    return user.permissions.includes(permission);
  }

  // Otherwise, check role-based permissions
  const userRole = user.role;
  const permissionsForRole = rolePermissions[userRole] || [];
  return permissionsForRole.includes(permission);
};

// Check if user has any of the required permissions
export const hasAnyPermission = (
  user: User | null,
  permissions: Permission[]
): boolean => {
  return permissions.some((permission) => hasPermission(user, permission));
};

// Check if user has all of the required permissions
export const hasAllPermissions = (
  user: User | null,
  permissions: Permission[]
): boolean => {
  return permissions.every((permission) => hasPermission(user, permission));
};

// Check user role
export const hasRole = (user: User | null, role: string): boolean => {
  return user?.role === role;
};

// Check if user is admin
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, "admin");
};

// Check if user is suspended
export const isSuspended = (user: User | null): boolean => {
  return user?.isSuspended === true;
};

// Check if user is verified
export const isVerified = (user: User | null): boolean => {
  return user?.isVerified === true;
};
