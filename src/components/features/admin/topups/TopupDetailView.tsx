"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminTopup,
  useRetryTopup,
  useUpdateTopupStatus,
} from "@/hooks/admin/useAdminTopups";
import { TopupStatus } from "@/types/admin/topup.types";
import { format } from "date-fns";
import {
  ArrowLeft,
  Hash,
  Loader2,
  Pencil,
  Phone,
  Radio,
  RefreshCw,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface TopupDetailViewProps {
  requestId: string;
}

const statusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  success: "default",
  completed: "default",
  failed: "destructive",
  reversed: "outline",
  retry: "secondary",
  cancelled: "outline",
};

const operatorColors: Record<string, string> = {
  MTN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  AIRTEL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  GLO: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "9MOBILE":
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export function TopupDetailView({ requestId }: TopupDetailViewProps) {
  const { data, isLoading, isError, refetch } = useAdminTopup(requestId);
  const retryMutation = useRetryTopup();
  const updateStatusMutation = useUpdateTopupStatus();
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TopupStatus | "">("");
  const [statusReason, setStatusReason] = useState("");

  const request = data?.data;

  useEffect(() => {
    if (request?.status) {
      setSelectedStatus(request.status);
    }
  }, [request?.status]);

  const isValidUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !request) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Failed to load topup request details
          </p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/admin/dashboard/topups">Back to Topups</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const canRetry = request.status === "failed";

  const formatAmount = (amount: number | string | undefined) => {
    if (amount === undefined) return "N/A";
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    return isNaN(num) ? amount : num.toLocaleString();
  };

  const handleUpdateStatus = () => {
    if (!selectedStatus || selectedStatus === request.status) {
      return;
    }

    const trimmedReason = statusReason.trim();
    if (trimmedReason.length < 1 || trimmedReason.length > 500) {
      toast.error("Reason must be between 1 and 500 characters");
      return;
    }

    if (!isValidUuid(requestId)) {
      toast.error("Invalid topup request ID");
      return;
    }

    updateStatusMutation.mutate(
      {
        requestId,
        data: { status: selectedStatus, reason: trimmedReason },
      },
      {
        onSuccess: () => {
          setIsEditStatusOpen(false);
          setStatusReason("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/dashboard/topups">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-full p-2">
            <Phone className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Topup Request</h1>
            <p className="text-muted-foreground text-sm">
              {request.id || request.requestId}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Dialog
            open={isEditStatusOpen}
            onOpenChange={(open) => {
              setIsEditStatusOpen(open);
              if (open) {
                setSelectedStatus(request.status);
                setStatusReason("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Topup Status</DialogTitle>
                <DialogDescription>
                  Select a new status for this topup request.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <Badge
                    variant={statusColors[request.status] || "secondary"}
                    className="capitalize"
                  >
                    {request.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topupStatus">New Status</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) =>
                      setSelectedStatus(value as TopupStatus)
                    }
                  >
                    <SelectTrigger id="topupStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="reversed">Reversed</SelectItem>
                      <SelectItem value="retry">Retry</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topupStatusReason">Reason</Label>
                  <Textarea
                    id="topupStatusReason"
                    placeholder="Why are you manually updating this status?"
                    value={statusReason}
                    onChange={(event) => setStatusReason(event.target.value)}
                    maxLength={500}
                    rows={4}
                  />
                  <p className="text-muted-foreground text-xs">
                    {statusReason.trim().length}/500
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setIsEditStatusOpen(false)}
                  disabled={updateStatusMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={
                    updateStatusMutation.isPending ||
                    !selectedStatus ||
                    selectedStatus === request.status ||
                    statusReason.trim().length < 1 ||
                    statusReason.trim().length > 500
                  }
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Update Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Badge
            variant={statusColors[request.status] || "secondary"}
            className="text-sm capitalize"
          >
            {request.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canRetry && (
            <Button
              variant="default"
              size="sm"
              onClick={() => retryMutation.mutate(requestId)}
              disabled={retryMutation.isPending}
            >
              {retryMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Retry
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Amount & Cost Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" />
              Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold">
              ₦{formatAmount(request.amount)}
            </div>
            {request.cost && (
              <div className="flex items-center justify-between border-t pt-3">
                <Label className="text-muted-foreground">Cost</Label>
                <span className="font-semibold">
                  ₦{formatAmount(request.cost)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Type</Label>
              <Badge variant="outline" className="capitalize">
                {request.type || "airtime"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Status</Label>
              <Badge
                variant={statusColors[request.status] || "secondary"}
                className="capitalize"
              >
                {request.status}
              </Badge>
            </div>
            {request.attemptCount !== undefined && request.attemptCount > 0 && (
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground">Attempts</Label>
                <span className="font-medium">{request.attemptCount}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operator & Recipient Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="h-4 w-4" />
              Operator & Recipient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {request.operator && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Operator
                </Label>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      operatorColors[request.operator.code] ||
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {request.operator.code}
                  </Badge>
                  <span className="font-medium">{request.operator.name}</span>
                </div>
              </div>
            )}
            {request.recipientPhone && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Recipient Phone
                </Label>
                <div className="flex items-center gap-2">
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <span className="text-lg font-semibold">
                    {request.recipientPhone}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2 border-t pt-3">
              <Label className="text-muted-foreground text-xs">Created</Label>
              <p className="font-medium">
                {format(new Date(request.createdAt), "PPpp")}
              </p>
            </div>
            {request.updatedAt && request.updatedAt !== request.createdAt && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Updated</Label>
                <p className="font-medium">
                  {format(new Date(request.updatedAt), "PPpp")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {request.user ? (
              <>
                <div>
                  <Label className="text-muted-foreground text-xs">Name</Label>
                  <Link
                    href={`/admin/dashboard/users/${request.userId}`}
                    className="text-primary block font-semibold hover:underline"
                  >
                    {request.user.fullName || "View User"}
                  </Link>
                </div>
                {request.user.email && (
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Email
                    </Label>
                    <p className="text-sm">{request.user.email}</p>
                  </div>
                )}
                {request.user.phoneNumber && (
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Phone
                    </Label>
                    <p className="text-sm">{request.user.phoneNumber}</p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <Label className="text-muted-foreground text-xs">User ID</Label>
                <Link
                  href={`/admin/dashboard/users/${request.userId}`}
                  className="text-primary block font-mono text-sm hover:underline"
                >
                  {request.userId}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* IDs & References Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            IDs & References
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <Label className="text-muted-foreground text-xs">
                Request ID
              </Label>
              <p className="font-mono text-xs break-all">{request.id}</p>
            </div>
            {request.externalId && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  External ID
                </Label>
                <p className="font-mono text-xs break-all">
                  {request.externalId}
                </p>
              </div>
            )}
            {request.idempotencyKey && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Idempotency Key
                </Label>
                <p className="font-mono text-xs break-all">
                  {request.idempotencyKey}
                </p>
              </div>
            )}
            {request.operatorId && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Operator ID
                </Label>
                <p className="font-mono text-xs break-all">
                  {request.operatorId}
                </p>
              </div>
            )}
            {request.operatorProductId && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Product ID
                </Label>
                <p className="font-mono text-xs break-all">
                  {request.operatorProductId}
                </p>
              </div>
            )}
            {request.supplierId && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Supplier ID
                </Label>
                <p className="font-mono text-xs break-all">
                  {request.supplierId}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Responses (if any) */}
      {request.responses && request.responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Response History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {request.responses.map((response, index) => (
                <div
                  key={response.id || index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <Badge
                      variant={
                        response.status === "success" ? "default" : "secondary"
                      }
                      className="capitalize"
                    >
                      {response.status}
                    </Badge>
                    {response.message && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {response.message}
                      </p>
                    )}
                  </div>
                  {response.createdAt && (
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(response.createdAt), "PP p")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
