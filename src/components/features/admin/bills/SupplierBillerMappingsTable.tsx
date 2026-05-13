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
  useAdminBillers,
  useAdminSupplierBillerMappings,
  useCreateSupplierBillerMapping,
  useUpdateSupplierBillerMapping,
} from "@/hooks/admin/useAdminBillPayments";
import { useAdminSuppliers } from "@/hooks/admin/useAdminSuppliers";
import { AdminSupplierBillerMapping } from "@/types/admin/bill-payment.types";
import { Plus, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type FormState = {
  supplierId: string;
  billerId: string;
  supplierServiceCode: string;
  supportsValidation: boolean;
  supportsVariations: boolean;
  isActive: boolean;
};

const emptyForm: FormState = {
  supplierId: "",
  billerId: "",
  supplierServiceCode: "",
  supportsValidation: true,
  supportsVariations: false,
  isActive: true,
};

export function SupplierBillerMappingsTable() {
  const [categoryType, setCategoryType] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminSupplierBillerMapping | null>(
    null
  );
  const [form, setForm] = useState<FormState>(emptyForm);

  const mappingParams = useMemo(
    () => ({
      categoryType: categoryType === "all" ? undefined : categoryType,
    }),
    [categoryType]
  );

  const { data: mappingsResponse, isLoading } =
    useAdminSupplierBillerMappings(mappingParams);
  const { data: billersResponse } = useAdminBillers(
    categoryType === "all" ? undefined : categoryType
  );
  const { data: suppliersResponse } = useAdminSuppliers();
  const createMutation = useCreateSupplierBillerMapping();
  const updateMutation = useUpdateSupplierBillerMapping();

  const mappings = mappingsResponse?.data || [];
  const billers = billersResponse?.data || [];
  const suppliers = suppliersResponse?.data?.suppliers || [];

  useEffect(() => {
    if (!open) {
      setEditing(null);
      setForm(emptyForm);
    }
  }, [open]);

  const openEdit = (mapping: AdminSupplierBillerMapping) => {
    setEditing(mapping);
    setForm({
      supplierId: mapping.supplierId,
      billerId: mapping.billerId,
      supplierServiceCode: mapping.supplierServiceCode,
      supportsValidation: mapping.supportsValidation,
      supportsVariations: mapping.supportsVariations,
      isActive: mapping.isActive,
    });
    setOpen(true);
  };

  const canSubmit =
    !!form.supplierId && !!form.billerId && !!form.supplierServiceCode.trim();

  const submit = async () => {
    if (!canSubmit) return;

    const payload = {
      ...form,
      supplierServiceCode: form.supplierServiceCode.trim(),
    };

    if (editing) {
      await updateMutation.mutateAsync({
        mappingId: editing.id,
        data: payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setOpen(false);
  };

  const selectedBiller = billers.find((biller) => biller.id === form.billerId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Supplier Biller Mappings</CardTitle>
          <CardDescription>
            Map canonical electricity and cable billers to supplier service
            codes.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Mapping
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Mapping" : "Create Mapping"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={form.supplierId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, supplierId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Biller</Label>
                <Select
                  value={form.billerId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, billerId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose biller" />
                  </SelectTrigger>
                  <SelectContent>
                    {billers.map((biller) => (
                      <SelectItem key={biller.id} value={biller.id}>
                        {biller.name} ({biller.categoryType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Supplier Service Code</Label>
                <Input
                  value={form.supplierServiceCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      supplierServiceCode: event.target.value,
                    }))
                  }
                  placeholder={selectedBiller?.code || "dstv"}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ToggleRow
                  label="Validation"
                  checked={form.supportsValidation}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      supportsValidation: checked,
                    }))
                  }
                />
                <ToggleRow
                  label="Variations"
                  checked={form.supportsVariations}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      supportsVariations: checked,
                    }))
                  }
                />
                <ToggleRow
                  label="Active"
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, isActive: checked }))
                  }
                />
              </div>

              <Button
                className="w-full"
                onClick={submit}
                disabled={
                  !canSubmit ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                <Save className="mr-2 h-4 w-4" />
                {editing ? "Save Changes" : "Create Mapping"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select value={categoryType} onValueChange={setCategoryType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="electricity">Electricity</SelectItem>
              <SelectItem value="cable">Cable TV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Biller</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Service Code</TableHead>
                <TableHead>Capabilities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    Loading mappings...
                  </TableCell>
                </TableRow>
              ) : mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    No supplier mappings yet.
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{mapping.billerName}</p>
                        <p className="text-muted-foreground text-xs">
                          {mapping.billerCode} • {mapping.categoryType}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {mapping.supplierName} ({mapping.supplierSlug})
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {mapping.supplierServiceCode}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {mapping.supportsValidation && (
                          <Badge variant="secondary">Validate</Badge>
                        )}
                        {mapping.supportsVariations && (
                          <Badge variant="secondary">Variations</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={mapping.isActive ? "default" : "outline"}>
                        {mapping.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(mapping)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-md border p-3">
      <Label className="mb-2 block text-xs">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
