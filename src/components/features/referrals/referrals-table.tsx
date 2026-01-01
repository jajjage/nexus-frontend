"use client";

import { Badge } from "@/components/ui/badge";
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
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useReferralsList } from "@/hooks/useReferrals";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function ReferralsTable() {
  const [page, setPage] = useState(1);
  const { data: response, isLoading } = useReferralsList({ page, limit: 10 });

  const referrals = response?.referrals || [];
  const pagination = response?.pagination;

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (pagination?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "claimed":
        return "bg-green-500 hover:bg-green-600";
      case "pending":
        return "bg-amber-500 hover:bg-amber-600";
      case "cancelled":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invited Friends</CardTitle>
        <CardDescription>
          Track status of people you've invited.
        </CardDescription>
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
                  <TableHead>Friend</TableHead>
                  <TableHead>Date Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral, index) => {
                  const userData = referral.referredUser;
                  const referralId = referral.referralId || index;

                  return (
                    <TableRow key={referralId}>
                      <TableCell>
                        <div className="font-medium">
                          {userData?.fullName ||
                            userData?.email ||
                            "User Joined"}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {userData?.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(referral.status)}>
                          {referral.status === "claimed"
                            ? "Success"
                            : referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₦{referral.rewardAmount}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(page - 1)}
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
