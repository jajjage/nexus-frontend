"use client";

import { CreateOfferWizard } from "@/components/features/admin/offers/CreateOfferWizard";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useAdminOffers,
  useDeleteOffer,
  useUpdateOffer,
} from "@/hooks/admin/useAdminOffers";
import { Offer, OfferStatus } from "@/types/admin/offer.types";
import { format, isValid } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

export function OfferListTable() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const limit = 15;

  const { data, isLoading, isError, refetch } = useAdminOffers({
    page,
    limit,
    status: statusFilter !== "all" ? (statusFilter as OfferStatus) : undefined,
  });

  const deleteMutation = useDeleteOffer();
  const updateMutation = useUpdateOffer();

  // Track which offer is being toggled (for loading state)
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const offers = data?.data?.offers || [];
  const pagination = data?.data?.pagination;

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

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
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.warn(`Error parsing date: ${dateString}`, error);
      return "Invalid Date";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load offers</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Offers
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Offer
                </Button>
              </DialogTrigger>
              <CreateOfferWizard
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => {
                  setIsCreateOpen(false);
                  refetch();
                }}
              />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      No offers found
                    </TableCell>
                  </TableRow>
                ) : (
                  offers.map((offer: Offer) => (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{offer.title}</p>
                          {offer.description && (
                            <p className="text-muted-foreground line-clamp-1 text-xs">
                              {offer.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {offer.code ? (
                          <Badge variant="outline" className="font-mono">
                            {offer.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusColors[offer.status] || "secondary"}
                          className="capitalize"
                        >
                          {offer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {offer.discountType === "percentage"
                            ? `${offer.discountValue}%`
                            : `₦${offer.discountValue}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="text-muted-foreground space-y-0.5">
                          <p>Start: {formatDate(offer.startsAt)}</p>
                          <p>End: {formatDate(offer.endsAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">
                            {offer.usageCount}
                          </span>
                          {offer.totalUsageLimit && (
                            <span className="text-muted-foreground">
                              {" "}
                              / {offer.totalUsageLimit}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Pause/Activate Toggle */}
                          {(offer.status === "active" ||
                            offer.status === "paused") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${
                                offer.status === "active"
                                  ? "text-amber-500 hover:text-amber-600"
                                  : "text-green-500 hover:text-green-600"
                              }`}
                              onClick={() => {
                                setTogglingId(offer.id);
                                updateMutation.mutate(
                                  {
                                    offerId: offer.id,
                                    data: {
                                      status:
                                        offer.status === "active"
                                          ? "paused"
                                          : "active",
                                    },
                                  },
                                  {
                                    onSettled: () => setTogglingId(null),
                                  }
                                );
                              }}
                              disabled={togglingId === offer.id}
                              title={
                                offer.status === "active"
                                  ? "Pause offer"
                                  : "Activate offer"
                              }
                            >
                              {togglingId === offer.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : offer.status === "active" ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {/* Activate Draft */}
                          {offer.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-500 hover:text-green-600"
                              onClick={() => {
                                setTogglingId(offer.id);
                                updateMutation.mutate(
                                  {
                                    offerId: offer.id,
                                    data: { status: "active" },
                                  },
                                  {
                                    onSettled: () => setTogglingId(null),
                                  }
                                );
                              }}
                              disabled={togglingId === offer.id}
                              title="Activate offer"
                            >
                              {togglingId === offer.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/dashboard/offers/${offer.id}`}>
                              View
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-8 w-8"
                            onClick={() => setDeleteId(offer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Page {pagination.page} of {pagination.totalPages} (
                {pagination.total} offers)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Offer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this offer? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
