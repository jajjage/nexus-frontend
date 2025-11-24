"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Plus } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface BalanceCardProps {
  balance: number;
  isVisible: boolean;
  setIsVisible: Dispatch<SetStateAction<boolean>>;
}

export function BalanceCard({
  balance,
  isVisible,
  setIsVisible,
}: BalanceCardProps) {
  const formattedBalance = balance.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Card className="bg-primary text-primary-foreground relative z-10 w-full rounded-t-2xl rounded-b-none p-6 shadow-lg">
      <div className="flex items-start justify-between">
        {" "}
        {/* Changed items-start to items-center for main div to align Add Money button */}
        <div className="flex flex-col">
          {" "}
          {/* New column to hold text and amount */}
          <div className="flex items-center gap-2">
            {" "}
            {/* Row for "Available Balance" text and eye icon */}
            <p className="text-sm opacity-90">Available Balance</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVisible((prev) => !prev)}
              className="text-primary-foreground/90 h-auto w-auto p-0 hover:bg-transparent hover:text-white"
              aria-label={isVisible ? "Hide balance" : "Show balance"}
            >
              {isVisible ? (
                <Eye className="size-5" />
              ) : (
                <EyeOff className="size-5" />
              )}
            </Button>
          </div>
          <p className="mt-1 text-3xl font-bold">
            {" "}
            {/* Balance amount */}
            {isVisible ? formattedBalance : "••••••••"}
          </p>
        </div>
        <Button className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30">
          <Plus className="size-4" />
          <span>Add Money</span>
        </Button>
      </div>
    </Card>
  );
}
