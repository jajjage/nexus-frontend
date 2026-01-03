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
import { Switch } from "@/components/ui/switch";
import {
  useAdminSupplier,
  useUpdateSupplier,
} from "@/hooks/admin/useAdminSuppliers";
import { format } from "date-fns";
import { ArrowLeft, Edit, Loader2, Server } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SupplierDetailViewProps {
  supplierId: string;
}

export function SupplierDetailView({ supplierId }: SupplierDetailViewProps) {
  const { data, isLoading, isError, refetch } = useAdminSupplier(supplierId);
  const updateMutation = useUpdateSupplier();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editApiBase, setEditApiBase] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [editPriority, setEditPriority] = useState(1);
  const [editIsActive, setEditIsActive] = useState(true);

  const supplier = data?.data;

  const handleEdit = () => {
    if (supplier) {
      setEditName(supplier.name);
      setEditApiBase(supplier.apiBase);
      setEditApiKey("");
      setEditPriority(supplier.priorityInt);
      setEditIsActive(supplier.isActive);
      setIsEditOpen(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        supplierId,
        data: {
          name: editName,
          apiBase: editApiBase,
          ...(editApiKey && { apiKey: editApiKey }),
          priorityInt: editPriority,
          isActive: editIsActive,
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

  if (isError || !supplier) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Failed to load supplier details
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
            <Link href="/admin/dashboard/suppliers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Suppliers
            </Link>
          </Button>
          <Badge variant={supplier.isActive ? "default" : "secondary"}>
            {supplier.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>
                Update supplier configuration. Leave API Key empty to keep
                current.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiBase">API Base URL</Label>
                <Input
                  id="apiBase"
                  value={editApiBase}
                  onChange={(e) => setEditApiBase(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key (leave empty to keep)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={editApiKey}
                  onChange={(e) => setEditApiKey(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (lower = higher)</Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  value={editPriority}
                  onChange={(e) => setEditPriority(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={editIsActive}
                  onCheckedChange={setEditIsActive}
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

      {/* Supplier Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {supplier.name}
          </CardTitle>
          <CardDescription>Supplier Configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Supplier ID" value={supplier.id} mono />
          <InfoRow label="Slug" value={supplier.slug} mono />
          <InfoRow label="API Base URL" value={supplier.apiBase} mono />
          <InfoRow label="API Key" value={supplier.apiKey || "••••••••"} mono />
          <InfoRow label="Priority" value={supplier.priorityInt.toString()} />
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Status</span>
            <Badge variant={supplier.isActive ? "default" : "secondary"}>
              {supplier.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {supplier.createdAt && (
            <InfoRow
              label="Created"
              value={format(new Date(supplier.createdAt), "PPpp")}
            />
          )}
          {supplier.updatedAt && (
            <InfoRow
              label="Updated"
              value={format(new Date(supplier.updatedAt), "PPpp")}
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
