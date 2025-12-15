"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/wallet.types";
import { Landmark, Phone, Wifi } from "lucide-react";
import React from "react";

interface TransactionReceiptProps {
  transaction: Transaction;
  showLogo?: boolean;
  operatorLogo?: string;
}

// Helper to determine status badge color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-500 text-yellow-50";
    case "completed":
    case "received":
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

// Helper to determine the transaction icon
const getTransactionIcon = (transaction: Transaction) => {
  const isDebit = transaction.direction === "debit";

  if (isDebit) {
    if (transaction.relatedType === "topup_request") {
      if (transaction.related?.type === "data") {
        return <Wifi className="size-8 text-purple-600" />;
      }
      if (transaction.related?.type === "airtime") {
        return <Phone className="size-8 text-blue-600" />;
      }
    }
    return <div className="text-destructive text-xl">↑</div>;
  } else {
    if (transaction.relatedType === "incoming_payment") {
      return <Landmark className="size-8 text-green-600" />;
    }
    return <div className="text-xl text-green-600">↓</div>;
  }
};

// Helper to get transaction type label
const getTransactionTypeLabel = (transaction: Transaction): string => {
  const isDebit = transaction.direction === "debit";

  if (isDebit && transaction.relatedType === "topup_request") {
    const type = transaction.related?.type?.toLowerCase() || "topup";
    return `${type.charAt(0).toUpperCase() + type.slice(1)} Purchase`;
  }

  if (!isDebit && transaction.relatedType === "incoming_payment") {
    return "Incoming Payment";
  }

  return isDebit ? "Withdrawal" : "Deposit";
};

// Helper to format date
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "N/A";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const TransactionReceipt = React.forwardRef<
  HTMLDivElement,
  TransactionReceiptProps
>(({ transaction, showLogo = true, operatorLogo }, ref) => {
  const isDebit = transaction.direction === "debit";
  const formattedAmount = transaction.amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  // Get operator logo - prioritize passed prop, then check transaction data
  const getLogoUrl = (): string | undefined => {
    // Priority 1: Use passed operator logo prop
    if (operatorLogo) return operatorLogo;

    // Priority 2: Check if operator info is in related.operator object
    if (transaction.related?.operator?.logoUrl) {
      return transaction.related.operator.logoUrl;
    }

    // Priority 3: Try to get from metadata
    if (transaction.metadata?.operatorLogo) {
      return transaction.metadata.operatorLogo;
    }

    // Priority 4: Default logos based on operator code
    const operatorCode = transaction.related?.operatorCode?.toLowerCase();
    const operatorName =
      transaction.related?.operator?.name?.toLowerCase() || operatorCode;

    const logos: Record<string, string> = {
      mtn: "https://logowik.com/content/uploads/images/mtn3122.jpg",
      airtel: "https://logowik.com/content/uploads/images/airtel4585.jpg",
      glo: "https://logowik.com/content/uploads/images/globacom-glo3852.jpg",
      "9mobile": "https://logowik.com/content/uploads/images/9mobile4667.jpg",
      etisalat: "https://logowik.com/content/uploads/images/etisalat1614.jpg",
    };

    // Try to match by operator code first
    if (operatorCode && logos[operatorCode]) {
      return logos[operatorCode];
    }

    // Try to match by operator name (partial match)
    for (const [key, url] of Object.entries(logos)) {
      if (operatorName && operatorName.includes(key)) {
        return url;
      }
    }

    return undefined;
  };

  const logoUrl = getLogoUrl();

  return (
    <div
      ref={ref}
      className="w-full bg-white p-4 sm:p-6"
      style={{ maxWidth: "400px", margin: "0 auto" }}
    >
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold">Receipt</h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {formatDate(transaction.createdAt)}
        </p>
      </div>

      {/* Transaction Summary */}
      <div className="mb-4 rounded-lg bg-blue-50 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-full",
                isDebit ? "bg-red-100" : "bg-green-100"
              )}
            >
              {getTransactionIcon(transaction)}
            </div>
            <div>
              <p className="text-sm leading-tight font-semibold">
                {getTransactionTypeLabel(transaction)}
              </p>
              {transaction.related?.recipient_phone && (
                <p className="text-muted-foreground text-xs leading-tight">
                  {transaction.related.recipient_phone}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-lg leading-none font-bold",
                isDebit ? "text-destructive" : "text-green-600"
              )}
            >
              {isDebit ? "-" : "+"}
              {formattedAmount.replace("₦", "")}
            </p>
            {transaction.related?.status && (
              <Badge
                className={cn(
                  "mt-1 px-2 py-0.5 text-xs capitalize",
                  getStatusColor(transaction.related.status)
                )}
              >
                {transaction.related.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Operator Logo for Topup */}
        {showLogo && transaction.relatedType === "topup_request" && (
          <div className="mt-3 flex items-center gap-2 border-t border-blue-100 pt-3">
            <span className="text-muted-foreground text-xs font-medium">
              Provider:
            </span>
            {logoUrl && (
              <img
                src={logoUrl}
                alt="operator"
                className="h-5 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="text-xs font-semibold">
              {transaction.related?.operatorCode?.toUpperCase() ||
                transaction.related?.operator?.name?.toUpperCase() ||
                "N/A"}
            </span>
          </div>
        )}
      </div>

      {/* Details Table */}
      <div className="mb-4 space-y-2 text-xs">
        <div className="flex justify-between border-b pb-2">
          <span className="font-medium text-gray-600">TXN ID</span>
          <span className="font-mono text-xs">
            {transaction.id.slice(0, 12)}...
          </span>
        </div>

        {transaction.reference && (
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Reference</span>
            <span className="font-mono text-xs">
              {transaction.reference.slice(0, 12)}...
            </span>
          </div>
        )}

        <div className="flex justify-between border-b pb-2">
          <span className="font-medium text-gray-600">Amount</span>
          <span className="font-bold">{formattedAmount}</span>
        </div>

        {/* Cashback Used - Show if useCashback was true */}
        {transaction.related?.useCashback &&
          transaction.related?.cashbackUsed && (
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-green-600">Cashback Used</span>
              <span className="font-bold text-green-600">
                -₦
                {parseFloat(transaction.related.cashbackUsed).toLocaleString(
                  "en-NG"
                )}
              </span>
            </div>
          )}

        {/* Cashback Earned - Show if has_cashback */}
        {transaction.related?.cashbackEarned && (
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-blue-600">Cashback Earned</span>
            <span className="font-bold text-blue-600">
              +₦
              {parseFloat(transaction.related.cashbackEarned).toLocaleString(
                "en-NG"
              )}
            </span>
          </div>
        )}

        {/* Amount Paid After Cashback */}
        {transaction.related?.useCashback &&
          transaction.related?.amountPaid && (
            <div className="flex justify-between border-b bg-blue-50 px-2 py-1 pb-2">
              <span className="font-medium text-gray-700">You Paid</span>
              <span className="font-bold">
                ₦
                {parseFloat(transaction.related.amountPaid).toLocaleString(
                  "en-NG"
                )}
              </span>
            </div>
          )}

        <div className="flex justify-between border-b pb-2">
          <span className="font-medium text-gray-600">Balance</span>
          <span className="text-xs font-bold">
            ₦{transaction.balanceAfter.toLocaleString("en-NG")}
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-medium text-gray-600">Method</span>
          <span className="text-xs capitalize">{transaction.method}</span>
        </div>

        {/* Related Information */}
        {transaction.related && Object.keys(transaction.related).length > 0 && (
          <>
            {transaction.related.recipient_phone && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-600">Recipient</span>
                <span className="text-xs">
                  {transaction.related.recipient_phone}
                </span>
              </div>
            )}

            {transaction.related.operatorCode && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-600">Operator</span>
                <span className="text-xs font-medium">
                  {transaction.related.operatorCode.toUpperCase()}
                </span>
              </div>
            )}

            {transaction.related.type && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-600">Type</span>
                <span className="text-xs capitalize">
                  {transaction.related.type}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-3 text-center text-xs text-gray-500">
        <p>Official Receipt</p>
        <p className="text-xs text-gray-400">Nexus Data</p>
      </div>
    </div>
  );
});

TransactionReceipt.displayName = "TransactionReceipt";
