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
import { useEnable2FA } from "@/hooks/admin/useAdminUsers";
import { AdminSetup2FAResponse } from "@/types/admin/user.types";
import { Check, Copy, KeyRound, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Setup2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

type Step = "initial" | "credentials";

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

  const enable2FAMutation = useEnable2FA();

  const handleEnable2FA = () => {
    enable2FAMutation.mutate(userId, {
      onSuccess: (response) => {
        setData(response.data ?? null);
        setStep("credentials");
      },
    });
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
    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    // Allow closing from any step - reset state
    setStep("initial");
    setData(null);
    setCopiedSecret(false);
    setCopiedBackup(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {/* Step 1: Initial - Enable 2FA */}
        {step === "initial" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Enable 2FA for User
              </DialogTitle>
              <DialogDescription>
                This will enable 2FA for{" "}
                <span className="text-foreground font-medium">{userName}</span>{" "}
                and generate their credentials. You can then share the QR code,
                secret, and backup codes with them.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                <strong>Important:</strong> After enabling, make sure to share
                the credentials with the user securely. The backup codes
                won&apos;t be shown again.
              </div>
              <Button
                onClick={handleEnable2FA}
                disabled={enable2FAMutation.isPending}
                className="w-full"
              >
                {enable2FAMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enabling 2FA...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Enable 2FA & Generate Credentials
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Show Credentials (QR Code, Secret, Backup Codes) */}
        {step === "credentials" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                2FA Enabled Successfully
              </DialogTitle>
              <DialogDescription>
                Share these credentials with the user. They need to scan the QR
                code or enter the secret in their authenticator app.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-4">
              {/* QR Code */}
              <div className="flex flex-col items-center gap-2">
                <Label className="text-muted-foreground text-xs">
                  QR Code for Authenticator App
                </Label>
                {data?.qrCode ? (
                  <div className="rounded-lg border bg-white p-3">
                    <img
                      src={data.qrCode}
                      alt="2FA QR Code"
                      className="h-40 w-40"
                    />
                  </div>
                ) : (
                  <Skeleton className="h-44 w-44" />
                )}
              </div>

              {/* Manual Entry Secret */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Manual Entry Secret
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

              {/* Backup Codes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-xs">
                    Backup Codes (one-time use)
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyBackupCodes}
                    className="h-6 px-2 text-xs"
                  >
                    {copiedBackup ? (
                      <>
                        <Check className="mr-1 h-3 w-3 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3 w-3" />
                        Copy All
                      </>
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {data?.backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="bg-muted rounded-md px-3 py-1.5 text-center font-mono text-xs"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                <strong>Warning:</strong> These credentials will NOT be shown
                again. Make sure the user has saved them before closing.
              </div>

              <Button onClick={handleDone} className="w-full">
                Done - I&apos;ve Shared the Credentials
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
