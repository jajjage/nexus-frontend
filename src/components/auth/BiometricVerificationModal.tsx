"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthContext } from "@/context/AuthContext";
import { useBiometricTransaction } from "@/hooks/useBiometric";
import { WebAuthnService } from "@/services/webauthn.service";
import { AlertCircle, Fingerprint, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface BiometricVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (verificationToken: string) => void;
  onBiometricUnavailable: () => void; // Fallback to PIN
  onNoPinSetup?: () => void; // Show PIN setup modal
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
 * - If PIN not set: Show PIN setup modal
 * - If PIN is set: Show PIN verification modal
 *
 * KEY REQUIREMENTS:
 * - Biometric takes PRIORITY over PIN
 * - User should NOT be prompted for PIN if biometric succeeds
 * - User should ONLY see PIN modal if biometric fails or unavailable
 * - Verification token from biometric is passed to transaction API
 * - Don't show checkout modal in background while switching modals
 */
export function BiometricVerificationModal({
  open,
  onClose,
  onSuccess,
  onBiometricUnavailable,
  onNoPinSetup,
  transactionAmount,
  productCode,
  phoneNumber,
}: BiometricVerificationModalProps) {
  const { user } = useAuthContext();
  const [supportedChecked, setSupportedChecked] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isAutoRetry, setIsAutoRetry] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Use the biometric transaction mutation
  const {
    mutate: verifyBiometric,
    isPending: loading,
    error: mutationError,
    reset: resetMutation,
  } = useBiometricTransaction();

  // Get error message from mutation or use custom error message
  const error = errorMessage || mutationError?.message || "";

  // Transition to PIN or PIN setup based on whether PIN is set
  const transitionToNextModal = useCallback(() => {
    // Immediately check PIN status
    const hasPin = user?.hasPin;

    // Call appropriate callback to show next modal
    if (hasPin) {
      // User has PIN set - show PIN verification modal
      onBiometricUnavailable();
    } else {
      // User doesn't have PIN set - show PIN setup modal instead
      if (onNoPinSetup) {
        onNoPinSetup();
      } else {
        // Fallback to PIN modal if onNoPinSetup not provided
        onBiometricUnavailable();
      }
    }
  }, [user?.hasPin, onBiometricUnavailable, onNoPinSetup]);

  // Check biometric support on mount and auto-start verification
  useEffect(() => {
    if (!open) {
      setSupportedChecked(false);
      setIsTransitioning(false);
      setErrorMessage("");
      resetMutation();
      return;
    }

    if (supportedChecked) return;

    const checkSupport = async () => {
      try {
        const supported = await WebAuthnService.isWebAuthnSupported();
        setSupportedChecked(true);
        setIsBiometricSupported(supported);

        if (supported) {
          // Mark this as auto-retry on first load
          setIsAutoRetry(true);
          // Auto-start biometric verification if supported
          setTimeout(() => {
            verifyBiometric(undefined, {
              onSuccess: (verificationToken: string | undefined) => {
                if (verificationToken) {
                  onSuccess(verificationToken);
                  onClose();
                }
              },
              onError: (error: any) => {
                // Check if it's a counter validation error (don't auto-fallback)
                if (
                  error.message &&
                  error.message.toLowerCase().includes("security check")
                ) {
                  // User can retry biometric
                  setIsAutoRetry(false);
                  return;
                }

                // Auto-retry failed - transition immediately
                console.log(
                  "[BiometricVerificationModal] Auto-retry failed, transitioning to PIN",
                  error
                );
                setIsAutoRetry(false);
                setIsTransitioning(true);
                transitionToNextModal();
              },
            });
          }, 300);
        } else {
          // WebAuthn not supported - transition immediately without showing error
          setIsAutoRetry(false);

          console.log(
            "[BiometricVerificationModal] WebAuthn not supported, transitioning to PIN"
          );

          // Transition immediately - no error display
          setIsTransitioning(true);
          transitionToNextModal();
        }
      } catch (err) {
        setSupportedChecked(true);
        setIsBiometricSupported(false);
        setIsAutoRetry(false);

        console.log("[BiometricVerificationModal] WebAuthn check failed", err);

        // Transition immediately without error display
        setIsTransitioning(true);
        transitionToNextModal();
      }
    };

    checkSupport();
  }, [
    open,
    supportedChecked,
    verifyBiometric,
    isAutoRetry,
    transitionToNextModal,
  ]);

  const handleBiometricVerification = () => {
    resetMutation();
    setIsAutoRetry(false);
    setErrorMessage("");
    verifyBiometric(undefined, {
      onSuccess: (verificationToken: string | undefined) => {
        if (verificationToken) {
          onSuccess(verificationToken);
          onClose();
        }
      },
      onError: (error: any) => {
        // Check if it's a counter validation error (don't auto-fallback)
        if (
          error.message &&
          error.message.toLowerCase().includes("security check")
        ) {
          // User can retry biometric
          return;
        }
        // Other errors - show error briefly then transition to PIN
        setErrorMessage(error?.message || "Verification failed");
        setTimeout(() => {
          setIsTransitioning(true);
          transitionToNextModal();
        }, 2000);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {/* Hide content during initialization or transition to prevent flashing */}
        {(!supportedChecked || isTransitioning) && !errorMessage ? (
          <div className="flex h-40 items-center justify-center">
            <DialogTitle className="sr-only">
              Verifying Biometric Support
            </DialogTitle>
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Verify with Fingerprint</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              {/* Error Display - Shows for 2 seconds before transition */}
              {errorMessage && (
                <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-red-900">
                      Biometric Unavailable
                    </p>
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Main content - Hidden while showing error and transitioning */}
              {!errorMessage && (
                <>
                  {/* Biometric Icon */}
                  <div className="flex justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-blue-50 to-indigo-50">
                      <Fingerprint className="h-12 w-12 text-indigo-600" />
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="text-center">
                    {!isBiometricSupported ? (
                      <>
                        <p className="font-medium text-gray-900">
                          Biometric Not Available
                        </p>
                        <p className="text-sm text-gray-600">
                          Your device doesn't support biometric verification.
                          Please use PIN instead.
                        </p>
                      </>
                    ) : loading ? (
                      <>
                        <p className="font-medium text-gray-900">
                          Waiting for Fingerprint
                        </p>
                        <p className="text-sm text-gray-600">
                          {isAutoRetry
                            ? "Preparing biometric verification..."
                            : "Touch your fingerprint sensor"}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-gray-900">
                          Verify Transaction
                        </p>
                        <p className="text-sm text-gray-600">
                          Use your fingerprint to verify this{" "}
                          {transactionAmount
                            ? `₦ ${transactionAmount} transaction`
                            : "transaction"}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Amount Display */}
                  {transactionAmount && (
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-xs text-gray-600">
                        Transaction Amount
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        ₦ {transactionAmount}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      onClick={handleBiometricVerification}
                      disabled={loading || !isBiometricSupported}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Use Fingerprint"
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={transitionToNextModal}
                      className="w-full"
                    >
                      Use PIN Instead
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
