"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminOperators } from "@/hooks/admin/useAdminOperators";
import { useCreateProduct } from "@/hooks/admin/useAdminProducts";
import { useAdminSuppliers } from "@/hooks/admin/useAdminSuppliers";
import { ArrowLeft, Loader2, Package, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateProductForm() {
  const router = useRouter();
  const createMutation = useCreateProduct();
  const { data: operatorsData } = useAdminOperators();
  const { data: suppliersData } = useAdminSuppliers();

  // Basic product fields
  const [operatorId, setOperatorId] = useState("");
  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [productType, setProductType] = useState("");
  const [denomAmount, setDenomAmount] = useState(0);
  const [dataMb, setDataMb] = useState<number | undefined>();
  const [validityDays, setValidityDays] = useState<number | undefined>();
  const [isActive, setIsActive] = useState(true);
  const [metadata, setMetadata] = useState("");

  // Optional supplier mapping fields
  const [includeMapping, setIncludeMapping] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [supplierProductCode, setSupplierProductCode] = useState("");
  const [supplierPrice, setSupplierPrice] = useState(0);
  const [minOrderAmount, setMinOrderAmount] = useState<number | undefined>();
  const [maxOrderAmount, setMaxOrderAmount] = useState<number | undefined>();
  const [leadTimeSeconds, setLeadTimeSeconds] = useState<number | undefined>();
  const [mappingIsActive, setMappingIsActive] = useState(true);

  const operators = operatorsData?.data?.operators || [];
  const suppliers = suppliersData?.data?.suppliers || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!operatorId || !productCode || !name || !productType) {
      return;
    }

    let parsedMetadata: Record<string, unknown> | undefined;
    if (metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        // Invalid JSON, ignore metadata
      }
    }

    createMutation.mutate(
      {
        operatorId,
        productCode,
        name,
        productType,
        denomAmount,
        dataMb,
        validityDays,
        isActive,
        metadata: parsedMetadata,
        // Include supplier mapping if enabled
        ...(includeMapping && supplierId
          ? {
              supplierId,
              supplierProductCode,
              supplierPrice,
              minOrderAmount,
              maxOrderAmount,
              leadTimeSeconds,
              mappingIsActive,
            }
          : {}),
      },
      {
        onSuccess: () => {
          router.push("/admin/dashboard/products");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Product Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Information
            </CardTitle>
            <CardDescription>Define the basic product details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="operator">Operator *</Label>
                <Select value={operatorId} onValueChange={setOperatorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.name} ({op.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productCode">Product Code *</Label>
                <Input
                  id="productCode"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  placeholder="e.g., MTN_1GB_DAILY"
                  className="font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., MTN 1GB Daily Bundle"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="productType">Product Type *</Label>
                <Input
                  id="productType"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  placeholder="e.g., data, airtime, bundle"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="denomAmount">Amount (₦) *</Label>
                <Input
                  id="denomAmount"
                  type="number"
                  value={denomAmount}
                  onChange={(e) => setDenomAmount(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dataMb">Data (MB)</Label>
                <Input
                  id="dataMb"
                  type="number"
                  value={dataMb || ""}
                  onChange={(e) =>
                    setDataMb(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validityDays">Validity (days)</Label>
                <Input
                  id="validityDays"
                  type="number"
                  value={validityDays || ""}
                  onChange={(e) =>
                    setValidityDays(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata">Metadata (JSON)</Label>
              <Textarea
                id="metadata"
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                placeholder='{"key": "value"}'
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Product Active</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </CardContent>
        </Card>

        {/* Supplier Mapping (Optional) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Supplier Mapping</CardTitle>
                <CardDescription>
                  Optionally link this product to a supplier during creation.
                </CardDescription>
              </div>
              <Switch
                checked={includeMapping}
                onCheckedChange={setIncludeMapping}
              />
            </div>
          </CardHeader>
          {includeMapping && (
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
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
                    value={supplierProductCode}
                    onChange={(e) => setSupplierProductCode(e.target.value)}
                    placeholder="e.g., SUPPLIER_PROD_123"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Supplier Price (₦)</Label>
                  <Input
                    type="number"
                    value={supplierPrice}
                    onChange={(e) => setSupplierPrice(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Min Order</Label>
                  <Input
                    type="number"
                    value={minOrderAmount || ""}
                    onChange={(e) =>
                      setMinOrderAmount(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Order</Label>
                  <Input
                    type="number"
                    value={maxOrderAmount || ""}
                    onChange={(e) =>
                      setMaxOrderAmount(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Lead Time (seconds)</Label>
                  <Input
                    type="number"
                    value={leadTimeSeconds || ""}
                    onChange={(e) =>
                      setLeadTimeSeconds(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Mapping Active</Label>
                  <Switch
                    checked={mappingIsActive}
                    onCheckedChange={setMappingIsActive}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/dashboard/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
}
