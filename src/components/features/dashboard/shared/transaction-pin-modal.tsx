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
import { motion } from "framer-motion";
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === "setup"
                ? "Set Transaction PIN"
                : "Enter Transaction PIN"}
            </DialogTitle>
            <DialogDescription>
              {mode === "setup"
                ? "Create a 4-digit PIN to authorize this transaction."
                : "Enter your 4-digit PIN to complete the transaction."}
            </DialogDescription>
            {amount && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="mt-3 mb-2"
              >
                <p className="text-muted-foreground mb-2 text-xs">
                  Transaction Amount
                </p>
                <p className="text-foreground text-2xl font-bold">
                  ₦
                  {amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
            )}
          </DialogHeader>

          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
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
            </motion.div>

            {mode === "setup" && (
              <motion.div
                className="space-y-3"
                ref={confirmPinRef}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <label className="text-sm font-medium">Confirm PIN</label>
                <PinInput
                  length={4}
                  value={confirmPin}
                  onChange={setConfirmPin}
                  disabled={isLoading}
                  masked={true}
                />
              </motion.div>
            )}

            {error && (
              <motion.p
                className="text-sm text-red-500"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.p>
            )}

            <motion.div
              className="flex gap-2 pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
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
            </motion.div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
