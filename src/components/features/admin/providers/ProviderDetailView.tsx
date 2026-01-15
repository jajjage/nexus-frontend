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
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminProvider,
  useUpdateProvider,
} from "@/hooks/admin/useAdminProviders";
import { format } from "date-fns";
import { ArrowLeft, Edit, Loader2, Server } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ProviderDetailViewProps {
  providerId: string;
}

export function ProviderDetailView({ providerId }: ProviderDetailViewProps) {
  const { data, isLoading, isError, refetch } = useAdminProvider(providerId);
  const updateMutation = useUpdateProvider();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editApiBase, setEditApiBase] = useState("");
  const [editWebhookSecret, setEditWebhookSecret] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editConfig, setEditConfig] = useState("");

  const provider = data?.data;

  useEffect(() => {
    if (provider) {
      setEditName(provider.name);
      setEditApiBase(provider.apiBase || "");
      setEditIsActive(provider.isActive);
      setEditConfig(
        provider.config ? JSON.stringify(provider.config, null, 2) : ""
      );
    }
  }, [provider]);

  const handleUpdate = () => {
    let parsedConfig: Record<string, any> | undefined;
    if (editConfig.trim()) {
      try {
        parsedConfig = JSON.parse(editConfig);
      } catch {
        return; // Invalid JSON
      }
    }

    updateMutation.mutate(
      {
        providerId,
        data: {
          name: editName,
          apiBase: editApiBase || undefined,
          webhookSecret: editWebhookSecret || undefined,
          isActive: editIsActive,
          config: parsedConfig,
        },
      },
      {
        onSuccess: () => {
          setEditOpen(false);
          setEditWebhookSecret("");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !provider) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Failed to load provider details
          </p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/admin/dashboard/providers">Back to Providers</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/dashboard/providers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
            <Server className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{provider.name}</h1>
            <p className="text-muted-foreground text-sm">{provider.id}</p>
          </div>
        </div>
        <div className="ml-auto">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Provider</DialogTitle>
                <DialogDescription>
                  Update provider configuration. Leave webhook secret empty to
                  keep existing.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. palmpay"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Base URL</Label>
                  <Input
                    value={editApiBase}
                    onChange={(e) => setEditApiBase(e.target.value)}
                    placeholder="https://api.provider.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Webhook Secret</Label>
                  <Input
                    type="password"
                    value={editWebhookSecret}
                    onChange={(e) => setEditWebhookSecret(e.target.value)}
                    placeholder="Leave empty to keep existing"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Config (JSON)</Label>
                  <Textarea
                    value={editConfig}
                    onChange={(e) => setEditConfig(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="font-mono text-sm break-all"
                    rows={4}
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
                    checked={editIsActive}
                    onCheckedChange={setEditIsActive}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={!editName || updateMutation.isPending}
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

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Details</CardTitle>
          <CardDescription>
            Configuration for {provider.name} payment provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Name" value={provider.name} />
            <InfoRow
              label="Status"
              value={
                <Badge variant={provider.isActive ? "default" : "secondary"}>
                  {provider.isActive ? "Active" : "Inactive"}
                </Badge>
              }
            />
            <InfoRow
              label="API Base"
              value={provider.apiBase || "Not configured"}
            />
            <InfoRow
              label="Created"
              value={format(new Date(provider.createdAt), "PPpp")}
            />
            {provider.updatedAt && (
              <InfoRow
                label="Last Updated"
                value={format(new Date(provider.updatedAt), "PPpp")}
              />
            )}
          </div>

          {provider.config && Object.keys(provider.config).length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground mb-2 block text-sm">
                Configuration
              </Label>
              <pre className="bg-muted overflow-x-auto rounded-md p-4 text-sm">
                {JSON.stringify(provider.config, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <p className="font-medium">{value}</p>
    </div>
  );
}
