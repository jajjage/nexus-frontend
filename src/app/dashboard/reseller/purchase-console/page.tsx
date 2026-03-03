"use client";

import { BottomNav } from "@/components/features/dashboard/bottom-nav";
import {
  PurchaseConsole,
  ResellerApiAccessFallback,
} from "@/components/features/reseller";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useResellerApiAccess } from "@/hooks/useReseller";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function PurchaseConsolePage() {
  const { user, isLoading } = useAuth();
  const { canAccessApi, shouldShowProvisionWarning } = useResellerApiAccess();

  if (!isLoading && user?.role !== "reseller") {
    redirect("/dashboard");
  }

  return (
    <>
      <div className="container mx-auto max-w-5xl px-4 py-8 pb-24">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/reseller">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">API Purchase Console</h1>
            <p className="text-muted-foreground text-sm">
              Create purchases and monitor pending-to-final transitions.
            </p>
          </div>
        </div>

        {!isLoading && !canAccessApi ? (
          <ResellerApiAccessFallback />
        ) : (
          <div className="space-y-4">
            {!isLoading && shouldShowProvisionWarning ? (
              <Alert>
                <AlertTitle>Permission payload fallback active</AlertTitle>
                <AlertDescription>
                  <code>reseller.api_access</code> was not present in your user
                  payload, so access is allowed temporarily in non-production.
                </AlertDescription>
              </Alert>
            ) : null}
            <PurchaseConsole />
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
