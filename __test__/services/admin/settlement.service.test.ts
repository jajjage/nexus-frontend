import apiClient from "@/lib/api-client";
import { adminSettlementService } from "@/services/admin/settlement.service";
import { vi, type Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("adminSettlementService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSettlements", () => {
    it("should call GET /admin/settlements without params", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { settlements: [] },
        },
      });

      await adminSettlementService.getSettlements();

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/settlements", {
        params: undefined,
      });
    });

    it("should call GET /admin/settlements with date filters", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { settlements: [] },
        },
      });

      await adminSettlementService.getSettlements({
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      });

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/settlements", {
        params: { dateFrom: "2024-01-01", dateTo: "2024-01-31" },
      });
    });

    it("should call GET /admin/settlements with providerId filter", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { settlements: [] },
        },
      });

      await adminSettlementService.getSettlements({
        providerId: "provider-123",
      });

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/settlements", {
        params: { providerId: "provider-123" },
      });
    });
  });

  describe("getSettlementById", () => {
    it("should call GET /admin/settlements/:settlementId", async () => {
      const mockSettlement = {
        id: "set-123",
        providerId: "provider-1",
        settlementDate: "2024-01-15",
        amount: 100000,
        fees: 1500,
        netAmount: 98500,
        reference: "SET-2024-001",
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockSettlement,
        },
      });

      const result = await adminSettlementService.getSettlementById("set-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/settlements/set-123"
      );
      expect(result.data).toEqual(mockSettlement);
    });
  });

  describe("createSettlement", () => {
    it("should call POST /admin/settlements with request body", async () => {
      const createData = {
        providerId: "provider-1",
        settlementDate: "2024-01-20",
        amount: 50000,
        fees: 750,
        reference: "SET-2024-002",
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Settlement created successfully",
          data: {
            settlement: {
              id: "set-new",
              ...createData,
              netAmount: 49250,
            },
          },
        },
      });

      const result = await adminSettlementService.createSettlement(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/settlements",
        createData
      );
      expect(result.success).toBe(true);
      expect(result.data?.settlement.netAmount).toBe(49250);
    });

    it("should handle createSettlement with rawReport", async () => {
      const createData = {
        providerId: "provider-1",
        settlementDate: "2024-01-20",
        amount: 50000,
        fees: 750,
        reference: "SET-2024-003",
        rawReport: { transactionCount: 100, batchId: "batch-abc" },
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: { settlement: { id: "set-new", ...createData } },
        },
      });

      await adminSettlementService.createSettlement(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/settlements",
        createData
      );
    });
  });
});
