"use client";

import { BulkTopupForm } from "@/components/features/reseller";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

/**
 * Bulk Topup Page
 * Process multiple topups in a single batch
 */
export default function BulkTopupPage() {
  const { user, isLoading } = useAuth();

  // Check if user is a reseller
  if (!isLoading && user?.role !== "reseller") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/reseller">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Bulk Topup</h1>
          <p className="text-muted-foreground text-sm">
            Process up to 50 topups at once
          </p>
        </div>
      </div>

      {/* Form */}
      <BulkTopupForm />
    </div>
  );
}
