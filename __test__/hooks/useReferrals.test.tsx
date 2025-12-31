import { renderHook, waitFor } from "@testing-library/react";
import {
  useReferralStats,
  useReferralsList,
  useRequestWithdrawal,
} from "@/hooks/useReferrals";
import { referralService } from "@/services/referral.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { toast } from "sonner";

jest.mock("@/services/referral.service");
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useReferrals Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useReferralStats", () => {
    it("should fetch and return stats", async () => {
      const mockStats = { totalReferrals: 10 };
      (referralService.getReferralStats as jest.Mock).mockResolvedValue({
        success: true,
        data: mockStats,
      });

      const { result } = renderHook(() => useReferralStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockStats);
    });
  });

  describe("useRequestWithdrawal", () => {
    it("should call requestWithdrawal and show toast on success", async () => {
      (referralService.requestWithdrawal as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useRequestWithdrawal(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ rewardId: "123", amount: 500 });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("submitted")
      );
    });
  });
});
