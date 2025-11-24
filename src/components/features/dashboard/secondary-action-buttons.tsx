"use client";

import { TrendingUp, Shield, Heart, MoreHorizontal } from "lucide-react";
import Link from "next/link";

const actions = [
  { label: "Invest", icon: TrendingUp, href: "/dashboard/invest" },
  { label: "Insurance", icon: Shield, href: "/dashboard/insurance" },
  { label: "Donate", icon: Heart, href: "/dashboard/donate" },
  { label: "More", icon: MoreHorizontal, href: "/dashboard/more" },
];

export function SecondaryActionButtons() {
  return (
    <div className="w-full">
      <div className="bg-card grid grid-cols-4 gap-3 rounded-xl p-4 text-center shadow-sm">
        {actions.map((action) => (
          <Link
            href={action.href}
            key={action.label}
            className="hover:bg-muted flex flex-col items-center gap-2 rounded-lg p-2 transition-colors"
          >
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <action.icon className="text-muted-foreground size-6" />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
