import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Permission } from "@/lib/auth-utils";

interface PermissionGuardProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, requires all permissions; if false, requires at least one
  fallback?: ReactNode; // Component to render if user doesn't have permission
  children: ReactNode;
}

export const PermissionGuard = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  // If a single permission is provided, check that
  if (permission) {
    if (hasPermission(permission)) {
      return <>{children}</>;
    }
  }
  // If multiple permissions are provided with requireAll = true
  else if (permissions.length > 0 && requireAll) {
    if (hasAllPermissions(permissions)) {
      return <>{children}</>;
    }
  }
  // If multiple permissions are provided with requireAll = false (default)
  else if (permissions.length > 0) {
    if (hasAnyPermission(permissions)) {
      return <>{children}</>;
    }
  }
  // If no specific permissions are required, just check if user is authenticated
  else {
    return <>{children}</>;
  }

  // If no condition was met, return the fallback
  return <>{fallback}</>;
};

interface RoleGuardProps {
  roles: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export const RoleGuard = ({
  roles,
  fallback = null,
  children,
}: RoleGuardProps) => {
  const { user } = useAuth();

  if (user && roles.includes(user.role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
