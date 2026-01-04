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
  useAdminSupplierMarkup,
  useUpdateSupplierMarkup,
} from "@/hooks/admin/useAdminSupplierMarkups";
import { format } from "date-fns";
import { ArrowLeft, Edit, Loader2, Percent } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SupplierMarkupDetailViewProps {
  markupId: string;
}

export function SupplierMarkupDetailView({
  markupId,
}: SupplierMarkupDetailViewProps) {
  const { data, isLoading, isError, refetch } =
    useAdminSupplierMarkup(markupId);
  const updateMutation = useUpdateSupplierMarkup();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editMarkupPercent, setEditMarkupPercent] = useState(0);
  const [editValidFrom, setEditValidFrom] = useState("");
  const [editValidUntil, setEditValidUntil] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const markup = data?.data;

  const handleEdit = () => {
    if (markup) {
      setEditMarkupPercent(markup.markupPercent);
      // Safeguard against null/undefined date strings
      const fromDate = markup.validFrom ? markup.validFrom.split("T")[0] : "";
      const untilDate = markup.validUntil
        ? markup.validUntil.split("T")[0]
        : "";

      setEditValidFrom(fromDate);
      setEditValidUntil(untilDate);
      setEditDescription(markup.description || "");
      setIsEditOpen(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        markupId,
        data: {
          markupPercent: editMarkupPercent,
          validFrom: editValidFrom,
          validUntil: editValidUntil,
          description: editDescription || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (isError || !markup) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load markup details</p>
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
            <Link href="/admin/dashboard/supplier-markups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Markups
            </Link>
          </Button>
          <Badge variant={markup.isActive ? "default" : "secondary"}>
            {markup.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Markup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Markup</DialogTitle>
              <DialogDescription>Update markup configuration</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="markupPercent">Markup Percentage</Label>
                <Input
                  id="markupPercent"
                  type="number"
                  step="0.01"
                  value={editMarkupPercent}
                  onChange={(e) => setEditMarkupPercent(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={editValidFrom}
                    onChange={(e) => setEditValidFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={editValidUntil}
                    onChange={(e) => setEditValidUntil(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Optional description..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Markup Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Markup Details
          </CardTitle>
          <CardDescription>
            {markup.markupPercent}% markup configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Markup ID" value={markup.id} mono />
          <InfoRow
            label="Supplier"
            value={markup.supplierName || markup.supplierId}
          />
          <InfoRow
            label="Product"
            value={markup.operatorProductName || markup.operatorProductId}
            mono
          />
          <InfoRow label="Markup" value={`${markup.markupPercent}%`} />
          <InfoRow
            label="Valid From"
            value={
              markup.validFrom ? format(new Date(markup.validFrom), "PPP") : "—"
            }
          />
          <InfoRow
            label="Valid Until"
            value={
              markup.validUntil
                ? format(new Date(markup.validUntil), "PPP")
                : "—"
            }
          />
          {markup.description && (
            <InfoRow label="Description" value={markup.description} />
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Status</span>
            <Badge variant={markup.isActive ? "default" : "secondary"}>
              {markup.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {markup.createdAt && (
            <InfoRow
              label="Created"
              value={format(new Date(markup.createdAt), "PPpp")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span
        className={`text-sm font-medium ${mono ? "font-mono" : ""} max-w-[250px] truncate`}
      >
        {value}
      </span>
    </div>
  );
}
