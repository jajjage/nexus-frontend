"use client";

import { useAuth, useResendVerification } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Lock, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface VerificationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function VerificationGuard({
  children,
  fallback,
  title = "Verification Required",
  description = "Please verify your account to unlock this feature.",
  className,
}: VerificationGuardProps) {
  const { user } = useAuth();
  const { mutate: resendEmail, isPending } = useResendVerification();
  const [email, setEmail] = useState(user?.email || "");
  const [isOpen, setIsOpen] = useState(false);

  const isVerified = user?.isVerified;

  if (isVerified) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const handleResend = () => {
    if (!email) return;
    resendEmail(email, {
      onSuccess: () => {
        setIsOpen(false);
      },
    });
  };

  return (
    <div
      className={cn(
        "bg-muted/10 flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
        <Lock className="size-6 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-[250px] text-sm">
        {description}
      </p>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm">Verify Now</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verify Your Email</DialogTitle>
            <DialogDescription>
              We will send a verification link to your email address.
            </DialogDescription>
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
    </div>
  );
}
