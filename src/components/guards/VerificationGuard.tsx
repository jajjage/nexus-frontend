"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  const isVerified = user?.isVerified; // Adjust based on your actual user type

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
      <Button asChild size="sm">
        <Link href="/dashboard/profile/security">Verify Now</Link>
      </Button>
    </div>
  );
}
