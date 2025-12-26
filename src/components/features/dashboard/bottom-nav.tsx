"use client";

import { cn } from "@/lib/utils";
import {
  ArrowUp,
  CreditCard,
  Home,
  PiggyBank,
  Trophy,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Savings", icon: PiggyBank, href: "/dashboard/savings" },
  { label: "Rewards", icon: Trophy, href: "/dashboard/rewards" },
  { label: "Profile", icon: User, href: "/dashboard/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="bg-card fixed bottom-0 left-0 z-50 h-20 w-full border-t md:hidden">
      <div className="grid h-full grid-cols-4 items-center">
        {navItems.map((item) => (
          <Link
            href={item.href}
            key={item.label}
            className={cn(
              "flex flex-col items-center gap-1 text-xs font-medium",
              pathname === item.href ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="size-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
