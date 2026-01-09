import { biometricService } from "@/services/biometric.service";
import { verificationService } from "@/services/verification.service";
import { WebAuthnService } from "@/services/webauthn.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Query keys - base key used in functions to avoid self-reference issues with Turbopack
const BIOMETRIC_BASE_KEY = ["biometric"] as const;

export const biometricKeys = {
  all: BIOMETRIC_BASE_KEY,
  enrollments: () => [...BIOMETRIC_BASE_KEY, "enrollments"] as const,
  auditLogs: () => [...BIOMETRIC_BASE_KEY, "audit-logs"] as const,
};

/**
 * Hook to list biometric enrollments
 * @param enabled - If false, query won't run (prevent fetching when not authenticated)
 */
export function useBiometricEnrollments(enabled: boolean = true) {
  return useQuery({
    queryKey: biometricKeys.enrollments(),
    queryFn: biometricService.listEnrollments,
    retry: 1,
    enabled, // Only fetch when enabled
  });
}

/**
 * Hook to register a new biometric device
 */
export function useBiometricRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceName: string) => {
      // Step 1: Check support
      const supported = await WebAuthnService.isWebAuthnSupported();
      if (!supported) {
        throw new Error(
          "Biometric authentication is not supported on this device"
        );
      }

      // Step 2: Get options
      const options = await WebAuthnService.getRegistrationOptions();

      // Step 3: Create credential
      const credential = await WebAuthnService.createCredential(options);

      // Step 4: Determine more accurate device information
      // Get browser-based device info
      const browserDeviceInfo = WebAuthnService.getDeviceInfo();

      // Get authenticator-specific information from the credential
      // The authenticatorAttachment is available in the response, but we need to access it properly
      const credentialResponse = credential.response;
      const clientExtensionResults = (credential as any).clientExtensionResults;

      // Determine platform more accurately based on browser environment and extensions
      let platform = browserDeviceInfo.platform;
      let detectedDeviceName = browserDeviceInfo.deviceName;

      // Check if this is likely a platform authenticator (Windows Hello, Touch ID, etc.)
      // Platform authenticators are typically tied to the device OS
      if (browserDeviceInfo.userAgent.includes("Windows")) {
        platform = "windows";
        detectedDeviceName = "Windows PC";
      } else if (
        browserDeviceInfo.userAgent.includes("Mac OS X") ||
        browserDeviceInfo.userAgent.includes("Macintosh")
      ) {
        platform = "macos";
        detectedDeviceName = "Mac";
      } else if (
        browserDeviceInfo.userAgent.includes("iPhone") ||
        browserDeviceInfo.userAgent.includes("iPad")
      ) {
        platform = "ios";
        detectedDeviceName = browserDeviceInfo.userAgent.includes("iPhone")
          ? "iPhone"
          : "iPad";
      } else if (browserDeviceInfo.userAgent.includes("Android")) {
        platform = "android";
        detectedDeviceName = "Android Device";
      }

      const finalDeviceName = deviceName || detectedDeviceName;

      // The authenticatorAttachment is typically part of the credential response
      // but we'll determine it based on the context since it might not be directly available
      let authenticatorAttachment: string | undefined;
      if (
        platform === "windows" ||
        platform === "macos" ||
        platform === "ios"
      ) {
        // These platforms typically use platform authenticators
        authenticatorAttachment = "platform";
      } else {
        // Other cases might be cross-platform
        authenticatorAttachment = "cross-platform";
      }

      return await WebAuthnService.verifyCredential(credential, {
        deviceName: finalDeviceName,
        platform,
        authenticatorAttachment,
      });
    },
    onSuccess: () => {
      toast.success("Biometric device registered successfully");
      queryClient.invalidateQueries({ queryKey: biometricKeys.enrollments() });
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message || error.message || "Registration failed";
      toast.error(msg);
    },
  });
}

/**
 * Hook to authenticate using biometrics
 */
export function useBiometricAuthentication() {
  return useMutation({
    mutationFn: async () => {
      // Step 1: Check support
      const supported = await WebAuthnService.isWebAuthnSupported();
      if (!supported) {
        throw new Error(
          "Biometric authentication is not supported on this device"
        );
      }

      // Step 2: Get options
      const options = await WebAuthnService.getAuthenticationOptions();

      // Step 3: Sign assertion
      const assertion = await WebAuthnService.signAssertion(options);

      // Step 4: Verify
      return await WebAuthnService.verifyAssertion(assertion);
    },
    onSuccess: (data) => {
      toast.success("Biometric authentication successful");
    },
    onError: (error: any) => {
      console.log("bio error:", error);
      // Don't show toast for "NotAllowedError" which happens when user cancels
      if (
        error.name !== "NotAllowedError" &&
        !error.message.includes("cancelled")
      ) {
        const msg =
          error.response?.data?.message ||
          error.message ||
          "Authentication failed";
        toast.error(msg);
      }
    },
  });
}

/**
 * Hook to revoke an enrollment
 */
export function useRevokeEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      biometricService.revokeEnrollment(id, reason),
    onSuccess: () => {
      toast.success("Biometric enrollment revoked");
      queryClient.invalidateQueries({ queryKey: biometricKeys.enrollments() });
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message || error.message || "Revocation failed";
      toast.error(msg);
    },
  });
}

/**
 * Hook to verify biometric for transactions
 *
 * Returns a verification token used for transaction APIs (topup, etc.)
 * Handles the full WebAuthn flow + transaction verification
 */
export function useBiometricTransaction() {
  return useMutation({
    mutationFn: async () => {
      // Step 1: Check support
      const supported = await WebAuthnService.isWebAuthnSupported();
      if (!supported) {
        throw new Error(
          "Biometric authentication is not supported on this device"
        );
      }

      try {
        // Step 2: Get options
        const options = await WebAuthnService.getAuthenticationOptions();

        // Step 3: Sign assertion
        const assertion = await WebAuthnService.signAssertion(options);

        // Step 4: Verify with backend (intent: 'transaction')
        const response =
          await verificationService.verifyBiometricForTransaction({
            id: assertion.id,
            rawId: assertion.rawId,
            response: assertion.response,
            type: "public-key",
            intent: "transaction",
          });

        if (!response.success) {
          // Special handling for counter validation failures (replay attack detection)
          if (
            response.message &&
            response.message.toLowerCase().includes("counter validation")
          ) {
            throw new Error(
              "Biometric verification failed due to a security check. Please try again."
            );
          }
          throw new Error(response.message || "Biometric verification failed");
        }

        return response.verificationToken;
      } catch (err: any) {
        // Extract actual error message from API response
        const apiError = err.response?.data;
        if (apiError && typeof apiError === "object") {
          // Extract message from error response object
          const message = apiError.message || apiError.error || err.message;
          const error = new Error(message);
          // Mark this as an API error for better handling
          (error as any).isApiError = true;
          (error as any).statusCode = apiError.statusCode;
          throw error;
        }

        // If not an API error, rethrow as-is
        throw err;
      }
    },
    onSuccess: () => {
      toast.success("Biometric verified successfully");
    },
    onError: (error: any) => {
      console.error("[useBiometricTransaction] Error:", error);

      // Don't show toast for cancellation
      if (
        error.name !== "NotAllowedError" &&
        !error.message.includes("cancelled")
      ) {
        const msg =
          error.message === "Failed to generate authentication options"
            ? "You don't have Active Biometric Enable"
            : error.message;
        toast.error(msg);
      }
    },
  });
}
