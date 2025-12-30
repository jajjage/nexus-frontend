"use client";

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
import { useState } from "react";

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
 *
 * Flow:
 * 1. Enter new 6-digit passcode
 * 2. Confirm passcode (retype)
 * 3. If changing: Enter current passcode for verification
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

  const { mutate: setPasscode, isPending } = useSetPasscode();

  const handlePasscodeInput = (
    value: string,
    setter: (val: string) => void
  ) => {
    // Only allow digits, max 6
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setter(digits);
    setError("");
  };

  const handleNext = () => {
    setError("");

    if (step === "current") {
      if (currentPasscode.length !== 6) {
        setError("Current passcode must be 6 digits");
        return;
      }
      setStep("new");
    } else if (step === "new") {
      if (newPasscode.length !== 6) {
        setError("New passcode must be 6 digits");
        return;
      }
      setStep("confirm");
    } else if (step === "confirm") {
      if (confirmPasscode.length !== 6) {
        setError("Confirmation must be 6 digits");
        return;
      }
      if (newPasscode !== confirmPasscode) {
        setError("Passcodes do not match");
        setConfirmPasscode("");
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setError("");

    setPasscode(
      {
        passcode: newPasscode,
        currentPasscode: isChanging ? currentPasscode : undefined,
      },
      {
        onSuccess: () => {
          console.log("[SetPasscodeModal] Passcode set successfully");
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Current Passcode
              </label>
              <div className="flex justify-between gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className="flex h-14 w-12 items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-center text-2xl font-bold text-slate-900"
                  >
                    {currentPasscode[index] ? "•" : ""}
                  </div>
                ))}
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={currentPasscode}
                onChange={(e) =>
                  handlePasscodeInput(e.target.value, setCurrentPasscode)
                }
                className="absolute -left-full opacity-0"
                autoFocus
              />
            </div>
          )}

          {/* Step 2: New Passcode */}
          {step === "new" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                New Passcode
              </label>
              <div className="flex justify-between gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className="flex h-14 w-12 items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-center text-2xl font-bold text-slate-900"
                  >
                    {newPasscode[index] ? "•" : ""}
                  </div>
                ))}
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={newPasscode}
                onChange={(e) =>
                  handlePasscodeInput(e.target.value, setNewPasscode)
                }
                className="absolute -left-full opacity-0"
                autoFocus
              />
            </div>
          )}

          {/* Step 3: Confirm Passcode */}
          {step === "confirm" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Confirm Passcode
              </label>
              <div className="flex justify-between gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className="flex h-14 w-12 items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-center text-2xl font-bold text-slate-900"
                  >
                    {confirmPasscode[index] ? "•" : ""}
                  </div>
                ))}
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={confirmPasscode}
                onChange={(e) =>
                  handlePasscodeInput(e.target.value, setConfirmPasscode)
                }
                className="absolute -left-full opacity-0"
                autoFocus
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                isPending ||
                (step === "current" && currentPasscode.length !== 6) ||
                (step === "new" && newPasscode.length !== 6) ||
                (step === "confirm" && confirmPasscode.length !== 6)
              }
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : step === "confirm" ? (
                "Complete"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
