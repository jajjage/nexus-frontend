"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function VerificationReminder() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 rounded-full bg-amber-100 p-4 dark:bg-amber-900/20">
        <ShieldCheck className="h-12 w-12 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight">
        Verification Required
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        To access your referral stats and rewards, you need to verify your
        account first. This helps us ensure the security of our rewards program.
      </p>

      <div className="grid w-full max-w-sm gap-4">
        <Button asChild className="w-full">
          <Link href="/dashboard/profile/security">
            Verify Now <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="mt-12 max-w-sm rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
        <div className="flex items-start gap-3 text-left">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold">Why verify?</p>
            <p>
              Verification unlocks withdrawal features and prevents fraudulent
              activity, ensuring everyone gets their fair share of rewards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
