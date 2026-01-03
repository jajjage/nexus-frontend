import { SettlementListTable } from "@/components/features/admin/settlements/SettlementListTable";
import { useAdminSettlements } from "@/hooks/admin/useAdminSettlements";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock hooks
vi.mock("@/hooks/admin/useAdminSettlements", () => ({
  useAdminSettlements: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("SettlementListTable", () => {
  const mockSettlements = [
    {
      id: "set-1",
      providerId: "provider-1",
      providerName: "Provider A",
      settlementDate: "2024-01-15",
      amount: 100000,
      fees: 1500,
      netAmount: 98500,
      reference: "SET-001",
    },
    {
      id: "set-2",
      providerId: "provider-2",
      providerName: "Provider B",
      settlementDate: "2024-01-20",
      amount: 50000,
      fees: 750,
      netAmount: 49250,
      reference: "SET-002",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display settlements list", () => {
    (useAdminSettlements as vi.Mock).mockReturnValue({
      data: {
        data: {
          settlements: mockSettlements,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<SettlementListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("Provider A")).toBeInTheDocument();
    expect(screen.getByText("Provider B")).toBeInTheDocument();
    expect(screen.getByText("SET-001")).toBeInTheDocument();
    expect(screen.getByText("SET-002")).toBeInTheDocument();
  });

  it("should show loading skeleton", () => {
    (useAdminSettlements as vi.Mock).mockReturnValue({
      isLoading: true,
      isError: false,
    });

    render(<SettlementListTable />, { wrapper: createWrapper() });

    expect(screen.queryByText("Provider A")).not.toBeInTheDocument();
  });

  it("should show empty state when no settlements", () => {
    (useAdminSettlements as vi.Mock).mockReturnValue({
      data: {
        data: {
          settlements: [],
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<SettlementListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("No settlements found")).toBeInTheDocument();
  });

  it("should show error state", () => {
    (useAdminSettlements as vi.Mock).mockReturnValue({
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    render(<SettlementListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("Failed to load settlements")).toBeInTheDocument();
  });

  it("should display summary totals", () => {
    (useAdminSettlements as vi.Mock).mockReturnValue({
      data: {
        data: {
          settlements: mockSettlements,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<SettlementListTable />, { wrapper: createWrapper() });

    // Check that totals are calculated
    expect(screen.getByText("Total Amount:")).toBeInTheDocument();
    expect(screen.getByText("Total Fees:")).toBeInTheDocument();
    expect(screen.getByText("Total Net:")).toBeInTheDocument();
  });
});
