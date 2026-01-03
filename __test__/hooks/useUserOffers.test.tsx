import { useEligibleOffers, useValidateOffer } from "@/hooks/useUserOffers";
import { userOfferService } from "@/services/user-offer.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";

vi.mock("@/services/user-offer.service");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useUserOffers Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useEligibleOffers", () => {
    it("should fetch eligible offers and return eligibleIds Set", async () => {
      const mockOffers = {
        offers: [
          {
            id: "offer-123",
            title: "Welcome Bonus",
            discountType: "percentage",
            discountValue: 50,
          },
          {
            id: "offer-456",
            title: "Flash Sale",
            discountType: "percentage",
            discountValue: 10,
          },
        ],
      };

      (userOfferService.getEligibleOffers as vi.Mock).mockResolvedValue({
        success: true,
        data: mockOffers,
      });

      const { result } = renderHook(() => useEligibleOffers(true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Check that eligibleIds Set is created correctly
      expect(result.current.eligibleIds.has("offer-123")).toBe(true);
      expect(result.current.eligibleIds.has("offer-456")).toBe(true);
      expect(result.current.eligibleIds.has("nonexistent")).toBe(false);
      expect(result.current.offers).toHaveLength(2);
    });

    it("should return empty Set when no offers are eligible", async () => {
      (userOfferService.getEligibleOffers as vi.Mock).mockResolvedValue({
        success: true,
        data: { offers: [] },
      });

      const { result } = renderHook(() => useEligibleOffers(true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.eligibleIds.size).toBe(0);
      expect(result.current.offers).toHaveLength(0);
    });

    it("should not fetch when enabled is false", async () => {
      const { result } = renderHook(() => useEligibleOffers(false), {
        wrapper: createWrapper(),
      });

      // Query should not be fetching
      expect(result.current.isFetching).toBe(false);
      expect(userOfferService.getEligibleOffers).not.toHaveBeenCalled();
    });

    it("should return empty Set on error", async () => {
      (userOfferService.getEligibleOffers as vi.Mock).mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() => useEligibleOffers(true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Should return empty Set even on error
      expect(result.current.eligibleIds.size).toBe(0);
    });
  });

  describe("useValidateOffer", () => {
    it("should call validateOffer service on mutation", async () => {
      const mockResponse = {
        success: true,
        data: { valid: true, discountedAmount: 500 },
      };

      (userOfferService.validateOffer as vi.Mock).mockResolvedValue(
        mockResponse
      );

      const { result } = renderHook(() => useValidateOffer(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        productId: "prod-123",
        amount: 1000,
        offerId: "offer-123",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userOfferService.validateOffer).toHaveBeenCalledWith({
        productId: "prod-123",
        amount: 1000,
        offerId: "offer-123",
      });
    });
  });
});
