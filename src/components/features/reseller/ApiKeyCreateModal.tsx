"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateApiKey } from "@/hooks/useReseller";
import { AlertTriangle, Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ApiKeyCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyCreateModal({
  open,
  onOpenChange,
}: ApiKeyCreateModalProps) {
  const [name, setName] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createKeyMutation = useCreateApiKey();

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a name for the key");
      return;
    }

    createKeyMutation.mutate(
      { name: name.trim(), isLive },
      {
        onSuccess: (response) => {
          setGeneratedKey(response.data?.key || null);
        },
      }
    );
  };

  const handleCopy = async () => {
    if (!generatedKey) return;

    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleClose = () => {
    setName("");
    setIsLive(true);
    setGeneratedKey(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            {generatedKey
              ? "Your new API key has been created"
              : "Create a new API key for your integration"}
          </DialogDescription>
        </DialogHeader>

        {!generatedKey ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., My Website Integration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  A descriptive name to identify this key
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isLive">Production Key</Label>
                  <p className="text-muted-foreground text-xs">
                    Enable for live transactions
                  </p>
                </div>
                <Switch
                  id="isLive"
                  checked={isLive}
                  onCheckedChange={setIsLive}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createKeyMutation.isPending}
              >
                {createKeyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Key"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Warning */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <AlertTriangle className="mt-0.5 size-5 text-amber-600 dark:text-amber-400" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Copy this key now!
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  This is the only time you&apos;ll see the full key. Store it
                  securely.
                </p>
              </div>
            </div>

            {/* Key Display */}
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="size-4 text-green-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                I&apos;ve Saved My Key
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
