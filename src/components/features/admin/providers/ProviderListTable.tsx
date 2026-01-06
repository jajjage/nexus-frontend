"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminProviders,
  useCreateProvider,
  useDeleteProvider,
  useUpdateProvider,
} from "@/hooks/admin/useAdminProviders";
import { Provider } from "@/types/admin/provider.types";
import { format } from "date-fns";
import { Edit, Loader2, Plus, RefreshCw, Server, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ProviderListTable() {
  const { data, isLoading, isError, refetch } = useAdminProviders();
  const createMutation = useCreateProvider();
  const updateMutation = useUpdateProvider();
  const deleteMutation = useDeleteProvider();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  );

  // Create form state
  const [newName, setNewName] = useState("");
  const [newApiBase, setNewApiBase] = useState("");
  const [newWebhookSecret, setNewWebhookSecret] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [newConfig, setNewConfig] = useState("");

  const providers = data?.data?.providers || [];

  const resetCreateForm = () => {
    setNewName("");
    setNewApiBase("");
    setNewWebhookSecret("");
    setNewIsActive(true);
    setNewConfig("");
  };

  const handleCreate = () => {
    let parsedConfig: Record<string, any> | undefined;
    if (newConfig.trim()) {
      try {
        parsedConfig = JSON.parse(newConfig);
      } catch {
        return; // Invalid JSON
      }
    }

    createMutation.mutate(
      {
        name: newName,
        apiBase: newApiBase || undefined,
        webhookSecret: newWebhookSecret || undefined,
        isActive: newIsActive,
        config: parsedConfig,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          resetCreateForm();
        },
      }
    );
  };

  const handleToggleActive = (provider: Provider) => {
    updateMutation.mutate({
      providerId: provider.id,
      data: { isActive: !provider.isActive },
    });
  };

  const handleDelete = () => {
    if (!selectedProvider) return;
    deleteMutation.mutate(selectedProvider.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setSelectedProvider(null);
      },
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
            {[...Array(3)].map((_, i) => (
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
          <p className="text-muted-foreground">Failed to load providers</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Payment Providers
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Provider</DialogTitle>
                <DialogDescription>
                  Configure a new payment provider for virtual account
                  generation.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. palmpay, monnify"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Base URL</Label>
                  <Input
                    value={newApiBase}
                    onChange={(e) => setNewApiBase(e.target.value)}
                    placeholder="https://api.provider.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <Input
                    type="password"
                    value={newWebhookSecret}
                    onChange={(e) => setNewWebhookSecret(e.target.value)}
                    placeholder="Secret key (will be encrypted)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Config (JSON)</Label>
                  <Textarea
                    value={newConfig}
                    onChange={(e) => setNewConfig(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Active</Label>
                    <p className="text-muted-foreground text-xs">
                      Enable this provider
                    </p>
                  </div>
                  <Switch
                    checked={newIsActive}
                    onCheckedChange={setNewIsActive}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newName || createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {providers.length === 0 ? (
          <div className="py-8 text-center">
            <Server className="text-muted-foreground mx-auto h-12 w-12" />
            <p className="text-muted-foreground mt-2">
              No providers configured
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setCreateOpen(true)}
            >
              Add First Provider
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>API Base</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">
                      {provider.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {provider.apiBase || "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={provider.isActive}
                        onCheckedChange={() => handleToggleActive(provider)}
                        disabled={updateMutation.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(provider.createdAt), "PP")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/admin/dashboard/providers/${provider.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedProvider(provider);
                            setDeleteOpen(true);
                          }}
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

        {/* Delete Confirmation */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Provider</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{selectedProvider?.name}
                &quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
