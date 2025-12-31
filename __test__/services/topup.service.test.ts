import apiClient from "@/lib/api-client";
import { topupService } from "@/services/topup.service";

vi.mock("@/lib/api-client");
const mockApiClient = apiClient as vi.Mocked<typeof apiClient>;

describe("topupService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
