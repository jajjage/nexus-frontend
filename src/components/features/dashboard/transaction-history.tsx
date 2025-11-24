"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TransactionItem } from "./transaction-item";
import Link from "next/link";
import { useRecentTransactions } from "@/hooks/useWallet";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

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
    <div className="-mt-12 w-full">
      {" "}
      {/* Increased negative margin for parent-child effect */}
      {/* Moved header outside the card */}
      <div className="mb-2 flex items-center justify-between px-2 pt-12">
        {" "}
        {/* Adjusted padding and spacing */}
        <h2 className="text-foreground font-normal">
          Recent Transactions
        </h2>{" "}
        {/* Lighter font */}
        <Link
          href="/dashboard/transactions"
          className="text-primary text-sm font-medium hover:underline"
        >
          See More
        </Link>
      </div>
      <Card className="w-full rounded-none rounded-b-2xl border-t-0 shadow-sm">
        {" "}
        {/* Remove top radius, adjust padding */}
        <CardContent className="p-2">{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
