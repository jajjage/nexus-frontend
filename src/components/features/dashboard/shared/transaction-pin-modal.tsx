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
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TransactionPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  isLoading?: boolean;
  mode: "setup" | "enter"; // "setup" for first time, "enter" for existing PIN
  amount?: number; // Amount to display when PIN modal appears
}

export function TransactionPinModal({
  isOpen,
  onClose,
  onSuccess,
  isLoading = false,
  mode = "enter",
  amount,
}: TransactionPinModalProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string>("");
  const confirmPinRef = useRef<HTMLDivElement>(null);
  const firstPinInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus first PIN input when modal opens on mobile
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        firstPinInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handlePinComplete = () => {
    if (mode === "setup") {
      // Focus the confirm PIN section when setup mode and first PIN is complete
      const firstInput = confirmPinRef.current?.querySelector("input");
      setTimeout(() => {
        firstInput?.focus();
      }, 100);
    }
  };

  const handleSubmit = () => {
    setError("");

    if (!pin || pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    if (mode === "setup") {
      // Setup mode: require confirmation
      if (!confirmPin || confirmPin.length !== 4) {
        setError("Confirm PIN must be 4 digits");
        return;
      }

      if (pin !== confirmPin) {
        setError("PINs do not match");
        setConfirmPin("");
        return;
      }
    }

    // Success - pass the PIN to parent
    onSuccess(pin);
    setPin("");
    setConfirmPin("");
  };

  const handleClose = () => {
    if (!isLoading) {
      setPin("");
      setConfirmPin("");
      setError("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] p-4 sm:max-w-md sm:rounded-2xl sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {mode === "setup" ? "Set Transaction PIN" : "Enter Transaction PIN"}
          </DialogTitle>
          <DialogDescription>
            {mode === "setup"
              ? "Create a 4-digit PIN to authorize this transaction."
              : "Enter your 4-digit PIN to complete the transaction."}
          </DialogDescription>
          {amount && (
            <div className="mt-3 mb-2">
              <p className="text-muted-foreground mb-2 text-xs">
                Transaction Amount
              </p>
              <p className="text-foreground text-2xl font-bold">
                ₦{amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {mode === "setup" ? "New Transaction PIN" : "Your PIN"}
            </label>
            <PinInput
              ref={firstPinInputRef}
              length={4}
              value={pin}
              onChange={setPin}
              onComplete={handlePinComplete}
              disabled={isLoading}
              masked={true}
            />
          </div>

          {mode === "setup" && (
            <div className="space-y-3" ref={confirmPinRef}>
              <label className="text-sm font-medium">Confirm PIN</label>
              <PinInput
                length={4}
                value={confirmPin}
                onChange={setConfirmPin}
                disabled={isLoading}
                masked={true}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {mode === "setup" ? "Set PIN" : "Confirm"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
