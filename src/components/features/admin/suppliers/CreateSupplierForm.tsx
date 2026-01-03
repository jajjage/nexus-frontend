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
import { Switch } from "@/components/ui/switch";
import { useCreateSupplier } from "@/hooks/admin/useAdminSuppliers";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateSupplierForm() {
  const router = useRouter();
  const createMutation = useCreateSupplier();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [apiBase, setApiBase] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [priorityInt, setPriorityInt] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug || !apiBase || !apiKey) {
      return;
    }

    createMutation.mutate(
      { name, slug, apiBase, apiKey, priorityInt, isActive },
      {
        onSuccess: () => {
          router.push("/admin/dashboard/suppliers");
        },
      }
    );
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === name.toLowerCase().replace(/\s+/g, "-")) {
      setSlug(value.toLowerCase().replace(/\s+/g, "-"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard/suppliers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Suppliers
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Supplier</CardTitle>
          <CardDescription>
            Add a new data supplier to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Supplier Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="My Supplier"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-supplier"
                  className="font-mono"
                  required
                />
                <p className="text-muted-foreground text-xs">
                  Unique identifier (auto-generated from name)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiBase">API Base URL</Label>
              <Input
                id="apiBase"
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                placeholder="https://api.supplier.com/v1"
                className="font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk_live_..."
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  value={priorityInt}
                  onChange={(e) => setPriorityInt(Number(e.target.value))}
                />
                <p className="text-muted-foreground text-xs">
                  Lower number = higher priority
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-muted-foreground text-xs">
                    Enable this supplier immediately
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/dashboard/suppliers">Cancel</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Create Supplier
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
