import { render, screen } from "@testing-library/react";
import { ReferralStatsCards } from "@/components/features/referrals/referral-stats-cards";
import { useReferralStats } from "@/hooks/useReferrals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Mock the hook
jest.mock("@/hooks/useReferrals", () => ({
  useReferralStats: jest.fn(),
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
    (useReferralStats as jest.Mock).mockReturnValue({
      isLoading: true,
    });

    render(<ReferralStatsCards />, { wrapper: createWrapper() });

    // Check for skeletons (usually have animate-pulse class or similar)
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should display stats when loaded", () => {
    const mockStats = {
      totalReferrals: 15,
      activeReferrals: 8,
      totalRewardEarned: 5000,
      pendingRewardAmount: 1200,
    };

    (useReferralStats as jest.Mock).mockReturnValue({
      data: { data: mockStats },
      isLoading: false,
    });

    render(<ReferralStatsCards />, { wrapper: createWrapper() });

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("₦5,000.00")).toBeInTheDocument();
    expect(screen.getByText("₦1,200.00")).toBeInTheDocument();
  });
});
