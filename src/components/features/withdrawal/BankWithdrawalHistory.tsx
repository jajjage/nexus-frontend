import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBankWithdrawals } from "@/hooks/useWithdrawal";
import { BankWithdrawalRequestObject } from "@/types/withdrawal.types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";

interface BankWithdrawalHistoryProps {
  statusFilter?: string;
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "pending":
      return "outline";
    case "processing":
      return "secondary";
    case "success":
      return "default";
    case "failed":
      return "destructive";
    default:
      return "default";
  }
};

const maskAccountNumber = (accountNumber: string) => {
  if (!accountNumber || accountNumber.length < 4) return accountNumber;
  return "XXXX" + accountNumber.slice(-4);
};

export const BankWithdrawalHistory: React.FC<BankWithdrawalHistoryProps> = ({
  statusFilter,
}) => {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useBankWithdrawals(page, limit, statusFilter);
  const requests = data?.requests || [];
  const pagination = data?.pagination;
  const hasMore = pagination ? page < pagination.totalPages : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!requests.length) {
    return (
      <div className="py-8 text-center text-gray-500">
        No withdrawal requests found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request: BankWithdrawalRequestObject) => (
              <TableRow key={request.id}>
                <TableCell>
                  {new Date(request.requestedAt).toLocaleDateString("en-NG")}
                </TableCell>
                <TableCell>
                  ₦
                  {request.amount.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>{request.bankName}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{request.accountName}</div>
                    <div className="text-gray-500">
                      {maskAccountNumber(request.accountNumber)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(request.status)}>
                    {request.status.charAt(0).toUpperCase() +
                      request.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm">
                  {request.adminNotes || (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {pagination?.page || 1} of {pagination?.totalPages || 1} •{" "}
          {pagination?.total || 0} total requests
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
