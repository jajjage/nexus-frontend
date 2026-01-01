"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useReferralStatsV2 } from "@/hooks/useReferrals";
import { Banknote, Users, UserCheck, Clock, TrendingUp } from "lucide-react";

export function ReferralStatsCards() {
  const { data: stats, isLoading } = useReferralStatsV2();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const referrer = stats?.referrerStats;
  const referred = stats?.referredStats;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Invited */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invited Friends</CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {referrer?.totalReferralsInvited || 0}
          </div>
          <p className="text-muted-foreground text-xs">
            {referrer?.claimedReferrals || 0} claimed,{" "}
            {referrer?.pendingClaimReferrals || 0} pending
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Referral Earnings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Inviter Earnings
          </CardTitle>
          <TrendingUp className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(referrer?.totalReferrerEarnings || 0)}
          </div>
          <p className="text-muted-foreground text-xs">Lifetime earnings</p>
        </CardContent>
      </Card>

      {/* 3. My Signup Bonus (if referred) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Signup Bonus</CardTitle>
          <Banknote className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(referred?.totalReferredEarnings || 0)}
          </div>
          <p className="text-muted-foreground text-xs">
            {referred ? `Referred by ${referred.referrerName}` : "Not referred"}
          </p>
        </CardContent>
      </Card>

      {/* 4. Total Pending (Available to Withdraw) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Withdrawable</CardTitle>
          <Clock className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(
              (referrer?.pendingReferrerAmount || 0) +
                (referred?.pendingReferredAmount || 0)
            )}
          </div>
          <p className="text-muted-foreground text-xs">Claimed rewards ready</p>
        </CardContent>
      </Card>
    </div>
  );
}
