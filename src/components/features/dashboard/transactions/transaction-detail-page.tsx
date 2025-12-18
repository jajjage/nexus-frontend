"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransaction } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/wallet.types";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  Landmark,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ShareTransactionDialog } from "./share-transaction-dialog";

interface TransactionDetailPageProps {
  transactionId: string;
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
      if (transaction.related?.operatorCode === "MTN") {
        return "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/960px-New-mtn-logo.jpg?20220217143058";
      }
      if (transaction.related?.operatorCode === "AIRTEL") {
        return "https://upload.wikimedia.org/wikipedia/commons/1/18/Airtel_logo.svg";
      }
      if (transaction.related?.operatorCode === "GLO") {
        return "https://upload.wikimedia.org/wikipedia/commons/8/86/Glo_button.png";
      }
      if (transaction.related?.operatorCode === "9MOBILE") {
        return "https://logosandtypes.com/wp-content/uploads/2020/10/9mobile-1.svg";
      }
    }
    // Default debit icon
    return <ArrowUp className="text-destructive size-8" />;
  } else {
    // isCredit
    if (transaction.relatedType === "incoming_payment") {
      return <Landmark className="size-8 text-green-600" />;
    }
    // Default credit icon
    return <ArrowDown className="size-8 text-green-600" />;
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
    const type = transaction.related?.type?.toLowerCase() || "topup";
    console.log(
      `getTransactionDescription: ${type.charAt(0).toUpperCase() + type.slice(1)} to ${operator} - ${phone}`
    );
    return `${type.charAt(0).toUpperCase() + type.slice(1)} to ${operator} - ${phone}`;
  }

  console.log(transaction.note || transaction.method || "Transaction");
  return transaction.note || transaction.method || "Transaction";
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

// Helper to copy to clipboard
const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
};

// Get operator logo from related data or from API
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

  // Try to match by operator code first
  if (operatorCode && logos[operatorCode]) {
    return logos[operatorCode];
  }

  return undefined;
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
      <div className="bg-background min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <TransactionDetailSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
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
      <div className="bg-background min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
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

  const operatorLogo = getOperatorLogo(transaction);

  return (
    <div className="bg-background min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
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

        {/* Main Transaction Card - Single Card Layout */}
        <Card className="overflow-hidden">
          {/* Header Section with Transaction Info */}
          <div className="px-6 py-8 sm:py-12">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <Avatar className="flex size-16 items-center justify-center rounded-full">
                  <AvatarImage src={operatorLogo} className="object-contain" />
                  <AvatarFallback>
                    {getTransactionIcon(transaction)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h1 className="text-2xl font-bold">
                    {getTransactionTypeLabel(transaction)}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {getTransactionDescription(transaction)}
                  </p>
                </div>
              </div>
              <p className="text-5xl font-bold">{formattedAmount}</p>
              {transaction.related?.status && (
                <Badge
                  className={cn(
                    "text-1xl capitalize",
                    getStatusColor(transaction.related.status)
                  )}
                >
                  {transaction.related.status}
                </Badge>
              )}
              <p className="font-medium">{formatDate(transaction.createdAt)}</p>
            </div>
          </div>

          {/* Details Section */}
          <CardContent className="mt-0 space-y-8 px-6 py-8">
            {/* Transaction Note */}
            {transaction.note && (
              <div className="border-t pt-6">
                <p className="text-muted-foreground mb-2 text-sm font-medium tracking-wide uppercase">
                  Note
                </p>
                <p className="bg-muted/30 rounded-lg p-4">{transaction.note}</p>
              </div>
            )}

            {/* Related Information */}
            {transaction.related &&
              Object.keys(transaction.related).length > 0 && (
                <div className="border-t pt-6">
                  <p className="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">
                    Transaction Details
                  </p>
                  <div className="space-y-3">
                    {transaction.related.recipient_phone && (
                      <div className="bg-muted/30 flex items-center justify-between rounded-lg p-4">
                        <span className="font-medium">Recipient Phone</span>
                        <span className="text-right">
                          {transaction.related.recipient_phone}
                        </span>
                      </div>
                    )}
                    <div className="bg-muted/30 flex items-center justify-between rounded-lg p-4">
                      <span className="font-medium">Amount Paid</span>
                      <span className="text-right">{formattedAmountPaid}</span>
                    </div>
                    {transaction.relatedType === "topup_request" && (
                      <div className="bg-muted/30 flex items-center justify-between rounded-lg p-4">
                        <span className="font-medium"> Cashback Used </span>
                        <span className="text-right">
                          <span className="text-right">
                            -₦{getCashbackUsed(transaction)}
                          </span>
                        </span>
                      </div>
                    )}
                    {transaction.related.type === "data" ? (
                      <div className="bg-muted/30 flex items-center justify-between rounded-lg p-4">
                        <span className="font-medium">Data Bundle</span>
                        <span className="capitalize">
                          {transaction.productCode}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-muted/30 flex items-center justify-between rounded-lg p-4">
                        <span className="font-medium">Airtime</span>
                        <span className="capitalize">
                          {transaction.productCode}
                        </span>
                      </div>
                    )}
                    {transaction.reference && (
                      <div className="bg-muted/30 flex items-center justify-between rounded-lg p-4">
                        <span className="font-medium"> Reference </span>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
                            {transaction.reference}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                transaction.reference || "",
                                "Reference"
                              )
                            }
                          >
                            {}
                            <Copy className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="bg-muted/30 flex items-center justify-between rounded-lg p-4">
                      <span className="font-medium"> Transaction ID </span>
                      <span className="text-right">
                        <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
                          {transaction.id.slice(0, 16)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(transaction.id, "Transaction ID")
                          }
                        >
                          {}
                          <Copy className="size-4" />
                        </Button>
                      </span>
                    </div>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Share Button Footer - Outside Card */}
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
        operatorLogo={operatorLogo}
      />
    </div>
  );
}
