"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAttachProductCommission,
  useProductCommissions,
  useRemoveProductCommission,
  useUpdateProductCommission,
} from "@/hooks/useAgent";
import type { AgentProduct } from "@/types/agent.types";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Check, ChevronDown, Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminAgentProductsPage() {
  const { data: products, isLoading } = useProductCommissions();
  const { data: catalogData, isLoading: productsLoading } = useProducts(
    { perPage: 500, isActive: true },
    { staleTime: 1000 * 60 * 10 }
  );
  const { mutate: attachCommission, isPending: attaching } =
    useAttachProductCommission();
  const { mutate: updateCommission, isPending: updating } =
    useUpdateProductCommission();
  const { mutate: removeCommission, isPending: removing } =
    useRemoveProductCommission();

  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [selectedProductValue, setSelectedProductValue] = useState("");
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [commissionType, setCommissionType] = useState<"fixed" | "percentage">(
    "fixed"
  );
  const [commissionValue, setCommissionValue] = useState("");

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      return error.response?.data?.message || fallback;
    }

    return fallback;
  };

  const catalogProducts = catalogData?.products ?? [];
  const selectedCatalogProduct =
    catalogProducts.find(
      (product) =>
        product.id === selectedProductValue ||
        product.productCode === selectedProductValue
    ) || null;

  const selectedProductIdentifier =
    selectedCatalogProduct?.id ||
    selectedCatalogProduct?.productCode ||
    selectedProductValue;

  const getCommissionType = (product: AgentProduct) =>
    product.commissionConfig?.commissionType || product.commissionType;

  const getCommissionValue = (product: AgentProduct) =>
    product.commissionConfig?.commissionValue ?? product.commissionValue;

  const getProductIdentifier = (product: AgentProduct) =>
    product.productId || product.productCode || product.id;

  const getProductLabel = (product: AgentProduct) =>
    product.productName || product.name || product.productCode || product.id;

  const getCommissionCreatedAt = (product: AgentProduct) =>
    product.commissionConfig?.createdAt || product.createdAt;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const handleAddOrUpdate = () => {
    if (!selectedProductIdentifier || !commissionValue) {
      toast.error("Please fill all fields");
      return;
    }

    const value = parseFloat(commissionValue);
    if (value <= 0) {
      toast.error("Commission value must be greater than 0");
      return;
    }

    if (commissionType === "percentage" && value > 100) {
      toast.error("Percentage cannot exceed 100");
      return;
    }

    const payload = { commissionType, commissionValue: value };

    if (editingProductId) {
      updateCommission(
        { productId: editingProductId, payload },
        {
          onSuccess: () => {
            toast.success("Commission updated");
            resetForm();
          },
          onError: (error) => {
            toast.error(getErrorMessage(error, "Failed to update commission"));
          },
        }
      );
    } else {
      attachCommission(
        { productId: selectedProductIdentifier, payload },
        {
          onSuccess: () => {
            toast.success("Commission attached");
            resetForm();
          },
          onError: (error) => {
            toast.error(getErrorMessage(error, "Failed to attach commission"));
          },
        }
      );
    }
  };

  const handleRemove = (productIdentifier: string) => {
    if (confirm("Are you sure you want to remove this commission?")) {
      removeCommission(productIdentifier, {
        onSuccess: () => {
          toast.success("Commission removed");
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, "Failed to remove commission"));
        },
      });
    }
  };

  const handleEdit = (product: AgentProduct) => {
    const productIdentifier = getProductIdentifier(product);
    const matchingCatalogProduct = catalogProducts.find(
      (catalogProduct) =>
        catalogProduct.id === productIdentifier ||
        catalogProduct.productCode === productIdentifier
    );

    setEditingProductId(productIdentifier);
    setSelectedProductValue(
      matchingCatalogProduct?.id ||
        matchingCatalogProduct?.productCode ||
        productIdentifier
    );
    setCommissionType(getCommissionType(product) || "fixed");
    setCommissionValue(String(getCommissionValue(product) ?? ""));
    setShowForm(true);
  };

  const resetForm = () => {
    setSelectedProductValue("");
    setCommissionType("fixed");
    setCommissionValue("");
    setEditingProductId(null);
    setProductPickerOpen(false);
    setShowForm(false);
  };

  return (
    <div className="bg-muted/40 min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agent Commission Products</h1>
            <p className="text-gray-600">
              Configure commission rules for products
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            {showForm ? "Cancel" : "Add Commission"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingProductId
                  ? "Edit Commission"
                  : "Add Commission to Product"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product-picker">Product</Label>
                <Popover
                  open={productPickerOpen}
                  onOpenChange={setProductPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      id="product-picker"
                      variant="outline"
                      role="combobox"
                      aria-expanded={productPickerOpen}
                      className="w-full justify-between"
                      disabled={productsLoading || editingProductId !== null}
                    >
                      {selectedCatalogProduct
                        ? `${selectedCatalogProduct.name} (${selectedCatalogProduct.productCode})`
                        : selectedProductValue
                          ? selectedProductValue
                          : productsLoading
                            ? "Loading products..."
                            : "Select a product"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search by product name or code..." />
                      <CommandList>
                        <CommandEmpty>No products found.</CommandEmpty>
                        <CommandGroup>
                          {catalogProducts.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={`${product.id} ${product.productCode} ${product.name}`}
                              onSelect={() => {
                                setSelectedProductValue(product.id);
                                setProductPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedProductValue === product.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex min-w-0 flex-col">
                                <span className="truncate font-medium">
                                  {product.name}
                                </span>
                                <span className="text-muted-foreground truncate text-xs">
                                  {product.productCode}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedCatalogProduct && (
                  <p className="text-muted-foreground mt-2 text-xs">
                    Sending product identifier: {selectedProductIdentifier}
                  </p>
                )}
                {editingProductId !== null && (
                  <p className="text-muted-foreground mt-2 text-xs">
                    Product selection is locked while editing an existing rule.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commissionType">Type</Label>
                  <Select
                    value={commissionType}
                    onValueChange={(value: "fixed" | "percentage") =>
                      setCommissionType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed (₦)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="commissionValue">
                    Value ({commissionType === "percentage" ? "%" : "₦"})
                  </Label>
                  <Input
                    id="commissionValue"
                    type="number"
                    placeholder="0"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddOrUpdate}
                  disabled={attaching || updating}
                  className="flex-1"
                >
                  {editingProductId ? "Update Commission" : "Add Commission"}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  disabled={attaching || updating}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Commission Rules</CardTitle>
            <CardDescription>
              Total products: {products?.length ?? 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!products || products.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">No commission rules configured</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                      <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Code / ID</TableHead>
                      <TableHead>Product Type</TableHead>
                      <TableHead>Commission Type</TableHead>
                      <TableHead>Commission Value</TableHead>
                      <TableHead>Commission Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {getProductLabel(product)}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm font-bold">
                            {product.productCode || getProductIdentifier(product)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {product.productType || "N/A"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              getCommissionType(product) === "percentage"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {getCommissionType(product) === "percentage"
                              ? "Percentage"
                              : "Fixed"}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold">
                          {getCommissionType(product) === "percentage"
                            ? `${getCommissionValue(product) ?? 0}%`
                            : `₦${(getCommissionValue(product) ?? 0).toLocaleString()}`}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              product.commissionConfig?.isActive ?? true
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {product.commissionConfig?.isActive ?? true
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getCommissionCreatedAt(product)
                            ? new Date(
                                getCommissionCreatedAt(product) as string
                              ).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(product)}
                              disabled={updating || removing}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleRemove(getProductIdentifier(product))
                              }
                              disabled={removing || updating}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
