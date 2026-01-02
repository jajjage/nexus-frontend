"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminTopup, useRetryTopup } from "@/hooks/admin/useAdminTopups";
import { ArrowLeft, CreditCard, Loader2, RefreshCw, User } from "lucide-react";
import Link from "next/link";

interface TopupDetailViewProps {
  requestId: string;
}

const statusColors = {
  pending: "secondary",
  completed: "default",
  failed: "destructive",
  cancelled: "outline",
} as const;

export function TopupDetailView({ requestId }: TopupDetailViewProps) {
  const { data, isLoading, isError } = useAdminTopup(requestId);
  const retryMutation = useRetryTopup();

  const request = data?.data?.request;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/dashboard/topups">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Topup Request</h1>
          <p className="text-muted-foreground">
            {request.requestId || request.id}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={statusColors[request.status]} className="text-sm">
            {request.status}
          </Badge>
          {canRetry && (
            <Button
              variant="outline"
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Request Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Request Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm">Amount</p>
              <p className="text-3xl font-bold">₦{request.amount}</p>
            </div>

            <div className="grid gap-3">
              <div className="flex justify-between">
                <Label className="text-muted-foreground">Status</Label>
                <Badge variant={statusColors[request.status]}>
                  {request.status}
                </Badge>
              </div>
              {request.provider && (
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Provider</Label>
                  <p className="font-medium">{request.provider}</p>
                </div>
              )}
              {request.paymentMethod && (
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">
                    Payment Method
                  </Label>
                  <p className="font-medium">{request.paymentMethod}</p>
                </div>
              )}
              {request.providerReference && (
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">
                    Provider Reference
                  </Label>
                  <p className="font-mono text-sm">
                    {request.providerReference}
                  </p>
                </div>
              )}
              <div className="flex justify-between">
                <Label className="text-muted-foreground">Created</Label>
                <p className="font-medium">
                  {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
              {request.completedAt && (
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Completed</Label>
                  <p className="font-medium">
                    {new Date(request.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between">
                <Label className="text-muted-foreground">User</Label>
                <Link
                  href={`/admin/dashboard/users/${request.userId}`}
                  className="text-primary font-medium hover:underline"
                >
                  {request.userName || "View User"}
                </Link>
              </div>
              {request.userEmail && (
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{request.userEmail}</p>
                </div>
              )}
              <div className="flex justify-between">
                <Label className="text-muted-foreground">User ID</Label>
                <p className="font-mono text-sm">{request.userId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
