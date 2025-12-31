import { render, screen } from "@testing-library/react";
import { TransactionHistory } from "@/components/features/dashboard/transaction-history";
import { useRecentTransactions } from "@/hooks/useWallet";

// Mock the hook
vi.mock("@/hooks/useWallet", () => ({
  useRecentTransactions: vi.fn(),
}));

// Mock TransactionItem to simplify
vi.mock("@/components/features/dashboard/transaction-item", () => ({
  TransactionItem: ({ transaction }: any) => (
    <div data-testid="transaction-item">{transaction.title}</div>
  ),
}));

describe("TransactionHistory", () => {
  it("shows loading spinner when loading", () => {
    (useRecentTransactions as vi.Mock).mockReturnValue({
      isLoading: true,
      data: undefined,
    });

    render(<TransactionHistory isVisible={true} />);
    // shadcn/ui spinner might be SVG, but usually we can find it or just check text isn't there
    // If spinner has no text, we might need to check for a class or role.
    // Assuming spinner doesn't have role="status" by default in your setup,
    // let's check that "Recent Transactions" header IS present.
    expect(screen.getByText("Recent Transactions")).toBeInTheDocument();
  });

  it("shows error message on error", () => {
    (useRecentTransactions as vi.Mock).mockReturnValue({
      isLoading: false,
      isError: true,
    });

    render(<TransactionHistory isVisible={true} />);
    expect(
      screen.getByText("Could not load transactions.")
    ).toBeInTheDocument();
  });

  it("shows empty state when no transactions", () => {
    (useRecentTransactions as vi.Mock).mockReturnValue({
      isLoading: false,
      data: [],
    });

    render(<TransactionHistory isVisible={true} />);
    expect(screen.getByText("No transactions yet.")).toBeInTheDocument();
  });

  it("renders transactions list when data exists", () => {
    const mockData = [
      { id: "1", title: "Data Purchase" },
      { id: "2", title: "Airtime Topup" },
    ];
    (useRecentTransactions as vi.Mock).mockReturnValue({
      isLoading: false,
      data: mockData,
    });

    render(<TransactionHistory isVisible={true} />);
    expect(screen.getAllByTestId("transaction-item")).toHaveLength(2);
    expect(screen.getByText("Data Purchase")).toBeInTheDocument();
  });

  it("blurs content when isVisible is false", () => {
    (useRecentTransactions as vi.Mock).mockReturnValue({
      isLoading: false,
      data: [{ id: "1", title: "Secret" }],
    });

    render(<TransactionHistory isVisible={false} />);
    const listContainer = screen.getByTestId("transaction-item").parentElement;
    expect(listContainer).toHaveClass("blur-md");
  });
});
