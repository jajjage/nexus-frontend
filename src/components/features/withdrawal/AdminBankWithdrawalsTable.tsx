import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminBankWithdrawals,
  useProcessWithdrawal,
} from "@/hooks/useWithdrawal";
import { BankWithdrawalRequestObject } from "@/types/withdrawal.types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface AdminBankWithdrawalsTableProps {
  statusFilter?: string;
  agentUserId?: string;
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "pending":
      return "outline";
    case "processing":
      return "secondary";
    case "success":
      return "success";
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

export const AdminBankWithdrawalsTable: React.FC<
  AdminBankWithdrawalsTableProps
> = ({ statusFilter, agentUserId }) => {
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] =
    useState<BankWithdrawalRequestObject | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [processingStatus, setProcessingStatus] = useState<
    "processing" | "success" | "failed" | null
  >(null);

  const limit = 20;
  const { data, isLoading } = useAdminBankWithdrawals(
    page,
    limit,
    statusFilter,
    agentUserId
  );
  const { mutate: processWithdrawal, isPending } = useProcessWithdrawal();

  const requests = data?.requests || [];
  const pagination = data?.pagination;
  const hasMore = pagination ? page < pagination.totalPages : false;

  const handleProcessClick = (
    request: BankWithdrawalRequestObject,
    status: "processing" | "success" | "failed"
  ) => {
    setSelectedRequest(request);
    setProcessingStatus(status);
    setAdminNotes("");
    setFailureReason("");
  };

  const handleSubmit = () => {
    if (!selectedRequest || !processingStatus) return;

    if (processingStatus === "failed" && !failureReason.trim()) {
      toast.error("Failure reason is required");
      return;
    }

    const payload = {
      status: processingStatus,
      adminNotes: adminNotes || undefined,
      failureReason: failureReason || undefined,
    };

    processWithdrawal(
      {
        withdrawalRequestId: selectedRequest.id,
        payload,
      },
      {
        onSuccess: () => {
          toast.success("Withdrawal request updated successfully");
          setSelectedRequest(null);
          setProcessingStatus(null);
          setAdminNotes("");
          setFailureReason("");
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message || "Failed to process withdrawal";
          toast.error(message);
        },
      }
    );
  };

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
    <>
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Agent ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request: BankWithdrawalRequestObject) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {new Date(request.requestedAt).toLocaleDateString("en-NG")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {request.agentUserId.substring(0, 8)}...
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
                  <TableCell>
                    <div className="flex gap-1">
                      {request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleProcessClick(request, "processing")
                            }
                          >
                            Mark Processing
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleProcessClick(request, "failed")
                            }
                          >
                            Mark Failed
                          </Button>
                        </>
                      )}
                      {request.status === "processing" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              handleProcessClick(request, "success")
                            }
                          >
                            Mark Success
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleProcessClick(request, "failed")
                            }
                          >
                            Mark Failed
                          </Button>
                        </>
                      )}
                    </div>
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

      {/* Processing Dialog */}
      <Dialog
        open={!!selectedRequest && !!processingStatus}
        onOpenChange={() => {
          setSelectedRequest(null);
          setProcessingStatus(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Process Withdrawal Request</DialogTitle>
            <DialogDescription>
              Update the status and add notes for this withdrawal request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Amount</Label>
              <div className="text-lg font-bold">
                ₦
                {selectedRequest?.amount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Status Change</Label>
              <div className="text-sm">
                {selectedRequest?.status} →{" "}
                <Badge variant={statusBadgeVariant(processingStatus || "")}>
                  {processingStatus}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Input
                id="adminNotes"
                type="text"
                placeholder="Optional notes for agent"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                disabled={isPending}
              />
            </div>

            {processingStatus === "failed" && (
              <div className="space-y-2">
                <Label htmlFor="failureReason">Failure Reason *</Label>
                <Input
                  id="failureReason"
                  type="text"
                  placeholder="Why this withdrawal failed"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  disabled={isPending}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRequest(null);
                  setProcessingStatus(null);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
