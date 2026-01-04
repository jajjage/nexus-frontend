"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWalletOverview } from "@/hooks/admin/useAdminAnalytics";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

export function WalletOverviewCard() {
  const { data, isLoading, error } = useWalletOverview();

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive py-8 text-center">
          Failed to load wallet overview
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);

  const stats = [
    {
      label: "Total Balance",
      value: formatCurrency(data?.totalBalance || 0),
      icon: <Wallet className="text-primary h-5 w-5" />,
      bgColor: "bg-primary/10",
    },
    {
      label: "Total Deposits",
      value: formatCurrency(data?.totalDeposits || 0),
      icon: <ArrowDownLeft className="h-5 w-5 text-green-500" />,
      bgColor: "bg-green-500/10",
    },
    {
      label: "Total Withdrawals",
      value: formatCurrency(data?.totalWithdrawals || 0),
      icon: <ArrowUpRight className="h-5 w-5 text-red-500" />,
      bgColor: "bg-red-500/10",
    },
    {
      label: "Net Movement",
      value: formatCurrency(data?.netMovement || 0),
      icon: (
        <span
          className={`text-lg font-bold ${
            (data?.netMovement || 0) >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {(data?.netMovement || 0) >= 0 ? "+" : "-"}
        </span>
      ),
      bgColor:
        (data?.netMovement || 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Wallet Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-lg p-4 ${stat.bgColor} flex flex-col items-center text-center`}
            >
              {stat.icon}
              <p className="text-muted-foreground mt-2 text-xs">{stat.label}</p>
              <p className="mt-1 text-base font-bold md:text-lg">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Top Holders Table */}
        {data?.topHolders && data.topHolders.length > 0 && (
          <div>
            <h4 className="text-muted-foreground mb-3 text-sm font-semibold">
              Top Wallet Holders
            </h4>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topHolders.slice(0, 5).map((holder, index) => (
                    <TableRow key={holder.userId || index}>
                      <TableCell className="font-medium">
                        {holder.email}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(holder.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
