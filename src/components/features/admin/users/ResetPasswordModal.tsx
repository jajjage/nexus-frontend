"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetUserPassword } from "@/hooks/admin/useAdminUsers";
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ResetPasswordModalProps {
  userId: string;
  userName?: string;
  userEmail?: string;
}

export function ResetPasswordModal({
  userId,
  userName,
  userEmail,
}: ResetPasswordModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetResult, setResetResult] = useState<{
    resetPassword: string;
    mustChangePassword: boolean;
    sessionsRevoked: boolean;
  } | null>(null);

  const resetPasswordMutation = useResetUserPassword();

  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let rand = "";
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(`Pass${rand}!`);
  };

  const handleReset = () => {
    resetPasswordMutation.mutate(
      {
        userId,
        newPassword: newPassword.trim() || undefined,
        autoGenerate: !newPassword.trim(),
        mustChangePassword,
      },
      {
        onSuccess: (res: any) => {
          if (res?.data) {
            setResetResult({
              resetPassword: res.data.resetPassword,
              mustChangePassword: res.data.mustChangePassword,
              sessionsRevoked: res.data.sessionsRevoked,
            });
          }
        },
      }
    );
  };

  const handleCopy = async () => {
    if (resetResult?.resetPassword) {
      await navigator.clipboard.writeText(resetResult.resetPassword);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setNewPassword("");
    setMustChangePassword(false);
    setResetResult(null);
    setCopied(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <KeyRound className="mr-2 h-4 w-4" />
          Reset Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="text-primary h-5 w-5" />
            Reset User Password
          </DialogTitle>
          <DialogDescription>
            {userName
              ? `Reset login password for ${userName}`
              : "Set or auto-generate a new password for this user."}
            {userEmail ? ` (${userEmail})` : ""}
          </DialogDescription>
        </DialogHeader>

        {resetResult ? (
          <div className="space-y-4 py-2">
            <div className="bg-muted/50 space-y-3 rounded-lg border p-4">
              <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                New Password (Shown Once)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={resetResult.resetPassword}
                  className="bg-background text-foreground font-mono text-base font-bold"
                />
                <Button size="icon" variant="secondary" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Copy and deliver this password to the user via phone, SMS, or
                WhatsApp.
              </p>
            </div>

            <div className="space-y-2">
              {resetResult.sessionsRevoked && (
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <span>
                    All active user sessions/tokens have been revoked
                    immediately.
                  </span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="newPassword">New Password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generatePassword}
                  className="flex h-7 items-center gap-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                  Auto-Generate
                </Button>
              </div>
              <Input
                id="newPassword"
                placeholder="Type password or click Auto-Generate"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Leaving this field empty will automatically generate a secure
                password.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="mustChangePassword"
                checked={mustChangePassword}
                onChange={(e) => setMustChangePassword(e.target.checked)}
                className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
              />
              <Label
                htmlFor="mustChangePassword"
                className="cursor-pointer text-sm font-normal"
              >
                Force user to change password on next login
              </Label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} type="button">
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                disabled={resetPasswordMutation.isPending}
                type="button"
              >
                {resetPasswordMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Reset
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
