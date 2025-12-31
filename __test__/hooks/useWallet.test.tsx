import { renderHook, waitFor } from "@testing-library/react";
import { useWallet, useWalletBalance } from "@/hooks/useWallet";
import { walletService } from "@/services/wallet.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

vi.mock("@/services/wallet.service");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useWallet Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useWallet", () => {
    it("should fetch and return wallet data", async () => {
      const mockWallet = { balance: "1000", id: "w1" };
      (walletService.getWallet as vi.Mock).mockResolvedValue({
        success: true,
        data: mockWallet,
      });

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual(mockWallet);
    });
  });

  describe("useWalletBalance", () => {
    it("should fetch and return balance data", async () => {
      const mockBalance = { balance: "500" };
      (walletService.getBalance as vi.Mock).mockResolvedValue({
        success: true,
        data: mockBalance,
      });

      const { result } = renderHook(() => useWalletBalance(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toEqual(mockBalance);
    });
  });
});
