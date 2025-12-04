"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Coins, Gift, RotateCcw, TrendingUp } from "lucide-react";

export default function RewardsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-10">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="mt-4 h-6 w-48" />
              <Skeleton className="mt-2 h-8 w-32" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>

        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Get cashback data from user object
  const cashbackBalance = user.cashback?.availableBalance || 0;
  const totalEarned = user.cashback?.totalEarned || 0;
  const totalUsed = user.cashback?.totalRedeemed || 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Cashback Rewards</h1>
        <p className="text-muted-foreground">Earn cashback on every purchase</p>
      </div>

      {/* Main Cashback Card */}
      <Card className="from-primary to-primary/80 text-primary-foreground bg-linear-to-r">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="mb-4 rounded-full bg-white/20 p-4">
              <Coins className="size-10" />
            </div>
            <h2 className="text-lg font-semibold">Available Cashback</h2>
            <p className="mt-2 text-3xl font-bold">
              ₦
              {cashbackBalance.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cashback Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-primary/10 mb-2 rounded-full p-3">
              <TrendingUp className="text-primary size-5" />
            </div>
            <p className="text-muted-foreground text-sm">Total Earned</p>
            <p className="text-lg font-bold">
              ₦
              {totalEarned.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-primary/10 mb-2 rounded-full p-3">
              <Gift className="text-primary size-5" />
            </div>
            <p className="text-muted-foreground text-sm">Total Used</p>
            <p className="text-lg font-bold">
              ₦{totalUsed.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ads Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Sponsored Offers</h2>

        {/* Ad Card 1 */}
        <Card className="overflow-hidden">
          <div className="relative">
            <div className="bg-linear-to-r from-purple-500 to-pink-500 p-6 text-white">
              <h3 className="text-lg font-bold">Earn 10% Cashback</h3>
              <p className="mt-1 text-sm opacity-90">
                On all data purchases this week
              </p>
            </div>
            <div className="p-4">
              <p className="text-muted-foreground text-sm">
                Limited time offer for our premium users
              </p>
              <Button variant="outline" className="mt-3 w-full">
                Learn More
              </Button>
            </div>
          </div>
        </Card>

        {/* Ad Card 2 */}
        <Card className="overflow-hidden">
          <div className="relative">
            <div className="bg-linear-to-r from-blue-500 to-cyan-500 p-6 text-white">
              <h3 className="text-lg font-bold">Double Cashback Day</h3>
              <p className="mt-1 text-sm opacity-90">
                Earn double cashback on airtime
              </p>
            </div>
            <div className="p-4">
              <p className="text-muted-foreground text-sm">
                Special promotion valid until end of month
              </p>
              <Button variant="outline" className="mt-3 w-full">
                View Details
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="size-5" />
            How Cashback Works
          </CardTitle>
          <CardDescription>Earn cashback on every transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                1
              </div>
              <div>
                <h4 className="font-medium">Make a Purchase</h4>
                <p className="text-muted-foreground text-sm">
                  Buy airtime, data, or pay bills
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                2
              </div>
              <div>
                <h4 className="font-medium">Earn Cashback</h4>
                <p className="text-muted-foreground text-sm">
                  Get percentage back as cashback
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                3
              </div>
              <div>
                <h4 className="font-medium">Use Cashback</h4>
                <p className="text-muted-foreground text-sm">
                  Apply to future purchases
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
