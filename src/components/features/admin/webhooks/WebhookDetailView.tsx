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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useMatchWebhook,
  useReviewWebhook,
  useWebhook,
} from "@/hooks/admin/useAdminWebhooks";
import { WebhookStatus } from "@/types/admin/webhook.types";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCopy,
  Eye,
  Flag,
  Link2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface WebhookDetailViewProps {
  webhookId: string;
}

const statusColors: Record<WebhookStatus, string> = {
  MATCHED: "bg-green-100 text-green-800",
  UNMATCHED: "bg-orange-100 text-orange-800",
  PENDING: "bg-blue-100 text-blue-800",
  REVIEWED: "bg-purple-100 text-purple-800",
  FAILED: "bg-red-100 text-red-800",
};

export function WebhookDetailView({ webhookId }: WebhookDetailViewProps) {
  const { data, isLoading, isError, refetch } = useWebhook(webhookId);
  const matchMutation = useMatchWebhook();
  const reviewMutation = useReviewWebhook();

  const [isMatchOpen, setIsMatchOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [topupRequestId, setTopupRequestId] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const webhook = data?.data;

  const handleMatch = () => {
    if (!topupRequestId) {
      toast.error("Please enter a Topup Request ID");
      return;
    }

    matchMutation.mutate(
      {
        id: webhookId,
        data: { topupRequestId },
      },
      {
        onSuccess: () => {
          setIsMatchOpen(false);
          setTopupRequestId("");
          refetch();
        },
      }
    );
  };

  const handleReview = (action: "approve" | "reject" | "flag") => {
    reviewMutation.mutate(
      {
        id: webhookId,
        data: { notes: reviewNotes || undefined, action },
      },
      {
        onSuccess: () => {
          setIsReviewOpen(false);
          setReviewNotes("");
          refetch();
        },
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !webhook) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Failed to load webhook details
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard/webhooks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Webhooks
            </Link>
          </Button>
          <Badge className={statusColors[webhook.status]}>
            {webhook.status}
          </Badge>
        </div>

        <div className="flex gap-2">
          {/* Match Dialog */}
          <Dialog open={isMatchOpen} onOpenChange={setIsMatchOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={webhook.status === "MATCHED"}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Match to Topup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Match to Topup Request</DialogTitle>
                <DialogDescription>
                  Enter the Topup Request ID to link this webhook.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Topup Request ID</Label>
                  <Input
                    value={topupRequestId}
                    onChange={(e) => setTopupRequestId(e.target.value)}
                    placeholder="e.g., tr_abc123..."
                    className="font-mono"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsMatchOpen(false)}
                  disabled={matchMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMatch}
                  disabled={matchMutation.isPending || !topupRequestId}
                >
                  {matchMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Match Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Review Dialog */}
          <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Flag className="mr-2 h-4 w-4" />
                Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review Webhook</DialogTitle>
                <DialogDescription>
                  Mark this webhook for review with optional notes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add any notes about this webhook..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleReview("flag")}
                  disabled={reviewMutation.isPending}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Flag for Later
                </Button>
                <Button
                  onClick={() => handleReview("approve")}
                  disabled={reviewMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {reviewMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Webhook Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Webhook Details
            </CardTitle>
            <CardDescription>Reconciliation record information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="ID" value={webhook.id} mono copyable />
            <InfoRow
              label="External Reference"
              value={webhook.externalReference}
              mono
              copyable
            />
            {webhook.internalReference && (
              <InfoRow
                label="Internal Reference"
                value={webhook.internalReference}
                mono
                copyable
              />
            )}
            <InfoRow label="Provider" value={webhook.provider} />
            <InfoRow label="Supplier" value={webhook.supplierName} />
            <InfoRow
              label="Amount"
              value={`₦${webhook.amount?.toLocaleString()}`}
            />
            {webhook.phoneNumber && (
              <InfoRow label="Phone Number" value={webhook.phoneNumber} />
            )}
            {webhook.productCode && (
              <InfoRow label="Product Code" value={webhook.productCode} mono />
            )}
            {webhook.matchedTopupId && (
              <InfoRow
                label="Matched Topup"
                value={webhook.matchedTopupId}
                mono
                copyable
              />
            )}
            <InfoRow
              label="Created"
              value={format(new Date(webhook.createdAt), "PPpp")}
            />
            {webhook.reviewedAt && (
              <>
                <InfoRow
                  label="Reviewed At"
                  value={format(new Date(webhook.reviewedAt), "PPpp")}
                />
                {webhook.reviewedBy && (
                  <InfoRow label="Reviewed By" value={webhook.reviewedBy} />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Payload */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Raw Payload</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(JSON.stringify(webhook.payload, null, 2))
                }
              >
                <ClipboardCopy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted max-h-96 overflow-auto rounded-md p-4 text-xs">
              {JSON.stringify(webhook.payload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Review Notes */}
      {webhook.reviewNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Review Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{webhook.reviewNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
  copyable = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-medium ${mono ? "font-mono" : ""} max-w-[250px] truncate`}
        >
          {value}
        </span>
        {copyable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
          >
            <ClipboardCopy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
