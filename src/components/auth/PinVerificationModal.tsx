"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSecurityStore } from "@/store/securityStore";
import "@/styles/pin-cursor.css";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface PinVerificationModalProps {
  open: boolean;

  onClose: () => void;

  onSuccess: (pin: string) => void; // Pass PIN back to parent

  useCashback: boolean;

  reason: "soft-lock" | "transaction";

  transactionAmount?: string;

  productCode?: string;

  phoneNumber?: string;

  isVerifying?: boolean;

  errorMessage?: string;

  onForgotPin?: () => void;
}

/**

 * PinVerificationModal Component

 *

 * PIN entry modal (4-digit) for transaction verification

 *

 * Features:

 * - Auto-submit when 4 digits entered

 * - PIN attempt tracking (3 failures = 5 min block)

 * - Clear error handling

 * - Keyboard support (Backspace to delete)

 *

 * Note: This is FALLBACK for transactions when:

 * - User doesn't have biometric enrolled

 * - User doesn't have biometric device available

 * - User explicitly chooses PIN verification

 */

export function PinVerificationModal({
  open,

  onClose,

  onSuccess,

  reason,

  useCashback,

  transactionAmount,

  productCode,

  phoneNumber,

  isVerifying = false,

  errorMessage,

  onForgotPin,
}: PinVerificationModalProps) {
  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);

  const [internalError, setInternalError] = useState("");

  const [showPin, setShowPin] = useState(false);

  const [isFocused, setIsFocused] = useState(false);

  // Combine internal validation errors with external API errors

  const displayError = internalError || errorMessage;

  const { isBlocked } = useSecurityStore();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  // Clear internal error when pin changes

  useEffect(() => {
    if (internalError) setInternalError("");
  }, [pin]);

  // Auto-submit when PIN reaches 4 digits

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 4).replace(/\D/g, "");

    setPin(value);

    setInternalError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    console.log("[PinVerificationModal] handleSubmit called", {
      pinLength: pin.length,

      loading,

      isVerifying,

      isBlocked,
    });

    if (loading || isVerifying) {
      console.log(
        "[PinVerificationModal] Skipping submit - already loading/verifying"
      );

      return;
    }

    if (pin.length !== 4) {
      console.log(
        "[PinVerificationModal] Validation failed - PIN length not 4"
      );

      setInternalError("PIN must be 4 digits");

      return;
    }

    if (isBlocked) {
      console.log("[PinVerificationModal] Blocked - too many attempts");

      setInternalError("Too many failed attempts. Please try again later.");

      return;
    }

    setLoading(true);

    setInternalError("");

    try {
      console.log("[PinVerificationModal] Verifying PIN");

      // Simply validate that a PIN was entered

      if (pin.length !== 4) {
        setInternalError("PIN must be exactly 4 digits");

        return;
      }

      // Call onSuccess with the PIN - parent will handle payment
      console.log("[PinVerificationModal] PIN submitted to parent");
      onSuccess(pin);

      // Clear PIN immediately so it's empty whether success (modal closes) or error (modal stays open)
      setPin("");
    } catch (err: any) {
      console.error("[PinVerificationModal] Error", err);
      setInternalError(err.message || "Verification failed. Please try again.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  // Keep input focused when not loading/verifying
  useEffect(() => {
    if (open && !loading && !isVerifying && !isBlocked) {
      // Small timeout to ensure DOM is ready and not conflicting with disable state updates
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [open, loading, isVerifying, isBlocked]);

  return (
    <Dialog
      open={open}
      onOpenChange={isVerifying || loading ? undefined : onClose}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {reason === "transaction"
              ? "Verify Transaction"
              : "Verify Identity"}
          </DialogTitle>
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

          {/* PIN Input - 4 Individual Digit Boxes */}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                4-Digit PIN
              </label>

              {onForgotPin && (
                <button
                  onClick={onForgotPin}
                  className="text-primary text-xs font-medium hover:underline"
                  type="button"
                >
                  Forgot PIN?
                </button>
              )}
            </div>

            <div className="relative flex justify-center gap-3">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="flex h-16 w-14 items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-2xl font-bold text-slate-900"
                >
                  {pin[index] ? "•" : ""}

                  {/* Blinking cursor */}

                  {isFocused && pin.length === index && (
                    <span className="cursor-blink text-primary ml-1">|</span>
                  )}
                </div>
              ))}

              {/* Hidden transparent input overlay */}

              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={pin}
                onChange={handlePinChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={loading || isBlocked || isVerifying}
                maxLength={4}
                className="absolute inset-0 cursor-text opacity-0"
                placeholder=""
                pattern="[0-9]*"
                autoComplete="off"
              />
            </div>

            <p className="text-center text-xs text-slate-500">
              {pin.length}/4 digits entered
            </p>
          </div>

          {/* Error Message */}

          {displayError && (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

              <p className="text-sm text-red-700">{displayError}</p>
            </div>
          )}

          {/* Blocked Warning */}

          {isBlocked && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-700">
                Too many failed attempts. Please try again later.
              </p>
            </div>
          )}

          {/* Buttons */}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading || isVerifying}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={pin.length !== 4 || loading || isBlocked || isVerifying}
              className="bg-primary hover:bg-primary/90 flex-1"
            >
              {loading || isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </div>
        </div>

        {/* Helper Text */}

        <div className="border-t pt-3 text-center text-xs text-slate-500">
          <p>Your PIN is encrypted and secure</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
