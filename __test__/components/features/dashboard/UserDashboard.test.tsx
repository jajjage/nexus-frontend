import { render, screen, waitFor } from "@testing-library/react";
import { UserDashboard } from "@/components/features/dashboard/user-dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { useUpdateProfile } from "@/hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// Mock Hooks
jest.mock("@/hooks/useAuth");
jest.mock("@/hooks/useNotifications");
jest.mock("@/hooks/useUser");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(),
}));

// Mock Child Components to reduce noise
jest.mock("@/components/features/dashboard/balance-card", () => ({
  BalanceCard: () => <div data-testid="balance-card">Balance</div>,
}));
jest.mock("@/components/features/dashboard/transaction-history", () => ({
  TransactionHistory: () => (
    <div data-testid="transaction-history">Tx History</div>
  ),
}));
jest.mock("@/components/features/dashboard/action-buttons", () => ({
  ActionButtons: () => <div>Actions</div>,
}));
jest.mock("@/components/features/dashboard/bottom-nav", () => ({
  BottomNav: () => <div>Nav</div>,
}));
jest.mock("@/components/features/dashboard/ads-carousel", () => ({
  AdsCarousel: () => <div data-testid="ads-carousel">Ads Carousel</div>,
}));
// ... mock others if needed, but these are main ones

describe("UserDashboard", () => {
  const mockRouter = { push: jest.fn() };
  const mockQueryClient = { invalidateQueries: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);

    // Default happy path mocks
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        userId: "1",
        fullName: "Test User",
        role: "user",
        hasPin: true, // Default has PIN
        balance: "5000",
        accountNumber: "123",
      },
      isLoading: false,
      refetch: jest.fn(),
    });

    (useUnreadNotificationCount as jest.Mock).mockReturnValue({
      data: { data: { unreadCount: 5 } },
    });

    (useUpdateProfile as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  it("redirects to admin dashboard if user is admin", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: "admin" },
      isLoading: false,
    });

    render(<UserDashboard />);

    // Check redirection logic in useEffect
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("shows PIN setup modal if user has no PIN", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        userId: "1",
        fullName: "User",
        hasPin: false, // NO PIN
        balance: "0",
      },
      isLoading: false,
    });

    render(<UserDashboard />);

    // "Transaction PIN" is likely in the modal title or text
    // The real modal is rendered, so we can search for the dialog title
    expect(
      screen.getByRole("heading", { name: /Transaction PIN/i })
    ).toBeInTheDocument();
  });

  it("renders dashboard content for valid user", () => {
    render(<UserDashboard />);

    expect(screen.getByTestId("balance-card")).toBeInTheDocument();
    expect(screen.getAllByText("Test User")[0]).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // Notification count
  });
});
