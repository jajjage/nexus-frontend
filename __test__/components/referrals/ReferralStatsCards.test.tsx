import { render, screen } from "@testing-library/react";
import { ReferralStatsCards } from "@/components/features/referrals/referral-stats-cards";
import { useReferralStatsV2 } from "@/hooks/useReferrals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Mock the hook
vi.mock("@/hooks/useReferrals", () => ({
  useReferralStatsV2: vi.fn(),
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
    (useReferralStatsV2 as vi.Mock).mockReturnValue({
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

    (useReferralStatsV2 as vi.Mock).mockReturnValue({
      data: mockStats,
      isLoading: false,
    });

    render(<ReferralStatsCards />, { wrapper: createWrapper() });

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("₦5,000.00")).toBeInTheDocument();
    // Withdrawable total = 1000 + 200 = 1200
    expect(screen.getByText("₦1,200.00")).toBeInTheDocument();
  });
});
