"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  useAdminSuppliers,
  useUpdateSupplier,
} from "@/hooks/admin/useAdminSuppliers";
import { Supplier } from "@/types/admin/supplier.types";
import { Eye, Plus, RefreshCw, Server } from "lucide-react";
import Link from "next/link";

export function SupplierListTable() {
  const { data, isLoading, isError, refetch } = useAdminSuppliers();
  const updateMutation = useUpdateSupplier();

  const suppliers = data?.data?.suppliers || [];

  const handleToggleActive = (supplier: Supplier) => {
    updateMutation.mutate({
      supplierId: supplier.id,
      data: { isActive: !supplier.isActive },
    });
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
          <p className="text-muted-foreground">Failed to load suppliers</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          All Suppliers
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/dashboard/suppliers/new">
              <Plus className="mr-2 h-4 w-4" />
              New Supplier
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>API Base</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    No suppliers found
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier: Supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      {supplier.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {supplier.slug}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate font-mono text-sm">
                      {supplier.apiBase}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          supplier.priorityInt <= 1 ? "default" : "secondary"
                        }
                      >
                        {supplier.priorityInt}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={supplier.isActive}
                        onCheckedChange={() => handleToggleActive(supplier)}
                        disabled={updateMutation.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link
                          href={`/admin/dashboard/suppliers/${supplier.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {suppliers.length > 0 && (
          <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
            <span>
              {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}{" "}
              total
            </span>
            <span>{suppliers.filter((s) => s.isActive).length} active</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
