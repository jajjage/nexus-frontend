"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSecurityStore } from "@/store/securityStore";
import "@/styles/pin-cursor.css";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface PinVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  useCashback: boolean;
  reason: "soft-lock" | "transaction";
  transactionAmount?: string;
  productCode?: string;
  phoneNumber?: string;
  isVerifying?: boolean;
  errorMessage?: string;
  onForgotPin?: () => void;
}

function formatTransactionAmount(amount?: string) {
  if (!amount) return null;
  const parsed = Number.parseFloat(amount.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return parsed.toLocaleString("en-NG");
}

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
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [internalError, setInternalError] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const { isBlocked, recordPinAttempt, resetPinAttempts } = useSecurityStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError =
    (isBlocked ? "Too many failed attempts. Please try again later." : "") ||
    internalError ||
    errorMessage;
  const formattedTransactionAmount = formatTransactionAmount(transactionAmount);

  // Clear PIN state when modal opens or closes
  useEffect(() => {
    if (open) {
      setPin("");
      setInternalError("");
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
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

  // Check external error message for failed attempt
  useEffect(() => {
    if (
      errorMessage &&
      (errorMessage.toLowerCase().includes("pin") ||
        errorMessage.toLowerCase().includes("invalid"))
    ) {
      const isExceeded = recordPinAttempt(false);
      if (isExceeded) {
        toast.error(
          "3 incorrect PIN attempts. Redirecting to change PIN page..."
        );
        onClose();
        if (onForgotPin) {
          onForgotPin();
        } else {
          router.push("/dashboard/profile/security/pin");
        }
      }
    }
  }, [errorMessage, recordPinAttempt, onClose, onForgotPin, router]);

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
    if (loading || isVerifying) return;

    if (pin.length !== 4) {
      setInternalError("PIN must be 4 digits");
      return;
    }

    setLoading(true);
    setInternalError("");

    try {
      onSuccess(pin);
      setPin("");
    } catch (err: any) {
      console.error("[PinVerificationModal] Error", err);
      const isExceeded = recordPinAttempt(false);
      if (isExceeded) {
        toast.error(
          "3 incorrect PIN attempts. Redirecting to change PIN page..."
        );
        onClose();
        if (onForgotPin) {
          onForgotPin();
        } else {
          router.push("/dashboard/profile/security/pin");
        }
      } else {
        setInternalError(
          err.message || "Verification failed. Please try again."
        );
        setPin("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isVerifying && !loading) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {reason === "transaction"
              ? "Verify Transaction"
              : "Verify Identity"}
          </DialogTitle>
          <DialogDescription>
            Please enter your 4-digit PIN to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {formattedTransactionAmount && (
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-sm text-slate-600">Amount</p>
              <p className="text-xl font-semibold text-slate-900">
                ₦{formattedTransactionAmount}
              </p>
            </div>
          )}

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
                  {isFocused && pin.length === index && (
                    <span className="cursor-blink text-primary ml-1">|</span>
                  )}
                </div>
              ))}

              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={pin}
                onChange={handlePinChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={loading || isVerifying || isBlocked}
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

          {displayError && (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{displayError}</p>
            </div>
          )}

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
              disabled={pin.length !== 4 || loading || isVerifying || isBlocked}
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

        <div className="border-t pt-3 text-center text-xs text-slate-500">
          <p>Your PIN is encrypted and secure</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
