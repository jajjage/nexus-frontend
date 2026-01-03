"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useActivateSupplierMarkup,
  useAdminSupplierMarkups,
  useDeactivateSupplierMarkup,
  useDeleteSupplierMarkup,
} from "@/hooks/admin/useAdminSupplierMarkups";
import { useAdminSuppliers } from "@/hooks/admin/useAdminSuppliers";
import { SupplierMarkup } from "@/types/admin/supplier-markup.types";
import { format } from "date-fns";
import { Eye, Percent, Plus, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function SupplierMarkupListTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supplierId = searchParams.get("supplierId") || undefined;
  const page = Number(searchParams.get("page")) || 1;

  const { data, isLoading, isError, refetch } = useAdminSupplierMarkups({
    supplierId,
    page,
    limit: 20,
  });
  const { data: suppliersData } = useAdminSuppliers();
  const activateMutation = useActivateSupplierMarkup();
  const deactivateMutation = useDeactivateSupplierMarkup();
  const deleteMutation = useDeleteSupplierMarkup();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const markups = data?.data?.markups || [];
  const suppliers = suppliersData?.data?.suppliers || [];

  const handleSupplierFilter = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("supplierId");
      } else {
        params.set("supplierId", value);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleToggleActive = (markup: SupplierMarkup) => {
    if (markup.isActive) {
      deactivateMutation.mutate(markup.id);
    } else {
      activateMutation.mutate(markup.id);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
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
          <p className="text-muted-foreground">
            Failed to load supplier markups
          </p>
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
            <Percent className="h-5 w-5" />
            Supplier Markups
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/dashboard/supplier-markups/new">
                <Plus className="mr-2 h-4 w-4" />
                New Markup
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select
              value={supplierId || "all"}
              onValueChange={handleSupplierFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Markup %</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center">
                      No markups found
                    </TableCell>
                  </TableRow>
                ) : (
                  markups.map((markup: SupplierMarkup) => (
                    <TableRow key={markup.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {markup.supplierName || markup.supplierId}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {markup.operatorProductName || markup.operatorProductId}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            markup.markupPercent > 0 ? "default" : "secondary"
                          }
                        >
                          {markup.markupPercent}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(markup.validFrom), "PP")} –{" "}
                        {format(new Date(markup.validUntil), "PP")}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={markup.isActive}
                          onCheckedChange={() => handleToggleActive(markup)}
                          disabled={
                            activateMutation.isPending ||
                            deactivateMutation.isPending
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link
                              href={`/admin/dashboard/supplier-markups/${markup.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteId(markup.id)}
                          >
                            <Trash2 className="text-destructive h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {markups.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {markups.length} markup{markups.length !== 1 ? "s" : ""} found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Markup?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The markup will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
