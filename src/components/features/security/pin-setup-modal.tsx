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
import { useRef, useState } from "react";

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  isLoading?: boolean;
}

export function PinSetupModal({
  isOpen,
  onClose,
  onSuccess,
  isLoading = false,
}: PinSetupModalProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string>("");
  const confirmPinRef = useRef<HTMLDivElement>(null);

  const handlePinComplete = () => {
    // Focus the first input of the confirm PIN section
    const firstInput = confirmPinRef.current?.querySelector("input");
    setTimeout(() => {
      firstInput?.focus();
    }, 100);
  };

  const handleSubmit = () => {
    setError("");

    if (!pin || pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    if (!confirmPin || confirmPin.length !== 4) {
      setError("Confirm PIN must be 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match");
      setConfirmPin("");
      return;
    }

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
          <DialogTitle>Set Your Transaction PIN</DialogTitle>
          <DialogDescription>
            A Transaction PIN is required to authorize payments and withdrawals.
            Please set a 4-digit PIN.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">New Transaction PIN</label>
            <PinInput
              length={4}
              value={pin}
              onChange={setPin}
              onComplete={handlePinComplete}
              disabled={isLoading}
              masked={true}
            />
          </div>

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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              Skip for now
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Set PIN
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
