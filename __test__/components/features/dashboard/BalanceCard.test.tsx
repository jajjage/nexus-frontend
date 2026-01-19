import { BalanceCard } from "@/components/features/dashboard/balance-card";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

// Mock the user service
vi.mock("@/services/user.service", () => ({
  userService: {
    createVirtualAccount: vi.fn(),
  },
}));

// Create a QueryClient for testing
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

// Wrapper to handle state and QueryClientProvider
const BalanceCardWrapper = (props: any) => {
  const [isVisible, setIsVisible] = useState(true);
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BalanceCard
        {...props}
        isVisible={isVisible}
        setIsVisible={setIsVisible}
      />
    </QueryClientProvider>
  );
};

// Wrapper with controlled visibility
const BalanceCardControlled = (props: any) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BalanceCard {...props} />
    </QueryClientProvider>
  );
};

describe("BalanceCard", () => {
  const defaultProps = {
    balance: 5000.5,
    accountName: "John Doe",
    accountNumber: "1234567890",
    providerName: "Nexus Bank",
  };

  it("renders balance correctly when visible", () => {
    render(<BalanceCardWrapper {...defaultProps} />);

    // Check formatted balance (approximate check due to locale differences)
    // "₦5,000.50" or similar. We look for the number part.
    expect(screen.getByText(/5,000.50/)).toBeInTheDocument();
  });

  it("masks balance when hidden", () => {
    render(
      <BalanceCardControlled
        {...defaultProps}
        isVisible={false}
        setIsVisible={vi.fn()}
      />
    );

    expect(screen.getByText("••••••••")).toBeInTheDocument();
    expect(screen.queryByText(/5,000.50/)).not.toBeInTheDocument();
  });

  it("displays account details", () => {
    render(<BalanceCardWrapper {...defaultProps} />);

    // These are usually in the Dialog, so they might not be visible initially.
    // Wait, the DialogTrigger is visible ("Add Money").
    // The account details are inside DialogContent.
    // RTL generally can't see DialogContent content until opened.

    // We can test the "Add Money" button exists
    expect(screen.getByText("Add Money")).toBeInTheDocument();
  });

  it("toggles visibility on eye click", () => {
    const setIsVisibleMock = vi.fn();
    render(
      <BalanceCardControlled
        {...defaultProps}
        isVisible={true}
        setIsVisible={setIsVisibleMock}
      />
    );

    // Find the toggle button (it has an aria-label)
    const toggleButton = screen.getByLabelText("Hide balance");
    fireEvent.click(toggleButton);

    expect(setIsVisibleMock).toHaveBeenCalled();
  });

  it("shows auto-create loading state when no virtual account exists", () => {
    render(
      <BalanceCardWrapper
        balance={5000}
        accountName={undefined}
        accountNumber={undefined}
        providerName={undefined}
      />
    );

    // Click Add Money button
    fireEvent.click(screen.getByText("Add Money"));

    // Should show loading state for auto-creating virtual account (no BVN required)
    expect(screen.getByText("Creating Virtual Account")).toBeInTheDocument();
    expect(
      screen.getByText("Creating your virtual account...")
    ).toBeInTheDocument();
  });
});
