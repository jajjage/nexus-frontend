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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminOffers,
  useCreateOffer,
  useDeleteOffer,
} from "@/hooks/admin/useAdminOffers";
import {
  DiscountType,
  EligibilityLogic,
  Offer,
  OfferApplyTo,
  OfferStatus,
} from "@/types/admin/offer.types";
import { format, isValid } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Loader2,
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

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OfferStatus>("draft");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("");
  const [totalUsageLimit, setTotalUsageLimit] = useState("");
  const [applyTo, setApplyTo] = useState<OfferApplyTo>("all");
  const [allowAll, setAllowAll] = useState(true);
  const [eligibilityLogic, setEligibilityLogic] =
    useState<EligibilityLogic>("all");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const limit = 15;

  const { data, isLoading, isError, refetch } = useAdminOffers({
    page,
    limit,
    status: statusFilter !== "all" ? (statusFilter as OfferStatus) : undefined,
  });

  const createMutation = useCreateOffer();
  const deleteMutation = useDeleteOffer();

  const offers = data?.data?.offers || [];
  const pagination = data?.data?.pagination;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCode("");
    setStatus("draft");
    setDiscountType("percentage");
    setDiscountValue("");
    setPerUserLimit("");
    setTotalUsageLimit("");
    setApplyTo("all");
    setAllowAll(true);
    setEligibilityLogic("all");
    setStartsAt("");
    setEndsAt("");
  };

  const handleCreate = () => {
    createMutation.mutate(
      {
        title,
        description: description || undefined,
        code: code || undefined,
        status,
        discountType,
        discountValue: discountValue ? parseFloat(discountValue) : 0,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : undefined,
        totalUsageLimit: totalUsageLimit
          ? parseInt(totalUsageLimit)
          : undefined,
        applyTo,
        allowAll,
        eligibilityLogic,
        startsAt: startsAt
          ? new Date(startsAt).toISOString()
          : new Date().toISOString(),
        endsAt: endsAt
          ? new Date(endsAt).toISOString()
          : new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          resetForm();
        },
      }
    );
  };

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
                <Button size="sm" onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Offer</DialogTitle>
                  <DialogDescription>
                    Create a new promotional offer.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Offer title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={status}
                        onValueChange={(v) => setStatus(v as OfferStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="code">Code</Label>
                      <Input
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="PROMO123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Apply To</Label>
                      <Select
                        value={applyTo}
                        onValueChange={(v) => setApplyTo(v as OfferApplyTo)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="operator_product">
                            Operator
                          </SelectItem>
                          <SelectItem value="supplier_product">
                            Supplier
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description"
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Discount Type</Label>
                      <Select
                        value={discountType}
                        onValueChange={(v) =>
                          setDiscountType(v as DiscountType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed_amount">
                            Fixed Amount
                          </SelectItem>
                          <SelectItem value="fixed_price">
                            Fixed Price
                          </SelectItem>
                          <SelectItem value="buy_x_get_y">
                            Buy X Get Y
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">Discount Value</Label>
                      <Input
                        id="discountValue"
                        type="number"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder="Value"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Eligibility Logic</Label>
                      <Select
                        value={eligibilityLogic}
                        onValueChange={(v) =>
                          setEligibilityLogic(v as EligibilityLogic)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            Match All Criteria
                          </SelectItem>
                          <SelectItem value="any">
                            Match Any Criteria
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Allow All Users?</Label>
                      <Select
                        value={allowAll ? "yes" : "no"}
                        onValueChange={(v) => setAllowAll(v === "yes")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No (Targeted)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="perUserLimit">Per User Limit</Label>
                      <Input
                        id="perUserLimit"
                        type="number"
                        min="0"
                        value={perUserLimit}
                        onChange={(e) => setPerUserLimit(e.target.value)}
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalUsageLimit">Total Usage Limit</Label>
                      <Input
                        id="totalUsageLimit"
                        type="number"
                        min="0"
                        value={totalUsageLimit}
                        onChange={(e) => setTotalUsageLimit(e.target.value)}
                        placeholder="e.g. 1000"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startsAt">Valid From</Label>
                      <Input
                        id="startsAt"
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endsAt">Valid To</Label>
                      <Input
                        id="endsAt"
                        type="datetime-local"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={
                      createMutation.isPending || !title || !discountValue
                    }
                  >
                    {createMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
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
