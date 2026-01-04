"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useAvailableBalanceV2,
  useClaimReferralBonusV2,
  useReferralStatsV2,
} from "@/hooks/useReferrals";
import { Gift, Loader2, Wallet } from "lucide-react";
import { useState } from "react";
import { WithdrawalModal } from "./withdrawal-modal";

export function ReferralActionCard() {
  const { data: stats, isLoading: isLoadingStats } = useReferralStatsV2();
  const { data: referrerBalanceV2, isLoading: isLoadingReferrer } =
    useAvailableBalanceV2("referrer");
  const { data: referredBalanceV2, isLoading: isLoadingReferred } =
    useAvailableBalanceV2("referred");

  const { mutate: claimBonus, isPending: isClaiming } =
    useClaimReferralBonusV2();

  const [showWithdrawalType, setShowWithdrawalType] = useState<
    "referrer" | "referred" | null
  >(null);

  const referredStats = stats?.referredStats;
  const referrerStats = stats?.referrerStats;

  // 1. Claim Bonus Action (New User / Referee)
  const canClaimBonus = referredStats?.referralStatus === "pending";
  const signupBonusAmount = 250; // Heuristic split share if amount not in referredStats

  // 2. Withdrawal Actions
  // Use authoritative V2 balances
  const referrerAmount = referrerBalanceV2?.totalAvailable || 0;
  const referredAmount = referredBalanceV2?.totalAvailable || 0;

  const hasReferrerBalance = referrerAmount > 0;
  // For referred balance, we show it if they have > 0 OR if they can claim (which might eventually give them balance)
  const hasReferredBalance = referredAmount > 0;

  const isLoading = isLoadingStats || isLoadingReferrer || isLoadingReferred;

  if (isLoading) {
    return (
      <Card className="animate-pulse border-amber-200 bg-amber-50/50">
        <CardHeader className="space-y-2 pb-2">
          <div className="h-6 w-1/3 rounded bg-amber-100/50"></div>
          <div className="h-4 w-1/2 rounded bg-amber-100/50"></div>
        </CardHeader>
        <CardContent>
          <div className="h-24 w-full rounded bg-amber-100/50"></div>
        </CardContent>
      </Card>
    );
  }

  // Hide if nothing to act on
  if (!canClaimBonus && !hasReferrerBalance && !hasReferredBalance) {
    return null;
  }

  const handleClaimBonus = () => {
    claimBonus();
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/10">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/50">
            <Gift className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-lg text-amber-950 dark:text-amber-100">
            {canClaimBonus ? "Claim Your Reward" : "Available Rewards"}
          </CardTitle>
        </div>
        <CardDescription className="text-amber-800 dark:text-amber-300">
          {canClaimBonus
            ? `You were referred by ${referredStats?.referrerName}. Claim your signup bonus now!`
            : "Collect your referral earnings."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-6">
            {/* Signup Bonus Balance */}
            {(canClaimBonus || hasReferredBalance) && (
              <div>
                <p className="text-xs font-medium tracking-wider text-amber-800 uppercase dark:text-amber-300">
                  Signup Bonus
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  ₦
                  {(hasReferredBalance
                    ? referredAmount
                    : signupBonusAmount
                  )?.toLocaleString()}
                </p>
              </div>
            )}

            {/* Referrer Balance */}
            {hasReferrerBalance && (
              <div>
                <p className="text-xs font-medium tracking-wider text-amber-800 uppercase dark:text-amber-300">
                  Referral Earnings
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  ₦{referrerAmount.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {/* Action: Claim Signup Bonus */}
            {canClaimBonus && (
              <Button
                onClick={handleClaimBonus}
                disabled={isClaiming}
                className="flex-1 bg-amber-600 text-white hover:bg-amber-700 sm:flex-none"
              >
                {isClaiming ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Gift className="mr-2 size-4" />
                )}
                Claim Bonus
              </Button>
            )}

            {/* Action: Withdraw Signup Bonus */}
            {hasReferredBalance && !canClaimBonus && (
              <Button
                onClick={() => setShowWithdrawalType("referred")}
                variant="outline"
                className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-100 sm:flex-none"
              >
                <Wallet className="mr-2 size-4" />
                Withdraw Bonus
              </Button>
            )}

            {/* Action: Withdraw Referral Earnings */}
            {hasReferrerBalance && (
              <Button
                onClick={() => setShowWithdrawalType("referrer")}
                className="flex-1 bg-amber-600 text-white hover:bg-amber-700 sm:flex-none"
              >
                <Wallet className="mr-2 size-4" />
                Withdraw Earnings
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Withdrawal Modal (Referrer) */}
      <WithdrawalModal
        userType="referrer"
        open={showWithdrawalType === "referrer"}
        onOpenChange={(open) => !open && setShowWithdrawalType(null)}
      />

      {/* Withdrawal Modal (Referee) */}
      <WithdrawalModal
        userType="referred"
        open={showWithdrawalType === "referred"}
        onOpenChange={(open) => !open && setShowWithdrawalType(null)}
      />
    </Card>
  );
}
