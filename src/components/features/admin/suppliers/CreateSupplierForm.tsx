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
import { useCreateSupplier } from "@/hooks/admin/useAdminSuppliers";
import { ArrowLeft, Eye, EyeOff, Loader2, Save } from "lucide-react";
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
  const [vtpassAuthType, setVtpassAuthType] = useState<"apiKey" | "basic">(
    "apiKey"
  );
  const [vtpassApiKey, setVtpassApiKey] = useState("");
  const [vtpassPublicKey, setVtpassPublicKey] = useState("");
  const [vtpassSecretKey, setVtpassSecretKey] = useState("");
  const [vtpassUsername, setVtpassUsername] = useState("");
  const [vtpassPassword, setVtpassPassword] = useState("");
  const [mssUsername, setMssUsername] = useState("");
  const [mssPassword, setMssPassword] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [priorityInt, setPriorityInt] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const normalizedSlug = slug.trim().toLowerCase();
  const isVtpass = normalizedSlug === "vtpass";
  const isMssDataSub =
    normalizedSlug === "mssdata" ||
    normalizedSlug === "mss-data" ||
    normalizedSlug === "mssdatasub" ||
    normalizedSlug === "mss-data-sub" ||
    normalizedSlug === "mss data sub";
  const resolvedApiKey = isVtpass
    ? vtpassAuthType === "apiKey"
      ? JSON.stringify({
          apiKey: vtpassApiKey.trim(),
          publicKey: vtpassPublicKey.trim(),
          secretKey: vtpassSecretKey.trim(),
        })
      : JSON.stringify({
          username: vtpassUsername.trim(),
          password: vtpassPassword.trim(),
        })
    : isMssDataSub
      ? JSON.stringify({
          username: mssUsername.trim(),
          password: mssPassword.trim(),
        })
      : apiKey.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug || !apiBase) {
      return;
    }

    if (
      isVtpass &&
      vtpassAuthType === "apiKey" &&
      (!vtpassApiKey || !vtpassPublicKey || !vtpassSecretKey)
    ) {
      return;
    }

    if (
      isVtpass &&
      vtpassAuthType === "basic" &&
      (!vtpassUsername || !vtpassPassword)
    ) {
      return;
    }

    if (isMssDataSub && (!mssUsername || !mssPassword)) {
      return;
    }

    if (!isVtpass && !isMssDataSub && !apiKey) {
      return;
    }

    createMutation.mutate(
      {
        name,
        slug,
        apiBase,
        apiKey: resolvedApiKey,
        priorityInt,
        isActive,
      },
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

  const handleSlugChange = (value: string) => {
    setSlug(value);
    if (value.trim().toLowerCase() === "vtpass" && !apiBase) {
      setApiBase("https://vtpass.com/api");
    }
    if (
      [
        "mssdata",
        "mss-data",
        "mssdatasub",
        "mss-data-sub",
        "mss data sub",
      ].includes(value.trim().toLowerCase()) &&
      !apiBase
    ) {
      setApiBase("https://mssdatasub.com/api");
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
                  onChange={(e) => handleSlugChange(e.target.value)}
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

            {isVtpass ? (
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <Label>VTpass Authentication</Label>
                  <p className="text-muted-foreground text-xs">
                    API keys are preferred. Basic auth is available for older
                    VTpass account setups.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vtpassAuthType">Auth Type</Label>
                  <Select
                    value={vtpassAuthType}
                    onValueChange={(value) =>
                      setVtpassAuthType(value as "apiKey" | "basic")
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
                {vtpassAuthType === "apiKey" ? (
                  <>
                    <SecretInput
                      id="vtpassApiKey"
                      label="Static API Key"
                      value={vtpassApiKey}
                      onChange={setVtpassApiKey}
                      placeholder="xxxxxxxxxxxxxxxxxxxx"
                      visible={showApiKey}
                    />
                    <SecretInput
                      id="vtpassPublicKey"
                      label="Public Key"
                      value={vtpassPublicKey}
                      onChange={setVtpassPublicKey}
                      placeholder="PK_xxxxxxxxxxxxxxxxx"
                      visible={showApiKey}
                    />
                    <SecretInput
                      id="vtpassSecretKey"
                      label="Secret Key"
                      value={vtpassSecretKey}
                      onChange={setVtpassSecretKey}
                      placeholder="SK_xxxxxxxxxxxxxxxxx"
                      visible={showApiKey}
                    />
                  </>
                ) : (
                  <>
                    <SecretInput
                      id="vtpassUsername"
                      label="Username / Email"
                      value={vtpassUsername}
                      onChange={setVtpassUsername}
                      placeholder="merchant@example.com"
                      visible={showApiKey}
                    />
                    <SecretInput
                      id="vtpassPassword"
                      label="Password"
                      value={vtpassPassword}
                      onChange={setVtpassPassword}
                      placeholder="VTpass password"
                      visible={showApiKey}
                    />
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  {showApiKey ? "Hide keys" : "Show keys"}
                </Button>
              </div>
            ) : isMssDataSub ? (
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <Label>Mssdatasub Credentials</Label>
                  <p className="text-muted-foreground text-xs">
                    Please provide the username and password for Mssdatasub.
                  </p>
                </div>
                <SecretInput
                  id="mssUsername"
                  label="Username"
                  value={mssUsername}
                  onChange={setMssUsername}
                  placeholder="Mssdatasub username"
                  visible={showApiKey}
                />
                <SecretInput
                  id="mssPassword"
                  label="Password"
                  value={mssPassword}
                  onChange={setMssPassword}
                  placeholder="Mssdatasub password"
                  visible={showApiKey}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  {showApiKey ? "Hide credentials" : "Show credentials"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk_live_..."
                    className="pr-10"
                    required
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

function SecretInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  visible,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono"
        required
      />
    </div>
  );
}
