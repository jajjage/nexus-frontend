"use client";

import { BottomNav } from "@/components/features/dashboard/bottom-nav";
import { BecomeResellerModal } from "@/components/features/reseller/BecomeResellerModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useResellerUpgradeStatus } from "@/hooks/useReseller";
import {
  ChevronRight,
  HelpCircle,
  LogOut,
  Shield,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const router = useRouter();
  const [showResellerModal, setShowResellerModal] = useState(false);
  const { getStatus: getUpgradeStatus } = useResellerUpgradeStatus();

  // Check for pending reseller upgrade request
  const upgradeStatus = getUpgradeStatus();
  const hasPendingRequest = upgradeStatus.pending;

  // Show "Become a Reseller" banner only for regular users (not resellers)
  const showResellerPromo = user?.role === "user";

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const menuGroups = [
    {
      title: "Account",
      items: [
        {
          label: "Personal Information",
          icon: User,
          href: "/dashboard/profile/personal-info",
          description: "Name, Email, Phone",
        },
        {
          label: "Wallet Settings",
          icon: Wallet,
          href: "/dashboard/profile/wallet",
          description: "Bank Accounts, Cards",
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          label: "Security",
          icon: Shield,
          href: "/dashboard/profile/security",
          description: "Password, PIN, Biometrics",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Help & Support",
          icon: HelpCircle,
          href: "/dashboard/profile/support",
          description: "FAQ, Contact Us",
        },
      ],
    },
  ];

  return (
    <div className="bg-muted/30 flex min-h-screen w-full flex-col pb-28">
      {/* Header */}
      <div className="bg-background p-6 pb-8">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="border-muted size-24 border-4">
            <AvatarImage src={user.profilePictureUrl || undefined} />
            <AvatarFallback className="text-2xl">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{user.fullName}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {user.phoneNumber}
            </p>
          </div>
          <Button variant="outline" size="sm" className="mt-2" asChild>
            <Link href="/dashboard/profile/personal-info">Edit Profile</Link>
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-6 p-4">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h2 className="text-muted-foreground px-1 text-sm font-medium">
              {group.title}
            </h2>
            <Card className="overflow-hidden border-none shadow-sm">
              <CardContent className="p-0">
                {group.items.map((item, index) => (
                  <div key={item.label}>
                    <Link
                      href={item.href}
                      className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors"
                    >
                      <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                        <item.icon className="size-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="text-muted-foreground/50 size-5" />
                    </Link>
                    {index < group.items.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Become a Reseller Promo - Only for regular users */}
        {showResellerPromo && (
          <div className="space-y-3">
            <h2 className="text-muted-foreground px-1 text-sm font-medium">
              Upgrade
            </h2>
            {hasPendingRequest ? (
              // Show pending status - same as dashboard
              <Card className="overflow-hidden border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/30">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                    <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Request Pending
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Your reseller application is being reviewed. We{"'"}ll
                      contact you within 24-48 hours.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Show become reseller option
              <Card
                className="cursor-pointer overflow-hidden border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm transition-all hover:shadow-md dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/30"
                onClick={() => setShowResellerModal(true)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                    <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Become a Reseller
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Get wholesale rates & API access
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-amber-500" />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Logout Button */}
        <div className="mt-4">
          <Button
            variant="destructive"
            className="w-full py-6"
            onClick={() => logout()}
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 size-5" />
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </Button>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Version 1.0.0
          </p>
        </div>
      </div>

      <BottomNav />

      {/* Become a Reseller Modal */}
      <BecomeResellerModal
        open={showResellerModal}
        onOpenChange={setShowResellerModal}
      />
    </div>
  );
}
