import { JobListTable } from "@/components/features/admin/jobs/JobListTable";
import {
  useAdminJobs,
  useDeleteJob,
  useRetryJob,
} from "@/hooks/admin/useAdminJobs";
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
vi.mock("@/hooks/admin/useAdminJobs", () => ({
  useAdminJobs: vi.fn(),
  useRetryJob: vi.fn(),
  useDeleteJob: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("JobListTable", () => {
  const mockJobs = [
    {
      id: "job-1",
      type: "email_notification",
      status: "completed" as const,
      attempts: 1,
      maxAttempts: 3,
      createdAt: "2024-01-01T10:00:00Z",
    },
    {
      id: "job-2",
      type: "sms_notification",
      status: "failed" as const,
      attempts: 3,
      maxAttempts: 3,
      error: "Provider unavailable",
      createdAt: "2024-01-02T12:00:00Z",
      failedAt: "2024-01-02T12:05:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRetryJob as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    (useDeleteJob as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it("should display jobs list", () => {
    (useAdminJobs as vi.Mock).mockReturnValue({
      data: {
        data: {
          jobs: mockJobs,
          pagination: { page: 1, totalPages: 1, total: 2 },
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<JobListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("email_notification")).toBeInTheDocument();
    expect(screen.getByText("sms_notification")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
  });

  it("should show loading skeleton", () => {
    (useAdminJobs as vi.Mock).mockReturnValue({
      isLoading: true,
      isError: false,
    });

    render(<JobListTable />, { wrapper: createWrapper() });

    // Skeleton elements should be present
    expect(screen.queryByText("email_notification")).not.toBeInTheDocument();
  });

  it("should show empty state when no jobs", () => {
    (useAdminJobs as vi.Mock).mockReturnValue({
      data: {
        data: {
          jobs: [],
          pagination: { page: 1, totalPages: 0, total: 0 },
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<JobListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("No jobs found")).toBeInTheDocument();
  });

  it("should show error state", () => {
    (useAdminJobs as vi.Mock).mockReturnValue({
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    render(<JobListTable />, { wrapper: createWrapper() });

    expect(screen.getByText("Failed to load jobs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
