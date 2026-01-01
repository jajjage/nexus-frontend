"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useReferralStatsV2 } from "@/hooks/useReferrals";
import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";

export function ReferralsCard() {
  const { data: stats, isLoading } = useReferralStatsV2();

  const totalPending =
    (stats?.referrerStats?.pendingReferrerAmount || 0) +
    (stats?.referredStats?.pendingReferredAmount || 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <Link href="/dashboard/referrals" className="w-full">
      <Card className="w-full shadow-sm transition-all hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-orange-100">
            <Users className="size-6 text-orange-500" />
          </div>
          <div className="flex-grow">
            <p className="text-sm font-semibold">Referrals Balance</p>
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className="text-lg font-bold">
                {formatCurrency(totalPending)}
              </p>
            )}
          </div>
          <ChevronRight className="text-muted-foreground size-5" />
        </CardContent>
      </Card>
    </Link>
  );
}
