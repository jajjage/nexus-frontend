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
import { useResendNotification } from "@/hooks/admin/useAdminNotifications";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface NotificationResendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificationId: string | null;
  isArchived?: boolean;
  mode?: "now" | "later";
}

export function NotificationResendModal({
  open,
  onOpenChange,
  notificationId,
  isArchived = false,
  mode = "later",
}: NotificationResendModalProps) {
  const resendMutation = useResendNotification();
  const [publishAt, setPublishAt] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setPublishAt("");
      setValidationError(null);
    }
  };

  const canSubmit = Boolean(
    notificationId &&
      !isArchived &&
      !validationError &&
      !resendMutation.isPending &&
      (mode === "now" || publishAt)
  );

  const handleSubmit = () => {
    if (!notificationId || !canSubmit) return;
    if (mode === "later" && publishAt) {
      const publishDate = new Date(publishAt);
      if (Number.isNaN(publishDate.getTime())) {
        setValidationError("Scheduled time is invalid.");
        return;
      }
      if (publishDate.getTime() <= Date.now()) {
        setValidationError("Scheduled time must be in the future.");
        return;
      }
    }

    setValidationError(null);

    resendMutation.mutate(
      {
        notificationId,
        data:
          mode === "now" || !publishAt
            ? undefined
            : { publish_at: new Date(publishAt).toISOString() },
      },
      {
        onSuccess: () => handleOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "now"
              ? "Resend Notification Now"
              : "Resend Notification Later"}
          </DialogTitle>
          <DialogDescription>
            {mode === "now"
              ? "This will trigger an immediate resend of the current notification content."
              : "Pick an optional future time to queue this resend."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {mode === "later" ? (
            <div className="space-y-2">
              <Label htmlFor="resend-publish-at">
                Scheduled Time (optional)
              </Label>
              <Input
                id="resend-publish-at"
                type="datetime-local"
                value={publishAt}
                onChange={(event) => {
                  setPublishAt(event.target.value);
                  setValidationError(null);
                }}
              />
              {validationError ? (
                <p className="text-destructive text-sm">{validationError}</p>
              ) : null}
            </div>
          ) : null}

          {isArchived ? (
            <p className="text-destructive text-sm">
              Archived notifications cannot be resent.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {resendMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : mode === "now" ? (
              "Resend Now"
            ) : (
              "Schedule Resend"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
