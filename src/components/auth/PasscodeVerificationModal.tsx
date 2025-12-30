"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVerifyPasscode } from "@/hooks/usePasscode";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface PasscodeVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  intent?: "unlock" | "revalidate";
  title?: string;
  description?: string;
}

/**
 * PasscodeVerificationModal
 *
 * Used for:
 * 1. Soft-lock unlock - User enters 6-digit passcode to unlock
 * 2. Session revalidation - User enters passcode to re-verify identity
 *
 * Includes:
 * - 6-digit input boxes (like PIN but for passcode)
 * - Auto-submit when all digits entered
 * - Attempt limiting (3 attempts = 5 min block)
 * - Error messaging
 */
export function PasscodeVerificationModal({
  open,
  onClose,
  onSuccess,
  intent = "unlock",
  title = "Enter Passcode",
  description = "Enter your 6-digit passcode to continue",
}: PasscodeVerificationModalProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  const { mutate: verifyPasscode, isPending } = useVerifyPasscode();

  // Check if user is temporarily blocked after failed attempts
  useEffect(() => {
    if (isBlocked && blockTimeRemaining > 0) {
      const timer = setTimeout(
        () => setBlockTimeRemaining(blockTimeRemaining - 1),
        1000
      );
      return () => clearTimeout(timer);
    } else if (isBlocked && blockTimeRemaining === 0) {
      setIsBlocked(false);
      setAttempts(0);
    }
  }, [isBlocked, blockTimeRemaining]);

  const handlePasscodeChange = (value: string) => {
    // Only allow digits, max 6
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPasscode(digits);
    setError("");

    // Auto-submit when 6 digits are entered
    if (digits.length === 6) {
      setTimeout(() => handleVerifyPasscode(digits), 100);
    }
  };

  const handleVerifyPasscode = async (code?: string) => {
    const codeToVerify = code || passcode;

    if (codeToVerify.length !== 6) {
      setError("Passcode must be 6 digits");
      return;
    }

    if (isBlocked) {
      setError(
        `Too many failed attempts. Please try again in ${blockTimeRemaining} seconds.`
      );
      return;
    }

    setError("");

    verifyPasscode(
      { passcode: codeToVerify, intent },
      {
        onSuccess: (response) => {
          console.log(
            "[PasscodeVerificationModal] Passcode verification successful"
          );
          setPasscode("");
          setAttempts(0);
          onSuccess();
          onClose();
        },
        onError: (error: any) => {
          // Verification failed
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setPasscode("");
          const message =
            error.response?.data?.message ||
            "Invalid passcode. Please try again.";
          setError(message);

          if (newAttempts >= 3) {
            console.log(
              "[PasscodeVerificationModal] Max attempts reached - blocking"
            );
            setIsBlocked(true);
            setBlockTimeRemaining(300); // 5 minutes
            setError(
              "Too many failed attempts. Please try again in 5 minutes."
            );
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Passcode Input - 6 digit boxes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              6-Digit Passcode
            </label>
            <div className="flex justify-between gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className="focus-within:border-primary focus-within:ring-primary/20 flex h-14 w-12 items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-center text-2xl font-bold text-slate-900 transition-all focus-within:ring-2"
                >
                  {passcode[index] ? "•" : ""}
                </div>
              ))}
            </div>
            {/* Hidden input for capturing digits */}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={passcode}
              onChange={(e) => handlePasscodeChange(e.target.value)}
              placeholder="Enter 6-digit passcode"
              maxLength={6}
              disabled={isPending || isBlocked}
              className="absolute -left-full opacity-0"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Attempt Counter */}
          {attempts > 0 && !isBlocked && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-700">
                {3 - attempts} attempts remaining
              </p>
            </div>
          )}

          {/* Verify Button */}
          <Button
            onClick={() => handleVerifyPasscode()}
            disabled={isPending || passcode.length !== 6 || isBlocked}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Passcode"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
