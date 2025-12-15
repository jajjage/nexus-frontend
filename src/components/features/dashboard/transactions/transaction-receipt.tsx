"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  return (
    <div ref={ref} className="w-full bg-white p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Transaction Receipt</h1>
        <p className="text-muted-foreground mt-1">
          {formatDate(transaction.createdAt)}
        </p>
      </div>

      {/* Transaction Summary */}
      <div className="mb-8 rounded-lg bg-gray-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-full",
                isDebit ? "bg-red-100" : "bg-green-100"
              )}
            >
              {getTransactionIcon(transaction)}
            </div>
            <div>
              <p className="text-lg font-semibold">
                {getTransactionTypeLabel(transaction)}
              </p>
              {transaction.related?.recipient_phone && (
                <p className="text-muted-foreground text-sm">
                  {transaction.related.recipient_phone}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-3xl font-bold",
                isDebit ? "text-destructive" : "text-green-600"
              )}
            >
              {isDebit ? "-" : "+"}
              {formattedAmount}
            </p>
            {transaction.related?.status && (
              <Badge
                className={cn(
                  "mt-2 capitalize",
                  getStatusColor(transaction.related.status)
                )}
              >
                {transaction.related.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Operator Logo for Topup */}
        {showLogo &&
          operatorLogo &&
          transaction.relatedType === "topup_request" && (
            <div className="mt-4 flex items-center gap-2 border-t pt-4">
              <span className="text-muted-foreground text-sm font-medium">
                Provider:
              </span>
              <Avatar className="size-6">
                <AvatarImage src={operatorLogo} className="object-contain" />
                <AvatarFallback>
                  {transaction.related?.operatorCode?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {transaction.related?.operatorCode?.toUpperCase()}
              </span>
            </div>
          )}
      </div>

      {/* Details Table */}
      <div className="mb-8 space-y-4">
        <div className="flex justify-between border-b pb-3">
          <span className="font-medium text-gray-600">Transaction ID</span>
          <span className="font-mono text-sm">{transaction.id}</span>
        </div>

        {transaction.reference && (
          <div className="flex justify-between border-b pb-3">
            <span className="font-medium text-gray-600">Reference</span>
            <span className="font-mono text-sm">{transaction.reference}</span>
          </div>
        )}

        <div className="flex justify-between border-b pb-3">
          <span className="font-medium text-gray-600">Amount</span>
          <span className="font-bold">{formattedAmount}</span>
        </div>

        <div className="flex justify-between border-b pb-3">
          <span className="font-medium text-gray-600">Balance After</span>
          <span className="font-bold">
            ₦{transaction.balanceAfter.toLocaleString("en-NG")}
          </span>
        </div>

        <div className="flex justify-between border-b pb-3">
          <span className="font-medium text-gray-600">Method</span>
          <span className="capitalize">{transaction.method}</span>
        </div>

        <div className="flex justify-between border-b pb-3">
          <span className="font-medium text-gray-600">Date & Time</span>
          <span className="text-sm">{formatDate(transaction.createdAt)}</span>
        </div>

        {/* Related Information */}
        {transaction.related && Object.keys(transaction.related).length > 0 && (
          <>
            {transaction.related.recipient_phone && (
              <div className="flex justify-between border-b pb-3">
                <span className="font-medium text-gray-600">
                  Recipient Phone
                </span>
                <span>{transaction.related.recipient_phone}</span>
              </div>
            )}

            {transaction.related.operatorCode && (
              <div className="flex justify-between border-b pb-3">
                <span className="font-medium text-gray-600">Operator</span>
                <span className="font-medium">
                  {transaction.related.operatorCode.toUpperCase()}
                </span>
              </div>
            )}

            {transaction.related.type && (
              <div className="flex justify-between border-b pb-3">
                <span className="font-medium text-gray-600">Type</span>
                <span className="capitalize">{transaction.related.type}</span>
              </div>
            )}

            {transaction.related.status && (
              <div className="flex justify-between pb-3">
                <span className="font-medium text-gray-600">Status</span>
                <Badge
                  className={cn(
                    "capitalize",
                    getStatusColor(transaction.related.status)
                  )}
                >
                  {transaction.related.status}
                </Badge>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-6 text-center">
        <p className="text-xs text-gray-500">
          This is an official receipt from Nexus Data
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Transaction ID: {transaction.id}
        </p>
      </div>
    </div>
  );
});

TransactionReceipt.displayName = "TransactionReceipt";
