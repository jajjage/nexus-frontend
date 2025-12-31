import apiClient from "@/lib/api-client";
import { verificationService } from "@/services/verification.service";
import { topupService } from "@/services/topup.service";

vi.mock("@/lib/api-client");
vi.mock("@/services/topup.service");

const mockApiClient = apiClient as vi.Mocked<typeof apiClient>;
const mockTopupService = topupService as vi.Mocked<typeof topupService>;

describe("verificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verifyBiometricForUnlock", () => {
    it("should call POST /biometric/auth/verify with intent: unlock", async () => {
      const mockRequest = {
        id: "credential-id",
        rawId: "raw-credential-id",
        response: {
          clientDataJSON: "client-data",
          authenticatorData: "authenticator-data",
          signature: "signature",
        },
        type: "public-key" as const,
        intent: "unlock" as const,
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          data: { success: true },
        },
      });

      const result =
        await verificationService.verifyBiometricForUnlock(mockRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/biometric/auth/verify",
        expect.objectContaining({
          intent: "unlock",
        })
      );
      expect(result.success).toBe(true);
    });

    it("should handle biometric verification errors", async () => {
      const mockRequest = {
        id: "credential-id",
        rawId: "raw-credential-id",
        response: {
          clientDataJSON: "client-data",
          authenticatorData: "authenticator-data",
          signature: "signature",
        },
        type: "public-key" as const,
        intent: "unlock" as const,
      };

      const errorMessage = "Biometric verification failed";
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          data: { message: errorMessage },
        },
      });

      const result =
        await verificationService.verifyBiometricForUnlock(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe(errorMessage);
    });
  });

  describe("verifyBiometricForTransaction", () => {
    it("should call POST /biometric/auth/verify with intent: transaction", async () => {
      const mockRequest = {
        id: "credential-id",
        rawId: "raw-credential-id",
        response: {
          clientDataJSON: "client-data",
          authenticatorData: "authenticator-data",
          signature: "signature",
        },
        type: "public-key" as const,
        intent: "transaction" as const,
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          data: {
            success: true,
            verificationToken: "jwt-token-here",
          },
        },
      });

      const result =
        await verificationService.verifyBiometricForTransaction(mockRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/biometric/auth/verify",
        expect.objectContaining({
          intent: "transaction",
        })
      );
      expect(result.success).toBe(true);
      expect(result.verificationToken).toBe("jwt-token-here");
    });
  });

  describe("submitTopup", () => {
    it("should submit transaction with PIN", async () => {
      const mockRequest = {
        pin: "1234",
        amount: 1000,
        productCode: "airtime-500",
        recipientPhone: "08012345678",
      };

      mockTopupService.initiateTopup.mockResolvedValueOnce({
        success: true,
        message: "Success",
        data: {
          transactionId: "txn-123",
          amount: 1000,
          status: "completed",
          balance: 4000,
        },
      });

      const result = await verificationService.submitTopup(mockRequest);

      expect(mockTopupService.initiateTopup).toHaveBeenCalledWith(mockRequest);
      expect(result.success).toBe(true);
      expect(result.transaction?.id).toBe("txn-123");
    });

    it("should handle invalid PIN error", async () => {
      const mockRequest = {
        pin: "0000",
        amount: 1000,
        productCode: "airtime-500",
        recipientPhone: "08012345678",
      };

      const errorResponse = {
        response: {
          status: 400,
          data: {
            success: false,
            message: "Invalid PIN",
          },
        },
      };

      mockTopupService.initiateTopup.mockRejectedValueOnce(errorResponse);

      const result = await verificationService.submitTopup(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid PIN");
    });
  });
});
