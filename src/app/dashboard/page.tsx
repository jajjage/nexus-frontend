"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Gift, Signal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Import components
import { ActionButtons } from "@/components/features/dashboard/action-buttons";
import { AdsCarousel } from "@/components/features/dashboard/ads-carousel";
import { BalanceCard } from "@/components/features/dashboard/balance-card";
import { BottomNav } from "@/components/features/dashboard/bottom-nav";
import { PromoBanner } from "@/components/features/dashboard/promo-banner";
import { ReferralsCard } from "@/components/features/dashboard/referrals-card";
import { TransactionHistory } from "@/components/features/dashboard/transaction-history";
import { UserInfo } from "@/components/features/dashboard/user-info";
import { PinSetupModal } from "@/components/features/security/pin-setup-modal";
import NotificationBanner from "@/components/notification/NotificationBanner";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { userKeys, useUpdateProfile } from "@/hooks/useUser";
import { walletKeys } from "@/hooks/useWallet";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, isLoading, refetch: refetchUser } = useAuth();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const queryClient = useQueryClient();
  const { mutate: updateProfile, isPending: isUpdatingPin } =
    useUpdateProfile();

  // Show PIN setup modal on first login without PIN
  useEffect(() => {
    if (user && !user.hasPin) {
      // Use localStorage to track if we've shown the modal once
      const pinModalShown = localStorage.getItem(
        `pin_modal_shown_${user.userId}`
      );
      if (!pinModalShown) {
        setShowPinModal(true);
        localStorage.setItem(`pin_modal_shown_${user.userId}`, "true");
      }
    }
  }, [user]);

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

  const handleRefresh = async () => {
    // Refetch user data (balance, profile)
    await refetchUser();
    // Invalidate wallet transactions
    await queryClient.invalidateQueries({ queryKey: walletKeys.all });
    // Invalidate user specific data (purchases, etc)
    await queryClient.invalidateQueries({ queryKey: userKeys.all });
  };

  const handlePinSetupSuccess = (pin: string) => {
    updateProfile(
      { pin },
      {
        onSuccess: () => {
          toast.success("Transaction PIN set successfully!");
          setShowPinModal(false);
          refetchUser();
        },
        onError: (error: any) => {
          const errorMsg = error.response?.data?.message || "Failed to set PIN";
          toast.error(errorMsg);
        },
      }
    );
  };

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
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
        </div>
      </PullToRefresh>
      {/* Bottom Navigation */}
      <BottomNav />

      {/* PIN Setup Modal */}
      <PinSetupModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSetupSuccess}
        isLoading={isUpdatingPin}
      />
    </>
  );
}
