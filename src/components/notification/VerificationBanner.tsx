"use client";

import { ResendVerificationModal } from "@/components/auth/ResendVerificationModal";
import { useAuth } from "@/hooks/useAuth";
import { useReferralStatsV2 } from "@/hooks/useReferrals";
import { AlertTriangle, ChevronRight, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function VerificationBanner() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: stats } = useReferralStatsV2();

  useEffect(() => {
    // Check if dismissed within the last 7 days (stored in localStorage)
    const dismissedAt = localStorage.getItem(
      "verification_banner_dismissed_at"
    );
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      // If dismissed less than 7 days ago, keep it hidden
      if (Date.now() - dismissedTime < sevenDaysMs) {
        setIsVisible(false);
        return;
      }
    }
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismiss timestamp so it persists across app restarts
    localStorage.setItem(
      "verification_banner_dismissed_at",
      Date.now().toString()
    );
  };

  if (!isAuthenticated || !user || !isVisible) return null;
  if (user.isVerified) return null;

  // Don't show on verification page itself
  if (pathname?.includes("/verify") || pathname?.includes("/security")) {
    return null;
  }

  // Check if user has pending bonuses
  const hasPendingBonus =
    stats?.referredStats?.referralStatus === "pending" ||
    (stats?.referrerStats?.pendingReferrerAmount || 0) > 0;

  return (
    <div className="relative border-b border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 pr-8 sm:flex-row">
        <div className="flex items-center gap-3 text-sm text-amber-900 dark:text-amber-200">
          <div className="shrink-0 rounded-full bg-amber-100 p-1.5 dark:bg-amber-900/50">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p>
            {hasPendingBonus ? (
              <>
                <span className="font-semibold">Action Required:</span> Verify
                your account to claim your referral bonuses and withdrawals.
              </>
            ) : (
              <>
                <span className="font-semibold">Secure Account:</span> Verify
                your email to unlock all features and secure your account.
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex cursor-pointer items-center gap-1 text-sm font-medium whitespace-nowrap text-amber-700 hover:text-amber-800 hover:underline dark:text-amber-400 dark:hover:text-amber-300"
        >
          Verify Now
          <ChevronRight className="size-4" />
        </button>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute top-1/2 right-2 -translate-y-1/2 p-2 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>

      <ResendVerificationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={hasPendingBonus ? "Unlock Your Rewards" : "Verify Your Account"}
        description={
          hasPendingBonus
            ? "Verify your email to instantly claim your pending bonuses and enable withdrawals."
            : "Confirm your email address to ensure your account is fully secure and all features are accessible."
        }
      />
    </div>
  );
}
