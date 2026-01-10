"use client";

import { Button } from "@/components/ui/button";
import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";
// Keep these imports for when feature is ready
// import { ResendVerificationModal } from "@/components/auth/ResendVerificationModal";
// import { useState } from "react";

/**
 * VerificationReminder - Shows "Coming Soon" message for referrals feature
 *
 * NOTE: Referrals feature is temporarily marked as "Coming Soon"
 * All logic is preserved for when the feature is ready
 */
export function VerificationReminder() {
  // Keep this state for when feature is ready
  // const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 p-4 dark:from-purple-900/20 dark:to-indigo-900/20">
        <Sparkles className="h-12 w-12 text-purple-600 dark:text-purple-400" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight">Coming Soon</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Our referral program is launching soon! You{"'"}ll be able to earn
        rewards by referring friends and unlock exclusive bonuses.
      </p>

      <div className="grid w-full max-w-sm gap-4">
        <Button disabled className="w-full cursor-not-allowed opacity-60">
          <Clock className="mr-2 h-4 w-4" />
          Feature Coming Soon
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      {/* TODO: Re-enable when referrals feature is ready
      <ResendVerificationModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Unlock Your Rewards"
        description="Verify your email address to instantly access your referral link, claim bonuses, and enable withdrawals."
      />
      */}

      <div className="mt-12 max-w-sm rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900/30 dark:bg-purple-900/10">
        <div className="flex items-start gap-3 text-left">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
          <div className="text-sm text-purple-800 dark:text-purple-300">
            <p className="font-semibold">What to expect?</p>
            <p>
              Invite friends, earn cashback rewards, and get bonus perks when
              they make their first purchase!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
