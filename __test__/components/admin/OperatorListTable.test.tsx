import { OperatorListTable } from "@/components/features/admin/operators/OperatorListTable";
import { useAdminOperators } from "@/hooks/admin/useAdminOperators";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock hooks
vi.mock("@/hooks/admin/useAdminOperators", () => ({
  useAdminOperators: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("OperatorListTable", () => {
  const mockOperators = [
    {
      id: "op-1",
      code: "MTN",
      name: "MTN Nigeria",
      isoCountry: "NG",
      isActive: true,
    },
    {
      id: "op-2",
      code: "AIRTEL",
      name: "Airtel Nigeria",
      isoCountry: "NG",
      isActive: true,
    },
    {
      id: "op-3",
      code: "GLO",
      name: "Globacom",
      isoCountry: "NG",
      isActive: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display operators list", () => {
    (useAdminOperators as Mock).mockReturnValue({
      data: {
        data: {
          operators: mockOperators,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<OperatorListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("MTN")).toBeInTheDocument();
    expect(screen.getByText("MTN Nigeria")).toBeInTheDocument();
    expect(screen.getByText("AIRTEL")).toBeInTheDocument();
    expect(screen.getByText("Airtel Nigeria")).toBeInTheDocument();
    expect(screen.getByText("GLO")).toBeInTheDocument();
    expect(screen.getByText("Globacom")).toBeInTheDocument();
  });

  it("should display country codes", () => {
    (useAdminOperators as Mock).mockReturnValue({
      data: {
        data: {
          operators: mockOperators,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<OperatorListTable />, { wrapper: createWrapper() });

    // All operators are from NG
    const countryBadges = screen.getAllByText("NG");
    expect(countryBadges).toHaveLength(3);
  });

  it("should display status badges", () => {
    (useAdminOperators as Mock).mockReturnValue({
      data: {
        data: {
          operators: mockOperators,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<OperatorListTable />, { wrapper: createWrapper() });

    // 2 active, 1 inactive
    expect(screen.getAllByText("Active")).toHaveLength(2);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("should show loading skeleton", () => {
    (useAdminOperators as Mock).mockReturnValue({
      isLoading: true,
      isError: false,
    });

    render(<OperatorListTable />, { wrapper: createWrapper() });

    expect(screen.queryByText("MTN")).not.toBeInTheDocument();
  });

  it("should show empty state when no operators", () => {
    (useAdminOperators as Mock).mockReturnValue({
      data: {
        data: {
          operators: [],
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<OperatorListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("No operators found")).toBeInTheDocument();
  });

  it("should show error state", () => {
    (useAdminOperators as Mock).mockReturnValue({
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    render(<OperatorListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("Failed to load operators")).toBeInTheDocument();
  });

  it("should display operator count", () => {
    (useAdminOperators as Mock).mockReturnValue({
      data: {
        data: {
          operators: mockOperators,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<OperatorListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("3 operators total")).toBeInTheDocument();
  });
});
