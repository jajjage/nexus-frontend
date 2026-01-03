import apiClient from "@/lib/api-client";
import { userOfferService } from "@/services/user-offer.service";

// Mock the API client
vi.mock("@/lib/api-client");
const mockApiClient = apiClient as any;

describe("userOfferService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEligibleOffers", () => {
    it("should fetch eligible offers for the current user", async () => {
      const mockOffers = {
        offers: [
          {
            id: "offer-123",
            title: "Welcome Bonus",
            description: "50% off first purchase",
            discountType: "percentage",
            discountValue: 50,
          },
          {
            id: "offer-456",
            title: "Flash Sale",
            description: "10% off all data",
            discountType: "percentage",
            discountValue: 10,
          },
        ],
      };

      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: mockOffers },
      });

      const result = await userOfferService.getEligibleOffers();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/user/offers/my-eligible"
      );
      expect(result.success).toBe(true);
      expect(result.data.offers).toHaveLength(2);
      expect(result.data.offers[0].id).toBe("offer-123");
    });

    it("should return empty offers array when user has no eligible offers", async () => {
      mockApiClient.get.mockResolvedValue({
        data: { success: true, data: { offers: [] } },
      });

      const result = await userOfferService.getEligibleOffers();

      expect(result.success).toBe(true);
      expect(result.data.offers).toHaveLength(0);
    });

    it("should handle API errors gracefully", async () => {
      mockApiClient.get.mockRejectedValue(new Error("Network error"));

      await expect(userOfferService.getEligibleOffers()).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("validateOffer", () => {
    it("should validate offer eligibility before purchase", async () => {
      const validationRequest = {
        productId: "prod-123",
        amount: 1000,
        offerId: "offer-123",
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            valid: true,
            discountedAmount: 500,
          },
        },
      });

      const result = await userOfferService.validateOffer(validationRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/user/offers/validate",
        validationRequest
      );
      expect(result.success).toBe(true);
      expect(result.data.valid).toBe(true);
      expect(result.data.discountedAmount).toBe(500);
    });

    it("should return invalid when user is not eligible", async () => {
      const validationRequest = {
        productId: "prod-123",
        amount: 1000,
        offerId: "offer-456",
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            valid: false,
            message: "User does not meet eligibility requirements",
          },
        },
      });

      const result = await userOfferService.validateOffer(validationRequest);

      expect(result.data.valid).toBe(false);
      expect(result.data.message).toBe(
        "User does not meet eligibility requirements"
      );
    });

    it("should handle validation without offerId", async () => {
      const validationRequest = {
        productId: "prod-123",
        amount: 1000,
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: { valid: true },
        },
      });

      await userOfferService.validateOffer(validationRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/user/offers/validate",
        validationRequest
      );
    });
  });
});
