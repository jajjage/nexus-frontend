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
// Uses inline hex colors for html2canvas compatibility when sharing receipt
const getStatusConfig = (status: string, isRefund?: boolean) => {
  // For refund transactions, always show as successful refund
  if (isRefund) {
    return {
      icon: CheckCircle2,
      color: "#16a34a", // green-600
      bgColor: "#f0fdf4", // green-50
      borderColor: "#dcfce7", // green-100
      label: "Refunded",
    };
  }

  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "completed":
    case "received":
    case "success": // Add success status
      return {
        icon: CheckCircle2,
        color: "#16a34a", // green-600
        bgColor: "#f0fdf4", // green-50
        borderColor: "#dcfce7", // green-100
        label: "Successful",
      };
    case "pending":
      return {
        icon: Clock,
        color: "#d97706", // amber-600
        bgColor: "#fffbeb", // amber-50
        borderColor: "#fef3c7", // amber-100
        label: "Pending",
      };
    case "failed":
      return {
        icon: XCircle,
        color: "#dc2626", // red-600
        bgColor: "#fef2f2", // red-50
        borderColor: "#fee2e2", // red-100
        label: "Failed",
      };
    case "cancelled":
      return {
        icon: XCircle,
        color: "#4b5563", // gray-600
        bgColor: "#f9fafb", // gray-50
        borderColor: "#f3f4f6", // gray-100
        label: "Cancelled",
      };
    case "reversed":
      return {
        icon: XCircle,
        color: "#dc2626", // red-600
        bgColor: "#fef2f2", // red-50
        borderColor: "#fee2e2", // red-100
        label: "Failed",
      };
    default:
      return {
        icon: AlertCircle,
        color: "#4b5563", // gray-600
        bgColor: "#f9fafb", // gray-50
        borderColor: "#f3f4f6", // gray-100
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

// Helper to detect if a transaction is for data (moved up for reuse)
const isDataTransactionCheck = (transaction: Transaction): boolean => {
  // First check the related.type from backend
  if (transaction.related?.type?.toLowerCase() === "data") {
    return true;
  }
  // Fallback: Check productCode patterns that indicate data products
  const productCode = (transaction.productCode || "").toUpperCase();
  const dataPatterns = ["DATA", "GB", "MB", "TB", "BUNDLE"];
  return dataPatterns.some((pattern) => productCode.includes(pattern));
};

// Get transaction type label
const getTransactionTypeLabel = (transaction: Transaction): string => {
  const isCredit = transaction.direction === "credit";
  const relatedStatus = transaction.related?.status?.toLowerCase();

  // Check if this is a refund (credit transaction with failed/reversed topup status)
  if (
    isCredit &&
    transaction.relatedType === "topup_request" &&
    (relatedStatus === "failed" || relatedStatus === "reversed")
  ) {
    return "Refund";
  }

  if (transaction.relatedType === "topup_request") {
    // Use smart detection instead of relying on backend's related.type
    const isData = isDataTransactionCheck(transaction);
    const typeLabel = isData ? "Data" : "Airtime";
    return `${typeLabel} Purchase`;
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
    // Use smart detection for type
    const isData = isDataTransactionCheck(transaction);
    const typeLabel = isData ? "Data" : "Airtime";
    const operator =
      transaction.related?.operatorCode?.toUpperCase() || "Unknown";
    const phone = transaction.related?.recipient_phone || "N/A";
    return `${typeLabel} to ${operator} - ${phone}`;
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

// Helper to get service type label with smart detection
const getServiceTypeLabel = (transaction: Transaction): string => {
  return isDataTransaction(transaction) ? "Data Bundle" : "Airtime";
};

export const TransactionReceipt = React.forwardRef<
  HTMLDivElement,
  TransactionReceiptProps
>(({ transaction, showLogo = true, className }, ref) => {
  const isCredit = transaction.direction === "credit";
  const relatedStatus = transaction.related?.status?.toLowerCase();

  // Check if this is a refund (credit transaction with failed/reversed topup status)
  const isRefund =
    isCredit &&
    transaction.relatedType === "topup_request" &&
    (relatedStatus === "failed" || relatedStatus === "reversed");

  // For topup transactions, show product name in main display
  // Uses smart detection that checks productCode patterns as fallback
  const isDataProduct = isDataTransaction(transaction);
  const isTopupRequest = transaction.relatedType === "topup_request";

  // Main display: For refunds show amount, for topups show product name
  let formattedAmount: string;
  if (isRefund) {
    // Refund: Show the refunded amount
    formattedAmount = transaction.amount.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });
  } else if (isTopupRequest) {
    if (isDataProduct) {
      // Data: Show product code/name
      formattedAmount =
        transaction.productCode ||
        transaction.related?.productCode ||
        "Data Bundle";
    } else {
      // Airtime: Show "MTN ₦100 Airtime" format
      const operator =
        transaction.related?.operatorCode?.toUpperCase() || "Unknown";
      const denom = transaction.denomAmount
        ? `₦${transaction.denomAmount.toLocaleString()}`
        : "";
      formattedAmount = `${operator} ${denom} Airtime`;
    }
  } else {
    // Other transactions: show amount
    formattedAmount = transaction.amount.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });
  }

  const formattedAmountPaid = transaction.amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  const logoUrl = getOperatorLogo(transaction);
  const statusConfig = getStatusConfig(
    transaction.related?.status || "pending",
    isRefund
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

        {/* Status Line - Uses inline styles for html2canvas compatibility */}
        <div
          className="mb-2 flex items-center gap-2 rounded-full px-3 py-1"
          style={{
            backgroundColor: statusConfig.bgColor,
            boxShadow: `inset 0 0 0 1px ${statusConfig.borderColor}`,
          }}
        >
          <StatusIcon
            className="h-4 w-4"
            style={{ color: statusConfig.color }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: statusConfig.color }}
          >
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
          {transaction.relatedType === "topup_request" && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Service</span>
              <div className="text-right">
                <span className="block font-medium text-slate-900">
                  {getServiceTypeLabel(transaction)}
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
