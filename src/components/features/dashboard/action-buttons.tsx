"use client";

import { Send, Phone, Wifi, Receipt } from "lucide-react";
import Link from "next/link";

const actions = [
  { label: "Transfer", icon: Send, href: "/dashboard/transfer" },
  { label: "Airtime", icon: Phone, href: "/dashboard/airtime" },
  { label: "Data", icon: Wifi, href: "/dashboard/data" },
  { label: "Pay Bills", icon: Receipt, href: "/dashboard/bills" },
];

export function ActionButtons() {
  return (
    <div className="w-full">
      <h2 className="mb-2 font-semibold">Make Payment</h2>
      <div className="bg-card grid grid-cols-4 gap-3 rounded-xl p-4 text-center shadow-sm">
        {actions.map((action) => (
          <Link
            href={action.href}
            key={action.label}
            className="hover:bg-muted flex flex-col items-center gap-2 rounded-lg p-2 transition-colors"
          >
            <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
              <action.icon className="text-primary size-6" />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
