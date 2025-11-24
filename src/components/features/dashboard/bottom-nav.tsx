"use client";

import { Home, CreditCard, ArrowUp, PiggyBank, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Cards", icon: CreditCard, href: "/dashboard/cards" },
  // Central button is handled separately
  { label: "Savings", icon: PiggyBank, href: "/dashboard/savings" },
  { label: "Rewards", icon: Trophy, href: "/dashboard/rewards" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="bg-card fixed bottom-0 left-0 z-50 h-20 w-full border-t">
      <div className="relative grid h-full grid-cols-5 items-center">
        {/* Regular nav items */}
        {navItems.slice(0, 2).map((item) => (
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

        {/* Central Action Button */}
        <div className="flex justify-center">
          <button className="absolute -top-6 flex size-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105">
            <ArrowUp className="size-7" />
          </button>
        </div>

        {/* Regular nav items */}
        {navItems.slice(2, 4).map((item) => (
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
