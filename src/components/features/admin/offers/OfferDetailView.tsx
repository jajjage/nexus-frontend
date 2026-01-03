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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminOffer,
  useComputeSegment,
  useCreateRedemptions,
  useEligibleUsers,
  usePreviewEligibility,
  useUpdateOffer,
} from "@/hooks/admin/useAdminOffers";
import { OfferEligibleUser, OfferStatus } from "@/types/admin/offer.types";
import { format, isValid } from "date-fns";
import {
  ArrowLeft,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gift,
  Loader2,
  Play,
  RefreshCw,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface OfferDetailViewProps {
  offerId: string;
}

const statusColors: Record<
  OfferStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  active: "default",
  scheduled: "secondary",
  paused: "secondary",
  expired: "destructive",
  cancelled: "destructive",
};

export function OfferDetailView({ offerId }: OfferDetailViewProps) {
  const [eligiblePage, setEligiblePage] = useState(1);
  const [isRedemptionOpen, setIsRedemptionOpen] = useState(false);
  const [redemptionDiscount, setRedemptionDiscount] = useState("");

  // Force refetch on mount and when id changes
  const { data, isLoading, isError, refetch } = useAdminOffer(offerId);
  const {
    data: eligibleData,
    isLoading: eligibleLoading,
    refetch: refetchEligible,
  } = useEligibleUsers(offerId, { page: eligiblePage, limit: 10 });

  const computeSegmentMutation = useComputeSegment();
  const updateMutation = useUpdateOffer();
  const redemptionMutation = useCreateRedemptions();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { data: previewData, isLoading: isPreviewLoading } =
    usePreviewEligibility(offerId, 10, isPreviewOpen);
  const previewUsers = previewData?.data?.preview || [];

  const offer = data?.data;
  const eligibleUsers = eligibleData?.data?.members || [];
  const eligibleTotal = eligibleData?.data?.total || 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";

    // Handle common date formats that might cause issues
    let date: Date;
    try {
      date = new Date(dateString);

      // Check if the date is valid
      if (!isValid(date) || isNaN(date.getTime())) {
        console.warn(`Invalid date received: ${dateString}`);
        return "Invalid Date";
      }

      // Format the valid date
      return format(date, "MMM d, yyyy h:mm a");
    } catch (error) {
      console.warn(`Error parsing date: ${dateString}`, error);
      return "Invalid Date";
    }
  };

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

  if (isError || !offer) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load offer details</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/admin/dashboard/offers">Back to Offers</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleStatusChange = (newStatus: OfferStatus) => {
    updateMutation.mutate({
      offerId,
      data: { status: newStatus },
    });
  };

  const handleComputeSegment = () => {
    computeSegmentMutation.mutate(offerId);
  };

  const handleCreateRedemptions = () => {
    redemptionMutation.mutate(
      {
        offerId,
        data: {
          fromSegment: true,
          discount: redemptionDiscount
            ? parseFloat(redemptionDiscount)
            : undefined,
        },
      },
      {
        onSuccess: () => {
          setIsRedemptionOpen(false);
          setRedemptionDiscount("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/dashboard/offers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-full p-2">
            <Gift className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{offer.title}</h1>
            <p className="text-muted-foreground text-sm">
              {offer.description || offer.id}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant={statusColors[offer.status] || "secondary"}
            className="text-sm capitalize"
          >
            {offer.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {offer.status === "draft" && (
            <Button size="sm" onClick={() => handleStatusChange("active")}>
              <Play className="mr-2 h-4 w-4" />
              Activate
            </Button>
          )}
          {offer.status === "active" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange("paused")}
            >
              Pause
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Offer Details Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Offer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {offer.code && (
              <div>
                <Label className="text-muted-foreground text-xs">Code</Label>
                <div className="mt-1">
                  <Badge variant="outline" className="font-mono text-base">
                    {offer.code}
                  </Badge>
                </div>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground text-xs">Discount</Label>
              <p className="text-2xl font-bold">
                {offer.discountType === "percentage"
                  ? `${offer.discountValue}%`
                  : `₦${offer.discountValue}`}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">
                Eligibility Logic
              </Label>
              <p className="font-medium capitalize">
                {offer.allowAll ? "All Users" : offer.eligibilityLogic}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Validity Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Validity Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground text-xs">Starts At</Label>
              <p className="font-medium">{formatDate(offer.startsAt)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Ends At</Label>
              <p className="font-medium">{formatDate(offer.endsAt)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Created</Label>
              <p className="font-medium">{formatDate(offer.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Usage Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">{offer.usageCount}</p>
              <p className="text-muted-foreground text-xs">Total Uses</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground text-xs">
                  Total Limit
                </Label>
                <p className="font-medium">
                  {offer.totalUsageLimit ?? "Unlimited"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  Per User Limit
                </Label>
                <p className="font-medium">
                  {offer.perUserLimit ?? "Unlimited"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Criteria (Only show if there's custom logic) */}
      {!offer.allowAll && offer.targetCriteria && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Target Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* ... criteria display logic if needed ... */}
            <p className="text-muted-foreground">Custom criteria applied</p>
          </CardContent>
        </Card>
      )}

      {/* Eligible Users Section (Only relevant if not allowAll, or just to show who used it?)
          Actually ADMIN_GUIDE says `eligible-users` endpoint exists.
          If allowAll is true, maybe everyone is eligible, but the endpoint might return paginated users?
          Let's keep it but handle empty states.
      */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Eligible Users ({eligibleTotal})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview Criteria
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleComputeSegment}
              disabled={computeSegmentMutation.isPending}
            >
              {computeSegmentMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="mr-2 h-4 w-4" />
              )}
              {offer.allowAll ? "Recompute All" : "Compute Segment"}
            </Button>
            <Button
              size="sm"
              onClick={() => setIsRedemptionOpen(true)}
              disabled={eligibleTotal === 0}
            >
              Create Redemptions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {eligibleLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : eligibleUsers.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No eligible users found. Click "Compute Segment" to calculate.
            </p>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>User ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleUsers.map((eu: OfferEligibleUser) => (
                      <TableRow key={eu.id}>
                        <TableCell className="font-medium">
                          {eu.fullName || "Unknown"}
                        </TableCell>
                        <TableCell>{eu.email || "—"}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {eu.id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Showing {eligibleUsers.length} of {eligibleTotal} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEligiblePage((p) => Math.max(1, p - 1))}
                    disabled={eligiblePage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEligiblePage((p) => p + 1)}
                    disabled={eligibleUsers.length < 10}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Redemptions Dialog */}
      <Dialog open={isRedemptionOpen} onOpenChange={setIsRedemptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Bulk Redemptions</DialogTitle>
            <DialogDescription>
              Create redemptions for all {eligibleTotal} eligible users?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount Override (optional)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                value={redemptionDiscount}
                onChange={(e) => setRedemptionDiscount(e.target.value)}
                placeholder="Leave empty to use offer discount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRedemptionOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRedemptions}
              disabled={redemptionMutation.isPending}
            >
              {redemptionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Redemptions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Eligibility Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Eligibility</DialogTitle>
            <DialogDescription>
              Preview of users currently matching the criteria (First 10).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isPreviewLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : previewUsers.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">
                No users match the criteria.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>User ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewUsers.map((u: OfferEligibleUser) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.fullName || "Unknown"}
                        </TableCell>
                        <TableCell>{u.email || "—"}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {u.id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
