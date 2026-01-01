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
import { WebAuthnService } from "@/services/webauthn.service";
import { CheckCircle2, Fingerprint, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Key for local storage to track if user skipped biometrics
const BIOMETRIC_PROMPT_KEY = "biometric_prompt_status";

export function SetupWizard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"loading" | "pin" | "biometric" | "finish">(
    "loading"
  );
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  // Biometric registration hook
  const { mutate: registerBiometric, isPending: isBiometricPending } =
    useBiometricRegistration();

  useEffect(() => {
    if (isAuthLoading) return;

    const checkStatus = async () => {
      // 1. Check PIN status
      if (!user?.hasPin) {
        setStep("pin");
        return;
      }

      // 2. Check Biometric Support & Status
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
  }, [user, isAuthLoading]);

  // Handle Step Completion
  const handlePinSuccess = () => {
    // Force a re-check to move to next step
    // But since we can't easily refetch user inside SetPinForm without it being messy,
    // we assume success moves us forward.
    // Actually, SetPinForm calls invalidateQueries, so `user` should update.
    // However, to be smooth, we can transition to biometric check manually.

    // We need to wait a tick for the `user` object to update via React Query
    // Or we just manually advance step if we know biometrics might be next.

    setTimeout(async () => {
      const supported = await WebAuthnService.isWebAuthnSupported();
      const promptStatus = localStorage.getItem(BIOMETRIC_PROMPT_KEY);
      if (supported && !promptStatus) {
        setStep("biometric");
      } else {
        setStep("finish");
      }
    }, 500);
  };

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

  const handleBiometricSkip = () => {
    localStorage.setItem(BIOMETRIC_PROMPT_KEY, "skipped");
    setStep("finish");
  };

  const handleFinish = () => {
    router.replace("/dashboard");
  };

  // Auto-redirect on finish
  useEffect(() => {
    if (step === "finish") {
      handleFinish();
    }
  }, [step]);

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
          {/* We need to modify SetPinForm to accept an onSuccess callback or detect it via props? 
              Currently SetPinForm handles its own redirect. We should probably wrap it or modify it.
              
              Looking at SetPinForm code:
              It uses `useSearchParams().get("returnUrl")` or pushes to `/dashboard/profile`.
              
              We should probably PASS a custom onSuccess handler if possible, 
              but the component might not support it.
              
              Wait, SetPinForm logic:
              if (returnUrl) router.push(returnUrl) else router.push("/dashboard/profile")
              
              This is problematic for our flow. We want to stay here.
              We can mock the returnUrl in the URL? 
              /setup?returnUrl=/setup?step=biometric ... too complex.
              
              Better: Create a `SetPinInline` component or modify `SetPinForm` to accept `onSuccess`.
          */}
          <SetPinForm onSuccess={handlePinSuccess} />
        </CardContent>
      </Card>
    );
  }

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
