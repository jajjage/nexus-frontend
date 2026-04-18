import apiClient from "@/lib/api-client";
import { agentService } from "@/services/agent.service";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the apiClient
vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockAxiosResponse = <T>(data: T) => ({ data });

describe("Agent Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Public Service", () => {
    it("should validate agent code", async () => {
      const mockResponse = {
        success: true,
        message: "Code is valid",
        data: {
          agentCode: "AGENT-ABC123",
          agentUserId: "user-123",
          isValid: true,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(
        mockAxiosResponse(mockResponse)
      );

      const result = await agentService.public.validateCode("AGENT-ABC123");

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/agent/code/validate?code=AGENT-ABC123"
      );
    });
  });

  describe("User Service", () => {
    it("should activate agent account", async () => {
      const mockResponse = {
        success: true,
        message: "Agent activated",
        data: {
          id: "agent-1",
          userId: "user-1",
          agentCode: "AGENT-ABC123",
          isActive: true,
          commissionCapType: "indefinite",
          commissionCapValue: null,
          commissionCapExpiresAt: null,
          metadata: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(
        mockAxiosResponse(mockResponse)
      );

      const result = await agentService.user.activateAgent();

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/dashboard/agent/account/activate"
      );
    });

    it("should get agent account", async () => {
      const mockResponse = {
        id: "agent-1",
        userId: "user-1",
        agentCode: "AGENT-ABC123",
        isActive: true,
        commissionCapType: "indefinite",
        commissionCapValue: null,
        commissionCapExpiresAt: null,
        metadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(
        mockAxiosResponse(mockResponse)
      );

      const result = await agentService.user.getAgentAccount();

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith("/dashboard/agent/account");
    });

    it("should unwrap agent account when backend responds with ApiResponse", async () => {
      const mockAccount = {
        id: "agent-1",
        userId: "user-1",
        agentCode: "AGENT-ABC123",
        isActive: true,
        commissionCapType: "indefinite",
        commissionCapValue: null,
        commissionCapExpiresAt: null,
        metadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(
        mockAxiosResponse({
          success: true,
          message: "Agent account retrieved",
          data: mockAccount,
        })
      );

      const result = await agentService.user.getAgentAccount();

      expect(result).toEqual(mockAccount);
    });

    it("should return null when agent account is not active yet", async () => {
      const notFoundError = {
        response: {
          status: 404,
        },
      };

      vi.spyOn(axios, "isAxiosError").mockReturnValueOnce(true);
      vi.mocked(apiClient.get).mockRejectedValueOnce(notFoundError);

      const result = await agentService.user.getAgentAccount();

      expect(result).toBeNull();
      expect(apiClient.get).toHaveBeenCalledWith("/dashboard/agent/account");
    });

    it("should get agent stats", async () => {
      const mockResponse = {
        totalCustomers: 10,
        activeCustomers: 8,
        totalCommissionsEarned: 50000,
        claimedCommissionsAmount: 30000,
        withdrawnCommissionsAmount: 20000,
        availableBalanceAmount: 10000,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(
        mockAxiosResponse(mockResponse)
      );

      const result = await agentService.user.getAgentStats();

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith("/dashboard/agent/stats");
    });

    it("should unwrap agent stats when backend responds with ApiResponse", async () => {
      const mockStats = {
        totalCustomers: 0,
        activeCustomers: 0,
        totalCommissionsEarned: 0,
        claimedCommissionsAmount: 0,
        withdrawnCommissionsAmount: 0,
        availableBalanceAmount: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(
        mockAxiosResponse({
          success: true,
          message: "Agent stats retrieved",
          data: mockStats,
        })
      );

      const result = await agentService.user.getAgentStats();

      expect(result).toEqual(mockStats);
    });

    it("should withdraw commissions", async () => {
      const mockResponse = {
        success: true,
        message: "Withdrawal successful",
        data: {
          transactionId: "txn-123",
          amount: 10000,
          newAvailableBalance: 0,
          withdrawDate: new Date().toISOString(),
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(
        mockAxiosResponse(mockResponse)
      );

      const result = await agentService.user.withdrawCommissions({
        amount: 10000,
      });

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith("/dashboard/agent/withdraw", {
        amount: 10000,
      });
    });
  });

  describe("Admin Service", () => {
    it("should unwrap paginated agents when backend responds with nested ApiResponse data", async () => {
      const mockAgents = [
        {
          id: "agent-1",
          userId: "user-1",
          agentCode: "AGENT-ABC123",
          email: "agent@example.com",
          fullName: "Agent One",
          phoneNumber: "08012345678",
          isActive: true,
          totalCustomers: 5,
          activeCustomers: 4,
          totalCommissionsEarned: 25000,
          withdrawnCommissionsAmount: 15000,
          availableBalanceAmount: 10000,
          commissionCapType: "indefinite",
          commissionCapValue: null,
          commissionCapExpiresAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce(
        mockAxiosResponse({
          success: true,
          message: "Agents retrieved",
          data: {
            data: mockAgents,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
              hasMore: false,
            },
          },
        })
      );

      const result = await agentService.admin.getAgents(1, 20);

      expect(result.data).toEqual(mockAgents);
      expect(result.pagination.total).toBe(1);
    });

    it("should unwrap paginated agents when backend returns agents key", async () => {
      const mockAgents = [
        {
          id: "agent-1",
          userId: "user-1",
          agentCode: "AGENT-ABC123",
          email: "agent@example.com",
          fullName: "Agent One",
          phoneNumber: "08012345678",
          isActive: true,
          totalCustomers: 5,
          activeCustomers: 4,
          totalCommissionsEarned: 25000,
          withdrawnCommissionsAmount: 15000,
          availableBalanceAmount: 10000,
          commissionCapType: "indefinite",
          commissionCapValue: null,
          commissionCapExpiresAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce(
        mockAxiosResponse({
          success: true,
          message: "Agents retrieved",
          data: {
            agents: mockAgents,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
              hasMore: false,
            },
          },
        })
      );

      const result = await agentService.admin.getAgents(1, 20);

      expect(result.data).toEqual(mockAgents);
      expect(result.pagination.total).toBe(1);
    });

    it("should get all agents", async () => {
      const mockResponse = {
        success: true,
        message: "Agents retrieved",
        data: [
          {
            id: "agent-1",
            userId: "user-1",
            agentCode: "AGENT-ABC123",
            email: "agent@example.com",
            fullName: "Agent One",
            phoneNumber: "08012345678",
            isActive: true,
            totalCustomers: 5,
            activeCustomers: 4,
            totalCommissionsEarned: 25000,
            withdrawnCommissionsAmount: 15000,
            availableBalanceAmount: 10000,
            commissionCapType: "indefinite",
            commissionCapValue: null,
            commissionCapExpiresAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasMore: false,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(
        mockAxiosResponse(mockResponse)
      );

      const result = await agentService.admin.getAgents(1, 20);

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/dashboard/agents?page=1&limit=20"
      );
    });

    it("should unwrap wrapped product commissions list", async () => {
      const mockProducts = [
        {
          id: "commission-1",
          productId: "MTN-DATA-1GB",
          productName: "MTN 1GB",
          commissionType: "fixed" as const,
          commissionValue: 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce(
        mockAxiosResponse({
          success: true,
          message: "Commission rules retrieved",
          data: mockProducts,
        })
      );

      const result = await agentService.admin.getProductCommissions();

      expect(result).toEqual(mockProducts);
    });

    it("should unwrap product commissions when backend returns products array", async () => {
      const mockProducts = [
        {
          id: "product-1",
          productId: "product-1",
          productCode: "MTN-DATA-1GB",
          name: "MTN 1GB",
          productType: "data",
          isActive: true,
          commissionConfig: {
            id: "commission-1",
            productId: "product-1",
            commissionType: "fixed" as const,
            commissionValue: 50,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce(
        mockAxiosResponse({
          success: true,
          message: "Commission products retrieved",
          data: {
            products: mockProducts,
          },
        })
      );

      const result = await agentService.admin.getProductCommissions();

      expect(result).toEqual(mockProducts);
    });

    it("should unwrap product commissions when backend returns results key", async () => {
      const mockProducts = [
        {
          id: "product-1",
          productId: "product-1",
          productCode: "MTN-DATA-1GB",
          name: "MTN 1GB",
          productType: "data",
          isActive: true,
          commissionConfig: {
            id: "commission-1",
            productId: "product-1",
            commissionType: "fixed" as const,
            commissionValue: 50,
            isActive: true,
          },
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce(
        mockAxiosResponse({
          success: true,
          message: "Commission products retrieved",
          data: {
            results: mockProducts,
          },
        })
      );

      const result = await agentService.admin.getProductCommissions();

      expect(result).toEqual(mockProducts);
    });

    it("should disable agent", async () => {
      const mockResponse = {
        success: true,
        message: "Agent disabled",
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(
        mockAxiosResponse(mockResponse)
      );

      const result = await agentService.admin.disableAgent("user-1");

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/dashboard/agents/user-1/disable"
      );
    });

    it("should enable agent", async () => {
      const mockResponse = {
        success: true,
        message: "Agent enabled",
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(
        mockAxiosResponse(mockResponse)
      );

      const result = await agentService.admin.enableAgent("user-1");

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/dashboard/agents/user-1/enable"
      );
    });
  });
});
