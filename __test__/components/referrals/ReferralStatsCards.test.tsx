import { ReferralStatsCards } from "@/components/features/referrals/referral-stats-cards";
import { useReferralStatsV2 } from "@/hooks/useReferrals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

// Mock the hook
vi.mock("@/hooks/useReferrals", () => ({
  useReferralStatsV2: vi.fn(),
  useAvailableBalanceV2: vi.fn(() => ({
    data: { availableBalance: 0 },
    isLoading: false,
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("ReferralStatsCards", () => {
  it("should show skeletons while loading", () => {
    (useReferralStatsV2 as ReturnType<typeof vi.fn>).mockReturnValue({
      isLoading: true,
    });

    render(<ReferralStatsCards />, { wrapper: createWrapper() });

    // Skeletons in Shadcn/UI usually have animate-pulse or skeleton classes
    const skeletons = document.querySelectorAll(".animate-pulse, .skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should display stats when loaded", () => {
    const mockStats = {
      referrerStats: {
        totalReferralsInvited: 15,
        claimedReferrals: 8,
        totalReferrerEarnings: 5000,
        pendingReferrerAmount: 1000,
      },
      referredStats: {
        totalReferredEarnings: 200,
        pendingReferredAmount: 200,
      },
    };

    (useReferralStatsV2 as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockStats,
      isLoading: false,
    });

    render(<ReferralStatsCards />, { wrapper: createWrapper() });

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("₦5,000")).toBeInTheDocument();
    // Withdrawable shows available balance from useAvailableBalanceV2 mock (0)
    expect(screen.getByText("₦0")).toBeInTheDocument();
  });
});
