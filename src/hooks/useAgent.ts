/**
 * Agent Hooks - React Query integration for agent operations
 * Handles queries and mutations for agent feature
 */

import {
  agentAdminService,
  agentPublicService,
  agentUserService,
} from "@/services/agent.service";
import type {
  AgentAccount,
  SetCommissionRequest,
  WithdrawCommissionsRequest,
} from "@/types/agent.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Query Key Factory for agent operations
 * Ensures consistent query key management across the app
 */
export const agentKeys = {
  all: ["agent"],
  account: () => [...agentKeys.all, "account"],
  stats: () => [...agentKeys.all, "stats"],
  customers: (
    page: number,
    limit: number,
    searchQuery?: string,
    isActive?: boolean
  ) => [...agentKeys.all, "customers", page, limit, searchQuery, isActive],
  commissions: (page: number, limit: number) => [
    ...agentKeys.all,
    "commissions",
    page,
    limit,
  ],
  balance: () => [...agentKeys.all, "balance"],
  products: () => [...agentKeys.all, "products"],
  agents: (page: number, limit: number) => [
    ...agentKeys.all,
    "agents",
    page,
    limit,
  ],
  agentsList: () => [...agentKeys.all, "agents"],
  agent: (agentUserId: string) => [...agentKeys.all, "agent", agentUserId],
  agentCustomers: (
    agentUserId: string,
    page: number,
    limit: number,
    searchQuery?: string,
    isActive?: boolean
  ) => [
    ...agentKeys.all,
    "agent",
    agentUserId,
    "customers",
    page,
    limit,
    searchQuery,
    isActive,
  ],
  agentCommissions: (agentUserId: string, page: number, limit: number) => [
    ...agentKeys.all,
    "agent",
    agentUserId,
    "commissions",
    page,
    limit,
  ],
};

/**
 * PUBLIC HOOKS
 */

/**
 * Validate agent code before signup
 */
export function useValidateAgentCode() {
  return useMutation({
    mutationFn: (code: string) => agentPublicService.validateCode(code),
  });
}

/**
 * USER HOOKS
 */

/**
 * Get current user's agent account details
 */
export function useAgentAccount() {
  return useQuery({
    queryKey: agentKeys.account(),
    queryFn: () => agentUserService.getAgentAccount(),
  });
}

/**
 * Get agent statistics
 */
export function useAgentStats(enabled: boolean = true) {
  return useQuery({
    queryKey: agentKeys.stats(),
    queryFn: () => agentUserService.getAgentStats(),
    enabled,
  });
}

/**
 * Get agent customers with pagination
 */
export function useAgentCustomers(
  page: number = 1,
  limit: number = 20,
  enabled: boolean = true,
  searchQuery?: string,
  isActive?: boolean
) {
  return useQuery({
    queryKey: agentKeys.customers(page, limit, searchQuery, isActive),
    queryFn: () =>
      agentUserService.getAgentCustomers(page, limit, searchQuery, isActive),
    enabled,
  });
}

/**
 * Get agent commissions with pagination
 */
export function useAgentCommissions(
  page: number = 1,
  limit: number = 20,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: agentKeys.commissions(page, limit),
    queryFn: () => agentUserService.getAgentCommissions(page, limit),
    enabled,
  });
}

/**
 * Get available balance for withdrawal
 */
export function useAvailableBalance(enabled: boolean = true) {
  return useQuery({
    queryKey: agentKeys.balance(),
    queryFn: () => agentUserService.getAvailableBalance(),
    enabled,
  });
}

/**
 * Activate agent account
 */
export function useActivateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => agentUserService.activateAgent(),
    onSuccess: (response) => {
      queryClient.setQueryData(agentKeys.account(), response.data);
      queryClient.invalidateQueries({ queryKey: agentKeys.account() });
      queryClient.invalidateQueries({ queryKey: agentKeys.stats() });
    },
  });
}

/**
 * Deactivate agent account
 */
export function useDeactivateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => agentUserService.deactivateAgent(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.account() });
      queryClient.invalidateQueries({ queryKey: agentKeys.stats() });
    },
  });
}

/**
 * Regenerate agent code
 */
export function useRegenerateAgentCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => agentUserService.regenerateCode(),
    onSuccess: (response) => {
      queryClient.setQueryData(
        agentKeys.account(),
        (current: AgentAccount | null | undefined) =>
          current
            ? {
                ...current,
                agentCode: response.data.agentCode,
              }
            : current
      );
      queryClient.invalidateQueries({ queryKey: agentKeys.account() });
    },
  });
}

/**
 * Withdraw commissions
 */
export function useWithdrawCommissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: WithdrawCommissionsRequest) =>
      agentUserService.withdrawCommissions(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.balance() });
      queryClient.invalidateQueries({ queryKey: agentKeys.stats() });
      queryClient.invalidateQueries({ queryKey: agentKeys.commissions(1, 20) });
    },
  });
}

/**
 * ADMIN HOOKS
 */

/**
 * Get product commission configurations
 */
export function useProductCommissions() {
  return useQuery({
    queryKey: agentKeys.products(),
    queryFn: () => agentAdminService.getProductCommissions(),
  });
}

/**
 * Attach commission to product
 */
export function useAttachProductCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: SetCommissionRequest;
    }) => agentAdminService.attachProductCommission(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.products() });
    },
  });
}

/**
 * Update product commission
 */
export function useUpdateProductCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: Partial<SetCommissionRequest>;
    }) => agentAdminService.updateProductCommission(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.products() });
    },
  });
}

/**
 * Remove product commission
 */
export function useRemoveProductCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      agentAdminService.removeProductCommission(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.products() });
    },
  });
}

/**
 * Get all agents with pagination
 */
export function useAgents(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: agentKeys.agents(page, limit),
    queryFn: () => agentAdminService.getAgents(page, limit),
  });
}

/**
 * Get agent details
 */
export function useAgentDetails(agentUserId: string) {
  return useQuery({
    queryKey: agentKeys.agent(agentUserId),
    queryFn: () => agentAdminService.getAgentDetails(agentUserId),
    enabled: !!agentUserId,
  });
}

/**
 * Get agent customers (admin view)
 */
export function useAgentCustomersAdmin(
  agentUserId: string,
  page: number = 1,
  limit: number = 20,
  searchQuery?: string,
  isActive?: boolean
) {
  return useQuery({
    queryKey: agentKeys.agentCustomers(
      agentUserId,
      page,
      limit,
      searchQuery,
      isActive
    ),
    queryFn: () =>
      agentAdminService.getAgentCustomersAdmin(
        agentUserId,
        page,
        limit,
        searchQuery,
        isActive
      ),
    enabled: !!agentUserId,
  });
}

/**
 * Get agent commissions (admin view)
 */
export function useAgentCommissionsAdmin(
  agentUserId: string,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: agentKeys.agentCommissions(agentUserId, page, limit),
    queryFn: () =>
      agentAdminService.getAgentCommissionsAdmin(agentUserId, page, limit),
    enabled: !!agentUserId,
  });
}

/**
 * Disable agent
 */
export function useDisableAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentUserId: string) =>
      agentAdminService.disableAgent(agentUserId),
    onSuccess: (_, agentUserId) => {
      queryClient.invalidateQueries({
        queryKey: agentKeys.agent(agentUserId),
      });
      queryClient.invalidateQueries({ queryKey: agentKeys.agentsList() });
    },
  });
}

/**
 * Enable agent
 */
export function useEnableAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentUserId: string) =>
      agentAdminService.enableAgent(agentUserId),
    onSuccess: (_, agentUserId) => {
      queryClient.invalidateQueries({
        queryKey: agentKeys.agent(agentUserId),
      });
      queryClient.invalidateQueries({ queryKey: agentKeys.agentsList() });
    },
  });
}
