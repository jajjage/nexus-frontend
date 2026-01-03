import apiClient from "@/lib/api-client";
import { adminSupplierService } from "@/services/admin/supplier.service";
import { vi, type Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("adminSupplierService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSuppliers", () => {
    it("should call GET /admin/suppliers", async () => {
      const mockSuppliers = [
        {
          id: "sup-1",
          name: "Supplier A",
          slug: "supplier-a",
          apiBase: "https://api.supplier-a.com",
          priorityInt: 1,
          isActive: true,
        },
        {
          id: "sup-2",
          name: "Supplier B",
          slug: "supplier-b",
          apiBase: "https://api.supplier-b.com",
          priorityInt: 2,
          isActive: false,
        },
      ];

      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { suppliers: mockSuppliers },
        },
      });

      const result = await adminSupplierService.getSuppliers();

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/suppliers");
      expect(result.data!.suppliers).toHaveLength(2);
      expect(result.data!.suppliers[0].slug).toBe("supplier-a");
    });

    it("should return empty array when no suppliers exist", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { suppliers: [] },
        },
      });

      const result = await adminSupplierService.getSuppliers();

      expect(result.data!.suppliers).toEqual([]);
    });
  });

  describe("getSupplierById", () => {
    it("should call GET /admin/suppliers/:supplierId", async () => {
      const mockSupplier = {
        id: "sup-123",
        name: "Test Supplier",
        slug: "test-supplier",
        apiBase: "https://api.test.com",
        apiKey: "sk_test_***",
        priorityInt: 1,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { supplier: mockSupplier },
        },
      });

      const result = await adminSupplierService.getSupplierById("sup-123");

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/admin/suppliers/sup-123"
      );
      expect(result.data).toEqual(mockSupplier);
    });
  });

  describe("createSupplier", () => {
    it("should call POST /admin/suppliers with request body", async () => {
      const createData = {
        name: "New Supplier",
        slug: "new-supplier",
        apiBase: "https://api.new-supplier.com",
        apiKey: "sk_live_123",
        priorityInt: 3,
        isActive: true,
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Supplier created successfully",
          data: {
            supplier: {
              id: "sup-new",
              ...createData,
            },
          },
        },
      });

      const result = await adminSupplierService.createSupplier(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/admin/suppliers",
        createData
      );
      expect(result.success).toBe(true);
      expect(result.data!.supplier.name).toBe("New Supplier");
    });
  });

  describe("updateSupplier", () => {
    it("should call PUT /admin/suppliers/:supplierId with update data", async () => {
      const updateData = {
        name: "Updated Supplier",
        isActive: false,
      };

      mockApiClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Supplier updated successfully",
          data: {
            supplier: {
              id: "sup-123",
              name: "Updated Supplier",
              slug: "test-supplier",
              isActive: false,
            },
          },
        },
      });

      const result = await adminSupplierService.updateSupplier(
        "sup-123",
        updateData
      );

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/admin/suppliers/sup-123",
        updateData
      );
      expect(result.data!.supplier.name).toBe("Updated Supplier");
      expect(result.data!.supplier.isActive).toBe(false);
    });

    it("should allow partial updates", async () => {
      const updateData = { priorityInt: 5 };

      mockApiClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          data: { supplier: { id: "sup-123", priorityInt: 5 } },
        },
      });

      await adminSupplierService.updateSupplier("sup-123", updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/admin/suppliers/sup-123",
        updateData
      );
    });
  });
});
