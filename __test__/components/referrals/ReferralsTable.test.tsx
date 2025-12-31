import { render, screen } from "@testing-library/react";
import { ReferralsTable } from "@/components/features/referrals/referrals-table";
import { useReferralsList, useClaimReferralBonus } from "@/hooks/useReferrals";
import { useAuth } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Mock dependencies
vi.mock("@/hooks/useReferrals", () => ({
  useReferralsList: vi.fn(),
  useClaimReferralBonus: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("ReferralsTable", () => {
  const mockReferrals = [
    {
      id: "ref-1",
      referredUserData: { fullName: "User One", email: "user1@test.com" },
      rewardAmount: 500,
      status: "active",
      createdAt: "2025-01-01T10:00:00Z",
    },
    {
      id: "ref-2",
      referredUserData: { fullName: "User Two", email: "user2@test.com" },
      rewardAmount: 500,
      status: "pending",
      createdAt: "2025-01-05T12:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({ user: { userId: "me" } });
    (useClaimReferralBonus as vi.Mock).mockReturnValue({ mutate: vi.fn() });
  });

  it("should display a list of referrals", () => {
    (useReferralsList as vi.Mock).mockReturnValue({
      data: {
        data: {
          referrals: mockReferrals,
          pagination: { totalPages: 1, page: 1 },
        },
      },
      isLoading: false,
    });

    render(<ReferralsTable />, { wrapper: createWrapper() });

    expect(screen.getByText("User One")).toBeInTheDocument();
    expect(screen.getByText("User Two")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("should show empty message when no referrals exist", () => {
    (useReferralsList as vi.Mock).mockReturnValue({
      data: { data: { referrals: [], pagination: {} } },
      isLoading: false,
    });

    render(<ReferralsTable />, { wrapper: createWrapper() });

    expect(screen.getByText(/no referrals yet/i)).toBeInTheDocument();
  });
});
