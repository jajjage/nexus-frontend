"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminTopup, useRetryTopup } from "@/hooks/admin/useAdminTopups";
import { format } from "date-fns";
import {
  ArrowLeft,
  Hash,
  Loader2,
  Phone,
  Radio,
  RefreshCw,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";

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

  const request = data?.data;

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
