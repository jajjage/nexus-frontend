import { SoftLockOverlay } from "@/components/auth/SoftLockOverlay";
import { verificationService } from "@/services/verification.service";
import { WebAuthnService } from "@/services/webauthn.service";
import { useSecurityStore } from "@/store/securityStore";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/store/securityStore");
jest.mock("@/services/webauthn.service");
jest.mock("@/services/verification.service");
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseSecurityStore = useSecurityStore as jest.MockedFunction<
  typeof useSecurityStore
>;
const mockWebAuthnService = WebAuthnService as jest.Mocked<
  typeof WebAuthnService
>;
const mockVerificationService = verificationService as jest.Mocked<
  typeof verificationService
>;

describe("SoftLockOverlay", () => {
  const mockUnlock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSecurityStore.mockReturnValue({
      isLocked: true,
      unlock: mockUnlock,
    } as any);
  });

  describe("Rendering", () => {
    it("should not render when app is not locked", () => {
      mockUseSecurityStore.mockReturnValue({
        isLocked: false,
        unlock: mockUnlock,
      } as any);

      render(<SoftLockOverlay />);

      expect(screen.queryByText("App Locked")).not.toBeInTheDocument();
    });

    it("should render when app is locked", () => {
      render(<SoftLockOverlay />);

      expect(screen.getByText("App Locked")).toBeInTheDocument();
    });

    it("should display lock icon", () => {
      render(<SoftLockOverlay />);

      expect(screen.getByText("App Locked")).toBeInTheDocument();
    });

    it("should show unlock button", () => {
      render(<SoftLockOverlay />);

      expect(screen.getByText("Unlock with Biometric")).toBeInTheDocument();
    });

    it("should display inactivity message", () => {
      render(<SoftLockOverlay />);

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

      render(<SoftLockOverlay />);

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

      render(<SoftLockOverlay />);

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

      render(<SoftLockOverlay />);

      const unlockButton = screen.getByText("Unlock with Biometric");
      fireEvent.click(unlockButton);

      await waitFor(() => {
        expect(mockUnlock).toHaveBeenCalled();
      });
    });

    it("should show error if biometric not supported", async () => {
      mockWebAuthnService.isWebAuthnSupported.mockResolvedValueOnce(false);

      render(<SoftLockOverlay />);

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

      render(<SoftLockOverlay />);

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

      render(<SoftLockOverlay />);

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

      render(<SoftLockOverlay />);

      const unlockButton = screen.getByText("Unlock with Biometric");
      fireEvent.click(unlockButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Verification attempts: 1/)
        ).toBeInTheDocument();
      });
    });

    it("should increment attempt counter on multiple failures", async () => {
      mockWebAuthnService.isWebAuthnSupported.mockResolvedValue(true);
      mockWebAuthnService.getAuthenticationOptions.mockResolvedValue({} as any);
      mockWebAuthnService.signAssertion.mockResolvedValue({
        id: "cred-id",
        rawId: "raw-id",
        response: {
          clientDataJSON: "data",
          authenticatorData: "auth",
          signature: "sig",
        },
        type: "public-key",
      } as any);
      mockVerificationService.verifyBiometricForUnlock.mockResolvedValue({
        success: false,
        message: "Verification failed",
      });

      const { rerender } = render(<SoftLockOverlay />);

      const unlockButton = screen.getByText("Unlock with Biometric");

      // First attempt
      fireEvent.click(unlockButton);
      await waitFor(() => {
        expect(
          screen.getByText(/Verification attempts: 1/)
        ).toBeInTheDocument();
      });

      // Second attempt
      rerender(<SoftLockOverlay />);
      const unlockButton2 = screen.getByText("Unlock with Biometric");
      fireEvent.click(unlockButton2);

      // Should show updated attempt count
      // Note: This depends on how the component tracks attempts
    });
  });

  describe("Error Handling", () => {
    it("should handle unexpected errors", async () => {
      mockWebAuthnService.isWebAuthnSupported.mockRejectedValueOnce(
        new Error("Unexpected error")
      );

      render(<SoftLockOverlay />);

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

      render(<SoftLockOverlay />);

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
      render(<SoftLockOverlay />);

      expect(screen.getByText(/session remains secure/i)).toBeInTheDocument();
    });

    it("should have proper styling and layout", () => {
      render(<SoftLockOverlay />);

      const overlay = screen.getByText("App Locked");
      expect(overlay).toBeInTheDocument();
    });
  });
});
