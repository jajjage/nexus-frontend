import apiClient from "@/lib/api-client";
import { adminOfferService } from "@/services/admin/offer.service";
import { vi, type Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("adminOfferService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOffers", () => {
    it("should call GET /admin/offers with optional params and map response", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            offers: [
              {
                id: "1",
                title: "Test",
                discount_type: "percentage",
                discount_value: 10,
                other_field: "val",
              },
            ],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          },
        },
      });

      const result = await adminOfferService.getOffers({
        page: 1,
        limit: 10,
        status: "active",
      });

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/offers", {
        params: { page: 1, limit: 10, status: "active" },
      });
      // Verify mapping
      expect(result.data?.offers[0].discountType).toBe("percentage");
      expect(result.data?.offers[0].discountValue).toBe(10);
    });
  });

  describe("getOfferById", () => {
    it("should call GET /admin/offers/:offerId and map response", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            offer: { id: "offer-123", title: "Test", discount_type: "fixed" },
          },
        },
      });

      const result = await adminOfferService.getOfferById("offer-123");

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/offers/offer-123");
      // Verify mapping and flattening
      expect(result.data?.id).toBe("offer-123");
      expect(result.data?.discountType).toBe("fixed");
    });
  });

  describe("createOffer", () => {
    it("should call POST /admin/offers with transformed data", async () => {
      const offerData: any = {
        title: "Test Offer",
        discountType: "percentage",
        discountValue: 10,
        startsAt: "2024-01-01",
        endsAt: "2024-02-01",
      };

      // Mock response can be anything, but let's be realistic
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: { offer: { id: "new-offer-id", title: "Test Offer" } },
        },
      });

      await adminOfferService.createOffer(offerData);

      // Verify request payload was transformed to snake_case
      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/offers",
        expect.objectContaining({
          title: "Test Offer",
          discount_type: "percentage",
          starts_at: "2024-01-01",
          ends_at: "2024-02-01",
        })
      );
    });
  });

  describe("updateOffer", () => {
    it("should call PUT /admin/offers/:offerId with transformed data", async () => {
      const updateData: any = { title: "Updated Title", discountType: "fixed" };
      mockApiClient.put.mockResolvedValueOnce({
        data: { success: true, data: { offer: { id: "offer-123" } } },
      });

      await adminOfferService.updateOffer("offer-123", updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/admin/offers/offer-123",
        expect.objectContaining({
          title: "Updated Title",
          discount_type: "fixed",
        })
      );
    });
  });

  describe("deleteOffer", () => {
    it("should call DELETE /admin/offers/:offerId", async () => {
      mockApiClient.delete.mockResolvedValueOnce({
        data: { success: true, message: "Offer deleted" },
      });

      await adminOfferService.deleteOffer("offer-123");

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/admin/offers/offer-123"
      );
    });
  });

  describe("computeSegment", () => {
    it("should call POST /admin/offers/:offerId/compute-segment", async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: { total: 100 } },
      });

      await adminOfferService.computeSegment("offer-123");

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/offers/offer-123/compute-segment"
      );
    });
  });

  describe("getEligibleUsers", () => {
    it("should call GET /admin/offers/:offerId/eligible-users", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: { members: [], total: 0 } },
      });

      await adminOfferService.getEligibleUsers("offer-123", { page: 1 });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/offers/offer-123/eligible-users",
        { params: { page: 1 } }
      );
    });
  });

  describe("previewEligibility", () => {
    it("should call GET /admin/offers/:offerId/preview-eligibility", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: { preview: [] } },
      });

      await adminOfferService.previewEligibility("offer-123", 50);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/offers/offer-123/preview-eligibility",
        { params: { limit: 50 } }
      );
    });
  });

  describe("createRedemptions", () => {
    it("should call POST /admin/offers/:offerId/redemptions", async () => {
      const redemptionData = { fromSegment: true };
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: { jobId: "job-123" } },
      });

      await adminOfferService.createRedemptions("offer-123", redemptionData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/offers/offer-123/redemptions",
        redemptionData
      );
    });
  });
});
