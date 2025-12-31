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

vi.mock("@/services/biometric.service");
vi.mock("@/services/webauthn.service");
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useBiometric Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useBiometricEnrollments", () => {
    it("should fetch and return enrollments", async () => {
      const mockEnrollments = [{ id: "1", deviceName: "Phone" }];
      (biometricService.listEnrollments as vi.Mock).mockResolvedValue(
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
      (WebAuthnService.isWebAuthnSupported as vi.Mock).mockResolvedValue(true);
      (WebAuthnService.getAuthenticationOptions as vi.Mock).mockResolvedValue(
        {}
      );
      (WebAuthnService.signAssertion as vi.Mock).mockResolvedValue({});
      (WebAuthnService.verifyAssertion as vi.Mock).mockResolvedValue({
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
      (WebAuthnService.isWebAuthnSupported as vi.Mock).mockResolvedValue(false);

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
