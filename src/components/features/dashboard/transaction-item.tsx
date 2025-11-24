"use client";

import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { Transaction } from "@/types/wallet.types"; // Updated import path

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isDebit = transaction.direction === "debit";

  const formattedAmount = transaction.amount
    .toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      // Do not show the currency symbol (₦) as it's not in the design
      // The design shows the symbol prefixing the amount, which we will add manually.
    })
    .replace("₦", ""); // Remove the symbol that the formatter adds

  return (
    <div className="hover:bg-muted/50 flex items-center justify-between p-3 transition-colors">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            isDebit ? "bg-red-100" : "bg-green-100"
          )}
        >
          {isDebit ? (
            <ArrowUp className="size-5 text-red-600" />
          ) : (
            <ArrowDown className="size-5 text-green-600" />
          )}
        </div>
        {/* Details */}
        <div>
          {/* Using note for the party name as a reasonable assumption */}
          <p className="text-sm font-semibold">
            {isDebit ? "to" : "from"} {transaction.note || "Unknown"}
          </p>
          <p className="text-muted-foreground text-xs capitalize">
            {transaction.method}
          </p>
        </div>
      </div>
      <div className="text-right">
        {/* Amount */}
        <p
          className={cn(
            "text-sm font-bold",
            isDebit ? "text-destructive" : "text-green-600"
          )}
        >
          {isDebit ? "-₦" : "+₦"}
          {formattedAmount}
        </p>
        {/* Status Badge */}
        <span
          className={cn(
            "mt-1 inline-block rounded-full px-2 py-0.5 text-xs text-white capitalize",
            isDebit ? "bg-destructive" : "bg-blue-500" // Using blue for credit as per image
          )}
        >
          {transaction.direction}
        </span>
      </div>
    </div>
  );
}
