/**
 * Offer Hooks Tests
 * Tests for useAdminOffers hooks
 */

import {
  useAdminOffer,
  useAdminOffers,
  useComputeSegment,
  useCreateOffer,
  useCreateRedemptions,
  useDeleteOffer,
  useEligibleUsers,
  useUpdateOffer,
} from "@/hooks/admin/useAdminOffers";
import { adminOfferService } from "@/services/admin/offer.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the service
vi.mock("@/services/admin/offer.service", () => ({
  adminOfferService: {
    getOffers: vi.fn(),
    getOfferById: vi.fn(),
    createOffer: vi.fn(),
    updateOffer: vi.fn(),
    deleteOffer: vi.fn(),
    computeSegment: vi.fn(),
    getEligibleUsers: vi.fn(),
    previewEligibility: vi.fn(),
    createRedemptions: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockService = adminOfferService as unknown as {
  getOffers: ReturnType<typeof vi.fn>;
  getOfferById: ReturnType<typeof vi.fn>;
  createOffer: ReturnType<typeof vi.fn>;
  updateOffer: ReturnType<typeof vi.fn>;
  deleteOffer: ReturnType<typeof vi.fn>;
  computeSegment: ReturnType<typeof vi.fn>;
  getEligibleUsers: ReturnType<typeof vi.fn>;
  previewEligibility: ReturnType<typeof vi.fn>;
  createRedemptions: ReturnType<typeof vi.fn>;
};

describe("Offer Hooks", () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockOffer = {
    id: "offer-123",
    title: "Test Offer",
    discountType: "percentage",
    discountValue: 10,
    status: "active",
    startsAt: "2024-01-01T00:00:00Z",
    endsAt: "2024-02-01T00:00:00Z",
  };

  // ============= useAdminOffers Tests =============

  describe("useAdminOffers", () => {
    it("should fetch offers list", async () => {
      const mockResponse = {
        success: true,
        data: { offers: [mockOffer] },
      };

      mockService.getOffers.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAdminOffers(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data?.offers).toHaveLength(1);
    });
  });

  // ============= useAdminOffer Tests =============

  describe("useAdminOffer", () => {
    it("should fetch offer details", async () => {
      const mockResponse = {
        success: true,
        data: mockOffer,
      };

      mockService.getOfferById.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAdminOffer("offer-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toEqual(mockOffer);
    });
  });

  // ============= useCreateOffer Tests =============

  describe("useCreateOffer", () => {
    it("should create offer successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Offer created",
        data: mockOffer,
      };

      mockService.createOffer.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateOffer(), { wrapper });

      result.current.mutate({
        title: "Test Offer",
        discountType: "percentage",
        discountValue: 10,
        startsAt: "2024-01-01T00:00:00Z",
        endsAt: "2024-02-01T00:00:00Z",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.createOffer).toHaveBeenCalled();
    });
  });

  // ============= useUpdateOffer Tests =============

  describe("useUpdateOffer", () => {
    it("should update offer successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Offer updated",
        data: { ...mockOffer, title: "Updated" },
      };

      mockService.updateOffer.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateOffer(), { wrapper });

      result.current.mutate({
        offerId: "offer-123",
        data: { title: "Updated" },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.updateOffer).toHaveBeenCalledWith("offer-123", {
        title: "Updated",
      });
    });
  });

  // ============= useDeleteOffer Tests =============

  describe("useDeleteOffer", () => {
    it("should delete offer successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Offer deleted",
      };

      mockService.deleteOffer.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteOffer(), { wrapper });

      result.current.mutate("offer-123");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.deleteOffer).toHaveBeenCalledWith("offer-123");
    });
  });

  // ============= useComputeSegment Tests =============

  describe("useComputeSegment", () => {
    it("should compute segment successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Segment computed",
        data: { total: 50 },
      };

      mockService.computeSegment.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useComputeSegment(), { wrapper });

      result.current.mutate("offer-123");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.computeSegment).toHaveBeenCalledWith("offer-123");
    });
  });

  // ============= useEligibleUsers Tests =============

  describe("useEligibleUsers", () => {
    it("should fetch eligible users", async () => {
      const mockResponse = {
        success: true,
        data: { members: [], total: 0 },
      };

      mockService.getEligibleUsers.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEligibleUsers("offer-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.getEligibleUsers).toHaveBeenCalledWith(
        "offer-123",
        undefined
      );
    });
  });

  // ============= useCreateRedemptions Tests =============

  describe("useCreateRedemptions", () => {
    it("should create redemptions successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Job created",
        data: { jobId: "job-123" },
      };

      mockService.createRedemptions.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateRedemptions(), { wrapper });

      result.current.mutate({
        offerId: "offer-123",
        data: { fromSegment: true },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockService.createRedemptions).toHaveBeenCalledWith("offer-123", {
        fromSegment: true,
      });
    });
  });
});
