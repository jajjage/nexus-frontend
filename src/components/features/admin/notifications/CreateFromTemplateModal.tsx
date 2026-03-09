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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateFromTemplate } from "@/hooks/admin/useAdminNotifications";
import {
  NotificationTemplate,
  NotificationType,
} from "@/types/admin/notification.types";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

interface CreateFromTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: NotificationTemplate | null;
}

const typeOptions: NotificationType[] = [
  "info",
  "success",
  "warning",
  "error",
  "alert",
];

export function CreateFromTemplateModal({
  open,
  onOpenChange,
  template,
}: CreateFromTemplateModalProps) {
  const createFromTemplateMutation = useCreateFromTemplate();
  const [draft, setDraft] = useState<{
    variables: Record<string, string>;
    category: string;
    type: NotificationType | "";
    publishAt: string;
    publishAtError: string | null;
  } | null>(null);

  const initialDraft = useMemo(() => {
    const defaults: Record<string, string> = {};
    template?.variables.forEach((variableName) => {
      defaults[variableName] = "";
    });
    return {
      variables: defaults,
      category: template?.category || "",
      type: "" as NotificationType | "",
      publishAt: "",
      publishAtError: null,
    };
  }, [template]);

  const values = draft ?? initialDraft;
  const { variables, category, type, publishAt, publishAtError } = values;

  const missingVariables = useMemo(() => {
    if (!template) return [];
    return template.variables.filter((name) => !variables[name]?.trim());
  }, [template, variables]);

  const canSubmit = Boolean(
    template &&
      missingVariables.length === 0 &&
      !publishAtError &&
      !createFromTemplateMutation.isPending
  );

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setDraft(null);
    }
  };

  const handleSubmit = () => {
    if (!template || !canSubmit) return;
    if (publishAt) {
      const value = new Date(publishAt);
      if (Number.isNaN(value.getTime())) {
        setDraft((prev) => ({
          ...(prev ?? initialDraft),
          publishAtError: "Scheduled time is invalid.",
        }));
        return;
      }
      if (value.getTime() <= Date.now()) {
        setDraft((prev) => ({
          ...(prev ?? initialDraft),
          publishAtError: "Scheduled time must be in the future.",
        }));
        return;
      }
    }
    setDraft((prev) => ({
      ...(prev ?? initialDraft),
      publishAtError: null,
    }));

    createFromTemplateMutation.mutate(
      {
        template_id: template.id,
        variables: Object.fromEntries(
          Object.entries(variables).map(([key, value]) => [key, value.trim()])
        ),
        category: category.trim() || undefined,
        type: type || undefined,
        publish_at: publishAt ? new Date(publishAt).toISOString() : undefined,
      },
      {
        onSuccess: () => handleOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Use Template</DialogTitle>
          <DialogDescription>
            Fill template variables and optionally schedule publication.
          </DialogDescription>
        </DialogHeader>

        {!template ? null : (
          <div className="space-y-4 py-2">
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">{template.name}</p>
              <p className="text-muted-foreground text-xs">{template.title}</p>
            </div>

            {template.variables.length > 0 ? (
              <div className="space-y-3">
                {template.variables.map((variableName) => (
                  <div key={variableName} className="space-y-1">
                    <Label htmlFor={`var-${variableName}`}>
                      {variableName}
                    </Label>
                    <Input
                      id={`var-${variableName}`}
                      value={variables[variableName] ?? ""}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...(prev ?? initialDraft),
                          variables: {
                            ...(prev ?? initialDraft).variables,
                            [variableName]: event.target.value,
                          },
                        }))
                      }
                      placeholder={`Value for ${variableName}`}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="template-category">Category (optional)</Label>
                <Input
                  id="template-category"
                  value={category}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...(prev ?? initialDraft),
                      category: event.target.value,
                    }))
                  }
                  placeholder="system"
                />
              </div>
              <div className="space-y-1">
                <Label>Type override (optional)</Label>
                <Select
                  value={type}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...(prev ?? initialDraft),
                      type: value as NotificationType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Use template default" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="template-publish-at">Publish at (optional)</Label>
              <Input
                id="template-publish-at"
                type="datetime-local"
                value={publishAt}
                onChange={(event) => {
                  setDraft((prev) => ({
                    ...(prev ?? initialDraft),
                    publishAt: event.target.value,
                    publishAtError: null,
                  }));
                }}
              />
              {publishAtError ? (
                <p className="text-destructive text-xs">{publishAtError}</p>
              ) : null}
            </div>

            {missingVariables.length > 0 ? (
              <p className="text-destructive text-sm">
                Please fill all template variables:{" "}
                {missingVariables.join(", ")}
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {createFromTemplateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Notification"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
