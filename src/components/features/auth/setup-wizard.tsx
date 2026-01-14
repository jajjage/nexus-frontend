"use client";

import { SetPinForm } from "@/components/features/security/set-pin-form";
import { PinInput } from "@/components/pin-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SmartBiometricIcon } from "@/components/ui/smart-biometric-icon";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { useBiometricRegistration } from "@/hooks/useBiometric";
import { useBiometricType } from "@/hooks/useBiometricType";
import { useSetPasscode } from "@/hooks/usePasscode";
import { WebAuthnService } from "@/services/webauthn.service";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Keys for local storage to track setup status
const BIOMETRIC_PROMPT_KEY = "biometric_prompt_status";
const PASSCODE_PROMPT_KEY = "passcode_prompt_status";

type SetupStep = "loading" | "pin" | "passcode" | "biometric" | "finish";

export function SetupWizard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>("loading");
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isPwaMode, setIsPwaMode] = useState(false);

  // Passcode state
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  // Refs for auto-focus
  const passcodeRef = useRef<HTMLInputElement>(null);
  const confirmPasscodeRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { mutate: registerBiometric, isPending: isBiometricPending } =
    useBiometricRegistration();
  const { mutate: setUserPasscode, isPending: isPasscodePending } =
    useSetPasscode();
  const { label } = useBiometricType();

  // Check PWA mode (still used for soft lock feature)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isPwa =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsPwaMode(isPwa);
      console.log("[SetupWizard] PWA mode detected:", isPwa);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    const checkStatus = async () => {
      console.log("[SetupWizard] Checking status:", {
        hasPin: user?.hasPin,
        hasPasscode: user?.hasPasscode,
        isPwaMode,
      });

      // 1. Check PIN status first
      if (!user?.hasPin) {
        setStep("pin");
        return;
      }

      // 2. Check if passcode not yet set (for ALL users, not just PWA)
      if (!user?.hasPasscode) {
        console.log("[SetupWizard] Need passcode setup");
        setStep("passcode");
        return;
      }

      // 3. Check Biometric Support & Status
      const supported = await WebAuthnService.isWebAuthnSupported();
      setIsBiometricSupported(supported);

      const promptStatus = localStorage.getItem(BIOMETRIC_PROMPT_KEY);

      // If supported and not yet decided (neither enabled nor skipped)
      if (supported && !promptStatus) {
        setStep("biometric");
        return;
      }

      // If all done, go to finish/dashboard
      setStep("finish");
    };

    checkStatus();
  }, [user, isAuthLoading, isPwaMode]);

  // Handle finish step - redirect to dashboard
  useEffect(() => {
    if (step === "finish") {
      const timer = setTimeout(() => {
        router.replace("/dashboard");
      }, 1000); // Small delay to show the completion state
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  // Handle PIN Success - Move to next step
  const handlePinSuccess = () => {
    setTimeout(async () => {
      // Check if passcode not yet set (for ALL users)
      if (!user?.hasPasscode) {
        setStep("passcode");
        return;
      }

      // Otherwise check biometrics
      const supported = await WebAuthnService.isWebAuthnSupported();
      const promptStatus = localStorage.getItem(BIOMETRIC_PROMPT_KEY);
      if (supported && !promptStatus) {
        setStep("biometric");
      } else {
        setStep("finish");
      }
    }, 500);
  };

  // Handle Passcode Submit
  const handleNewPasscodeComplete = () => {
    setTimeout(() => {
      confirmPasscodeRef.current?.focus();
    }, 50);
  };

  const handleConfirmPasscodeComplete = (val: string) => {
    // Auto submit with the final value
    handlePasscodeSubmit(val);
  };

  // Handle Passcode Submit
  const handlePasscodeSubmit = (confirmVal?: string) => {
    setPasscodeError("");

    // Use provided value or fall back to state (for button click)
    const finalConfirmPasscode = confirmVal ?? confirmPasscode;

    if (passcode.length !== 6) {
      setPasscodeError("Passcode must be 6 digits");
      return;
    }

    if (passcode !== finalConfirmPasscode) {
      setPasscodeError("Passcodes do not match");
      return;
    }

    setUserPasscode(
      { passcode },
      {
        onSuccess: () => {
          localStorage.setItem(PASSCODE_PROMPT_KEY, "enabled");
          toast.success("App passcode set successfully");
          handleFinish(); // Move to biometric or finish
        },
        onError: (error: any) => {
          setPasscodeError(
            error.response?.data?.message || "Failed to set passcode"
          );
        },
      }
    );
  };

  // Handle Biometric Enable
  const handleBiometricEnable = () => {
    const info = WebAuthnService.getDeviceInfo();
    registerBiometric(info.deviceName, {
      onSuccess: () => {
        localStorage.setItem(BIOMETRIC_PROMPT_KEY, "enabled");
        toast.success("Biometric login enabled");
        setStep("finish");
      },
    });
  };

  // Handle Biometric Skip
  const handleBiometricSkip = () => {
    localStorage.setItem(BIOMETRIC_PROMPT_KEY, "skipped");
    setStep("finish");
  };

  // Handle Finish
  const handleFinish = () => {
    router.replace("/dashboard");
  };

  // Loading/Finish state
  if (step === "loading" || step === "finish") {
    return (
      <Card className="border-none bg-transparent shadow-none">
        <CardContent className="flex flex-col items-center justify-center pt-6">
          <Spinner className="text-primary size-8" />
          <p className="text-muted-foreground mt-4 text-sm">
            {step === "finish"
              ? "Setting up your dashboard..."
              : "Checking account status..."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // PIN Step
  if (step === "pin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Secure Your Account</CardTitle>
          <CardDescription>
            Please set a 4-digit Transaction PIN. This will be required for all
            payments and withdrawals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetPinForm onSuccess={handlePinSuccess} />
        </CardContent>
      </Card>
    );
  }

  // Passcode Step (for PWA soft lock)
  if (step === "passcode") {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
            <Lock className="size-8" />
          </div>
          <CardTitle>Set App Passcode</CardTitle>
          <CardDescription>
            Create a 6-digit passcode to unlock your app quickly. This will be
            used when you return to the app after being away.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Passcode Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium">New Passcode</label>
            <PinInput
              ref={passcodeRef}
              length={6}
              value={passcode}
              onChange={(val: string) => {
                setPasscode(val);
                setPasscodeError("");
              }}
              onComplete={handleNewPasscodeComplete}
              masked={true}
              disabled={isPasscodePending}
              error={!!passcodeError}
            />
          </div>

          {/* Confirm Passcode */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Confirm Passcode</label>
            <PinInput
              ref={confirmPasscodeRef}
              length={6}
              value={confirmPasscode}
              onChange={(val: string) => {
                setConfirmPasscode(val);
                setPasscodeError("");
              }}
              onComplete={handleConfirmPasscodeComplete}
              masked={true}
              disabled={isPasscodePending}
              error={!!passcodeError}
            />
          </div>

          {/* Error */}
          {passcodeError && (
            <p className="text-sm text-red-500">{passcodeError}</p>
          )}

          {/* Info */}
          <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-4">
            <ShieldCheck className="size-5 shrink-0 text-green-500" />
            <div className="text-sm">
              <p className="font-medium">Quick App Unlock</p>
              <p className="text-muted-foreground">
                Use this passcode to quickly unlock the app when you return.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <Button
            onClick={() => handlePasscodeSubmit()}
            disabled={isPasscodePending || passcode.length !== 6}
            className="w-full"
            size="lg"
          >
            {isPasscodePending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Set Passcode"
            )}
          </Button>

          {/* Note: Passcode is REQUIRED for PWA users - no skip button */}
          <p className="text-muted-foreground text-center text-xs">
            Passcode is required to secure your app. You can change it later in
            Settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Biometric Step
  if (step === "biometric") {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
            <SmartBiometricIcon size={32} />
          </div>
          <CardTitle>Enable {label} Login</CardTitle>
          <CardDescription>
            Log in faster and more securely using your device&apos;s{" "}
            {label.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-4">
            <ShieldCheck className="size-5 shrink-0 text-green-500" />
            <div className="text-sm">
              <p className="font-medium">Secure & Private</p>
              <p className="text-muted-foreground">
                Your biometric data never leaves your device.
              </p>
            </div>
          </div>

          <Button
            onClick={handleBiometricEnable}
            disabled={isBiometricPending}
            className="w-full"
            size="lg"
          >
            {isBiometricPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Enabling...
              </>
            ) : (
              `Enable ${label}`
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleBiometricSkip}
            className="w-full"
          >
            Skip for now
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
