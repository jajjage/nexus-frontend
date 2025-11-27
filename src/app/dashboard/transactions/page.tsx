"use client";

import { TransactionList } from "@/components/features/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TransactionsPage() {
  return (
    <div className="bg-muted/40 flex w-full flex-col gap-4 p-4">
      {/* Page Header */}
      <header className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap sm:grow-0">
          All Transactions
        </h1>
      </header>

      {/* Main Content */}
      <main>
        <TransactionList />
      </main>
    </div>
  );
}
