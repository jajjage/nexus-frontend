"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useAdminOperators } from "@/hooks/admin/useAdminOperators";
import { useAdminProducts } from "@/hooks/admin/useAdminProducts";
import { Product } from "@/types/admin/product.types";
import { Eye, Package, Plus, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function ProductListTable() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const operatorId = searchParams.get("operatorId") || undefined;
  const productType = searchParams.get("productType") || undefined;
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useAdminProducts({
    operatorId,
    productType,
  });
  const { data: operatorsData } = useAdminOperators();

  const products = data?.data?.products || [];
  const operators = operatorsData?.data?.operators || [];

  // Filter by search locally
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.productCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleOperatorFilter = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("operatorId");
      } else {
        params.set("operatorId", value);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleTypeFilter = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("productType");
      } else {
        params.set("productType", value);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Get unique product types
  const productTypes = [...new Set(products.map((p) => p.productType))].filter(
    Boolean
  );

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
          <p className="text-muted-foreground">Failed to load products</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Products
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/dashboard/products/new">
              <Plus className="mr-2 h-4 w-4" />
              New Product
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={operatorId || "all"}
            onValueChange={handleOperatorFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operators</SelectItem>
              {operators.map((op) => (
                <SelectItem key={op.id} value={op.id}>
                  {op.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={productType || "all"} onValueChange={handleTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Product Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {productTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="max-w-[120px]">
                      <code className="bg-muted block truncate rounded px-1.5 py-0.5 text-xs">
                        {product.productCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.operatorName || product.operatorId}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.productType}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₦{product.denomAmount?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.dataMb ? `${product.dataMb} MB` : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.validityDays
                        ? `${product.validityDays} days`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch checked={product.isActive} disabled />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/admin/dashboard/products/${product.id}`}>
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

        {/* Summary */}
        {filteredProducts.length > 0 && (
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""}
              {search && ` matching "${search}"`}
            </span>
            <span>
              {filteredProducts.filter((p) => p.isActive).length} active
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
