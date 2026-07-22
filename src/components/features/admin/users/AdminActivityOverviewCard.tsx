"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminActivityOverview } from "@/hooks/admin/useAdminUserActivity";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CreditCard,
  DollarSign,
  Wallet,
} from "lucide-react";

interface AdminActivityOverviewCardProps {
  userId: string;
}

export function AdminActivityOverviewCard({
  userId,
}: AdminActivityOverviewCardProps) {
  const { data, isLoading, isError } = useAdminActivityOverview(userId);

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data?.data) {
    return (
      <Card className="border-destructive/50 mb-6">
        <CardContent className="text-destructive py-4 text-center text-sm">
          Failed to load activity overview
        </CardContent>
      </Card>
    );
  }

  const overview = data.data;
  const {
    currentWalletBalance,
    todaySnapshot,
    sevenDayTotals,
    lifetimeTotals,
    latestTopups,
    latestPaymentEvents,
  } = overview;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="text-primary h-5 w-5" />
          Admin Activity Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Wallet Balance */}
          <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                Wallet Balance
              </span>
              <Wallet className="text-muted-foreground h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-bold">
              ₦{Number(currentWalletBalance || 0).toLocaleString()}
            </div>
          </div>

          {/* Today Snapshot */}
          <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                Today&apos;s Activity
              </span>
              <Calendar className="text-muted-foreground h-4 w-4" />
            </div>
            <div className="mt-2 text-lg font-bold">
              ₦
              {Number(
                todaySnapshot?.successfulTopupsAmount || 0
              ).toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {todaySnapshot?.successfulTopupsCount || 0} top-ups •{" "}
              {todaySnapshot?.paymentEventsCount || 0} payments
            </p>
          </div>

          {/* 7-Day Totals */}
          <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                7-Day Totals
              </span>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <div className="mt-2 text-lg font-bold">
              ₦{Number(sevenDayTotals?.topupsAmount || 0).toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {sevenDayTotals?.topupsCount || 0} top-ups • ₦
              {Number(
                sevenDayTotals?.paymentEventsAmount || 0
              ).toLocaleString()}{" "}
              payments
            </p>
          </div>

          {/* Lifetime Totals */}
          <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                Lifetime Volume
              </span>
              <DollarSign className="text-primary h-4 w-4" />
            </div>
            <div className="mt-2 text-lg font-bold">
              ₦{Number(lifetimeTotals?.topupsAmount || 0).toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {lifetimeTotals?.topupsCount || 0} top-ups •{" "}
              {lifetimeTotals?.paymentEventsCount || 0} payment events
            </p>
          </div>
        </div>

        {/* Latest Activity Preview */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Latest Top-ups */}
          <div className="rounded-lg border p-4">
            <h4 className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="text-primary h-4 w-4" />
              Latest Top-ups
            </h4>
            {latestTopups && latestTopups.length > 0 ? (
              <div className="space-y-2">
                {latestTopups.map((topup: any) => (
                  <div
                    key={topup.id}
                    className="flex items-center justify-between border-b py-1 text-xs last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {topup.network || topup.product_code || "Top-up"}
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(topup.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ₦
                        {Number(
                          topup.total_amount || topup.amount || 0
                        ).toLocaleString()}
                      </p>
                      <Badge
                        variant={
                          topup.status === "successful" ||
                          topup.status === "success"
                            ? "default"
                            : topup.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {topup.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-2 text-xs">
                No recent top-ups
              </p>
            )}
          </div>

          {/* Latest Payment Events */}
          <div className="rounded-lg border p-4">
            <h4 className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
              Latest Payment Events
            </h4>
            {latestPaymentEvents && latestPaymentEvents.length > 0 ? (
              <div className="space-y-2">
                {latestPaymentEvents.map((evt: any) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between border-b py-1 text-xs last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {evt.providerReference || "Payment Event"}
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(evt.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ₦{Number(evt.amount || 0).toLocaleString()}
                      </p>
                      <Badge
                        variant={
                          evt.matchState === "matched"
                            ? "default"
                            : evt.matchState === "mismatched"
                              ? "destructive"
                              : evt.matchState === "resolved"
                                ? "outline"
                                : "secondary"
                        }
                        className="text-[10px] capitalize"
                      >
                        {evt.matchState}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-2 text-xs">
                No recent payment events
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
