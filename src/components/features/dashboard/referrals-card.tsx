"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";

export function ReferralsCard() {
  return (
    <Link href="/dashboard/referrals" className="w-full">
      <Card className="w-full shadow-sm transition-all hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-orange-100">
            <Users className="size-6 text-orange-500" />
          </div>
          <div className="flex-grow">
            <p className="text-sm font-semibold">Referrals Balance</p>
            <p className="text-lg font-bold">₦0.00</p>
          </div>
          <ChevronRight className="text-muted-foreground size-5" />
        </CardContent>
      </Card>
    </Link>
  );
}
