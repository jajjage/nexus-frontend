"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useRecentTransactions } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TransactionItem } from "./transaction-item";

interface TransactionHistoryProps {
  isVisible: boolean;
}

export function TransactionHistory({ isVisible }: TransactionHistoryProps) {
  const { data: transactions, isLoading, isError } = useRecentTransactions();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-24 items-center justify-center">
          <Spinner />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-destructive flex h-24 items-center justify-center">
          <p>Could not load transactions.</p>
        </div>
      );
    }

    const recentTransactions = transactions?.slice(0, 2) || [];

    if (recentTransactions.length === 0) {
      return (
        <div className="flex h-24 items-center justify-center">
          <p className="text-muted-foreground">No transactions yet.</p>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "space-y-2 transition-all duration-300",
          !isVisible && "pointer-events-none blur-md"
        )}
      >
        {recentTransactions.map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full rounded-2xl shadow-sm">
      {/* Header at the top of the card */}
      <div className="flex items-center justify-between px-6 pt-4 pb-3">
        <h2 className="text-foreground text-base font-medium">
          Recent Transactions
        </h2>
        <Link
          href="/dashboard/transactions"
          className="text-primary text-sm font-medium hover:underline"
        >
          See More
        </Link>
      </div>
      <CardContent className="px-6 pt-0 pb-6">{renderContent()}</CardContent>
    </Card>
  );
}
