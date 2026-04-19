import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useBankWithdrawals } from "@/hooks/useWithdrawal";
import { AlertCircle, CheckCircle, Clock, Loader } from "lucide-react";
import React, { useMemo } from "react";

export const WithdrawalStatusTracker: React.FC = () => {
  const { data, isLoading } = useBankWithdrawals(1, 100);
  const requests = data?.requests || [];

  // Get the most recent pending or processing request
  const activeRequest = useMemo(() => {
    return requests.find(
      (req) => req.status === "pending" || req.status === "processing"
    );
  }, [requests]);

  // Get the most recent request overall (for completed ones)
  const latestRequest = requests[0];

  const displayRequest = activeRequest || latestRequest;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (!displayRequest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Status</CardTitle>
          <CardDescription>No withdrawal requests yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Once you submit a withdrawal request, you can track its progress
            here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-6 w-6 text-amber-500" />;
      case "processing":
        return <Loader className="h-6 w-6 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Waiting for admin review";
      case "processing":
        return "Admin is processing your request";
      case "success":
        return "Withdrawal completed successfully";
      case "failed":
        return "Withdrawal could not be processed";
      default:
        return "";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Status Tracker</CardTitle>
        <CardDescription>
          Monitor your latest withdrawal request progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Timeline */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`rounded-full p-2 ${displayRequest.status === "pending" || displayRequest.status === "processing" ? "bg-amber-100" : "bg-gray-100"}`}
              >
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="h-8 w-0.5 bg-gray-300" />
            </div>
            <div className="flex-1 pt-1">
              <h4 className="text-sm font-semibold">Pending Review</h4>
              <p className="text-xs text-gray-600">
                Admin will review your request
              </p>
            </div>
            {(displayRequest.status === "pending" ||
              displayRequest.status === "processing" ||
              displayRequest.status === "success" ||
              displayRequest.status === "failed") && (
              <Badge variant="outline" className="text-xs">
                {displayRequest.status === "pending" ? "Now" : "Done"}
              </Badge>
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`rounded-full p-2 ${displayRequest.status === "processing" || displayRequest.status === "success" || displayRequest.status === "failed" ? "bg-blue-100" : "bg-gray-100"}`}
              >
                <Loader
                  className={`h-5 w-5 ${displayRequest.status === "processing" ? "animate-spin text-blue-600" : "text-gray-400"}`}
                />
              </div>
              <div className="h-8 w-0.5 bg-gray-300" />
            </div>
            <div className="flex-1 pt-1">
              <h4 className="text-sm font-semibold">Processing Transfer</h4>
              <p className="text-xs text-gray-600">
                Fund transfer in progress or queued
              </p>
            </div>
            {(displayRequest.status === "processing" ||
              displayRequest.status === "success" ||
              displayRequest.status === "failed") && (
              <Badge variant="outline" className="text-xs">
                {displayRequest.status === "processing" ? "Now" : "Done"}
              </Badge>
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`rounded-full p-2 ${displayRequest.status === "success" ? "bg-green-100" : displayRequest.status === "failed" ? "bg-red-100" : "bg-gray-100"}`}
              >
                {displayRequest.status === "success" && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {displayRequest.status === "failed" && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {displayRequest.status !== "success" &&
                  displayRequest.status !== "failed" && (
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                  )}
              </div>
            </div>
            <div className="flex-1 pt-1">
              <h4 className="text-sm font-semibold">Completed</h4>
              <p className="text-xs text-gray-600">
                {displayRequest.status === "success" &&
                  "Money sent to your account"}
                {displayRequest.status === "failed" && "Withdrawal failed"}
                {displayRequest.status !== "success" &&
                  displayRequest.status !== "failed" &&
                  "Awaiting completion"}
              </p>
            </div>
            {(displayRequest.status === "success" ||
              displayRequest.status === "failed") && (
              <Badge
                variant={
                  displayRequest.status === "success"
                    ? "default"
                    : "destructive"
                }
                className="text-xs"
              >
                {displayRequest.status === "success" ? "Success" : "Failed"}
              </Badge>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="border-t pt-6">
          <h4 className="mb-4 text-sm font-semibold">Request Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600">Amount</p>
              <p className="font-bold">
                ₦
                {displayRequest.amount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Bank</p>
              <p className="text-sm font-semibold">{displayRequest.bankName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Account Name</p>
              <p className="text-sm font-semibold">
                {displayRequest.accountName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Account Number</p>
              <p className="font-mono text-sm">
                {"XXXX" + displayRequest.accountNumber.slice(-4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Requested Date</p>
              <p className="text-sm">
                {new Date(displayRequest.requestedAt).toLocaleDateString(
                  "en-NG"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Current Status</p>
              <Badge variant={getStatusBadgeVariant(displayRequest.status)}>
                {displayRequest.status.charAt(0).toUpperCase() +
                  displayRequest.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        {(displayRequest.adminNotes || displayRequest.failureReason) && (
          <div className="border-t pt-6">
            <h4 className="mb-4 text-sm font-semibold">Admin Update</h4>
            {displayRequest.adminNotes && (
              <div className="mb-3">
                <p className="mb-1 text-xs text-gray-600">Notes</p>
                <p className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-gray-800">
                  {displayRequest.adminNotes}
                </p>
              </div>
            )}
            {displayRequest.failureReason && (
              <div>
                <p className="mb-1 text-xs text-gray-600">Failure Reason</p>
                <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {displayRequest.failureReason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="rounded border border-t border-amber-200 bg-amber-50 p-4 pt-6">
          <div className="flex gap-2">
            <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">
                Processing Timeline
              </p>
              <p className="mt-1 text-xs text-amber-800">
                Most withdrawal requests are processed within{" "}
                <strong>24 hours</strong>. Your balance is deducted only after
                the withdrawal is marked as successful.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
