"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ResendVerificationModal } from "@/components/auth/ResendVerificationModal";

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
  const [isOpen, setIsOpen] = useState(false);

  const isVerified = user?.isVerified;

  if (isVerified) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

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

      <Button size="sm" onClick={() => setIsOpen(true)}>
        Verify Now
      </Button>

      <ResendVerificationModal open={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}
