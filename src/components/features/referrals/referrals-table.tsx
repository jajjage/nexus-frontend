"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useClaimReferralBonus, useReferralsList } from "@/hooks/useReferrals";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function ReferralsTable() {
  const [page, setPage] = useState(1);
  const {
    data: response,
    isLoading,
    refetch,
  } = useReferralsList({ page, limit: 10 });
  const { mutate: claimBonus, isPending: isClaiming } = useClaimReferralBonus();
  const { user } = useAuth();

  const referrals = response?.data?.referrals || [];
  const pagination = response?.data?.pagination;

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (pagination?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return "bg-green-500 hover:bg-green-600";
      case "pending":
        return "bg-amber-500 hover:bg-amber-600";
      case "cancelled":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  const isReferredUser = (referral: any) =>
    referral.referredUserId === user?.userId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral History</CardTitle>
        <CardDescription>Users who signed up with your link.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No referrals yet. Share your link to get started!
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <div className="font-medium">
                        {referral.referredUserData?.fullName || "Unknown User"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {referral.referredUserData?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>₦{referral.rewardAmount}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(referral.status)}>
                        {referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Check if current user is the referred user and status is pending to show Claim button */}
                      {/* Note: Logic depends on backend. Usually referrer gets auto-rewarded or claims from dashboard.
                          The guide says: "Can only be called if the user has a pending referral status where they are the referredUserId"
                          This suggests this table view might be mixed or this button appears differently.
                          Assuming this table shows People I Referred.
                          If I am the referrer, I usually don't "claim" individual rows, but maybe bulk claim or withdrawal.
                          The 'Claim Bonus' endpoint is for the NEW USER. 
                          So this table typically won't have actions for the referrer unless 'Force Complete' is admin.
                      */}
                      {isReferredUser(referral) &&
                        referral.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              claimBonus(undefined, {
                                onSuccess: () => refetch(),
                              })
                            }
                            disabled={isClaiming}
                          >
                            {isClaiming ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              "Claim Bonus"
                            )}
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(page - 1)}
                      // disabled={page <= 1} // Shadcn pagination might not have disabled prop on link, need to handle click
                      className={
                        page <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-4 text-sm">
                      Page {page} of {pagination.totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(page + 1)}
                      className={
                        page >= pagination.totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
