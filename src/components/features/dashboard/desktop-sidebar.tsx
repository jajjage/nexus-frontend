"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  FileUp,
  Home,
  Key,
  LogOut,
  Store,
  Trophy,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  const isReseller = user?.role === "reseller";

  return (
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
                  pathname === item.href || pathname.startsWith(item.href + "/")
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
  );
}
