import apiClient from "@/lib/api-client";
import { adminSupplierMarkupService } from "@/services/admin/supplier-markup.service";
import { vi, type Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("adminSupplierMarkupService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMarkups", () => {
    it("should call GET /admin/supplier-markups without params", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { markups: [], pagination: {} },
        },
      });

      await adminSupplierMarkupService.getMarkups();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/supplier-markups",
        {
          params: undefined,
        }
      );
    });

    it("should call GET /admin/supplier-markups with supplierId filter", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { markups: [], pagination: {} },
        },
      });

      await adminSupplierMarkupService.getMarkups({ supplierId: "sup-123" });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/supplier-markups",
        {
          params: { supplierId: "sup-123" },
        }
      );
    });
  });

  describe("getMarkupById", () => {
    it("should call GET /admin/supplier-markups/:id", async () => {
      const mockMarkup = {
        id: "markup-123",
        supplierId: "sup-1",
        operatorProductId: "prod-1",
        markupPercent: 5,
        validFrom: "2024-01-01",
        validUntil: "2024-12-31",
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { markup: mockMarkup },
        },
      });

      const result =
        await adminSupplierMarkupService.getMarkupById("markup-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/supplier-markups/markup-123"
      );
      expect(result.data!.markup).toEqual(mockMarkup);
    });
  });

  describe("createMarkup", () => {
    it("should call POST /admin/supplier-markups with request body", async () => {
      const createData = {
        supplierId: "sup-1",
        operatorProductId: "prod-1",
        markupPercent: 10,
        validFrom: "2024-01-01",
        validUntil: "2024-06-30",
        description: "Test markup",
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Markup created successfully",
          data: { markup: { id: "markup-new", ...createData } },
        },
      });

      const result = await adminSupplierMarkupService.createMarkup(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/supplier-markups",
        createData
      );
      expect(result.success).toBe(true);
    });
  });

  describe("updateMarkup", () => {
    it("should call PUT /admin/supplier-markups/:id with update data", async () => {
      const updateData = { markupPercent: 15 };

      mockApiClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          data: { markup: { id: "markup-123", markupPercent: 15 } },
        },
      });

      await adminSupplierMarkupService.updateMarkup("markup-123", updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/admin/supplier-markups/markup-123",
        updateData
      );
    });
  });

  describe("deleteMarkup", () => {
    it("should call DELETE /admin/supplier-markups/:id", async () => {
      mockApiClient.delete.mockResolvedValueOnce({
        data: { success: true, message: "Markup deleted" },
      });

      await adminSupplierMarkupService.deleteMarkup("markup-123");

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/admin/supplier-markups/markup-123"
      );
    });
  });

  describe("activateMarkup", () => {
    it("should call PATCH /admin/supplier-markups/:id/activate", async () => {
      mockApiClient.patch.mockResolvedValueOnce({
        data: {
          success: true,
          data: { markup: { id: "markup-123", isActive: true } },
        },
      });

      await adminSupplierMarkupService.activateMarkup("markup-123");

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        "/admin/supplier-markups/markup-123/activate"
      );
    });
  });

  describe("deactivateMarkup", () => {
    it("should call PATCH /admin/supplier-markups/:id/deactivate", async () => {
      mockApiClient.patch.mockResolvedValueOnce({
        data: {
          success: true,
          data: { markup: { id: "markup-123", isActive: false } },
        },
      });

      await adminSupplierMarkupService.deactivateMarkup("markup-123");

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        "/admin/supplier-markups/markup-123/deactivate"
      );
    });
  });
});
