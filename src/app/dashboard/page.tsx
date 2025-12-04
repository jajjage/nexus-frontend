"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Signal, Gift } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

// Import components
import { ActionButtons } from "@/components/features/dashboard/action-buttons";
import { AdsCarousel } from "@/components/features/dashboard/ads-carousel";
import { BalanceCard } from "@/components/features/dashboard/balance-card";
import { BottomNav } from "@/components/features/dashboard/bottom-nav";
import { PromoBanner } from "@/components/features/dashboard/promo-banner";
import { ReferralsCard } from "@/components/features/dashboard/referrals-card";
import { TransactionHistory } from "@/components/features/dashboard/transaction-history";
import { UserInfo } from "@/components/features/dashboard/user-info";
import NotificationBanner from "@/components/notification/NotificationBanner";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  console.log("user: ", user);
  if (isLoading || !user) {
    // A simple loading state for now
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  // The getInitials function for the top header can be simplified or kept
  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-muted/40 relative flex min-h-screen w-full flex-col pb-28">
      {/* Main content */}
      <div className="flex flex-col gap-6 p-4">
        {/* Top Header Section */}
        <header className="flex w-full items-center justify-between">
          <Avatar className="size-10">
            <AvatarImage
              src={user.profilePictureUrl || undefined}
              alt={user.fullName}
            />
            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/rewards">
                <Gift className="size-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon">
              <Signal className="size-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="size-5" />
            </Button>
          </div>
        </header>

        <NotificationBanner />

        {/* User Info Section */}
        <UserInfo fullName={user.fullName} phone={user.phoneNumber} />

        {/* Balance Card */}
        <BalanceCard
          balance={parseFloat(user.balance)}
          isVisible={isBalanceVisible}
          setIsVisible={setIsBalanceVisible}
          accountName={user.fullName}
          accountNumber={user.accountNumber}
          providerName={user.providerName}
        />

        {/* Recent Transactions */}
        <div className="-mt-12">
          <TransactionHistory isVisible={isBalanceVisible} />
        </div>

        {/* Referrals Balance */}
        <ReferralsCard />

        {/* Make Payment Actions */}
        <ActionButtons />

        {/* Ads Carousel */}
        <AdsCarousel />

        {/* Promotional Banner */}
        <PromoBanner />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
