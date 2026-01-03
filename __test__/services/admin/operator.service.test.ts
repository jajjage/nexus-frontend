import apiClient from "@/lib/api-client";
import { adminOperatorService } from "@/services/admin/operator.service";
import { vi, type Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("adminOperatorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOperators", () => {
    it("should call GET /admin/operators", async () => {
      const mockOperators = [
        { id: "op-1", code: "MTN", name: "MTN Nigeria", isoCountry: "NG" },
        {
          id: "op-2",
          code: "AIRTEL",
          name: "Airtel Nigeria",
          isoCountry: "NG",
        },
      ];

      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { operators: mockOperators },
        },
      });

      const result = await adminOperatorService.getOperators();

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/operators");
      expect(result.data.operators).toHaveLength(2);
      expect(result.data.operators[0].code).toBe("MTN");
    });

    it("should return empty array when no operators exist", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { operators: [] },
        },
      });

      const result = await adminOperatorService.getOperators();

      expect(result.data.operators).toEqual([]);
    });
  });

  describe("getOperatorById", () => {
    it("should call GET /admin/operators/:operatorId", async () => {
      const mockOperator = {
        id: "op-123",
        code: "GLO",
        name: "Globacom",
        isoCountry: "NG",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { operator: mockOperator },
        },
      });

      const result = await adminOperatorService.getOperatorById("op-123");

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/operators/op-123");
      expect(result.data.operator).toEqual(mockOperator);
    });
  });

  describe("createOperator", () => {
    it("should call POST /admin/operators with request body", async () => {
      const createData = {
        code: "9MOBILE",
        name: "9Mobile Nigeria",
        isoCountry: "NG",
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Operator created successfully",
          data: {
            operator: {
              id: "op-new",
              ...createData,
              isActive: true,
            },
          },
        },
      });

      const result = await adminOperatorService.createOperator(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/operators",
        createData
      );
      expect(result.success).toBe(true);
      expect(result.data.operator.code).toBe("9MOBILE");
    });
  });

  describe("updateOperator", () => {
    it("should call PUT /admin/operators/:operatorId with update data", async () => {
      const updateData = {
        name: "MTN Nigeria Updated",
        isoCountry: "NG",
      };

      mockApiClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Operator updated successfully",
          data: {
            operator: {
              id: "op-123",
              code: "MTN",
              ...updateData,
            },
          },
        },
      });

      const result = await adminOperatorService.updateOperator(
        "op-123",
        updateData
      );

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/admin/operators/op-123",
        updateData
      );
      expect(result.data.operator.name).toBe("MTN Nigeria Updated");
    });

    it("should allow partial updates", async () => {
      const updateData = { name: "New Name Only" };

      mockApiClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          data: { operator: { id: "op-123", name: "New Name Only" } },
        },
      });

      await adminOperatorService.updateOperator("op-123", updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/admin/operators/op-123",
        updateData
      );
    });
  });
});
