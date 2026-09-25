"use client";

import { BottomNav } from "@/components/features/dashboard/bottom-nav";
import {
  ApiKeyList,
  AdexCredentialList,
  ResellerApiAccessFallback,
} from "@/components/features/reseller";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useResellerApiAccess } from "@/hooks/useReseller";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

/**
 * API Keys Management Page
 * Create, view, and revoke API keys
 */
export default function ApiKeysPage() {
  const { user, isLoading } = useAuth();
  const { canAccessApi, isApiUser, shouldShowProvisionWarning } = useResellerApiAccess();

  // The API console is reserved for api_user accounts.
  if (!isLoading && !isApiUser) {
    redirect("/dashboard");
  }

  return (
    <>
      <div className="container mx-auto max-w-4xl px-4 py-8 pb-24">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/reseller">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">API Keys</h1>
            <p className="text-muted-foreground text-sm">
              Manage keys for your integrations
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
            <ApiKeyList />
            <AdexCredentialList />
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
