import apiClient from "@/lib/api-client";
import { referralService } from "@/services/referral.service";

jest.mock("@/lib/api-client");
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("referralService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateReferralCode", () => {
    it("should call GET /referral/code/validate with code", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: { referrerId: "ref-123" } },
      });

      const result = await referralService.validateReferralCode("CODE123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/referral/code/validate",
        {
          params: { code: "CODE123" },
        }
      );
      expect(result.data.referrerId).toBe("ref-123");
    });
  });

  describe("getReferralStats", () => {
    it("should fetch referral stats", async () => {
      const mockStats = { totalReferrals: 5, totalRewardEarned: 1000 };
      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockStats },
      });

      const result = await referralService.getReferralStats();

      expect(mockApiClient.get).toHaveBeenCalledWith("/dashboard/referrals");
      expect(result.data).toEqual(mockStats);
    });
  });

  describe("getWithdrawalBalance", () => {
    it("should fetch balance for a specific rewardId", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: { totalAmount: 500 } },
      });

      const result = await referralService.getWithdrawalBalance("reward-abc");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/withdrawals/balance/reward-abc"
      );
      expect(result.data.totalAmount).toBe(500);
    });
  });

  describe("getReferralRewardId", () => {
    it("should extract ID from the rewards summary", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { id: "actual-reward-id", type: "REFERRAL" },
        },
      });

      const id = await referralService.getReferralRewardId();

      expect(mockApiClient.get).toHaveBeenCalledWith("/dashboard/rewards");
      expect(id).toBe("actual-reward-id");
    });

    it("should return null on error", async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error("Network error"));

      const id = await referralService.getReferralRewardId();

      expect(id).toBeNull();
    });
  });
});
