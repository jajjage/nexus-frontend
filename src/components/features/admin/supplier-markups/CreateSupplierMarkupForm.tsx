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
import { Textarea } from "@/components/ui/textarea";
import { useCreateSupplierMarkup } from "@/hooks/admin/useAdminSupplierMarkups";
import { useAdminSuppliers } from "@/hooks/admin/useAdminSuppliers";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateSupplierMarkupForm() {
  const router = useRouter();
  const createMutation = useCreateSupplierMarkup();
  const { data: suppliersData } = useAdminSuppliers();

  const [supplierId, setSupplierId] = useState("");
  const [operatorProductId, setOperatorProductId] = useState("");
  const [markupPercent, setMarkupPercent] = useState(0);
  const [validFrom, setValidFrom] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil] = useState("");
  const [description, setDescription] = useState("");

  const suppliers = suppliersData?.data?.suppliers || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || !operatorProductId || !validFrom || !validUntil) {
      return;
    }

    createMutation.mutate(
      {
        supplierId,
        operatorProductId,
        markupPercent,
        validFrom,
        validUntil,
        description: description || undefined,
      },
      {
        onSuccess: () => {
          router.push("/admin/dashboard/supplier-markups");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard/supplier-markups">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Markups
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Supplier Markup</CardTitle>
          <CardDescription>
            Define a markup percentage for a specific supplier-product
            combination.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
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
                <Label htmlFor="operatorProductId">Operator Product ID</Label>
                <Input
                  id="operatorProductId"
                  value={operatorProductId}
                  onChange={(e) => setOperatorProductId(e.target.value)}
                  placeholder="e.g., mtn_1gb_daily"
                  className="font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="markupPercent">Markup Percentage (%)</Label>
              <Input
                id="markupPercent"
                type="number"
                step="0.01"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(Number(e.target.value))}
                required
              />
              <p className="text-muted-foreground text-xs">
                Percentage to add on top of supplier price
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Holiday promotion markup..."
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/dashboard/supplier-markups">Cancel</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Create Markup
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
