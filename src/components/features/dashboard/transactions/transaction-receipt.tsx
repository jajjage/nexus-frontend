"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClipboard } from "@/hooks/useClipboard";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/wallet.types";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  XCircle,
} from "lucide-react";
import React from "react";

interface TransactionReceiptProps {
  transaction: Transaction;
  showLogo?: boolean;
  operatorLogo?: string;
  className?: string;
}

// Get status icon and color
const getStatusConfig = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "completed":
    case "received":
      return {
        icon: CheckCircle2,
        color: "text-green-600",
        label: "Successful",
      };
    case "pending":
      return {
        icon: Clock,
        color: "text-amber-600",
        label: "Pending",
      };
    case "failed":
      return {
        icon: XCircle,
        color: "text-red-600",
        label: "Failed",
      };
    case "cancelled":
      return {
        icon: XCircle,
        color: "text-gray-600",
        label: "Cancelled",
      };
    case "reversed":
      return {
        icon: AlertCircle,
        color: "text-orange-600",
        label: "Reversed",
      };
    default:
      return {
        icon: AlertCircle,
        color: "text-gray-600",
        label: status,
      };
  }
};

// Get operator logo
const getOperatorLogo = (transaction: Transaction): string | undefined => {
  const operatorCode = transaction.related?.operatorCode?.toLowerCase();

  const logos: Record<string, string> = {
    mtn: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/960px-New-mtn-logo.jpg?20220217143058",
    airtel:
      "https://upload.wikimedia.org/wikipedia/commons/1/18/Airtel_logo.svg",
    glo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Glo_button.png",
    "9mobile":
      "https://logosandtypes.com/wp-content/uploads/2020/10/9mobile-1.svg",
  };

  if (operatorCode && logos[operatorCode]) {
    return logos[operatorCode];
  }

  return undefined;
};

// Get transaction type label
const getTransactionTypeLabel = (transaction: Transaction): string => {
  if (transaction.relatedType === "topup_request") {
    const type = transaction.related?.type?.toLowerCase() || "topup";
    return `${type.charAt(0).toUpperCase() + type.slice(1)} Purchase`;
  }
  if (transaction.relatedType === "incoming_payment") {
    return "Incoming Payment";
  }
  return transaction.direction === "debit" ? "Withdrawal" : "Deposit";
};

// Helper to get transaction cashback label
const getCashbackUsed = (transaction: Transaction): string => {
  const isDebit = transaction.direction === "debit";

  if (isDebit && transaction.relatedType === "topup_request") {
    const cashbackUsed = transaction.cashbackUsed || 0;
    return cashbackUsed.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    });
  }
  return transaction.cashbackUsed.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  });
};

// Get transaction description
const getTransactionDescription = (transaction: Transaction): string => {
  if (transaction.relatedType === "topup_request") {
    const type = transaction.related?.type?.toLowerCase() || "topup";
    const operator =
      transaction.related?.operatorCode?.toUpperCase() || "Unknown";
    const phone = transaction.related?.recipient_phone || "N/A";
    return `${type.charAt(0).toUpperCase() + type.slice(1)} to ${operator} - ${phone}`;
  }
  return transaction.note || transaction.method || "Transaction";
};

// Format date
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if date is valid
    if (dateObj instanceof Date && isNaN(dateObj.getTime())) {
      console.warn(`Invalid date received: ${date}`);
      return "Invalid Date";
    }

    return dateObj.toLocaleString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.warn(`Error parsing date: ${date}`, error);
    return "Invalid Date";
  }
};

export const TransactionReceipt = React.forwardRef<
  HTMLDivElement,
  TransactionReceiptProps
>(({ transaction, showLogo = true, className }, ref) => {
  const isCredit = transaction.direction === "credit";
  const formattedAmount = isCredit
    ? transaction.amount.toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
      })
    : `₦${transaction.denomAmount.toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
      })}`;

  const formattedAmountPaid = transaction.amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  const logoUrl = getOperatorLogo(transaction);
  const statusConfig = getStatusConfig(
    transaction.related?.status || "pending"
  );
  const StatusIcon = statusConfig.icon;

  const operatorName =
    transaction.productCode || transaction.productCode || "N/A";

  const { copy: copyId } = useClipboard({
    successMessage: "Transaction ID copied",
  });

  return (
    <Card
      ref={ref}
      className={cn(
        "relative mx-auto w-full max-w-[400px] overflow-hidden border-0 bg-white shadow-none ring-1 ring-slate-200 sm:border sm:shadow-lg sm:ring-0",
        className
      )}
    >
      {/* Receipt Top Section */}
      <div className="flex flex-col items-center p-6 pb-4">
        {/* Logo / Icon */}
        <div className="mb-4 flex size-16 items-center justify-center overflow-hidden rounded-full bg-slate-50 shadow-sm ring-1 ring-slate-100">
          {showLogo &&
          transaction.relatedType === "topup_request" &&
          logoUrl ? (
            <img
              src={logoUrl}
              alt="operator"
              className="size-full object-cover"
            />
          ) : isCredit ? (
            <div className="flex flex-col items-center justify-center text-green-600">
              <span className="text-xs font-bold">IN</span>
            </div>
          ) : (
            <CreditCard className="size-8 text-slate-400" />
          )}
        </div>

        <h2 className="mb-1 text-lg font-semibold text-slate-900">
          {getTransactionTypeLabel(transaction)}
        </h2>
        <p className="mb-6 max-w-[250px] text-center text-sm text-slate-500">
          {getTransactionDescription(transaction)}
        </p>

        {/* Amount */}
        <div className="mb-4 text-center">
          <span className="text-3xl font-bold tracking-tight text-slate-900">
            {formattedAmount}
          </span>
        </div>

        {/* Status Line */}
        <div className="mb-2 flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-100">
          <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
          <span className={cn("text-sm font-medium", statusConfig.color)}>
            {statusConfig.label}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          {formatDate(transaction.createdAt)}
        </p>
      </div>

      {/* Dotted Separator */}
      <div className="relative flex items-center justify-center px-4">
        <div className="h-px w-full border-t-2 border-dashed border-slate-200" />
      </div>

      {/* Details Section */}
      <div className="space-y-4 p-6 pt-4">
        <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Transaction Details
        </p>

        <div className="space-y-3">
          {/* Recipient Phone */}
          {transaction.related?.recipient_phone && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Recipient Phone</span>
              <span className="font-medium text-slate-900">
                {transaction.related.recipient_phone}
              </span>
            </div>
          )}

          {/* Amount Paid */}
          {transaction.amount && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-medium text-slate-900">
                {formattedAmountPaid}
              </span>
            </div>
          )}

          {/* Cashback Used */}
          {transaction.relatedType === "topup_request" && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Cashback Used</span>
              <span className="font-medium text-red-500">
                -{getCashbackUsed(transaction)}
              </span>
            </div>
          )}

          {/* Service Type */}
          {transaction.related?.type && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Service</span>
              <div className="text-right">
                <span className="block font-medium text-slate-900">
                  {transaction.related.type === "airtime"
                    ? "Airtime"
                    : "Data Bundle"}
                </span>
                <span className="text-xs text-slate-400">{operatorName}</span>
              </div>
            </div>
          )}

          {/* Reference/ID */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Transaction ID</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-slate-900"
                onClick={() => copyId(transaction.id)}
              >
                <Copy className="size-3" />
              </Button>
            </div>
            <p className="mt-1 font-mono text-xs break-all text-slate-600">
              {transaction.id}
            </p>
          </div>
        </div>
      </div>

      {/* Branding Footer */}
      <div className="bg-slate-50 p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
          <span>nexus-data.com</span>
        </div>
      </div>
    </Card>
  );
});

TransactionReceipt.displayName = "TransactionReceipt";
