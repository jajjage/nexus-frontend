"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { verificationService } from "@/services/verification.service";
import { WebAuthnService } from "@/services/webauthn.service";
import { useSecurityStore } from "@/store/securityStore";
import { AlertCircle, Fingerprint, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * SoftLockOverlay Component
 *
 * Displays full-screen lock after 15 min inactivity
 * Uses Biometric (WebAuthn) to unlock
 *
 * Design:
 * - If user has biometric enrolled, MUST use it to unlock
 * - No PIN fallback for soft-lock (only for transactions)
 * - Shows attempt counter for UX feedback
 */
export function SoftLockOverlay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const { isLocked, unlock } = useSecurityStore();

  const handleUnlockWithBiometric = async () => {
    setLoading(true);
    setError("");

    try {
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
        unlock();
        toast.success("App unlocked successfully");
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

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-xl">
        {/* Header with Icon */}
        <div className="flex items-center justify-center pt-8 pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        <div className="px-6 py-8">
          {/* Heading */}
          <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">
            App Locked
          </h2>
          <p className="mb-8 text-center text-sm text-slate-600">
            Your app was locked due to inactivity. Verify your identity to
            continue.
          </p>

          {/* Biometric Button */}
          <Button
            onClick={handleUnlockWithBiometric}
            disabled={loading}
            size="lg"
            className="mb-4 h-12 w-full bg-blue-600 hover:bg-blue-700"
          >
            <Fingerprint className="mr-2 h-5 w-5" />
            {loading ? "Verifying..." : "Unlock with Biometric"}
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
            Your session remains secure. This is just a verification step.
          </p>
        </div>
      </Card>
    </div>
  );
}
