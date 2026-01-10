"use client";

import { SetPinForm } from "@/components/features/security/set-pin-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { useBiometricRegistration } from "@/hooks/useBiometric";
import { useSetPasscode } from "@/hooks/usePasscode";
import { WebAuthnService } from "@/services/webauthn.service";
import {
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState("");

  // Hooks
  const { mutate: registerBiometric, isPending: isBiometricPending } =
    useBiometricRegistration();
  const { mutate: setUserPasscode, isPending: isPasscodePending } =
    useSetPasscode();

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
  const handlePasscodeSubmit = () => {
    setPasscodeError("");

    if (passcode.length !== 6) {
      setPasscodeError("Passcode must be 6 digits");
      return;
    }

    if (!/^\d{6}$/.test(passcode)) {
      setPasscodeError("Passcode must contain only digits");
      return;
    }

    if (passcode !== confirmPasscode) {
      setPasscodeError("Passcodes do not match");
      return;
    }

    setUserPasscode(
      { passcode },
      {
        onSuccess: () => {
          localStorage.setItem(PASSCODE_PROMPT_KEY, "enabled");
          toast.success("App passcode set successfully");
          handlePasscodeComplete();
        },
        onError: (error: any) => {
          setPasscodeError(
            error.response?.data?.message || "Failed to set passcode"
          );
        },
      }
    );
  };

  // Handle Passcode Skip
  const handlePasscodeSkip = () => {
    localStorage.setItem(PASSCODE_PROMPT_KEY, "skipped");
    handlePasscodeComplete();
  };

  // After passcode, move to biometric
  const handlePasscodeComplete = async () => {
    const supported = await WebAuthnService.isWebAuthnSupported();
    const promptStatus = localStorage.getItem(BIOMETRIC_PROMPT_KEY);
    if (supported && !promptStatus) {
      setStep("biometric");
    } else {
      setStep("finish");
    }
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

  // Auto-redirect on finish
  useEffect(() => {
    if (step === "finish") {
      handleFinish();
    }
  }, [step]);

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
          <div className="space-y-2">
            <label className="text-sm font-medium">New Passcode</label>
            <div className="relative">
              <input
                type={showPasscode ? "text" : "password"}
                value={passcode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPasscode(val);
                  setPasscodeError("");
                }}
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-lg tracking-[0.5em] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setShowPasscode(!showPasscode)}
              >
                {showPasscode ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Confirm Passcode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm Passcode</label>
            <div className="relative">
              <input
                type={showPasscode ? "text" : "password"}
                value={confirmPasscode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setConfirmPasscode(val);
                  setPasscodeError("");
                }}
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-lg tracking-[0.5em] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
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
            onClick={handlePasscodeSubmit}
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
            <Fingerprint className="size-8" />
          </div>
          <CardTitle>Enable Biometric Login</CardTitle>
          <CardDescription>
            Log in faster and more securely using your device's fingerprint or
            face recognition.
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
              "Enable Biometrics"
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
