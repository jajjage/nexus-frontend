import { referralService } from "@/services/referral.service";
import apiClient from "@/lib/api-client";

// Mock the API client
vi.mock("@/lib/api-client");
const mockApiClient = apiClient as any;

describe("referralService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateReferralCode", () => {
    it("should call validation endpoint with code", async () => {
      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: { valid: true } },
      });

      await referralService.validateReferralCode("ABC1234");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/referral/code/validate",
        {
          params: { code: "ABC1234" },
        }
      );
    });
  });

  describe("getReferralStatsV2", () => {
    it("should fetch referral stats", async () => {
      const mockStats = { referrerStats: { totalReferralsInvited: 5 } };
      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockStats },
      });

      const result = await referralService.getReferralStatsV2();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/dashboard/referrals/stats-v2"
      );
      expect(result.data).toEqual(mockStats);
    });
  });

  describe("getAvailableBalanceV2", () => {
    it("should fetch balance for a specific role", async () => {
      const mockBalance = { totalAvailable: 5000 };
      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockBalance },
      });

      const result = await referralService.getAvailableBalanceV2("referrer");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/dashboard/referrals/available-balance-v2",
        { params: { type: "referrer" } }
      );
      expect(result.data).toEqual(mockBalance);
    });
  });

  describe("requestWithdrawalV2", () => {
    it("should request withdrawal", async () => {
      const mockRequest = { amount: 1000, userType: "referrer" as const };
      mockApiClient.post.mockResolvedValue({
        data: { success: true },
      });

      await referralService.requestWithdrawalV2(mockRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/dashboard/referrals/withdraw-v2",
        mockRequest
      );
    });
  });

  describe("getReferralRewardId", () => {
    it("should extract ID from the rewards summary", async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: { id: "actual-reward-id" },
        },
      });

      const id = await referralService.getReferralRewardId();

      expect(mockApiClient.get).toHaveBeenCalledWith("/dashboard/rewards");
      expect(id).toBe("actual-reward-id");
    });
  });
});
