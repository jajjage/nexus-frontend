"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransaction } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/wallet.types";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Share2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ShareTransactionDialog } from "./share-transaction-dialog";
import { TransactionTimeline } from "./transaction-timeline";

interface TransactionDetailPageProps {
  transactionId: string;
}

// Get status icon and color configuration
const getStatusConfig = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "completed":
    case "received":
    case "success":
      return {
        icon: CheckCircle2,
        color: "text-green-600",
        label: "Successful",
        bgColor: "bg-green-50",
        borderColor: "ring-green-100",
      };
    case "pending":
      return {
        icon: Clock,
        color: "text-amber-600",
        label: "Pending",
        bgColor: "bg-amber-50",
        borderColor: "ring-amber-100",
      };
    case "failed":
      return {
        icon: XCircle,
        color: "text-red-600",
        label: "Failed",
        bgColor: "bg-red-50",
        borderColor: "ring-red-100",
      };
    case "cancelled":
      return {
        icon: XCircle,
        color: "text-gray-600",
        label: "Cancelled",
        bgColor: "bg-gray-50",
        borderColor: "ring-gray-100",
      };
    case "reversed":
      return {
        icon: AlertCircle,
        color: "text-orange-600",
        label: "Reversed",
        bgColor: "bg-orange-50",
        borderColor: "ring-orange-100",
      };
    default:
      return {
        icon: AlertCircle,
        color: "text-gray-600",
        label: status,
        bgColor: "bg-gray-50",
        borderColor: "ring-gray-100",
      };
  }
};

// Helper to determine the transaction icon
const getTransactionIcon = (transaction: Transaction) => {
  const isDebit = transaction.direction === "debit";

  if (isDebit) {
    if (transaction.relatedType === "topup_request") {
      const operatorCode = transaction.related?.operatorCode?.toUpperCase();
      if (operatorCode === "MTN") {
        return "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/960px-New-mtn-logo.jpg?20220217143058";
      }
      if (operatorCode === "AIRTEL") {
        return "https://upload.wikimedia.org/wikipedia/commons/1/18/Airtel_logo.svg";
      }
      if (operatorCode === "GLO") {
        return "https://upload.wikimedia.org/wikipedia/commons/8/86/Glo_button.png";
      }
      if (operatorCode === "9MOBILE") {
        return "https://logosandtypes.com/wp-content/uploads/2020/10/9mobile-1.svg";
      }
    }
    // Default debit icon
    return <CreditCard className="size-8 text-slate-400" />;
  } else {
    // isCredit
    if (transaction.relatedType === "incoming_payment") {
      return (
        <div className="flex flex-col items-center justify-center text-green-600">
          <ArrowUp className="size-8 text-green-600" />
        </div>
      );
    }
    // Default credit icon
    return <ArrowDown className="size-8 text-green-600" />;
  }
};

// Helper to get transaction type label
const getTransactionTypeLabel = (transaction: Transaction): string => {
  const isDebit = transaction.direction === "debit";

  if (isDebit && transaction.relatedType === "topup_request") {
    // Use smart detection instead of relying on backend's related.type
    // which might incorrectly be "airtime" for all transactions
    const isData = isDataTransaction(transaction);
    const typeLabel = isData ? "Data" : "Airtime";
    return `${typeLabel} Purchase`;
  }

  if (!isDebit && transaction.relatedType === "incoming_payment") {
    return "Incoming Payment";
  }

  // Handle referral withdrawals (usually credits to wallet from referral system)
  if (!isDebit && transaction.relatedType === "referral_withdrawal") {
    return "Referral Bonus";
  }

  return isDebit ? "Withdrawal" : "Deposit";
};

// Helper to get transaction cashback label
const getCashbackUsed = (transaction: Transaction): string => {
  const isDebit = transaction.direction === "debit";

  if (isDebit && transaction.relatedType === "topup_request") {
    const cashbackUsed = transaction.cashbackUsed || 0;
    const formattedBalance = cashbackUsed.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formattedBalance;
  }
  const formattedBalance = transaction.cashbackUsed.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formattedBalance;
};

// Helper to get transaction description
const getTransactionDescription = (transaction: Transaction): string => {
  const isDebit = transaction.direction === "debit";

  if (isDebit && transaction.relatedType === "topup_request") {
    const operator =
      transaction.related?.operatorCode?.toUpperCase() || "Unknown";
    const phone = transaction.related?.recipient_phone || "N/A";
    // Use smart detection for type
    const isData = isDataTransaction(transaction);
    const typeLabel = isData ? "Data" : "Airtime";
    console.log(
      `getTransactionDescription: ${typeLabel} to ${operator} - ${phone}`
    );
    return `${typeLabel} to ${operator} - ${phone}`;
  }

  // For incoming payments, show a clean message instead of admin UUID
  if (!isDebit && transaction.relatedType === "incoming_payment") {
    return "Wallet top-up";
  }

  // For outgoing payments (admin debit), show a clean message instead of admin UUID
  if (isDebit && transaction.relatedType === "outgoing_payment") {
    return "Admin deduction";
  }

  console.log(transaction.note || transaction.method || "Transaction");
  return transaction.note || transaction.method || "Transaction";
};

// Helper to get transaction detail type label
const getTransactionDetailTypeLabel = (transaction: Transaction): string => {
  if (transaction.relatedType === "incoming_payment") {
    return "Incoming Transfer";
  }

  if (transaction.relatedType === "outgoing_payment") {
    return "Wallet Debit";
  }

  // Handle referral transactions which might be categorized under 'system' or similar
  if (transaction.relatedType === "referral_withdrawal") {
    return "Referral";
  }

  const type = transaction.related?.type?.toLowerCase() || "airtime";
  return type.charAt(0).toUpperCase() + type.slice(1);
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
  if (transaction.relatedType === "incoming_payment") {
    return "Incoming Transfer";
  }
  if (transaction.relatedType === "referral_withdrawal") {
    return "Referral Withdrawal";
  }

  return isDataTransaction(transaction) ? "Data Bundle" : "Airtime";
};

// Helper to format date
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
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.warn(`Error parsing date: ${date}`, error);
    return "Invalid Date";
  }
};

// Helper to copy to clipboard
const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
};

// Skeleton loader component
function TransactionDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      <Card className="h-96" />
    </div>
  );
}

export function TransactionDetailPage({
  transactionId,
}: TransactionDetailPageProps) {
  const { data, isLoading, error } = useTransaction(transactionId);
  const transaction = data?.data;
  const [isShareOpen, setIsShareOpen] = useState(false);
  const searchParams = useSearchParams();

  // Navigation Logic
  const fromSource = searchParams.get("from");
  const backLink =
    fromSource === "transactions" ? "/dashboard/transactions" : "/dashboard";
  const backLabel =
    fromSource === "transactions"
      ? "Back to Transactions"
      : "Back to Dashboard";

  if (isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <TransactionDetailSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <header className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
              <Link href={backLink}>
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
              {backLabel}
            </h1>
          </header>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-900">Error loading transaction details.</p>
              <p className="text-sm text-red-800">
                Please try again or go back to the transaction list.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <header className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
              <Link href={backLink}>
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
              {backLabel}
            </h1>
          </header>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Transaction not found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isCredit = transaction.direction === "credit";

  // For topup transactions, show product name in main display
  // Uses smart detection that checks productCode patterns as fallback
  const isDataProduct = isDataTransaction(transaction);
  const isTopupRequest = transaction.relatedType === "topup_request";

  // Main display: For topups show product name, for other transactions show amount
  let formattedAmount: string;
  if (isTopupRequest) {
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

  const transactionIcon = getTransactionIcon(transaction);
  const isIconUrl = typeof transactionIcon === "string";
  const logoUrl = isIconUrl ? transactionIcon : null;
  // For topup_request, use related.status with "pending" default
  // For incoming_payment and other credit transactions, they're instant so default to "completed"
  const transactionStatus =
    transaction.relatedType === "topup_request"
      ? transaction.related?.status || "pending"
      : transaction.related?.status || "completed";
  const statusConfig = getStatusConfig(transactionStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href={backLink}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 text-lg font-semibold tracking-tight whitespace-nowrap sm:grow-0">
            {backLabel}
          </h1>
        </header>

        {/* Main Transaction Card */}
        <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-slate-200">
          {/* Header Section - Centralized */}
          <div className="flex flex-col items-center p-8 pb-4">
            {/* Logo / Icon Container */}
            <div className="mb-4 flex size-16 items-center justify-center overflow-hidden rounded-full bg-slate-50 shadow-sm ring-1 ring-slate-100">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="operator"
                  className="size-full object-cover"
                />
              ) : (
                transactionIcon
              )}
            </div>
            <h2 className="mb-1 text-center text-lg font-semibold text-slate-900">
              {getTransactionTypeLabel(transaction)}
            </h2>
            <p className="mb-6 max-w-[280px] text-center text-sm text-slate-500">
              {getTransactionDescription(transaction)}
            </p>

            {/* Amount */}
            <div className="mb-4 text-center">
              <span className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {formattedAmount}
              </span>
            </div>

            {/* Status Line */}
            <div
              className={cn(
                "mb-3 flex items-center gap-2 rounded-full px-3 py-1 ring-1",
                statusConfig.bgColor,
                statusConfig.borderColor
              )}
            >
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
          <div className="relative flex items-center justify-center px-6">
            <div className="h-px w-full border-t-2 border-dashed border-slate-200" />
          </div>

          <CardContent className="space-y-10 px-6 py-8">
            {/* Status Timeline */}
            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Transaction Status
              </p>
              <TransactionTimeline
                status={transactionStatus}
                createdAt={
                  transaction.createdAt instanceof Date
                    ? transaction.createdAt.toISOString()
                    : new Date(transaction.createdAt).toISOString()
                }
                transactionType={transaction.relatedType}
              />
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Transaction Details
              </p>

              <div className="space-y-4">
                {/* Recipient Phone */}
                {transaction.related?.recipient_phone && (
                  <div className="flex justify-between border-b border-slate-50 pb-3 text-sm">
                    <span className="text-slate-500">Recipient Phone</span>
                    <span className="font-medium text-slate-900">
                      {transaction.related.recipient_phone}
                    </span>
                  </div>
                )}

                {/* Amount Paid */}
                {transaction.amount && (
                  <div className="flex justify-between border-b border-slate-50 pb-3 text-sm">
                    <span className="text-slate-500">Amount Paid</span>
                    <span className="font-medium text-slate-900">
                      {formattedAmountPaid}
                    </span>
                  </div>
                )}

                {/* Cashback Used */}
                {transaction.relatedType === "topup_request" && (
                  <div className="flex justify-between border-b border-slate-50 pb-3 text-sm">
                    <span className="text-slate-500">Cashback Used</span>
                    <span className="font-medium text-red-500">
                      -{getCashbackUsed(transaction)}
                    </span>
                  </div>
                )}

                {/* Service Type */}
                <div className="flex justify-between border-b border-slate-50 pb-3 text-sm">
                  <span className="text-slate-500">Service</span>
                  <div className="text-right">
                    <span className="block font-medium text-slate-900">
                      {getServiceTypeLabel(transaction)}
                    </span>
                    {transaction.productCode && (
                      <span className="text-xs text-slate-400">
                        {transaction.productCode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Method (for Transfers) */}
                {transaction.relatedType === "incoming_payment" &&
                  transaction.method && (
                    <div className="flex justify-between border-b border-slate-50 pb-3 text-sm">
                      <span className="text-slate-500">Method</span>
                      <span className="font-medium text-slate-900 capitalize">
                        {transaction.method}
                      </span>
                    </div>
                  )}

                {/* Reference */}
                {transaction.reference && (
                  <div className="space-y-1 border-b border-slate-50 pb-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Reference</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-slate-900"
                        onClick={() =>
                          copyToClipboard(transaction.reference!, "Reference")
                        }
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                    <code className="block font-mono text-xs break-all text-slate-600">
                      {transaction.reference}
                    </code>
                  </div>
                )}

                {/* Transaction ID */}
                <div className="space-y-1 pt-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Transaction ID</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-slate-900"
                      onClick={() =>
                        copyToClipboard(transaction.id, "Transaction ID")
                      }
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                  <code className="block font-mono text-xs break-all text-slate-600">
                    {transaction.id}
                  </code>
                </div>
              </div>
            </div>

            {/* Transaction Note */}
            {transaction.note && (
              <div className="mt-6 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="mb-1 text-xs font-semibold text-slate-400 uppercase">
                  Note
                </p>
                <p className="text-sm text-slate-700">{transaction.note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share Button Footer */}
        <div className="flex justify-center pb-4">
          <Button
            onClick={() => setIsShareOpen(true)}
            className="gap-2"
            size="lg"
          >
            <Share2 className="size-5" />
            Share Receipt
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareTransactionDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        transaction={transaction}
      />
    </div>
  );
}
