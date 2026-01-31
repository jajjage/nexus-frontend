/* eslint-disable @typescript-eslint/no-explicit-any */
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
  useAdminProduct,
  useMapProductToSupplier,
  useUpdateProduct,
} from "@/hooks/admin/useAdminProducts";
import { useAdminSuppliers } from "@/hooks/admin/useAdminSuppliers";
import { format } from "date-fns";
import {
  ArrowLeft,
  Database,
  Edit,
  Link as LinkIcon,
  Loader2,
  Package,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProductDetailViewProps {
  productId: string;
}

export function ProductDetailView({ productId }: ProductDetailViewProps) {
  const { data, isLoading, isError, refetch } = useAdminProduct(productId);
  const { data: suppliersData } = useAdminSuppliers();
  const updateMutation = useUpdateProduct();
  const mapMutation = useMapProductToSupplier();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editProductCode, setEditProductCode] = useState("");
  const [editProductType, setEditProductType] = useState("");
  const [editDenomAmount, setEditDenomAmount] = useState(0);
  const [editDataMb, setEditDataMb] = useState<number | undefined>();
  const [editValidityDays, setEditValidityDays] = useState<
    number | undefined
  >();
  const [editIsActive, setEditIsActive] = useState(true);
  const [editHasCashback, setEditHasCashback] = useState(false);
  const [editCashbackPercentage, setEditCashbackPercentage] = useState<
    number | undefined
  >();

  // Map to supplier form state
  const [mapSupplierId, setMapSupplierId] = useState("");
  const [mapSupplierProductCode, setMapSupplierProductCode] = useState("");
  const [mapSupplierPrice, setMapSupplierPrice] = useState(0);
  const [mapMinOrder, setMapMinOrder] = useState<number | undefined>();
  const [mapMaxOrder, setMapMaxOrder] = useState<number | undefined>();
  const [mapLeadTime, setMapLeadTime] = useState<number | undefined>();
  const [mapIsActive, setMapIsActive] = useState(true);

  const product = data?.data;
  const suppliers = suppliersData?.data?.suppliers || [];

  const handleEdit = () => {
    if (product) {
      setEditName(product.name);
      setEditProductCode(product.productCode);
      setEditProductType(product.productType);
      setEditDenomAmount(product.denomAmount);
      setEditDataMb(product.dataMb ?? undefined);
      setEditValidityDays(product.validityDays ?? undefined);
      setEditIsActive(product.isActive);
      setEditHasCashback(product.has_cashback ?? product.hasCashback ?? false);
      setEditCashbackPercentage(
        product.cashback_percentage ?? product.cashbackPercentage ?? undefined
      );
      setIsEditOpen(true);
    }
  };

  const handleSaveEdit = () => {
    const payload = {
      name: editName,
      productCode: editProductCode,
      productType: editProductType,
      denomAmount: editDenomAmount,
      dataMb: editDataMb,
      validityDays: editValidityDays,
      isActive: editIsActive,
      has_cashback: editHasCashback,
      cashback_percentage: editHasCashback ? editCashbackPercentage : undefined,
    };

    console.log("[ProductDetailView] Updating payload:", payload);

    updateMutation.mutate(
      {
        productId,
        data: payload,
      },
      {
        onSuccess: () => setIsEditOpen(false),
      }
    );
  };

  const handleMapToSupplier = () => {
    if (!mapSupplierId || !mapSupplierProductCode) return;

    mapMutation.mutate(
      {
        productId,
        data: {
          supplierId: mapSupplierId,
          supplierProductCode: mapSupplierProductCode,
          supplierPrice: mapSupplierPrice,
          minOrderAmount: mapMinOrder,
          maxOrderAmount: mapMaxOrder,
          leadTimeSeconds: mapLeadTime,
          isActive: mapIsActive,
        },
      },
      {
        onSuccess: () => {
          setIsMapOpen(false);
          // Reset form
          setMapSupplierId("");
          setMapSupplierProductCode("");
          setMapSupplierPrice(0);
          setMapMinOrder(undefined);
          setMapMaxOrder(undefined);
          setMapLeadTime(undefined);
          setMapIsActive(true);
        },
      }
    );
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

  if (isError || !product) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Failed to load product details
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
            <Link href="/admin/dashboard/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
          <Badge variant={product.isActive ? "default" : "secondary"}>
            {product.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex gap-2">
          {/* Map to Supplier Dialog */}
          <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <LinkIcon className="mr-2 h-4 w-4" />
                Map to Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Map Product to Supplier</DialogTitle>
                <DialogDescription>
                  Link this product to a supplier&apos;s catalog.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select
                    value={mapSupplierId}
                    onValueChange={setMapSupplierId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Supplier Product Code</Label>
                  <Input
                    value={mapSupplierProductCode}
                    onChange={(e) => setMapSupplierProductCode(e.target.value)}
                    placeholder="e.g., PROD_MTN_1GB"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supplier Price (₦)</Label>
                  <Input
                    type="number"
                    value={mapSupplierPrice}
                    onChange={(e) =>
                      setMapSupplierPrice(Number(e.target.value))
                    }
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Min Order Amount</Label>
                    <Input
                      type="number"
                      value={mapMinOrder || ""}
                      onChange={(e) =>
                        setMapMinOrder(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Order Amount</Label>
                    <Input
                      type="number"
                      value={mapMaxOrder || ""}
                      onChange={(e) =>
                        setMapMaxOrder(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lead Time (seconds)</Label>
                  <Input
                    type="number"
                    value={mapLeadTime || ""}
                    onChange={(e) =>
                      setMapLeadTime(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    placeholder="Optional"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Mapping Active</Label>
                  <Switch
                    checked={mapIsActive}
                    onCheckedChange={setMapIsActive}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsMapOpen(false)}
                  disabled={mapMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMapToSupplier}
                  disabled={
                    mapMutation.isPending ||
                    !mapSupplierId ||
                    !mapSupplierProductCode
                  }
                >
                  {mapMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Map to Supplier
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>Update product details.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Code</Label>
                  <Input
                    value={editProductCode}
                    onChange={(e) => setEditProductCode(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Type</Label>
                  <Input
                    value={editProductType}
                    onChange={(e) => setEditProductType(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₦)</Label>
                  <Input
                    type="number"
                    value={editDenomAmount}
                    onChange={(e) => setEditDenomAmount(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Data (MB)</Label>
                    <Input
                      type="number"
                      value={editDataMb || ""}
                      onChange={(e) =>
                        setEditDataMb(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Validity (days)</Label>
                    <Input
                      type="number"
                      value={editValidityDays || ""}
                      onChange={(e) =>
                        setEditValidityDays(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={editIsActive}
                    onCheckedChange={setEditIsActive}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable Cashback</Label>
                  <Switch
                    checked={editHasCashback}
                    onCheckedChange={setEditHasCashback}
                  />
                </div>
                {editHasCashback && (
                  <div className="space-y-2">
                    <Label>Cashback Percentage (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editCashbackPercentage || ""}
                      onChange={(e) =>
                        setEditCashbackPercentage(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      placeholder="e.g., 5"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Details
            </CardTitle>
            <CardDescription>{product.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Product ID" value={product.id} mono />
            <InfoRow label="Product Code" value={product.productCode} mono />
            <InfoRow label="Name" value={product.name} />
            <InfoRow
              label="Operator"
              value={product.operatorName || product.operatorId}
            />
            <InfoRow label="Type" value={product.productType} />
            <InfoRow
              label="Amount"
              value={`₦${product.denomAmount?.toLocaleString()}`}
            />
            {product.dataMb && (
              <InfoRow label="Data" value={`${product.dataMb} MB`} />
            )}
            {product.validityDays && (
              <InfoRow
                label="Validity"
                value={`${product.validityDays} days`}
              />
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Status</span>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {product.createdAt && (
              <InfoRow
                label="Created"
                value={format(new Date(product.createdAt), "PPpp")}
              />
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            {product.metadata && Object.keys(product.metadata).length > 0 ? (
              <pre className="bg-muted max-h-80 overflow-auto rounded-md p-4 text-xs">
                {JSON.stringify(product.metadata, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No metadata available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Supplier Mappings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Supplier Mappings
          </CardTitle>
          <CardDescription>
            Product-to-supplier mappings for fulfillment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {product.mappings && product.mappings.length > 0 ? (
            <div className="space-y-4">
              {product.mappings.map((mapping: any) => (
                <div
                  key={mapping.id}
                  className="bg-muted/50 flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {mapping.supplierName || "Unknown Supplier"}
                      </span>
                      <Badge
                        variant={mapping.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {mapping.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                      <span>
                        Code:{" "}
                        <code className="bg-muted rounded px-1">
                          {mapping.supplierProductCode}
                        </code>
                      </span>
                      <span>
                        Price: ₦
                        {parseFloat(
                          mapping.supplierPrice || 0
                        ).toLocaleString()}
                      </span>
                      <span>Lead Time: {mapping.leadTimeSeconds}s</span>
                      {mapping.minOrderAmount &&
                        parseFloat(mapping.minOrderAmount) > 0 && (
                          <span>
                            Min: ₦
                            {parseFloat(
                              mapping.minOrderAmount
                            ).toLocaleString()}
                          </span>
                        )}
                      {mapping.maxOrderAmount &&
                        parseFloat(mapping.maxOrderAmount) > 0 && (
                          <span>
                            Max: ₦
                            {parseFloat(
                              mapping.maxOrderAmount
                            ).toLocaleString()}
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {mapping.createdAt &&
                      format(new Date(mapping.createdAt), "PP")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No supplier mappings. Click &quot;Map to Supplier&quot; to add
              one.
            </p>
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
