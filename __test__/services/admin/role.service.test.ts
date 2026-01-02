import apiClient from "@/lib/api-client";
import { adminRoleService } from "@/services/admin/role.service";
import { vi, type Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("adminRoleService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRoles", () => {
    it("should call GET /admin/roles", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            roles: [
              { id: "1", name: "admin", description: "Administrator" },
              { id: "2", name: "user", description: "Regular User" },
            ],
          },
        },
      });

      await adminRoleService.getRoles();

      expect(mockApiClient.get).toHaveBeenCalledWith("/admin/roles");
    });
  });

  describe("assignRole", () => {
    it("should call POST /admin/assign-role with data", async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Role assigned successfully",
          data: {
            userId: "user-123",
            roleId: "role-456",
            roleName: "admin",
          },
        },
      });

      await adminRoleService.assignRole({
        userId: "user-123",
        roleId: "role-456",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/admin/assign-role", {
        userId: "user-123",
        roleId: "role-456",
      });
    });
  });
});
