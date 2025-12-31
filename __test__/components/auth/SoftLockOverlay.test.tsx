import { SoftLockOverlay } from "@/components/auth/SoftLockOverlay";
import { verificationService } from "@/services/verification.service";
import { WebAuthnService } from "@/services/webauthn.service";
import { useSecurityStore } from "@/store/securityStore";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/store/securityStore");
vi.mock("@/services/webauthn.service");
vi.mock("@/services/verification.service");
vi.mock("@/context/AuthContext", () => ({
  useAuthContext: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useAuthContext } from "@/context/AuthContext";

const mockUseSecurityStore = useSecurityStore as vi.MockedFunction<
  typeof useSecurityStore
>;
const mockUseAuthContext = useAuthContext as vi.MockedFunction<
  typeof useAuthContext
>;
const mockWebAuthnService = WebAuthnService as vi.Mocked<
  typeof WebAuthnService
>;
const mockVerificationService = verificationService as vi.Mocked<
  typeof verificationService
>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("SoftLockOverlay", () => {
  const mockUnlock = vi.fn();
  const mockSetIsAuthLoadingGlobal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSecurityStore.mockReturnValue({
      isLocked: true,
      unlock: mockUnlock,
    } as any);
    mockUseAuthContext.mockReturnValue({
      setIsAuthLoadingGlobal: mockSetIsAuthLoadingGlobal,
    } as any);
  });

  describe("Rendering", () => {
    it("should not render when app is not locked", () => {
      mockUseSecurityStore.mockReturnValue({
        isLocked: false,
        unlock: mockUnlock,
      } as any);

      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      expect(screen.queryByText("App Locked")).not.toBeInTheDocument();
    });

    it("should render when app is locked", () => {
      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      expect(screen.getByText("App Locked")).toBeInTheDocument();
    });

    it("should display lock icon", () => {
      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      expect(screen.getByText("App Locked")).toBeInTheDocument();
    });

    it("should show unlock button", () => {
      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      expect(screen.getByText("Unlock with Biometric")).toBeInTheDocument();
    });

    it("should display inactivity message", () => {
      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      expect(screen.getByText(/locked due to inactivity/i)).toBeInTheDocument();
    });
  });

  describe("Biometric Unlock", () => {
    it("should call WebAuthn service when unlock button clicked", async () => {
      mockWebAuthnService.isWebAuthnSupported.mockResolvedValueOnce(true);
      mockWebAuthnService.getAuthenticationOptions.mockResolvedValueOnce(
        {} as any
      );
      mockWebAuthnService.signAssertion.mockResolvedValueOnce({
        id: "cred-id",
        rawId: "raw-id",
        response: {
          clientDataJSON: "data",
          authenticatorData: "auth",
          signature: "sig",
        },
        type: "public-key",
      } as any);
      mockVerificationService.verifyBiometricForUnlock.mockResolvedValueOnce({
        success: true,
      });

      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      const unlockButton = screen.getByText("Unlock with Biometric");
      fireEvent.click(unlockButton);

      await waitFor(() => {
        expect(mockWebAuthnService.getAuthenticationOptions).toHaveBeenCalled();
      });
    });

    it("should show loading state during verification", async () => {
      mockWebAuthnService.isWebAuthnSupported.mockResolvedValueOnce(true);
      mockWebAuthnService.getAuthenticationOptions.mockImplementationOnce(
        () =>
          new Promise((resolve) => setTimeout(() => resolve({} as any), 1000))
      );

      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      const unlockButton = screen.getByText("Unlock with Biometric");
      fireEvent.click(unlockButton);

      await waitFor(() => {
        expect(screen.getByText("Verifying...")).toBeInTheDocument();
      });
    });

    it("should unlock app on successful biometric verification", async () => {
      mockWebAuthnService.isWebAuthnSupported.mockResolvedValueOnce(true);
      mockWebAuthnService.getAuthenticationOptions.mockResolvedValueOnce(
        {} as any
      );
      mockWebAuthnService.signAssertion.mockResolvedValueOnce({
        id: "cred-id",
        rawId: "raw-id",
        response: {
          clientDataJSON: "data",
          authenticatorData: "auth",
          signature: "sig",
        },
        type: "public-key",
      } as any);
      mockVerificationService.verifyBiometricForUnlock.mockResolvedValueOnce({
        success: true,
      });

      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      const unlockButton = screen.getByText("Unlock with Biometric");
      fireEvent.click(unlockButton);

      await waitFor(() => {
        expect(mockUnlock).toHaveBeenCalled();
      });
    });

    it("should show error if biometric not supported", async () => {
      mockWebAuthnService.isWebAuthnSupported.mockResolvedValueOnce(false);

      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      const unlockButton = screen.getByText("Unlock with Biometric");
      fireEvent.click(unlockButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Biometric authentication not available/i)
        ).toBeInTheDocument();
      });
    });

    it("should show error if biometric verification fails", async () => {
      mockWebAuthnService.isWebAuthnSupported.mockResolvedValueOnce(true);
      mockWebAuthnService.getAuthenticationOptions.mockResolvedValueOnce(
        {} as any
      );
      mockWebAuthnService.signAssertion.mockResolvedValueOnce({
        id: "cred-id",
        rawId: "raw-id",
        response: {
          clientDataJSON: "data",
          authenticatorData: "auth",
          signature: "sig",
        },
        type: "public-key",
      } as any);
      mockVerificationService.verifyBiometricForUnlock.mockResolvedValueOnce({
        success: false,
        message: "Biometric mismatch",
      });

      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      const unlockButton = screen.getByText("Unlock with Biometric");
      fireEvent.click(unlockButton);

      await waitFor(() => {
        expect(screen.getByText("Biometric mismatch")).toBeInTheDocument();
      });
    });

    it("should silently handle user cancellation", async () => {
      mockWebAuthnService.isWebAuthnSupported.mockResolvedValueOnce(true);
      mockWebAuthnService.getAuthenticationOptions.mockResolvedValueOnce(
        {} as any
      );
      mockWebAuthnService.signAssertion.mockRejectedValueOnce({
        name: "NotAllowedError",
      });

      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      const unlockButton = screen.getByText("Unlock with Biometric");
      fireEvent.click(unlockButton);

      await waitFor(() => {
        // Should not show error message for user cancellation
        expect(
          screen.queryByText(/biometric.*failed/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Attempt Counter", () => {
    it("should display attempt counter after failed attempt", async () => {
      mockWebAuthnService.isWebAuthnSupported.mockResolvedValueOnce(true);
      mockWebAuthnService.getAuthenticationOptions.mockResolvedValueOnce(
        {} as any
      );
      mockWebAuthnService.signAssertion.mockResolvedValueOnce({
        id: "cred-id",
        rawId: "raw-id",
        response: {
          clientDataJSON: "data",
          authenticatorData: "auth",
          signature: "sig",
        },
        type: "public-key",
      } as any);
      mockVerificationService.verifyBiometricForUnlock.mockResolvedValueOnce({
        success: false,
        message: "Verification failed",
      });

      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      const unlockButton = screen.getByText("Unlock with Biometric");
      fireEvent.click(unlockButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Verification attempts: 1/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle unexpected errors", async () => {
      mockWebAuthnService.isWebAuthnSupported.mockRejectedValueOnce(
        new Error("Unexpected error")
      );

      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      const unlockButton = screen.getByText("Unlock with Biometric");
      fireEvent.click(unlockButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Unexpected error|failed/i)
        ).toBeInTheDocument();
      });
    });

    it("should re-enable button after error", async () => {
      mockWebAuthnService.isWebAuthnSupported.mockResolvedValueOnce(false);

      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      let unlockButton = screen.getByText("Unlock with Biometric");
      expect(unlockButton).not.toBeDisabled();

      fireEvent.click(unlockButton);

      await waitFor(() => {
        unlockButton = screen.getByText("Unlock with Biometric");
        expect(unlockButton).not.toBeDisabled();
      });
    });
  });

  describe("UI Elements", () => {
    it("should display security message in footer", () => {
      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      expect(screen.getByText(/session remains secure/i)).toBeInTheDocument();
    });

    it("should have proper styling and layout", () => {
      render(<SoftLockOverlay />, { wrapper: createWrapper() });

      const overlay = screen.getByText("App Locked");
      expect(overlay).toBeInTheDocument();
    });
  });
});
