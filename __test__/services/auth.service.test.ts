import apiClient from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import { Mocked } from "vitest";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as Mocked<typeof apiClient>;

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should call POST /auth/register", async () => {
      const mockData = {
        email: "test@test.com",
        password: "password",
        fullName: "Test",
        phoneNumber: "08012345678",
      };
      mockApiClient.post.mockResolvedValueOnce({ data: { success: true } });

      await authService.register(mockData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/auth/register",
        mockData
      );
    });
  });

  describe("login", () => {
    it("should call POST /auth/login", async () => {
      const mockData = { email: "test@test.com", password: "password" };
      mockApiClient.post.mockResolvedValueOnce({ data: { success: true } });

      await authService.login(mockData);

      expect(mockApiClient.post).toHaveBeenCalledWith("/auth/login", mockData);
    });
  });

  describe("getProfile", () => {
    it("should call GET /user/profile/me", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { data: { userId: "123" } },
      });

      const user = await authService.getProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/user/profile/me",
        expect.any(Object)
      );
      expect(user).toEqual({ userId: "123" });
    });

    it("should bypass cache when forceRefresh is true", async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { data: {} } });

      await authService.getProfile(true);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("?t="),
        expect.any(Object)
      );
    });
  });

  describe("refreshToken", () => {
    it("should call POST /auth/refresh", async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: { success: true } });

      await authService.refreshToken();

      expect(mockApiClient.post).toHaveBeenCalledWith("/auth/refresh");
    });
  });
});
