/**
 * Admin Role Management Hooks
 * React Query hooks for role management
 */

"use client";

import { adminRoleService } from "@/services/admin/role.service";
import { AssignRoleRequest } from "@/types/admin/role.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Query keys for cache management
const roleKeys = {
  all: ["admin", "roles"] as const,
  list: () => [...roleKeys.all, "list"] as const,
};

/**
 * Fetch all available roles
 */
export function useAdminRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => adminRoleService.getRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Assign role to user mutation
 */
export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignRoleRequest) => adminRoleService.assignRole(data),
    onSuccess: (response) => {
      toast.success(
        response.message ||
          `Role ${response.data?.roleName} assigned successfully`
      );
      // Invalidate user queries to reflect new role
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => {
      toast.error("Failed to assign role");
    },
  });
}
