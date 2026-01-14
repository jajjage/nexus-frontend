"use client";

import { PinInput } from "@/components/pin-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSetPasscode } from "@/hooks/usePasscode";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SetPasscodeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isChanging?: boolean;
}

/**
 * SetPasscodeModal
 *
 * For setting a new passcode or changing existing one.
 * Uses individual input boxes with auto-focus and auto-advance.
 *
 * Flow:
 * 1. Enter new 6-digit passcode (auto-advance on complete)
 * 2. Confirm passcode (auto-advance on complete)
 * 3. If changing: Enter current passcode for verification (auto-submit)
 * 4. Submit to backend
 */
export function SetPasscodeModal({
  open,
  onClose,
  onSuccess,
  isChanging = false,
}: SetPasscodeModalProps) {
  const [step, setStep] = useState<"new" | "confirm" | "current">(
    isChanging ? "current" : "new"
  );
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState("");

  // Refs for focusing inputs
  const newInputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);
  const currentInputRef = useRef<HTMLInputElement>(null);

  const { mutate: setPasscode, isPending } = useSetPasscode();

  // Auto-focus the current step's input when step changes or modal opens
  useEffect(() => {
    if (!open) return;

    const focusDelay = setTimeout(() => {
      if (step === "current") {
        currentInputRef.current?.focus();
      } else if (step === "new") {
        newInputRef.current?.focus();
      } else if (step === "confirm") {
        confirmInputRef.current?.focus();
      }
    }, 100);

    return () => clearTimeout(focusDelay);
  }, [open, step]);

  // Handle step completion - auto-advance to next step
  const handleNewComplete = () => {
    setError("");
    setStep("confirm");
  };

  const handleConfirmComplete = () => {
    setError("");
    if (newPasscode !== confirmPasscode) {
      setError("Passcodes do not match");
      setConfirmPasscode("");
      return;
    }
    handleSubmit();
  };

  const handleCurrentComplete = () => {
    setError("");
    setStep("new");
  };

  const handleSubmit = () => {
    setError("");

    setPasscode(
      {
        passcode: newPasscode,
        currentPasscode: isChanging ? currentPasscode : undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setCurrentPasscode("");
          setNewPasscode("");
          setConfirmPasscode("");
          setStep(isChanging ? "current" : "new");
          onSuccess();
          onClose();
        },
        onError: (error: any) => {
          const message =
            error.response?.data?.message ||
            error.message ||
            "Failed to set passcode";
          setError(message);
          // Reset to first step
          setCurrentPasscode("");
          setNewPasscode("");
          setConfirmPasscode("");
          setStep(isChanging ? "current" : "new");
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setCurrentPasscode("");
      setNewPasscode("");
      setConfirmPasscode("");
      setStep(isChanging ? "current" : "new");
      setError("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isChanging ? "Change Passcode" : "Set Passcode"}
          </DialogTitle>
          <DialogDescription>
            {step === "current"
              ? "Enter your current passcode to verify"
              : step === "new"
                ? "Enter your new 6-digit passcode"
                : "Confirm your new passcode"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Current Passcode (if changing) */}
          {step === "current" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Current Passcode
              </label>
              <PinInput
                ref={currentInputRef}
                length={6}
                value={currentPasscode}
                onChange={setCurrentPasscode}
                onComplete={handleCurrentComplete}
                disabled={isPending}
                masked={true}
                error={!!error}
              />
            </div>
          )}

          {/* Step 2: New Passcode */}
          {step === "new" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">New Passcode</label>
              <PinInput
                ref={newInputRef}
                length={6}
                value={newPasscode}
                onChange={setNewPasscode}
                onComplete={handleNewComplete}
                disabled={isPending}
                masked={true}
                error={!!error}
              />
            </div>
          )}

          {/* Step 3: Confirm Passcode */}
          {step === "confirm" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Confirm Passcode
              </label>
              <PinInput
                ref={confirmInputRef}
                length={6}
                value={confirmPasscode}
                onChange={setConfirmPasscode}
                onComplete={handleConfirmComplete}
                disabled={isPending}
                masked={true}
                error={!!error}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Loading indicator */}
          {isPending && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground text-sm">
                Processing...
              </span>
            </div>
          )}

          {/* Close button */}
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
