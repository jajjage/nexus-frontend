"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminTransaction } from "@/hooks/admin/useAdminTransactions";
import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Phone,
  RefreshCw,
  ShoppingCart,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";

interface TransactionDetailViewProps {
  transactionId: string;
}

// Method display names
const methodLabels: Record<string, string> = {
  wallet: "Wallet Payment",
  admin_credit: "Admin Credit",
  admin_debit: "Admin Debit",
  topup: "Topup",
  refund: "Refund",
};

// Helper to detect if a transaction is for data (with fallback for incorrect backend type)
const isDataTransaction = (transaction: any): boolean => {
  // First check the related.type from backend
  if (transaction?.related?.type?.toLowerCase() === "data") {
    return true;
  }

  // Fallback: Check productCode patterns that indicate data products
  const productCode = (transaction?.productCode || "").toUpperCase();
  const dataPatterns = ["DATA", "GB", "MB", "TB", "BUNDLE"];

  return dataPatterns.some((pattern) => productCode.includes(pattern));
};

// Helper to get product type label with smart detection
const getProductTypeLabel = (transaction: any): string => {
  return isDataTransaction(transaction) ? "Data" : "Airtime";
};

export function TransactionDetailView({
  transactionId,
}: TransactionDetailViewProps) {
  const { data, isLoading, isError, refetch } =
    useAdminTransaction(transactionId);

  // Handle different API response structures: data.data.transaction OR data.data directly
  const apiData = data?.data as any;
  const transaction = apiData?.transaction || apiData;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !transaction) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Failed to load transaction details
          </p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/admin/dashboard/transactions">
              Back to Transactions
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatAmount = (amount: number | string) => {
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    return isNaN(num) ? amount : num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/dashboard/transactions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          {transaction.direction === "credit" ? (
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
              <ArrowDownRight className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
              <ArrowUpRight className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {transaction.productCode || transaction.method || "Transaction"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {transaction.id || transaction.transactionId}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Amount Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" />
              Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div
                className={`text-4xl font-bold ${
                  transaction.direction === "credit"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {transaction.direction === "credit" ? "+" : "-"}₦
                {formatAmount(transaction.amount)}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    transaction.direction === "credit" ? "default" : "secondary"
                  }
                  className="capitalize"
                >
                  {transaction.direction}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {methodLabels[transaction.method || ""] ||
                    transaction.method ||
                    transaction.relatedType ||
                    "N/A"}
                </Badge>
              </div>
              {transaction.balanceAfter !== undefined && (
                <div className="border-t pt-2">
                  <p className="text-muted-foreground text-sm">Balance After</p>
                  <p className="text-xl font-semibold">
                    ₦{formatAmount(transaction.balanceAfter)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product/Details Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transaction.productCode && (
              <div>
                <Label className="text-muted-foreground text-xs">Product</Label>
                <p className="font-semibold">{transaction.productCode}</p>
              </div>
            )}
            {transaction.denomAmount && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Denomination
                </Label>
                <p className="font-medium">₦{transaction.denomAmount}</p>
              </div>
            )}
            {transaction.cashbackUsed &&
              parseFloat(transaction.cashbackUsed) > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Cashback Used
                  </Label>
                  <p className="font-medium text-green-600">
                    ₦{transaction.cashbackUsed}
                  </p>
                </div>
              )}
            {transaction.note && (
              <div>
                <Label className="text-muted-foreground text-xs">Note</Label>
                <p className="text-sm">{transaction.note}</p>
              </div>
            )}
            {transaction.reference && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Reference
                </Label>
                <p className="font-mono text-xs break-all">
                  {transaction.reference}
                </p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground text-xs">
                Transaction ID
              </Label>
              <p className="font-mono text-xs break-all">{transaction.id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Date</Label>
              <p className="font-medium">
                {format(new Date(transaction.createdAt), "PPpp")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transaction.user ? (
              <>
                <div>
                  <Label className="text-muted-foreground text-xs">Name</Label>
                  <Link
                    href={`/admin/dashboard/users/${transaction.userId}`}
                    className="text-primary block font-semibold hover:underline"
                  >
                    {transaction.user.fullName || "View User"}
                  </Link>
                </div>
                {transaction.user.email && (
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Email
                    </Label>
                    <p className="text-sm">{transaction.user.email}</p>
                  </div>
                )}
                {transaction.user.phoneNumber && (
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Phone
                    </Label>
                    <p className="text-sm">{transaction.user.phoneNumber}</p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <Label className="text-muted-foreground text-xs">User ID</Label>
                <Link
                  href={`/admin/dashboard/users/${transaction.userId}`}
                  className="text-primary block font-mono text-sm hover:underline"
                >
                  {transaction.userId}
                </Link>
              </div>
            )}
            {transaction.walletId && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Wallet ID
                </Label>
                <p className="font-mono text-xs break-all">
                  {transaction.walletId}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Related Info (if topup) */}
      {transaction.related && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Related Topup Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                <Badge
                  variant={
                    transaction.related.status === "completed"
                      ? "default"
                      : transaction.related.status === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                  className="mt-1 capitalize"
                >
                  {transaction.related.status}
                </Badge>
              </div>
              {transaction.related.operatorCode && (
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Operator
                  </Label>
                  <p className="font-semibold">
                    {transaction.related.operatorCode}
                  </p>
                </div>
              )}
              {transaction.related.recipient_phone && (
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Recipient
                  </Label>
                  <p className="font-medium">
                    {transaction.related.recipient_phone}
                  </p>
                </div>
              )}
              {transaction.related.amount && (
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Amount
                  </Label>
                  <p className="font-medium">₦{transaction.related.amount}</p>
                </div>
              )}
              {transaction.related.cost && (
                <div>
                  <Label className="text-muted-foreground text-xs">Cost</Label>
                  <p className="font-medium">₦{transaction.related.cost}</p>
                </div>
              )}
              {transaction.relatedType === "topup_request" && (
                <div>
                  <Label className="text-muted-foreground text-xs">Type</Label>
                  <p className="font-medium capitalize">
                    {getProductTypeLabel(transaction)}
                  </p>
                </div>
              )}
              {transaction.related.external_id && (
                <div className="sm:col-span-2">
                  <Label className="text-muted-foreground text-xs">
                    External ID
                  </Label>
                  <p className="font-mono text-xs break-all">
                    {transaction.related.external_id}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
