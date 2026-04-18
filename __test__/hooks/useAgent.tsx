import {
  useActivateAgent,
  useAgentAccount,
  useAgentStats,
  useValidateAgentCode,
} from "@/hooks/useAgent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the service
vi.mock("@/services/agent.service", () => ({
  agentPublicService: {
    validateCode: vi.fn(),
  },
  agentUserService: {
    getAgentAccount: vi.fn(),
    getAgentStats: vi.fn(),
    activateAgent: vi.fn(),
  },
}));

describe("Agent Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe("useValidateAgentCode", () => {
    it("should validate agent code", async () => {
      const { agentPublicService } = await import("@/services/agent.service");
      const mockResponse = {
        success: true,
        message: "Valid code",
        data: {
          agentCode: "AGENT-ABC123",
          agentUserId: "user-123",
          isValid: true,
        },
      };

      vi.mocked(agentPublicService.validateCode).mockResolvedValueOnce(
        mockResponse
      );

      const { result } = renderHook(() => useValidateAgentCode(), {
        wrapper,
      });

      result.current.mutate("AGENT-ABC123");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("should handle validation error", async () => {
      const { agentPublicService } = await import("@/services/agent.service");
      const mockError = new Error("Invalid code");

      vi.mocked(agentPublicService.validateCode).mockRejectedValueOnce(
        mockError
      );

      const { result } = renderHook(() => useValidateAgentCode(), {
        wrapper,
      });

      result.current.mutate("INVALID-CODE");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("useAgentAccount", () => {
    it("should fetch agent account", async () => {
      const { agentUserService } = await import("@/services/agent.service");
      const mockAccount = {
        id: "agent-1",
        userId: "user-1",
        agentCode: "AGENT-ABC123",
        isActive: true,
        commissionCapType: "indefinite" as const,
        commissionCapValue: null,
        commissionCapExpiresAt: null,
        metadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(agentUserService.getAgentAccount).mockResolvedValueOnce(
        mockAccount
      );

      const { result } = renderHook(() => useAgentAccount(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAccount);
    });
  });

  describe("useAgentStats", () => {
    it("should fetch agent stats", async () => {
      const { agentUserService } = await import("@/services/agent.service");
      const mockStats = {
        totalCustomers: 10,
        activeCustomers: 8,
        totalCommissionsEarned: 50000,
        claimedCommissionsAmount: 30000,
        withdrawnCommissionsAmount: 20000,
        availableBalanceAmount: 10000,
      };

      vi.mocked(agentUserService.getAgentStats).mockResolvedValueOnce(
        mockStats
      );

      const { result } = renderHook(() => useAgentStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
    });
  });

  describe("useActivateAgent", () => {
    it("should activate agent account", async () => {
      const { agentUserService } = await import("@/services/agent.service");
      const mockResponse = {
        success: true,
        message: "Agent activated",
        data: {
          id: "agent-1",
          userId: "user-1",
          agentCode: "AGENT-ABC123",
          isActive: true,
          commissionCapType: "indefinite" as const,
          commissionCapValue: null,
          commissionCapExpiresAt: null,
          metadata: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      vi.mocked(agentUserService.activateAgent).mockResolvedValueOnce(
        mockResponse
      );

      const { result } = renderHook(() => useActivateAgent(), { wrapper });

      result.current.mutate(undefined);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });
  });
});
