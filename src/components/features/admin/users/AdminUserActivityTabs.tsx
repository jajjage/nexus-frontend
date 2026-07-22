"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminUserPaymentEvents,
  useAdminUserSnapshots,
  useAdminUserTopups,
  useAdminUserWalletLedger,
} from "@/hooks/admin/useAdminUserActivity";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  History,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useState } from "react";

interface AdminUserActivityTabsProps {
  userId: string;
}

export function AdminUserActivityTabs({ userId }: AdminUserActivityTabsProps) {
  const [topupPage, setTopupPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [snapshotPage, setSnapshotPage] = useState(1);

  const topupsQuery = useAdminUserTopups(userId, {
    page: topupPage,
    perPage: 10,
  });
  const paymentsQuery = useAdminUserPaymentEvents(userId, {
    page: paymentPage,
    perPage: 10,
  });
  const ledgerQuery = useAdminUserWalletLedger(userId, {
    page: ledgerPage,
    perPage: 10,
  });
  const snapshotsQuery = useAdminUserSnapshots(userId, {
    page: snapshotPage,
    perPage: 10,
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Detailed Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="topups" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="topups" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Top-ups
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4" />
              Payments/Webhooks
            </TabsTrigger>
            <TabsTrigger value="ledger" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet Ledger
            </TabsTrigger>
            <TabsTrigger value="snapshots" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Daily Snapshots
            </TabsTrigger>
          </TabsList>

          {/* Top-ups Tab */}
          <TabsContent value="topups" className="pt-4">
            {topupsQuery.isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : topupsQuery.isError ? (
              <p className="text-destructive py-4 text-center text-sm">
                Failed to load top-ups
              </p>
            ) : !topupsQuery.data?.data?.topups?.length ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No top-up activity found
              </p>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference / Code</TableHead>
                      <TableHead>Network / Type</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topupsQuery.data.data.topups.map((topup: any) => (
                      <TableRow key={topup.id}>
                        <TableCell className="font-mono text-xs">
                          {topup.reference || topup.product_code || topup.id}
                        </TableCell>
                        <TableCell className="capitalize">
                          {topup.network || topup.product_type || "N/A"}
                        </TableCell>
                        <TableCell>{topup.phone_number || "N/A"}</TableCell>
                        <TableCell className="font-bold">
                          ₦
                          {Number(
                            topup.total_amount || topup.amount || 0
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              topup.status === "successful" ||
                              topup.status === "success"
                                ? "default"
                                : topup.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="capitalize"
                          >
                            {topup.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(topup.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="text-muted-foreground flex items-center justify-between pt-4 text-xs">
                  <span>
                    Page {topupsQuery.data.data.pagination.page} of{" "}
                    {topupsQuery.data.data.pagination.totalPages || 1}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={topupPage <= 1}
                      onClick={() => setTopupPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        topupPage >=
                        (topupsQuery.data.data.pagination.totalPages || 1)
                      }
                      onClick={() => setTopupPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Payments / Webhooks Tab */}
          <TabsContent value="payments" className="pt-4">
            {paymentsQuery.isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : paymentsQuery.isError ? (
              <p className="text-destructive py-4 text-center text-sm">
                Failed to load payment events
              </p>
            ) : !paymentsQuery.data?.data?.paymentEvents?.length ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No payment events found
              </p>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider Ref</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Match State</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Received Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsQuery.data.data.paymentEvents.map((evt: any) => (
                      <TableRow key={evt.id}>
                        <TableCell className="font-mono text-xs">
                          {evt.providerReference}
                        </TableCell>
                        <TableCell className="font-bold">
                          ₦{Number(evt.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
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
                            className="capitalize"
                          >
                            {evt.matchState}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {evt.status}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(evt.receivedAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="text-muted-foreground flex items-center justify-between pt-4 text-xs">
                  <span>
                    Page {paymentsQuery.data.data.pagination.page} of{" "}
                    {paymentsQuery.data.data.pagination.totalPages || 1}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paymentPage <= 1}
                      onClick={() => setPaymentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        paymentPage >=
                        (paymentsQuery.data.data.pagination.totalPages || 1)
                      }
                      onClick={() => setPaymentPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Wallet Ledger Tab */}
          <TabsContent value="ledger" className="pt-4">
            {ledgerQuery.isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : ledgerQuery.isError ? (
              <p className="text-destructive py-4 text-center text-sm">
                Failed to load wallet ledger
              </p>
            ) : !ledgerQuery.data?.data?.transactions?.length ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No wallet transactions found
              </p>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance After</TableHead>
                      <TableHead>Note / Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerQuery.data.data.transactions.map((tx: any) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">
                          {tx.reference || tx.id}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.direction === "credit"
                                ? "default"
                                : "secondary"
                            }
                            className="flex w-fit items-center gap-1 capitalize"
                          >
                            {tx.direction === "credit" ? (
                              <ArrowDownLeft className="h-3 w-3 text-green-400" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3 text-red-400" />
                            )}
                            {tx.direction}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          ₦{Number(tx.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          ₦
                          {Number(
                            tx.balance_after || tx.balanceAfter || 0
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {tx.note || tx.method || "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(
                            tx.created_at || tx.createdAt
                          ).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="text-muted-foreground flex items-center justify-between pt-4 text-xs">
                  <span>
                    Page {ledgerQuery.data.data.pagination.page} of{" "}
                    {ledgerQuery.data.data.pagination.totalPages || 1}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ledgerPage <= 1}
                      onClick={() => setLedgerPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        ledgerPage >=
                        (ledgerQuery.data.data.pagination.totalPages || 1)
                      }
                      onClick={() => setLedgerPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Daily Snapshots Tab */}
          <TabsContent value="snapshots" className="pt-4">
            {snapshotsQuery.isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : snapshotsQuery.isError ? (
              <p className="text-destructive py-4 text-center text-sm">
                Failed to load daily snapshots
              </p>
            ) : !snapshotsQuery.data?.data?.snapshots?.length ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No daily snapshots recorded yet
              </p>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Date</TableHead>
                      <TableHead>Top-ups (Count / Amount)</TableHead>
                      <TableHead>Payment Events</TableHead>
                      <TableHead>Wallet Credits / Debits</TableHead>
                      <TableHead>Closing Balance</TableHead>
                      <TableHead>Last Reconciled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshotsQuery.data.data.snapshots.map((snap: any) => (
                      <TableRow key={snap.id}>
                        <TableCell className="font-semibold">
                          {snap.businessDate}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {snap.successfulTopupsCount} succ (₦
                            {Number(
                              snap.successfulTopupsAmount
                            ).toLocaleString()}
                            )
                          </span>
                          {snap.failedTopupsCount > 0 && (
                            <span className="block text-xs text-red-500">
                              {snap.failedTopupsCount} failed
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {snap.paymentEventsCount} events (₦
                          {Number(snap.paymentEventsAmount).toLocaleString()})
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-green-600">
                            +₦{Number(snap.walletCreditTotal).toLocaleString()}
                          </span>{" "}
                          /{" "}
                          <span className="text-xs text-red-600">
                            -₦{Number(snap.walletDebitTotal).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold">
                          ₦{Number(snap.closingBalance).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {snap.lastReconciledAt
                            ? new Date(snap.lastReconciledAt).toLocaleString()
                            : "Not reconciled"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="text-muted-foreground flex items-center justify-between pt-4 text-xs">
                  <span>
                    Page {snapshotsQuery.data.data.pagination.page} of{" "}
                    {snapshotsQuery.data.data.pagination.totalPages || 1}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={snapshotPage <= 1}
                      onClick={() => setSnapshotPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        snapshotPage >=
                        (snapshotsQuery.data.data.pagination.totalPages || 1)
                      }
                      onClick={() => setSnapshotPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
