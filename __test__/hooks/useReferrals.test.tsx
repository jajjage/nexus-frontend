import {
  useReferralStatsV2,
  useRequestWithdrawalV2,
} from "@/hooks/useReferrals";
import { referralService } from "@/services/referral.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { toast } from "sonner";
import { Mock } from "vitest";

vi.mock("@/services/referral.service");
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/**
 * NOTE: Referrals feature is temporarily disabled (Coming Soon)
 * All hooks have enabled: false and mutations reject immediately
 * Tests are skipped until feature is re-enabled
 */
describe.skip("useReferrals Hooks (FEATURE DISABLED)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useReferralStats", () => {
    it("should fetch and return stats", async () => {
      const mockStats = { referrerStats: { totalReferralsInvited: 10 } };
      (referralService.getReferralStatsV2 as Mock).mockResolvedValue({
        success: true,
        data: mockStats,
      });

      const { result } = renderHook(() => useReferralStatsV2(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockStats);
      expect(referralService.getReferralStatsV2).toHaveBeenCalled();
    });
  });

  describe("useRequestWithdrawalV2", () => {
    it("should call requestWithdrawalV2 and show toast on success", async () => {
      (referralService.requestWithdrawalV2 as Mock).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useRequestWithdrawalV2(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ amount: 1000, userType: "referrer" });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(referralService.requestWithdrawalV2).toHaveBeenCalledWith({
        amount: 1000,
        userType: "referrer",
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
