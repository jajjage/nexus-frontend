"use client";

import { BecomeResellerModal } from "@/components/features/reseller/BecomeResellerModal";
import { useAuth } from "@/hooks/useAuth";
import { useResellerUpgradeStatus } from "@/hooks/useReseller";
import { cn } from "@/lib/utils";
import { Clock, Home, Sparkles, Trophy, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Referral", icon: Users, href: "/dashboard/referrals" },
  { label: "Rewards", icon: Trophy, href: "/dashboard/rewards" },
  { label: "Profile", icon: User, href: "/dashboard/profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showResellerModal, setShowResellerModal] = useState(false);
  const { getStatus, clearPending } = useResellerUpgradeStatus();
  const [hasPendingUpgrade, setHasPendingUpgrade] = useState(false);

  // Show "Become a Reseller" only for regular users
  const showBecomeReseller = user?.role === "user";
  const isReseller = user?.role === "reseller";

  // Check pending status on mount and clear if user is now reseller
  useEffect(() => {
    if (isReseller) {
      clearPending();
      setHasPendingUpgrade(false);
    } else {
      const status = getStatus();
      setHasPendingUpgrade(status.pending);
    }
  }, [isReseller, getStatus, clearPending]);

  return (
    <>
      <div className="bg-card fixed bottom-0 left-0 z-50 w-full border-t md:hidden">
        {/* Become a Reseller Banner - Mobile */}
        {showBecomeReseller &&
          (hasPendingUpgrade ? (
            // Pending state
            <div className="flex w-full items-center justify-center gap-2 bg-zinc-100 px-4 py-2 text-sm font-medium dark:bg-zinc-800">
              <Clock className="size-4 text-zinc-500" />
              <span className="text-zinc-600 dark:text-zinc-400">
                Upgrade request pending review
              </span>
            </div>
          ) : (
            // Active state
            <button
              onClick={() => setShowResellerModal(true)}
              className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 text-sm font-medium transition-all hover:from-amber-100 hover:to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50"
            >
              <Sparkles className="size-4 text-amber-600 dark:text-amber-400" />
              <span className="text-amber-900 dark:text-amber-100">
                Become a Reseller — Get 10% OFF
              </span>
            </button>
          ))}

        {/* Bottom Navigation */}
        <div className="grid h-16 grid-cols-4 items-center">
          {navItems.map((item) => (
            <Link
              href={item.href}
              key={item.label}
              className={cn(
                "flex flex-col items-center gap-1 text-xs font-medium",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Become a Reseller Modal */}
      <BecomeResellerModal
        open={showResellerModal}
        onOpenChange={(open) => {
          setShowResellerModal(open);
          // Refresh pending status when modal closes
          if (!open) {
            const status = getStatus();
            setHasPendingUpgrade(status.pending);
          }
        }}
      />
    </>
  );
}
