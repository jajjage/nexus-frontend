"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/wallet.types";
import { ArrowDown, ArrowUp, Phone, Wifi } from "lucide-react";
import { useRouter } from "next/navigation";

// Helper to determine status badge color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-500 text-yellow-50";
    case "completed":
    case "received":
    case "success":
    case "refunded":
      return "bg-green-500 text-green-50";
    case "failed":
      return "bg-red-500 text-red-50";
    case "cancelled":
      return "bg-gray-400 text-gray-50";
    case "reversed":
      return "bg-orange-500 text-orange-50";
    case "retry":
      return "bg-blue-500 text-blue-50";
    default:
      return "bg-gray-400 text-gray-50";
  }
};

// Helper to get user-friendly display status
// For credit transactions (refunds) with failed/reversed status, show "Refunded" instead
const getDisplayStatus = (transaction: Transaction): string => {
  const status = transaction.related?.status?.toLowerCase() || "";
  const isCredit = transaction.direction === "credit";

  // If this is a credit transaction (refund) for a failed/reversed topup
  // Show "Refunded" because the money successfully came back
  if (isCredit && (status === "failed" || status === "reversed")) {
    return "Refunded";
  }

  // Default: capitalize the original status
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Helper to detect if a transaction is for data (with fallback for incorrect backend type)
const isDataTransaction = (transaction: Transaction): boolean => {
  // First check the related.type from backend
  if (transaction.related?.type?.toLowerCase() === "data") {
    return true;
  }

  // Fallback: Check productCode patterns that indicate data products
  const productCode = (transaction.productCode || "").toUpperCase();
  const dataPatterns = ["DATA", "GB", "MB", "TB", "BUNDLE"];

  return dataPatterns.some((pattern) => productCode.includes(pattern));
};

// Helper to get product type label with smart detection
const getProductTypeLabel = (transaction: Transaction): string => {
  return isDataTransaction(transaction) ? "Data" : "Airtime";
};

// Helper to determine the transaction icon
const getTransactionIcon = (transaction: Transaction) => {
  const isDebit = transaction.direction === "debit";

  if (isDebit) {
    if (transaction.relatedType === "topup_request") {
      // Use smart detection for data vs airtime
      if (isDataTransaction(transaction)) {
        return <Wifi className="size-5 text-purple-600" />;
      }
      // Default to phone icon for airtime
      return <Phone className="size-5 text-blue-600" />;
    }
    // Admin debit or outgoing_payment - use arrow up (money going out)
    return <ArrowUp className="size-5 text-red-600" />;
  } else {
    // isCredit - incoming_payment or other credits - use arrow down (money coming in)
    return <ArrowDown className="size-5 text-green-600" />;
  }
};

interface TransactionItemProps {
  transaction: Transaction;
  source?: "home" | "transactions";
}

export function TransactionItem({ transaction, source }: TransactionItemProps) {
  const router = useRouter();
  const isDebit = transaction.direction === "debit";

  const tranxDetail = () => {
    const url = `/dashboard/transactions/${transaction.id}${source ? `?from=${source}` : ""}`;
    router.push(url);
  };
  const formattedAmount = transaction.amount
    .toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    })
    .replace("₦", "");

  return (
    <div
      className="hover:bg-muted/50 flex cursor-auto items-center justify-between p-3 transition-colors"
      onClick={() => tranxDetail()}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            isDebit ? "bg-red-100" : "bg-green-100"
          )}
        >
          {getTransactionIcon(transaction)}
        </div>
        {/* Details Section */}
        <div>
          {isDebit && transaction.relatedType === "topup_request" ? (
            <>
              {isDataTransaction(transaction) ? (
                // Data: Show product name/code as main title
                <>
                  <p className="text-sm font-semibold">
                    {transaction.productCode || "Data Bundle"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    to{" "}
                    {transaction.related?.operatorCode?.toUpperCase() ||
                      "Unknown"}{" "}
                    ({transaction.related?.recipient_phone || "N/A"})
                  </p>
                </>
              ) : (
                // Airtime: Show product name like "MTN 100 Airtime"
                <>
                  <p className="text-sm font-semibold">
                    {transaction.related?.operatorCode?.toUpperCase() ||
                      "Unknown"}{" "}
                    {transaction.denomAmount
                      ? `₦${transaction.denomAmount.toLocaleString()}`
                      : ""}{" "}
                    Airtime
                  </p>
                  <p className="text-muted-foreground text-xs">
                    to{" "}
                    {transaction.related?.operatorCode?.toUpperCase() ||
                      "Unknown"}{" "}
                    ({transaction.related?.recipient_phone || "N/A"})
                  </p>
                </>
              )}
            </>
          ) : transaction.relatedType === "incoming_payment" ? (
            // Incoming payment (admin credit): Show clean message instead of admin UUID
            <>
              <p className="text-sm font-semibold">Incoming Payment</p>
              <p className="text-muted-foreground text-xs">Wallet top-up</p>
            </>
          ) : transaction.relatedType === "outgoing_payment" ? (
            // Outgoing payment (admin debit): Show clean message instead of admin UUID
            <>
              <p className="text-sm font-semibold">Wallet Debit</p>
              <p className="text-muted-foreground text-xs">Admin deduction</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">
                {transaction.note || transaction.method}
              </p>
              <p className="text-muted-foreground text-xs capitalize">
                {transaction.method}
              </p>
            </>
          )}
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
        {/* Status Badge - Only show for topup requests, not for instant wallet operations */}
        {transaction.relatedType === "topup_request" &&
          transaction.related?.status && (
            <Badge
              className={cn(
                "mt-1 inline-block rounded-full border-0 px-2 py-0.5 text-xs text-white capitalize",
                getStatusColor(getDisplayStatus(transaction))
              )}
            >
              {getDisplayStatus(transaction)}
            </Badge>
          )}
      </div>
    </div>
  );
}
