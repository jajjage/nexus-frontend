"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SmartBiometricIcon } from "@/components/ui/smart-biometric-icon";
import { useBiometricRegistration } from "@/hooks/useBiometric";
import { useBiometricType } from "@/hooks/useBiometricType";
import { WebAuthnService } from "@/services/webauthn.service";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const BIOMETRIC_PROMPT_KEY = "biometric_prompt_status";

export function BiometricPromptModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { mutate: register, isPending } = useBiometricRegistration();
  const { label } = useBiometricType();

  useEffect(() => {
    const checkStatus = async () => {
      // 1. Check if device supports biometrics
      const supported = await WebAuthnService.isWebAuthnSupported();
      setIsSupported(supported);

      if (!supported) return;

      // 2. Check if user has already made a choice
      const promptStatus = localStorage.getItem(BIOMETRIC_PROMPT_KEY);
      if (promptStatus) return; // Already skipped or enabled

      // 3. Show modal
      // We use a small delay to ensure the dashboard has loaded
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    };

    checkStatus();
  }, []);

  const handleEnable = () => {
    const info = WebAuthnService.getDeviceInfo();
    register(info.deviceName, {
      onSuccess: () => {
        // Save status as enabled
        localStorage.setItem(BIOMETRIC_PROMPT_KEY, "enabled");
        setIsOpen(false);
        // Modal closes - no toast needed
      },
      onError: () => {
        // Even if failed, we don't save status so they can try again later
        // or we could save 'skipped' to stop annoying them.
        // For now, let's keep it open or let them skip.
      },
    });
  };

  const handleSkip = () => {
    // Save status as skipped
    localStorage.setItem(BIOMETRIC_PROMPT_KEY, "skipped");
    setIsOpen(false);
  };

  if (!isSupported) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
            <SmartBiometricIcon size={24} />
          </div>
          <DialogTitle className="text-center text-xl">
            Enable {label}?
          </DialogTitle>
          <DialogDescription className="pt-2 text-center">
            Log in faster and more securely using your device&apos;s{" "}
            {label.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <ShieldCheck className="size-5 shrink-0 text-green-500" />
            <div className="text-sm">
              <p className="font-medium">Secure & Private</p>
              <p className="text-muted-foreground">
                Your biometric data never leaves your device.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleEnable}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Enabling...
              </>
            ) : (
              "Enable Biometrics"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
