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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminOperators } from "@/hooks/admin/useAdminOperators";
import { useAdminProducts } from "@/hooks/admin/useAdminProducts";
import { Product } from "@/types/admin/product.types";
import { Eye, Package, Plus, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function ProductListTable() {
  // Filter state - now using local state instead of URL for faster client-side filtering
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("all");
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Fetch ALL products once (no server-side filtering since list is small)
  const { data, isLoading, isError, refetch } = useAdminProducts();
  const { data: operatorsData } = useAdminOperators();

  const allProducts = data?.data?.products || [];
  const operators = operatorsData?.data?.operators || [];

  // Client-side filtering for search, operator, and type
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      // Search filter
      const matchesSearch =
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.productCode.toLowerCase().includes(search.toLowerCase());

      // Operator filter
      const matchesOperator =
        selectedOperatorId === "all" || p.operatorId === selectedOperatorId;

      // Product type filter
      const matchesType =
        selectedProductType === "all" ||
        p.productType?.toLowerCase() === selectedProductType.toLowerCase();

      return matchesSearch && matchesOperator && matchesType;
    });
  }, [allProducts, search, selectedOperatorId, selectedProductType]);

  const handleOperatorFilter = (value: string) => {
    setSelectedOperatorId(value);
  };

  const handleTypeFilter = (value: string) => {
    setSelectedProductType(value);
  };

  // Predefined product types - don't derive from filtered results
  const productTypes = ["airtime", "data"];

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

  const renderTable = (products: Product[]) => (
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
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-8 text-center">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            products.map((product: Product) => (
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
                  {product.validityDays ? `${product.validityDays} days` : "—"}
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
  );

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
        {/* Tabs and Filters */}
        <div className="space-y-4">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative max-w-sm min-w-[200px]">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 pl-9"
                  />
                </div>

                <Select
                  value={selectedOperatorId}
                  onValueChange={handleOperatorFilter}
                >
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="Operator" />
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

                <Select
                  value={selectedProductType}
                  onValueChange={handleTypeFilter}
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {productTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all" className="mt-4">
              {renderTable(filteredProducts)}
            </TabsContent>
            <TabsContent value="daily" className="mt-4">
              {renderTable(
                filteredProducts.filter(
                  (p) => p.validityDays && p.validityDays === 1
                )
              )}
            </TabsContent>
            <TabsContent value="weekly" className="mt-4">
              {/* Capture anything from 2 days up to 7 days */}
              {renderTable(
                filteredProducts.filter(
                  (p) =>
                    p.validityDays && p.validityDays > 1 && p.validityDays <= 7
                )
              )}
            </TabsContent>
            <TabsContent value="monthly" className="mt-4">
              {/* Capture anything from 8 days up to 40 days (approx month) */}
              {renderTable(
                filteredProducts.filter(
                  (p) =>
                    p.validityDays && p.validityDays > 7 && p.validityDays <= 45
                )
              )}
            </TabsContent>
            <TabsContent value="other" className="mt-4">
              {/* No validity or very long validity */}
              {renderTable(
                filteredProducts.filter(
                  (p) => !p.validityDays || p.validityDays > 45
                )
              )}
            </TabsContent>
          </Tabs>
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
