import {
  useBiometricAuthentication,
  useBiometricEnrollments,
} from "@/hooks/useBiometric";
import { biometricService } from "@/services/biometric.service";
import { WebAuthnService } from "@/services/webauthn.service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { toast } from "sonner";
import { Mock } from "vitest";

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
      (biometricService.listEnrollments as Mock).mockResolvedValue(
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
      (WebAuthnService.isWebAuthnSupported as Mock).mockResolvedValue(true);
      (WebAuthnService.getAuthenticationOptions as Mock).mockResolvedValue({});
      (WebAuthnService.signAssertion as Mock).mockResolvedValue({});
      (WebAuthnService.verifyAssertion as Mock).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useBiometricAuthentication(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      // Note: toast.success is intentionally not called in this hook to reduce UI noise
      // The success state is sufficient for callers to handle
    });

    it("should show error when not supported", async () => {
      (WebAuthnService.isWebAuthnSupported as Mock).mockResolvedValue(false);

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
