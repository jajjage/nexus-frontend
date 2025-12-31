import apiClient from "@/lib/api-client";
import { walletService } from "@/services/wallet.service";

jest.mock("@/lib/api-client");
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("walletService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getWallet", () => {
    it("should call GET /user/wallet", async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { success: true } });
      await walletService.getWallet();
      expect(mockApiClient.get).toHaveBeenCalledWith("/user/wallet");
    });
  });

  describe("getBalance", () => {
    it("should call GET /user/wallet/balance", async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { success: true } });
      await walletService.getBalance();
      expect(mockApiClient.get).toHaveBeenCalledWith("/user/wallet/balance");
    });
  });

  describe("getTransactions", () => {
    it("should call GET /user/wallet/transactions with params", async () => {
      const params = { page: 1, limit: 10 };
      mockApiClient.get.mockResolvedValueOnce({ data: { success: true } });
      await walletService.getTransactions(params);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/user/wallet/transactions",
        { params }
      );
    });
  });
});
