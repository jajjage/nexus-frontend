"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { Bell, Gift, Signal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Import components
import { PinSetupModal } from "@/components/features/security/pin-setup-modal";
import NotificationBanner from "@/components/notification/NotificationBanner";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { userKeys, useUpdateProfile } from "@/hooks/useUser";
import { walletKeys } from "@/hooks/useWallet";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ActionButtons } from "./action-buttons";
import { AdsCarousel } from "./ads-carousel";
import { BalanceCard } from "./balance-card";
import { BottomNav } from "./bottom-nav";
import { PromoBanner } from "./promo-banner";
import { ReferralsCard } from "./referrals-card";
import { TransactionHistory } from "./transaction-history";
import { UserInfo } from "./user-info";

import { DesktopSidebar } from "./desktop-sidebar";

/**
 * User Dashboard
 * Main dashboard view for regular users
 * Displays balance, transactions, referrals, and action buttons
 */
export function UserDashboard() {
  const { user, isLoading, refetch: refetchUser } = useAuth();
  const { data: unreadCountResponse } = useUnreadNotificationCount();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutate: updateProfile, isPending: isUpdatingPin } =
    useUpdateProfile();

  const unreadNotificationCount = unreadCountResponse?.data?.unreadCount || 0;

  // Security check - redirect if user is admin
  useEffect(() => {
    if (
      !isLoading &&
      user &&
      user.role &&
      user.role.toLowerCase() === "admin"
    ) {
      router.push("/admin/dashboard");
    }
  }, [user?.role, isLoading, router]);

  // Show PIN setup modal only once when user data is loaded and they don't have a PIN
  useEffect(() => {
    if (user && user.hasPin !== undefined) {
      if (!user.hasPin) {
        setShowPinModal(true);
      }
    }
  }, [user?.userId, user?.hasPin]);

  // Close modal when user has set the PIN (hasPin becomes true)
  useEffect(() => {
    if (user && user.hasPin && showPinModal) {
      setShowPinModal(false);
    }
  }, [user?.hasPin, showPinModal]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  // Prevent rendering if admin (while redirect happens)
  if (user.role && user.role.toLowerCase() === "admin") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleRefresh = async () => {
    await refetchUser();
    await queryClient.invalidateQueries({ queryKey: walletKeys.all });
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
    <div className="bg-muted/40 flex min-h-screen w-full">
      <DesktopSidebar className="hidden md:flex" />

      <main className="flex-1">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="relative flex min-h-screen w-full flex-col pb-28 md:pb-8">
            {/* Main content container - centered on desktop */}
            <div className="mx-auto w-full max-w-2xl flex-col gap-6 p-4 md:p-6 lg:p-8">
              {/* Top Header Section */}
              <header className="mb-6 flex w-full items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage
                      src={user.profilePictureUrl || undefined}
                      alt={user.fullName}
                    />
                    <AvatarFallback>
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <h1 className="text-lg font-semibold">Welcome back,</h1>
                    <p className="text-muted-foreground text-sm">
                      {user.fullName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/rewards">
                      <Gift className="size-5" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Signal className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="relative"
                  >
                    <Link href="/dashboard/notifications">
                      <Bell className="size-5" />
                      {unreadNotificationCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                          {unreadNotificationCount > 9
                            ? "9+"
                            : unreadNotificationCount}
                        </span>
                      )}
                    </Link>
                  </Button>
                </div>
              </header>

              <div className="flex flex-col gap-6">
                <NotificationBanner />

                {/* User Info Section (Mobile Only) */}
                <div className="md:hidden">
                  <UserInfo fullName={user.fullName} phone={user.phoneNumber} />
                </div>

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
          </div>
        </PullToRefresh>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <BottomNav />

      {/* PIN Setup Modal */}
      <PinSetupModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSetupSuccess}
        isLoading={isUpdatingPin}
      />
    </div>
  );
}
