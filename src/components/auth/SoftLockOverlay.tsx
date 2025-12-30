"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";
import { verificationService } from "@/services/verification.service";
import { WebAuthnService } from "@/services/webauthn.service";
import { useSecurityStore } from "@/store/securityStore";
import { AlertCircle, Fingerprint, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PasscodeVerificationModal } from "./PasscodeVerificationModal";

/**
 * SoftLockOverlay Component
 *
 * NOTE: SOFT-LOCK FEATURE IS DISABLED (Marked as Upcoming)
 * This component is preserved for future use but is not currently rendered.
 * All soft-lock functionality has been disabled in SecurityGuard.tsx
 *
 * When re-enabling soft-lock:
 * 1. Uncomment the SoftLockService import below
 * 2. Uncomment the SoftLockService calls in the useEffect
 * 3. Re-enable rendering in SecurityGuard.tsx
 *
 * Displays full-screen lock after 15 min inactivity (soft-lock mode)
 * OR displays re-verification prompt during session revalidation (revalidation mode)
 *
 * Modes:
 * 1. Soft-lock: User inactive for 15 min, app is locked. Uses WebAuthn to unlock.
 * 2. Revalidation: Session needs re-verification after network issue or sleep.
 *    Uses WebAuthn with intent: 'unlock' to re-verify identity.
 *
 * Design:
 * - Uses biometric (WebAuthn) as primary method
 * - No PIN fallback for soft-lock (only for transactions)
 * - Shows attempt counter for UX feedback
 */

interface SoftLockOverlayProps {
  revalidationMode?: boolean;
  message?: string;
  description?: string;
}

export function SoftLockOverlay({
  revalidationMode = false,
  message: customMessage,
  description: customDescription,
}: SoftLockOverlayProps) {
  console.log("[SoftLockOverlay] Rendering with props:", {
    revalidationMode,
    customMessage,
    customDescription,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);

  const { isLocked, unlock } = useSecurityStore();
  const { setIsAuthLoadingGlobal } = useAuthContext();

  // Prevent scrolling and interactions while overlay is active
  const shouldShow = revalidationMode || isLocked;

  useEffect(() => {
    console.log("[SoftLockOverlay] shouldShow changed:", {
      shouldShow,
      revalidationMode,
      isLocked,
    });

    if (shouldShow) {
      // NOTE: SoftLockService activity tracking disabled (feature is inactive)
      // Uncomment when soft-lock is re-enabled:
      // SoftLockService.disableActivityTracking();
      // console.log("[SoftLockOverlay] Activity tracking disabled (security)");

      // Prevent scrolling
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.height = "100vh";
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";

      // Prevent any interactions with page behind overlay
      const appDiv = document.querySelector("[data-app-root]");
      if (appDiv) {
        (appDiv as HTMLElement).style.pointerEvents = "none";
      }

      // Disable all keyboard interactions
      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      document.addEventListener("keydown", handleKeydown, true);

      return () => {
        // NOTE: SoftLockService activity tracking disabled (feature is inactive)
        // Uncomment when soft-lock is re-enabled:
        // SoftLockService.enableActivityTracking();
        // console.log("[SoftLockOverlay] Activity tracking enabled (unlocked)");

        document.removeEventListener("keydown", handleKeydown, true);
        document.documentElement.style.overflow = "";
        document.documentElement.style.height = "";
        document.body.style.overflow = "";
        document.body.style.height = "";
        document.body.style.position = "";
        document.body.style.width = "";

        const appDiv = document.querySelector("[data-app-root]");
        if (appDiv) {
          (appDiv as HTMLElement).style.pointerEvents = "";
        }
      };
    }
    // NOTE: SoftLockService activity tracking disabled (feature is inactive)
    // Uncomment when soft-lock is re-enabled:
    // else {
    //   SoftLockService.enableActivityTracking();
    // }
  }, [shouldShow]);

  const handleUnlockWithBiometric = async () => {
    setLoading(true);
    setError("");

    try {
      // Step 0: Check if session is still valid before attempting unlock
      // This ensures the access token hasn't expired
      console.log("[SoftLockOverlay] Checking session validity");
      const sessionValid = await checkSessionBeforeUnlock();

      if (!sessionValid) {
        setError(
          "Session expired. Please log in again to verify your identity."
        );
        setAttempts((prev) => prev + 1);
        return;
      }

      // Step 1: Check biometric support
      const supported = await WebAuthnService.isWebAuthnSupported();
      if (!supported) {
        setError(
          "Biometric authentication not available on this device. Please restart the app."
        );
        setAttempts((prev) => prev + 1);
        return;
      }

      console.log("[SoftLockOverlay] Getting authentication options");

      // Step 2: Get authentication options
      const options = await WebAuthnService.getAuthenticationOptions();

      console.log("[SoftLockOverlay] Starting biometric verification");

      // Step 3: User completes biometric
      const assertion = await WebAuthnService.signAssertion(options);

      console.log("[SoftLockOverlay] Verifying with backend");

      // Step 4: Verify with backend using intent: 'unlock'
      const response = await verificationService.verifyBiometricForUnlock({
        id: assertion.id,
        rawId: assertion.rawId,
        response: assertion.response,
        type: "public-key",
        intent: "unlock",
      });

      if (response.success) {
        console.log("[SoftLockOverlay] Biometric verification successful");

        if (revalidationMode) {
          // In revalidation mode, clear the auth loading state
          // The session revalidation flow will continue
          console.log(
            "[SoftLockOverlay] Revalidation successful - clearing loading state"
          );
          setIsAuthLoadingGlobal(false);
          toast.success("Session verified successfully");
        } else {
          // In soft-lock mode, unlock the app
          unlock();
          toast.success("App unlocked successfully");
        }
      } else {
        setAttempts((prev) => prev + 1);
        setError(response.message || "Biometric verification failed");
        console.log("[SoftLockOverlay] Biometric verification failed", {
          message: response.message,
        });
      }
    } catch (err: any) {
      console.error("[SoftLockOverlay] Error", err);

      if (err.name === "NotAllowedError") {
        // User cancelled biometric - don't show error
        setError("");
      } else {
        setAttempts((prev) => prev + 1);
        setError(err.message || "Biometric verification failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if session is still valid before attempting unlock
   * Attempts to refresh token if necessary
   * Returns true if session is valid, false if requires full re-login
   */
  const checkSessionBeforeUnlock = async (): Promise<boolean> => {
    try {
      // Make a simple request to /auth/profile
      // This will trigger token refresh if access token is expired
      const response = await fetch("/api/auth/profile", {
        method: "GET",
        credentials: "include", // Include cookies (access token in HTTPOnly cookie)
      });

      console.log("[SoftLockOverlay] Session check response:", {
        status: response.status,
      });

      if (response.ok) {
        // Session is valid
        return true;
      }

      if (response.status === 401) {
        // Token refresh failed - session has expired
        console.log("[SoftLockOverlay] Session expired - 401 after refresh");
        return false;
      }

      // Other error - assume session is okay to attempt unlock
      console.warn("[SoftLockOverlay] Session check returned", response.status);
      return true;
    } catch (err) {
      console.error("[SoftLockOverlay] Session check failed", err);
      // Network error - allow unlock attempt to proceed
      // If session is actually expired, the biometric verification will fail
      return true;
    }
  };

  if (!shouldShow) {
    console.log("[SoftLockOverlay] Not showing overlay:", {
      shouldShow,
      revalidationMode,
      isLocked,
    });
    return null;
  }

  // Determine heading and description based on mode
  const heading =
    customMessage || (revalidationMode ? "Verify Your Identity" : "App Locked");
  const subtext =
    customDescription ||
    (revalidationMode
      ? "Please unlock with biometric or passcode to continue"
      : "Your app was locked due to inactivity. Verify your identity to continue.");

  return (
    <div
      data-softlock-overlay="true"
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onMouseDown={(e) => {
        // Prevent any mouse interactions from propagating
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        // Absolutely prevent clicks from closing the overlay
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onTouchStart={(e) => {
        // Prevent touch interactions from propagating
        e.stopPropagation();
      }}
      onTouchEnd={(e) => {
        // Prevent touch interactions from propagating
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
    >
      <Card
        className="pointer-events-auto w-full max-w-md shadow-2xl"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          // Prevent clicks on the card from propagating
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header with Icon */}
        <div className="flex items-center justify-center pt-8 pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        <div className="px-6 py-8">
          {/* Heading */}
          <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">
            {heading}
          </h2>
          <p className="mb-8 text-center text-sm text-slate-600">{subtext}</p>

          {/* Biometric Button */}
          <Button
            onClick={handleUnlockWithBiometric}
            disabled={loading}
            size="lg"
            className="mb-3 h-12 w-full bg-blue-600 hover:bg-blue-700"
          >
            <Fingerprint className="mr-2 h-5 w-5" />
            {loading ? "Verifying..." : "Unlock with Biometric"}
          </Button>

          {/* Passcode Fallback Button */}
          <Button
            onClick={() => setShowPasscodeModal(true)}
            variant="outline"
            className="w-full"
          >
            Use Passcode Instead
          </Button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Attempt Counter */}
          {attempts > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                Verification attempts: {attempts}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 text-center">
          <p className="text-xs text-slate-500">
            {revalidationMode
              ? "Your session remains secure. Please verify to continue."
              : "Your session remains secure. This is just a verification step."}
          </p>
        </div>
      </Card>

      {/* Passcode Verification Modal */}
      <PasscodeVerificationModal
        open={showPasscodeModal}
        onClose={() => setShowPasscodeModal(false)}
        onSuccess={() => {
          setShowPasscodeModal(false);
          if (revalidationMode) {
            setIsAuthLoadingGlobal(false);
            toast.success("Session verified successfully");
          } else {
            unlock();
            toast.success("App unlocked successfully");
          }
        }}
        intent={revalidationMode ? "revalidate" : "unlock"}
        title={revalidationMode ? "Verify Passcode" : "Unlock with Passcode"}
        description="Enter your 6-digit passcode"
      />
    </div>
  );
}
