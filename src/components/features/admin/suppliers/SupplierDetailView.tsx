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
  useAdminSupplier,
  useUpdateSupplier,
} from "@/hooks/admin/useAdminSuppliers";
import { format } from "date-fns";
import { ArrowLeft, Edit, Eye, EyeOff, Loader2, Server } from "lucide-react";
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
  const [editVtpassAuthType, setEditVtpassAuthType] = useState<
    "apiKey" | "basic"
  >("apiKey");
  const [editVtpassApiKey, setEditVtpassApiKey] = useState("");
  const [editVtpassPublicKey, setEditVtpassPublicKey] = useState("");
  const [editVtpassSecretKey, setEditVtpassSecretKey] = useState("");
  const [editVtpassUsername, setEditVtpassUsername] = useState("");
  const [editVtpassPassword, setEditVtpassPassword] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [editPriority, setEditPriority] = useState(1);
  const [editIsActive, setEditIsActive] = useState(true);

  const supplier = data?.data;
  const isVtpass = supplier?.slug?.toLowerCase() === "vtpass";

  const handleEdit = () => {
    if (supplier) {
      setEditName(supplier.name);
      setEditApiBase(supplier.apiBase);
      setEditApiKey("");
      setEditVtpassAuthType("apiKey");
      setEditVtpassApiKey("");
      setEditVtpassPublicKey("");
      setEditVtpassSecretKey("");
      setEditVtpassUsername("");
      setEditVtpassPassword("");
      setEditPriority(supplier.priorityInt);
      setEditIsActive(supplier.isActive);
      setIsEditOpen(true);
    }
  };

  const handleSave = () => {
    const hasAnyVtpassApiKey =
      editVtpassApiKey || editVtpassPublicKey || editVtpassSecretKey;
    const hasAnyVtpassBasicKey = editVtpassUsername || editVtpassPassword;
    const hasAnyVtpassKey = hasAnyVtpassApiKey || hasAnyVtpassBasicKey;

    if (
      isVtpass &&
      editVtpassAuthType === "apiKey" &&
      hasAnyVtpassApiKey &&
      (!editVtpassApiKey || !editVtpassPublicKey || !editVtpassSecretKey)
    ) {
      return;
    }

    if (
      isVtpass &&
      editVtpassAuthType === "basic" &&
      hasAnyVtpassBasicKey &&
      (!editVtpassUsername || !editVtpassPassword)
    ) {
      return;
    }

    const vtpassKeyPayload =
      isVtpass && hasAnyVtpassKey
        ? editVtpassAuthType === "apiKey"
          ? JSON.stringify({
              apiKey: editVtpassApiKey.trim(),
              publicKey: editVtpassPublicKey.trim(),
              secretKey: editVtpassSecretKey.trim(),
            })
          : JSON.stringify({
              username: editVtpassUsername.trim(),
              password: editVtpassPassword.trim(),
            })
        : "";

    updateMutation.mutate(
      {
        supplierId,
        data: {
          name: editName,
          apiBase: editApiBase,
          ...(isVtpass
            ? vtpassKeyPayload && { apiKey: vtpassKeyPayload }
            : editApiKey && { apiKey: editApiKey }),
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
          <DialogContent className="flex max-h-[90vh] max-w-md flex-col">
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>
                Update supplier configuration. Leave credential fields empty to
                keep current keys.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4 pr-1">
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
              {isVtpass && (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label>VTpass Authentication</Label>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Fill the selected credential set only when rotating
                        credentials.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <Eye className="text-muted-foreground h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vtpassAuthType">Auth Type</Label>
                    <Select
                      value={editVtpassAuthType}
                      onValueChange={(value) =>
                        setEditVtpassAuthType(value as "apiKey" | "basic")
                      }
                    >
                      <SelectTrigger id="vtpassAuthType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apiKey">API keys</SelectItem>
                        <SelectItem value="basic">
                          Basic username/password
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editVtpassAuthType === "apiKey" ? (
                    <>
                      <SecretInput
                        id="vtpassApiKey"
                        label="Static API Key"
                        value={editVtpassApiKey}
                        visible={showApiKey}
                        onChange={setEditVtpassApiKey}
                      />
                      <SecretInput
                        id="vtpassPublicKey"
                        label="Public Key"
                        value={editVtpassPublicKey}
                        visible={showApiKey}
                        onChange={setEditVtpassPublicKey}
                      />
                      <SecretInput
                        id="vtpassSecretKey"
                        label="Secret Key"
                        value={editVtpassSecretKey}
                        visible={showApiKey}
                        onChange={setEditVtpassSecretKey}
                      />
                    </>
                  ) : (
                    <>
                      <SecretInput
                        id="vtpassUsername"
                        label="Username / Email"
                        value={editVtpassUsername}
                        visible={showApiKey}
                        onChange={setEditVtpassUsername}
                      />
                      <SecretInput
                        id="vtpassPassword"
                        label="Password"
                        value={editVtpassPassword}
                        visible={showApiKey}
                        onChange={setEditVtpassPassword}
                      />
                    </>
                  )}
                </div>
              )}
              {!isVtpass && (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key (leave empty to keep)</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={editApiKey}
                      onChange={(e) => setEditApiKey(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <Eye className="text-muted-foreground h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
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
            <DialogFooter className="border-t pt-4">
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

function SecretInput({
  id,
  label,
  value,
  visible,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="leave empty to keep current"
      />
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
