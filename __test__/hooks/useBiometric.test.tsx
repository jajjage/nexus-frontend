import { renderHook, waitFor } from "@testing-library/react";
import {
  useBiometricEnrollments,
  useBiometricAuthentication,
} from "@/hooks/useBiometric";
import { biometricService } from "@/services/biometric.service";
import { WebAuthnService } from "@/services/webauthn.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { toast } from "sonner";

jest.mock("@/services/biometric.service");
jest.mock("@/services/webauthn.service");
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useBiometric Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useBiometricEnrollments", () => {
    it("should fetch and return enrollments", async () => {
      const mockEnrollments = [{ id: "1", deviceName: "Phone" }];
      (biometricService.listEnrollments as jest.Mock).mockResolvedValue(
        mockEnrollments
      );

      const { result } = renderHook(() => useBiometricEnrollments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockEnrollments);
    });
  });

  describe("useBiometricAuthentication", () => {
    it("should complete authentication flow on success", async () => {
      (WebAuthnService.isWebAuthnSupported as jest.Mock).mockResolvedValue(
        true
      );
      (WebAuthnService.getAuthenticationOptions as jest.Mock).mockResolvedValue(
        {}
      );
      (WebAuthnService.signAssertion as jest.Mock).mockResolvedValue({});
      (WebAuthnService.verifyAssertion as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useBiometricAuthentication(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("successful")
      );
    });

    it("should show error when not supported", async () => {
      (WebAuthnService.isWebAuthnSupported as jest.Mock).mockResolvedValue(
        false
      );

      const { result } = renderHook(() => useBiometricAuthentication(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("not supported")
      );
    });
  });
});
