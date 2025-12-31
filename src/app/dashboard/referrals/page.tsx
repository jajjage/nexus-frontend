"use client";

import { ReferralLinkSection } from "@/components/features/referrals/referral-link-section";
import { ReferralStatsCards } from "@/components/features/referrals/referral-stats-cards";
import { ReferralsTable } from "@/components/features/referrals/referrals-table";
import { VerificationReminder } from "@/components/features/referrals/verification-reminder";
import { WithdrawalModal } from "@/components/features/referrals/withdrawal-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useReferralRewardId, useReferralStats } from "@/hooks/useReferrals";

export default function ReferralsPage() {
  const { isLoading: isAuthLoading } = useAuth();
  const { data: rewardId } = useReferralRewardId();
  const { error } = useReferralStats();

  // Check if error is 403 Forbidden (verification required)
  const isVerificationRequired = (error as any)?.response?.status === 403;

  if (isAuthLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isVerificationRequired) {
    return (
      <div className="space-y-6 p-4 pb-24 md:p-6">
        <div>
          <h1 className="text-2xl font-bold">Referrals</h1>
          <p className="text-muted-foreground">
            Earn rewards by referring friends
          </p>
        </div>
        <VerificationReminder />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Referrals</h1>
          <p className="text-muted-foreground">
            Earn rewards by referring friends
          </p>
        </div>
        {rewardId && <WithdrawalModal rewardId={rewardId} />}
      </div>

      <ReferralStatsCards />

      <ReferralLinkSection />

      <ReferralsTable />
    </div>
  );
}
