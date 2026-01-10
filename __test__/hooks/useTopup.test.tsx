import { useTopup } from "@/hooks/useTopup";
import { topupService } from "@/services/topup.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { toast } from "sonner";
import { Mock } from "vitest";

vi.mock("@/services/topup.service");
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useTopup Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call initiateTopup and show success toast on success", async () => {
    (topupService.initiateTopup as Mock).mockResolvedValue({
      success: true,
      message: "Topup in progress",
    });

    const { result } = renderHook(() => useTopup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      amount: 100,
      productCode: "abc",
      recipientPhone: "123",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Order Placed"),
      expect.any(Object)
    );
  });

  it("should show error toast on failure", async () => {
    (topupService.initiateTopup as Mock).mockRejectedValue({
      response: { data: { message: "Invalid PIN" } },
    });

    const { result } = renderHook(() => useTopup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      amount: 100,
      productCode: "abc",
      recipientPhone: "123",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed"),
      expect.objectContaining({ description: "Invalid PIN" })
    );
  });
});
