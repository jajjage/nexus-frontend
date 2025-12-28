"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { verificationService } from "@/services/verification.service";
import { WebAuthnService } from "@/services/webauthn.service";
import { AlertCircle, Fingerprint, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BiometricVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (verificationToken: string) => void;
  onBiometricUnavailable: () => void; // Fallback to PIN
  transactionAmount?: string;
  productCode?: string;
  phoneNumber?: string;
}

/**
 * BiometricVerificationModal Component
 *
 * TRANSACTION VERIFICATION FLOW - BIOMETRIC FIRST
 *
 * This modal handles the biometric-first transaction verification:
 * 1. Check if WebAuthn is supported on device
 * 2. User performs biometric (Face ID / Fingerprint)
 * 3. Backend validates and returns verification token
 * 4. Token is used in /user/topup call
 *
 * On Failure/Unavailable:
 * - Call onBiometricUnavailable() to show PIN modal as fallback
 *
 * KEY REQUIREMENTS:
 * - Biometric takes PRIORITY over PIN
 * - User should NOT be prompted for PIN if biometric succeeds
 * - User should ONLY see PIN modal if biometric fails or unavailable
 * - Verification token from biometric is passed to transaction API
 */
export function BiometricVerificationModal({
  open,
  onClose,
  onSuccess,
  onBiometricUnavailable,
  transactionAmount,
  productCode,
  phoneNumber,
}: BiometricVerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [supportedChecked, setSupportedChecked] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  // Check biometric support on mount
  const checkBiometricSupport = async () => {
    if (supportedChecked) return;

    try {
      const supported = await WebAuthnService.isWebAuthnSupported();
      setSupportedChecked(true);
      setIsBiometricSupported(supported);

      if (!supported) {
        setError(
          "Biometric authentication not available on this device. Please use PIN instead."
        );
      }
    } catch (err) {
      setError("Unable to check biometric support. Please try PIN instead.");
      setSupportedChecked(true);
      setIsBiometricSupported(false);
    }
  };

  const handleBiometricVerification = async () => {
    setLoading(true);
    setError("");

    try {
      console.log(
        "[BiometricVerificationModal] Starting biometric verification"
      );

      // Step 1: Check WebAuthn support
      const supported = await WebAuthnService.isWebAuthnSupported();
      if (!supported) {
        console.log(
          "[BiometricVerificationModal] WebAuthn not supported - falling back to PIN"
        );
        setError(
          "Biometric not available. Falling back to PIN verification..."
        );
        setTimeout(() => {
          onBiometricUnavailable();
        }, 1500);
        return;
      }

      // Step 2: Get authentication options from backend
      console.log(
        "[BiometricVerificationModal] Getting authentication options"
      );
      const options = await WebAuthnService.getAuthenticationOptions();

      // Step 3: Perform biometric challenge
      console.log(
        "[BiometricVerificationModal] Performing biometric authentication"
      );
      const assertion = await WebAuthnService.signAssertion(options);

      // Step 4: Verify with backend (intent: 'transaction')
      console.log("[BiometricVerificationModal] Verifying with backend");
      const response = await verificationService.verifyBiometricForTransaction({
        id: assertion.id,
        rawId: assertion.rawId,
        response: assertion.response,
        type: "public-key",
        intent: "transaction",
      });

      if (response.success && response.verificationToken) {
        console.log(
          "[BiometricVerificationModal] Biometric verification successful"
        );
        toast.success("Biometric verified successfully");
        onSuccess(response.verificationToken);
        onClose();
      } else {
        // Biometric verification failed - try PIN
        console.log(
          "[BiometricVerificationModal] Biometric verification failed",
          {
            message: response.message,
          }
        );
        setError("Biometric verification failed. Falling back to PIN...");
        setTimeout(() => {
          onBiometricUnavailable();
        }, 1500);
      }
    } catch (err: any) {
      console.error("[BiometricVerificationModal] Error", err);

      if (err.name === "NotAllowedError") {
        // User cancelled biometric - don't show error, just close
        console.log("[BiometricVerificationModal] User cancelled biometric");
        onClose();
      } else if (err.name === "NotSupportedError") {
        // Device doesn't support WebAuthn
        console.log(
          "[BiometricVerificationModal] Device doesn't support WebAuthn"
        );
        setError(
          "Biometric not available on this device. Falling back to PIN..."
        );
        setTimeout(() => {
          onBiometricUnavailable();
        }, 1500);
      } else {
        // Other error - fall back to PIN
        console.log(
          "[BiometricVerificationModal] Unexpected error",
          err.message
        );
        setError(
          `${err.message || "Biometric verification failed"}. Falling back to PIN...`
        );
        setTimeout(() => {
          onBiometricUnavailable();
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger biometric when modal opens
  if (open && !supportedChecked && !loading) {
    checkBiometricSupport().then(() => {
      // Auto-start biometric if supported
      if (isBiometricSupported) {
        setTimeout(() => {
          handleBiometricVerification();
        }, 300);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Verify with Biometric</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Details (if provided) */}
          {transactionAmount && (
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-sm text-slate-600">Amount</p>
              <p className="text-xl font-semibold text-slate-900">
                ₦{parseFloat(transactionAmount).toLocaleString("en-NG")}
              </p>
            </div>
          )}

          {/* Biometric Icon & Status */}
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="bg-primary/15 flex h-16 w-16 items-center justify-center rounded-full">
              <Fingerprint className="text-primary h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900">
                {loading
                  ? "Please complete biometric verification"
                  : "Ready for biometric"}
              </p>
              <p className="text-sm text-slate-600">
                {loading
                  ? "Look at your device camera or place your finger on the scanner"
                  : "This is more secure than entering your PIN"}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Verify Button */}
          <Button
            onClick={handleBiometricVerification}
            disabled={loading || !isBiometricSupported}
            className="bg-primary hover:bg-primary/90 w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Verify with Biometric
              </>
            )}
          </Button>

          {/* Fallback to PIN */}
          <Button
            onClick={onBiometricUnavailable}
            variant="outline"
            disabled={loading}
            className="w-full"
          >
            Use PIN Instead
          </Button>
        </div>

        {/* Footer */}
        <div className="border-t pt-3 text-center text-xs text-slate-500">
          <p>Your biometric data is secure and never shared</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
