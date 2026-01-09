"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSetup2FA,
  useUpdateUser,
  useVerify2FA,
} from "@/hooks/admin/useAdminUsers";
import { AdminSetup2FAResponse } from "@/types/admin/user.types";
import { Check, Copy, KeyRound, Loader2, QrCode, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Setup2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

type Step = "initial" | "qrcode" | "verify" | "backup";

export function Setup2FAModal({
  isOpen,
  onClose,
  userId,
  userName,
  onSuccess,
}: Setup2FAModalProps) {
  const [step, setStep] = useState<Step>("initial");
  const [data, setData] = useState<AdminSetup2FAResponse | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const setup2FAMutation = useSetup2FA();
  const verify2FAMutation = useVerify2FA();
  const updateUserMutation = useUpdateUser();

  const handleStartSetup = () => {
    setup2FAMutation.mutate(userId, {
      onSuccess: (response) => {
        setData(response.data ?? null);
        setStep("qrcode");
      },
    });
  };

  const handleVerifyOtp = () => {
    if (otpCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    verify2FAMutation.mutate(
      { userId, code: otpCode },
      {
        onSuccess: () => {
          setStep("backup");
        },
      }
    );
  };

  const handleForceEnable = () => {
    // Bypass verification and force update the user record
    updateUserMutation.mutate(
      { userId, data: { twoFactorEnabled: true } },
      {
        onSuccess: () => {
          setStep("backup");
          toast.success("2FA Force Enabled (Verification Skipped)");
        },
      }
    );
  };

  const handleCopySecret = async () => {
    if (data?.secret) {
      await navigator.clipboard.writeText(data.secret);
      setCopiedSecret(true);
      toast.success("Secret copied to clipboard");
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleCopyBackupCodes = async () => {
    if (data?.backupCodes) {
      await navigator.clipboard.writeText(data.backupCodes.join("\n"));
      setCopiedBackup(true);
      toast.success("Backup codes copied to clipboard");
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  const handleDone = () => {
    setStep("initial");
    setData(null);
    setCopiedSecret(false);
    setCopiedBackup(false);
    setOtpCode("");
    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    // Only allow closing on initial step or after viewing backup codes
    if (step === "initial" || step === "backup") {
      setStep("initial");
      setData(null);
      setOtpCode("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {/* Step 1: Initial - Start Setup */}
        {step === "initial" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Setup 2FA for User
              </DialogTitle>
              <DialogDescription>
                This will generate a new 2FA secret and backup codes for{" "}
                <span className="text-foreground font-medium">{userName}</span>.
                The user will need to scan the QR code with their authenticator
                app.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                <strong>Important:</strong> After setup, make sure the user
                saves their backup codes securely. They won&apos;t be shown
                again.
              </div>
              <Button
                onClick={handleStartSetup}
                disabled={setup2FAMutation.isPending}
                className="w-full"
              >
                {setup2FAMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Generate 2FA Credentials
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Step 2: QR Code Display */}
        {step === "qrcode" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-500" />
                Scan QR Code
              </DialogTitle>
              <DialogDescription>
                Have the user scan this QR code with Google Authenticator,
                Authy, or another TOTP app.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 pt-4">
              {/* QR Code */}
              {data?.qrCode ? (
                <div className="rounded-lg border bg-white p-4">
                  <img
                    src={data.qrCode}
                    alt="2FA QR Code"
                    className="h-48 w-48"
                  />
                </div>
              ) : (
                <Skeleton className="h-56 w-56" />
              )}

              {/* Manual Entry Secret */}
              <div className="w-full space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Manual Entry Code
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={data?.secret || ""}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopySecret}
                  >
                    {copiedSecret ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={() => setStep("verify")} className="w-full">
                Next: Verify OTP Code
              </Button>
            </div>
          </>
        )}

        {/* Step 3: OTP Verification */}
        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Verify OTP Code
              </DialogTitle>
              <DialogDescription>
                Enter the 6-digit code from the authenticator app to confirm 2FA
                setup is working.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-4">
              <div className="space-y-2">
                <Label>Enter OTP from Authenticator App</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="text-center font-mono text-2xl tracking-widest"
                />
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                <strong>Note:</strong> This step confirms the authenticator app
                is set up correctly before enabling 2FA.
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("qrcode")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length !== 6 || verify2FAMutation.isPending}
                  className="flex-1"
                >
                  {verify2FAMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Enable 2FA"
                  )}
                </Button>
              </div>

              {/* Force Enable Option */}
              <div className="mt-4 border-t pt-2">
                <p className="text-muted-foreground mb-2 text-xs">
                  Can&apos;t get the code? You can force enable 2FA if you are
                  sure the user has the secret.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleForceEnable}
                  disabled={updateUserMutation.isPending}
                  className="w-full text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                >
                  {updateUserMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  Force Enable (Skip Verification)
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Backup Codes Display */}
        {step === "backup" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                2FA Enabled - Backup Codes
              </DialogTitle>
              <DialogDescription>
                2FA has been enabled successfully! These codes can be used if
                the user loses access to their authenticator app. Each code can
                only be used once.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-4">
              {/* Backup Codes Grid */}
              <div className="grid grid-cols-2 gap-2">
                {data?.backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="bg-muted rounded-md px-3 py-2 text-center font-mono text-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>

              {/* Copy All Button */}
              <Button
                variant="outline"
                onClick={handleCopyBackupCodes}
                className="w-full"
              >
                {copiedBackup ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All Codes
                  </>
                )}
              </Button>

              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                <strong>Warning:</strong> These codes will NOT be shown again.
                Make sure the user has saved them securely before closing.
              </div>

              <Button onClick={handleDone} className="w-full">
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
