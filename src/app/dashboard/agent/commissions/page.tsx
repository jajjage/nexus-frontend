"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAgentAccount, useAgentCommissions } from "@/hooks/useAgent";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AgentCommissionsPage() {
  const [page, setPage] = useState(1);
  const {
    data: account,
    error: accountError,
    isLoading: accountLoading,
  } = useAgentAccount();
  const {
    data,
    error: commissionsError,
    isLoading: commissionsLoading,
  } = useAgentCommissions(page, 20, Boolean(account));

  if (accountLoading || (Boolean(account) && commissionsLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (accountError || commissionsError) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>We couldn&apos;t load your commissions</CardTitle>
              <CardDescription>Please refresh and try again.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/agent">
                <Button>Back to Agent Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="bg-muted/40 min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Agent mode is not active yet</CardTitle>
              <CardDescription>
                Activate Agent Mode from your dashboard to start sharing a code
                and tracking commissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/agent">
                <Button>Go to Agent Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const commissions = data?.data ?? [];
  const pagination = data?.pagination;

  const totalEarned = commissions.reduce(
    (sum, c) => sum + c.calculatedCommission,
    0
  );

  return (
    <div className="bg-muted/40 min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/dashboard/agent">
            <Button variant="outline" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Commissions</CardTitle>
            <CardDescription>
              Commissions earned from your referred customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">No commissions yet</p>
                <p className="mt-2 text-sm text-gray-400">
                  Your customers need to make purchases for you to earn
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-gray-600">
                    Total on this page: ₦{totalEarned.toLocaleString()}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Commission Type</TableHead>
                        <TableHead>Earned</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>
                            {new Date(
                              commission.transactionDate
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {commission.productName}
                          </TableCell>
                          <TableCell>
                            ₦{commission.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {commission.commissionType === "percentage"
                              ? `${commission.commissionValue}%`
                              : `₦${commission.commissionValue}`}
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            ₦{commission.calculatedCommission.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                commission.status === "withdrawn"
                                  ? "bg-green-100 text-green-800"
                                  : commission.status === "claimed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {commission.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t pt-6">
                    <div className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setPage(page + 1)}
                        disabled={!pagination.hasMore}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
