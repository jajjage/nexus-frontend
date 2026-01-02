import apiClient from "@/lib/api-client";
import { adminTransactionService } from "@/services/admin/transaction.service";
import { vi, type Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("adminTransactionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTransactions", () => {
    it("should call GET /admin/transactions with no params", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            transactions: [],
            pagination: { page: 1, limit: 10, total: 0 },
          },
        },
      });

      await adminTransactionService.getTransactions();

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/transactions", {
        params: undefined,
      });
    });

    it("should call GET /admin/transactions with filters", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { transactions: [], pagination: {} },
        },
      });

      await adminTransactionService.getTransactions({
        page: 2,
        limit: 20,
        direction: "credit",
        userId: "user-123",
      });

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/transactions", {
        params: {
          page: 2,
          limit: 20,
          direction: "credit",
          userId: "user-123",
        },
      });
    });
  });

  describe("getTransactionById", () => {
    it("should call GET /admin/transactions/:transactionId", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            transaction: {
              id: "tx-123",
              type: "topup",
              amount: "1000",
            },
          },
        },
      });

      await adminTransactionService.getTransactionById("tx-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/transactions/tx-123"
      );
    });
  });
});
