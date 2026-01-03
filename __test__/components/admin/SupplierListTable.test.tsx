import { SupplierListTable } from "@/components/features/admin/suppliers/SupplierListTable";
import {
  useAdminSuppliers,
  useUpdateSupplier,
} from "@/hooks/admin/useAdminSuppliers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock hooks
vi.mock("@/hooks/admin/useAdminSuppliers", () => ({
  useAdminSuppliers: vi.fn(),
  useUpdateSupplier: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("SupplierListTable", () => {
  const mockSuppliers = [
    {
      id: "sup-1",
      name: "Supplier One",
      slug: "supplier-one",
      apiBase: "https://api.one.com",
      priorityInt: 1,
      isActive: true,
    },
    {
      id: "sup-2",
      name: "Supplier Two",
      slug: "supplier-two",
      apiBase: "https://api.two.com",
      priorityInt: 2,
      isActive: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useUpdateSupplier as Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it("should display suppliers list", () => {
    (useAdminSuppliers as Mock).mockReturnValue({
      data: {
        data: {
          suppliers: mockSuppliers,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<SupplierListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("Supplier One")).toBeInTheDocument();
    expect(screen.getByText("Supplier Two")).toBeInTheDocument();
    expect(screen.getByText("supplier-one")).toBeInTheDocument();
    expect(screen.getByText("supplier-two")).toBeInTheDocument();
  });

  it("should display priority badges", () => {
    (useAdminSuppliers as Mock).mockReturnValue({
      data: {
        data: {
          suppliers: mockSuppliers,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<SupplierListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should show loading skeleton", () => {
    (useAdminSuppliers as Mock).mockReturnValue({
      isLoading: true,
      isError: false,
    });

    render(<SupplierListTable />, { wrapper: createWrapper() });

    expect(screen.queryByText("Supplier One")).not.toBeInTheDocument();
  });

  it("should show empty state when no suppliers", () => {
    (useAdminSuppliers as Mock).mockReturnValue({
      data: {
        data: {
          suppliers: [],
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<SupplierListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("No suppliers found")).toBeInTheDocument();
  });

  it("should show error state", () => {
    (useAdminSuppliers as Mock).mockReturnValue({
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    render(<SupplierListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("Failed to load suppliers")).toBeInTheDocument();
  });

  it("should display supplier count and active count", () => {
    (useAdminSuppliers as Mock).mockReturnValue({
      data: {
        data: {
          suppliers: mockSuppliers,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<SupplierListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("2 suppliers total")).toBeInTheDocument();
    expect(screen.getByText("1 active")).toBeInTheDocument();
  });
});
