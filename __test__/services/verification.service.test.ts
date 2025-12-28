import apiClient from "@/lib/api-client";
import { verificationService } from "@/services/verification.service";

jest.mock("@/lib/api-client");

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("verificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      mockApiClient.post.mockRejectedValueOnce(new Error(errorMessage));

      const result =
        await verificationService.verifyBiometricForUnlock(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Biometric");
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

    it("should return verification token on success", async () => {
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

      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          data: {
            success: true,
            verificationToken: token,
          },
        },
      });

      const result =
        await verificationService.verifyBiometricForTransaction(mockRequest);

      expect(result.verificationToken).toBe(token);
    });
  });

  describe("submitTopup", () => {
    it("should submit transaction with PIN", async () => {
      const mockRequest = {
        pin: "1234",
        amount: 1000,
        productCode: "airtime-500",
        phoneNumber: "08012345678",
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          data: {
            success: true,
            transaction: {
              id: "txn-123",
              amount: 1000,
              status: "completed",
            },
          },
        },
      });

      const result = await verificationService.submitTopup(mockRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/user/topup",
        expect.objectContaining({
          pin: "1234",
          amount: 1000,
          productCode: "airtime-500",
        })
      );
      expect(result.success).toBe(true);
      expect(result.transaction?.id).toBe("txn-123");
    });

    it("should submit transaction with verification token", async () => {
      const mockRequest = {
        verificationToken: "jwt-token",
        amount: 1000,
        productCode: "airtime-500",
        phoneNumber: "08012345678",
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          data: {
            success: true,
            transaction: {
              id: "txn-456",
              amount: 1000,
              status: "completed",
            },
          },
        },
      });

      const result = await verificationService.submitTopup(mockRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/user/topup",
        expect.objectContaining({
          verificationToken: "jwt-token",
          amount: 1000,
          productCode: "airtime-500",
        })
      );
      expect(result.success).toBe(true);
    });

    it("should handle invalid PIN error", async () => {
      const mockRequest = {
        pin: "0000",
        amount: 1000,
        productCode: "airtime-500",
        phoneNumber: "08012345678",
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

      mockApiClient.post.mockRejectedValueOnce(errorResponse);

      const result = await verificationService.submitTopup(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid PIN");
    });

    it("should handle network errors", async () => {
      const mockRequest = {
        pin: "1234",
        amount: 1000,
        productCode: "airtime-500",
        phoneNumber: "08012345678",
      };

      mockApiClient.post.mockRejectedValueOnce(new Error("Network error"));

      const result = await verificationService.submitTopup(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Topup failed");
    });
  });

  describe("Response Formatting", () => {
    it("should format success responses correctly", async () => {
      const mockRequest = {
        id: "cred-id",
        rawId: "raw-id",
        response: {
          clientDataJSON: "data",
          authenticatorData: "auth",
          signature: "sig",
        },
        type: "public-key" as const,
        intent: "unlock" as const,
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true },
      });

      const result =
        await verificationService.verifyBiometricForUnlock(mockRequest);

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
    });

    it("should handle missing transaction details", async () => {
      const mockRequest = {
        pin: "1234",
        amount: 1000,
        productCode: "airtime-500",
        phoneNumber: "08012345678",
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          data: {
            success: true,
          },
        },
      });

      const result = await verificationService.submitTopup(mockRequest);

      expect(result.success).toBe(true);
      expect(result.transaction).toBeUndefined();
    });
  });
});
