"use client";

import { TransactionItem } from "@/components/features/dashboard/transaction-item";
import { Spinner } from "@/components/ui/spinner";
import { useInfiniteTransactions } from "@/hooks/useWallet";
import { Transaction } from "@/types/wallet.types";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import {
  TransactionFilters,
  TransactionFiltersState,
} from "./transaction-filters";

export function TransactionList() {
  const [filters, setFilters] = useState<TransactionFiltersState>({
    query: "",
    direction: "all",
  });

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteTransactions({
    // We can pass server-side filters here if the API supports it,
    // but for now, we'll filter on the client.
    // direction: filters.direction === 'all' ? undefined : filters.direction,
  });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Flatten the pages array and apply client-side filtering
  const filteredTransactions = useMemo(() => {
    const allTransactions =
      data?.pages.flatMap((page) => page.data.transactions) || [];
    return allTransactions.filter((tx) => {
      const queryMatch =
        filters.query.length > 2
          ? JSON.stringify(tx)
              .toLowerCase()
              .includes(filters.query.toLowerCase())
          : true;
      const directionMatch =
        filters.direction === "all" || tx.direction === filters.direction;
      return queryMatch && directionMatch;
    });
  }, [data, filters]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        const date = format(new Date(tx.createdAt), "yyyy-MM-dd");
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(tx);
        return acc;
      },
      {} as Record<string, Transaction[]>
    );
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      <TransactionFilters filters={filters} setFilters={setFilters} />

      {status === "pending" ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : status === "error" ? (
        <div className="text-destructive text-center">
          Error: {error.message}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedTransactions).length > 0 ? (
            Object.entries(groupedTransactions).map(([date, transactions]) => (
              <div key={date} className="space-y-2">
                <h3 className="text-muted-foreground text-sm font-semibold">
                  {format(new Date(date), "MMMM dd, yyyy")}
                </h3>
                <div className="bg-card rounded-lg shadow-sm">
                  {transactions.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              No transactions found.
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          <div ref={ref} className="flex justify-center">
            {isFetchingNextPage && <Spinner />}
            {!hasNextPage && filteredTransactions.length > 0 && (
              <p className="text-muted-foreground text-sm">
                No more transactions
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
