import { render, screen, waitFor } from "@testing-library/react";
import { HomeNotificationBanner } from "@/components/notification/home-notification-banner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: { userId: "123" },
    isAuthenticated: true,
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

// Mock the child component to isolate the test
vi.mock("@/components/notification/notification-banner", () => ({
  NotificationBanner: ({ notifications }: { notifications: any[] }) => (
    <div data-testid="notification-banner">
      {notifications.map((n) => (
        <div key={n.id} data-testid="notification-item">
          {n.notification.title}
        </div>
      ))}
    </div>
  ),
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

    // Wait for the banner to appear
    await waitFor(() => {
      expect(screen.getByTestId("notification-banner")).toBeInTheDocument();
    });

    // Check that only the "System Update" notification is shown
    // "Welcome" (general) should be filtered out based on the component logic
    expect(screen.getByText("System Update")).toBeInTheDocument();
    expect(screen.queryByText("Welcome")).not.toBeInTheDocument();
  });
});
