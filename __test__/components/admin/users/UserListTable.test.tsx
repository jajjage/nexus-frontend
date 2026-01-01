import { UserListTable } from "@/components/features/admin/users/UserListTable";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the hook
vi.mock("@/hooks/admin/useAdminUsers");
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

const mockUseAdminUsers = useAdminUsers as Mock;

describe("UserListTable", () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading skeleton when loading", () => {
    mockUseAdminUsers.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<UserListTable />, { wrapper: createWrapper() });

    // When loading, the main table should not be visible yet
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("should render error message when fetch fails", () => {
    mockUseAdminUsers.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<UserListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("Failed to load users")).toBeInTheDocument();
  });

  it("should render user list when data is loaded", () => {
    mockUseAdminUsers.mockReturnValue({
      data: {
        data: {
          users: [
            {
              id: "user-1",
              userId: "user-1",
              fullName: "John Doe",
              email: "john@example.com",
              role: "user",
              isSuspended: false,
              balance: "100",
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    render(<UserListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("should render suspended badge for suspended users", () => {
    mockUseAdminUsers.mockReturnValue({
      data: {
        data: {
          users: [
            {
              id: "user-1",
              userId: "user-1",
              fullName: "Jane Suspended",
              email: "jane@example.com",
              role: "user",
              isSuspended: true,
              balance: "50",
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    render(<UserListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("Jane Suspended")).toBeInTheDocument();
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });

  it("should show empty state when no users", () => {
    mockUseAdminUsers.mockReturnValue({
      data: {
        data: {
          users: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    render(<UserListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("No users found")).toBeInTheDocument();
  });
});
