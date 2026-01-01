"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface TwoFactorFormProps {
  onSubmit: (code: string, isBackupCode: boolean) => void;
  onCancel: () => void;
  isPending: boolean;
  error?: string;
}

export function TwoFactorForm({
  onSubmit,
  onCancel,
  isPending,
  error,
}: TwoFactorFormProps) {
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onSubmit(code, useBackupCode);
    }
  };

  const handleComplete = (value: string) => {
    setCode(value);
    // Auto-submit when 6 digits are entered
    if (value.length === 6) {
      onSubmit(value, useBackupCode);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-sm sm:max-w-md">
      <CardHeader className="text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <ShieldCheck className="text-primary h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
        <CardDescription>
          {useBackupCode
            ? "Enter one of your backup codes"
            : "Enter the 6-digit code from your authenticator app"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-center text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              onComplete={handleComplete}
              disabled={isPending}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={code.length !== 6 || isPending}
          >
            {isPending ? (
              <div className="flex items-center gap-x-2">
                <Spinner />
                <span>Verifying...</span>
              </div>
            ) : (
              "Verify"
            )}
          </Button>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode("");
              }}
              className="text-muted-foreground hover:text-foreground text-sm underline"
            >
              {useBackupCode
                ? "Use authenticator app instead"
                : "Use a backup code instead"}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
