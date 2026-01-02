"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminTransaction } from "@/hooks/admin/useAdminTransactions";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

interface TransactionDetailViewProps {
  transactionId: string;
}

export function TransactionDetailView({
  transactionId,
}: TransactionDetailViewProps) {
  const { data, isLoading, isError } = useAdminTransaction(transactionId);

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
            <ArrowDownRight className="h-6 w-6 text-green-500" />
          ) : (
            <ArrowUpRight className="h-6 w-6 text-red-500" />
          )}
          <div>
            <h1 className="text-2xl font-bold capitalize">
              {transaction.type}
            </h1>
            <p className="text-muted-foreground">
              {transaction.reference || transaction.transactionId}
            </p>
          </div>
        </div>
        <div className="ml-auto">
          <Badge
            variant={
              transaction.status === "completed"
                ? "default"
                : transaction.status === "pending"
                  ? "secondary"
                  : "destructive"
            }
            className="text-sm"
          >
            {transaction.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm">Amount</p>
              <p
                className={`text-3xl font-bold ${
                  transaction.direction === "credit"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {transaction.direction === "credit" ? "+" : "-"}₦
                {transaction.amount}
              </p>
            </div>

            <div className="grid gap-3">
              <div className="flex justify-between">
                <Label className="text-muted-foreground">Direction</Label>
                <p className="font-medium capitalize">
                  {transaction.direction}
                </p>
              </div>
              <div className="flex justify-between">
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-medium capitalize">{transaction.type}</p>
              </div>
              {transaction.balanceBefore && (
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">
                    Balance Before
                  </Label>
                  <p className="font-medium">₦{transaction.balanceBefore}</p>
                </div>
              )}
              {transaction.balanceAfter && (
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Balance After</Label>
                  <p className="font-medium">₦{transaction.balanceAfter}</p>
                </div>
              )}
              <div className="flex justify-between">
                <Label className="text-muted-foreground">Date</Label>
                <p className="font-medium">
                  {new Date(transaction.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User & Reference Info */}
        <Card>
          <CardHeader>
            <CardTitle>User & Reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between">
                <Label className="text-muted-foreground">User</Label>
                <Link
                  href={`/admin/dashboard/users/${transaction.userId}`}
                  className="text-primary font-medium hover:underline"
                >
                  {transaction.userName || transaction.userEmail || "View User"}
                </Link>
              </div>
              {transaction.userEmail && (
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{transaction.userEmail}</p>
                </div>
              )}
              <div className="flex justify-between">
                <Label className="text-muted-foreground">Transaction ID</Label>
                <p className="font-mono text-sm">{transaction.transactionId}</p>
              </div>
              {transaction.reference && (
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Reference</Label>
                  <p className="font-mono text-sm">{transaction.reference}</p>
                </div>
              )}
              {transaction.description && (
                <div className="pt-2">
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1 text-sm">{transaction.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
