"use client";

import { BottomNav } from "@/components/features/dashboard/bottom-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowDownLeft,
  Copy,
  CreditCard,
  History,
  Plus,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function WalletPage() {
  const { user, isLoading } = useAuth();

  const copyAccountNumber = () => {
    // Placeholder - will be populated with actual virtual account
    navigator.clipboard.writeText("0123456789");
    toast.success("Account number copied!");
  };

  if (isLoading || !user) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <header className="flex items-center gap-4">
          <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
            Wallet
          </h1>
        </header>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-10">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="mt-4 h-6 w-48" />
              <Skeleton className="mt-2 h-8 w-32" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  const balance = parseFloat(user.balance || "0");

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6">
      {/* Page Header */}
      <header className="flex items-center gap-4">
        <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
          Wallet
        </h1>
      </header>

      {/* Balance Card */}
      <Card className="from-primary to-primary/80 text-primary-foreground bg-gradient-to-r">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="mb-4 rounded-full bg-white/20 p-4">
              <Wallet className="size-10" />
            </div>
            <h2 className="text-lg font-semibold">Available Balance</h2>
            <p className="mt-2 text-3xl font-bold">
              ₦
              {balance.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex flex-col items-center justify-center p-4 text-center">
            <div className="mb-2 rounded-full bg-green-100 p-3 dark:bg-green-900/20">
              <Plus className="size-5 text-green-600" />
            </div>
            <p className="text-sm font-medium">Add Money</p>
          </CardContent>
        </Card>
      </div>

      {/* Virtual Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Fund via Bank Transfer
          </CardTitle>
          <CardDescription>
            Transfer to this account to fund your wallet instantly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground text-sm">Bank Name</p>
            <p className="font-medium">Wema Bank (Coming Soon)</p>
          </div>
          <div className="bg-muted flex items-center justify-between rounded-lg p-4">
            <div>
              <p className="text-muted-foreground text-sm">Account Number</p>
              <p className="font-medium">••••••••••</p>
            </div>
            <Button variant="ghost" size="icon" onClick={copyAccountNumber}>
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground text-sm">Account Name</p>
            <p className="font-medium">{user.fullName}</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5" />
              Recent Activity
            </CardTitle>
          </div>
          <Link
            href="/dashboard/transactions"
            className="text-primary text-sm font-medium hover:underline"
          >
            See All
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
            <ArrowDownLeft className="mb-2 size-8 opacity-50" />
            <p className="text-sm">No recent transactions</p>
            <p className="text-xs">Your transaction history will appear here</p>
          </div>
        </CardContent>
      </Card>

      <BottomNav />
    </div>
  );
}
