"use client";

import { ApiKeyList } from "@/components/features/reseller";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

/**
 * API Keys Management Page
 * Create, view, and revoke API keys
 */
export default function ApiKeysPage() {
  const { user, isLoading } = useAuth();

  // Check if user is a reseller
  if (!isLoading && user?.role !== "reseller") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
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

      {/* API Key List */}
      <ApiKeyList />
    </div>
  );
}
