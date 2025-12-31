import apiClient from "@/lib/api-client";
import { userService } from "@/services/user.service";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as vi.Mocked<typeof apiClient>;

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should call GET /user/profile/me", async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { success: true } });
      await userService.getProfile();
      expect(mockApiClient.get).toHaveBeenCalledWith("/user/profile/me");
    });
  });

  describe("updateProfile", () => {
    it("should call PUT /user/profile/me with data", async () => {
      const mockData = { fullName: "New Name" };
      mockApiClient.put.mockResolvedValueOnce({ data: { success: true } });
      await userService.updateProfile(mockData);
      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/user/profile/me",
        mockData
      );
    });
  });

  describe("setPin", () => {
    it("should call PUT /user/profile/pin with data", async () => {
      const mockData = { pin: "1234" };
      mockApiClient.put.mockResolvedValueOnce({ data: { success: true } });
      await userService.setPin(mockData);
      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/user/profile/pin",
        mockData
      );
    });
  });
});
