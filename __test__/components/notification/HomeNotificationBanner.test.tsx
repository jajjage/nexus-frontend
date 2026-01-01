import { render, screen, waitFor } from "@testing-library/react";
import { HomeNotificationBanner } from "@/components/notification/home-notification-banner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      userId: "test-user-id",
      fullName: "Test User",
      email: "test@example.com",
      phoneNumber: "+1234567890",
      role: "user",
      isSuspended: false,
      isVerified: true,
      twoFactorEnabled: false,
      accountNumber: "1234567890",
      providerName: "test-provider",
      balance: "100.00",
      hasPin: true,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    },
    isAuthenticated: true,
    isLoading: false,
  })),
  useResendVerification: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock useNotifications
vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: vi.fn(() => ({
    data: {
      success: true,
      data: {
        notifications: [
          {
            id: "1",
            notification: { title: "System Update", category: "updates" },
          },
          {
            id: "2",
            notification: { title: "Welcome", category: "general" },
          },
        ],
      },
    },
    isLoading: false,
    error: null,
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

describe("HomeNotificationBanner", () => {
  it("renders notifications with 'updates' category", async () => {
    render(<HomeNotificationBanner />, { wrapper: createWrapper() });

    // Wait for the component to render and fetch data
    await waitFor(
      () => {
        expect(screen.getByText("System Update")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Check that only the "System Update" notification is shown
    // "Welcome" (general) should be filtered out based on the component logic
    expect(screen.getByText("System Update")).toBeInTheDocument();
    expect(screen.queryByText("Welcome")).not.toBeInTheDocument();
  });
});
