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
import { Input } from "@/components/ui/input";
import { useAuth, useResendVerification } from "@/hooks/useAuth";
import { Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";

interface ResendVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
  title?: string;
  description?: string;
}

export function ResendVerificationModal({
  open,
  onOpenChange,
  initialEmail,
  title = "Verify Your Email",
  description = "We will send a verification link to your email address.",
}: ResendVerificationModalProps) {
  const { user } = useAuth();
  const { mutate: resendEmail, isPending } = useResendVerification();
  const [email, setEmail] = useState(initialEmail || user?.email || "");

  // Update email if user object changes
  useEffect(() => {
    if (!email && user?.email) {
      setEmail(user.email);
    }
  }, [user?.email, email]);

  const handleResend = () => {
    if (!email) return;
    // Pass email as object, returnUrl will be auto-captured (current page path)
    resendEmail(
      { email },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            onClick={handleResend}
            disabled={isPending || !email}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Verification Link
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
