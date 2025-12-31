import apiClient from "@/lib/api-client";
import { topupService } from "@/services/topup.service";

jest.mock("@/lib/api-client");
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("topupService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initiateTopup", () => {
    it("should call POST /user/topup with correct data", async () => {
      const mockRequest = {
        amount: 1000,
        productCode: "data-1GB",
        recipientPhone: "08012345678",
        pin: "1234",
      };

      mockApiClient.post.mockResolvedValueOnce({
        status: 200,
        data: { success: true, data: { transactionId: "txn-123" } },
      });

      const result = await topupService.initiateTopup(mockRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/user/topup",
        mockRequest
      );
      expect(result.success).toBe(true);
    });
  });
});
