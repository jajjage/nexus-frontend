"use client";

import { BecomeResellerModal } from "@/components/features/reseller/BecomeResellerModal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useResellerUpgradeStatus } from "@/hooks/useReseller";
import { cn } from "@/lib/utils";
import {
  Clock,
  FileUp,
  Home,
  Key,
  LogOut,
  Sparkles,
  Store,
  Trophy,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Referral", icon: Users, href: "/dashboard/referrals" },
  { label: "Rewards", icon: Trophy, href: "/dashboard/rewards" },
  { label: "Profile", icon: User, href: "/dashboard/profile" },
];

const resellerItems = [
  { label: "Reseller Hub", icon: Store, href: "/dashboard/reseller" },
  { label: "Bulk Topup", icon: FileUp, href: "/dashboard/reseller/bulk-topup" },
  { label: "API Keys", icon: Key, href: "/dashboard/reseller/api-keys" },
];

export function DesktopSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const [showResellerModal, setShowResellerModal] = useState(false);
  const { getStatus, clearPending } = useResellerUpgradeStatus();
  const [hasPendingUpgrade, setHasPendingUpgrade] = useState(false);

  const isReseller = user?.role === "reseller";
  const showBecomeReseller = user?.role === "user";

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
      <div
        className={cn(
          "bg-card sticky top-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r px-4 py-6",
          className
        )}
      >
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="relative size-8 overflow-hidden rounded-full">
            <Image
              src="/images/logo.svg"
              alt="Nexus Data"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xl font-bold">Nexus Data</span>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => (
            <Link
              href={item.href}
              key={item.label}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Reseller Section - Only visible to resellers */}
          {isReseller && (
            <>
              <Separator className="my-2" />
              <span className="text-muted-foreground px-3 text-xs font-medium tracking-wider uppercase">
                Reseller Tools
              </span>
              {resellerItems.map((item) => (
                <Link
                  href={item.href}
                  key={item.label}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    pathname === item.href ||
                      pathname.startsWith(item.href + "/")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </>
          )}

          {/* Become a Reseller - Only visible to regular users */}
          {showBecomeReseller && (
            <>
              <Separator className="my-2" />
              {hasPendingUpgrade ? (
                // Pending state - user already submitted
                <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-800/50">
                  <Clock className="size-5 text-zinc-500" />
                  <div className="flex flex-col">
                    <span className="text-zinc-600 dark:text-zinc-300">
                      Upgrade Pending
                    </span>
                    <span className="text-xs text-zinc-500">
                      We're reviewing your request
                    </span>
                  </div>
                </div>
              ) : (
                // Active state - user can submit
                <button
                  onClick={() => setShowResellerModal(true)}
                  className="flex items-center gap-3 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-3 text-sm font-medium transition-all hover:shadow-sm dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/30"
                >
                  <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-900 dark:text-amber-100">
                    Become a Reseller
                  </span>
                </button>
              )}
            </>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground justify-start gap-3 px-3"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="size-5" />
            <span>Logout</span>
          </Button>
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
