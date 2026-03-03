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
import { AlertTriangle, Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface OneTimeSecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  secret: string | null;
  filePrefix: string;
}

export function OneTimeSecretDialog({
  open,
  onOpenChange,
  title,
  description,
  secret,
  filePrefix,
}: OneTimeSecretDialogProps) {
  const [copied, setCopied] = useState(false);
  const [hasSavedSecret, setHasSavedSecret] = useState(false);

  const handleCopy = async () => {
    if (!secret) return;

    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setHasSavedSecret(true);
      toast.success("Secret copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy secret");
    }
  };

  const handleDownload = () => {
    if (!secret) return;

    const content = `${title}\n\n${secret}\n\nGenerated: ${new Date().toISOString()}\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filePrefix}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setHasSavedSecret(true);
    toast.success("Secret downloaded");
  };

  const closeDialog = () => {
    setCopied(false);
    setHasSavedSecret(false);
    onOpenChange(false);
  };

  const canDismiss = hasSavedSecret || !secret;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !canDismiss) {
          toast.error("Copy or download this secret before closing");
          return;
        }

        if (!nextOpen) {
          closeDialog();
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={canDismiss}
        onInteractOutside={(event) => {
          if (!canDismiss) {
            event.preventDefault();
            toast.error("Copy or download this secret before closing");
          }
        }}
        onEscapeKeyDown={(event) => {
          if (!canDismiss) {
            event.preventDefault();
            toast.error("Copy or download this secret before closing");
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <AlertTriangle className="mt-0.5 size-5 text-amber-600 dark:text-amber-400" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Save this secret now.
            </p>
            <p className="text-amber-700 dark:text-amber-300">
              This value will not be shown again.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Secret</Label>
          <div className="flex gap-2">
            <Input
              value={secret ?? ""}
              readOnly
              className="font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 size-4" />
              .txt
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={closeDialog}
            className="w-full"
            disabled={!hasSavedSecret}
          >
            I&apos;ve Saved This Secret
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
