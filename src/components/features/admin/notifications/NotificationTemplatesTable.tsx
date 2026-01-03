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
  useCreateTemplate,
  useDeleteTemplate,
  useNotificationTemplates,
} from "@/hooks/admin/useAdminNotifications";
import { NotificationType } from "@/types/admin/notification.types";
import {
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Variable,
} from "lucide-react";
import { useState } from "react";

export function NotificationTemplatesTable() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [category, setCategory] = useState("");
  const [variables, setVariables] = useState("");

  const { data, isLoading, isError, refetch } = useNotificationTemplates();
  const createMutation = useCreateTemplate();
  const deleteMutation = useDeleteTemplate();

  const templates = data?.data || [];

  const resetForm = () => {
    setName("");
    setTitle("");
    setBody("");
    setType("info");
    setCategory("");
    setVariables("");
  };

  const handleCreate = () => {
    const variableArray = variables
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    createMutation.mutate(
      {
        name,
        title,
        body,
        type,
        category: category || undefined,
        variables: variableArray,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          resetForm();
        },
      }
    );
  };

  const handleDelete = (templateId: string, templateName: string) => {
    if (
      confirm(`Are you sure you want to delete template "${templateName}"?`)
    ) {
      deleteMutation.mutate(templateId);
    }
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
              <Skeleton key={i} className="h-16 w-full" />
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
          <p className="text-muted-foreground">Failed to load templates</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notification Templates
          </CardTitle>
          <CardDescription>
            Reusable templates for creating notifications.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          {/* Create Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Template</DialogTitle>
                <DialogDescription>
                  Create a reusable notification template with variables.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="welcome_user"
                  />
                  <p className="text-muted-foreground text-xs">
                    Use snake_case for the template name
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Welcome {{name}}!"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Body *</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Hello {{name}}, welcome to our platform!"
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={type}
                      onValueChange={(v) => setType(v as NotificationType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variables">Variables</Label>
                  <Input
                    id="variables"
                    value={variables}
                    onChange={(e) => setVariables(e.target.value)}
                    placeholder="name, email, amount"
                  />
                  <p className="text-muted-foreground text-xs">
                    Comma-separated list of variable names used in the template
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={
                    createMutation.isPending || !name || !title || !body
                  }
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
        {/* Table */}
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                        {template.name}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {template.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{template.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {template.category ? (
                        <Badge variant="outline">{template.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.variables && template.variables.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((v) => (
                            <Badge
                              key={v}
                              variant="outline"
                              className="text-xs"
                            >
                              <Variable className="mr-1 h-3 w-3" />
                              {v}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(template.id, template.name)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {templates.length > 0 && (
          <div className="text-muted-foreground mt-4 text-sm">
            {templates.length} template{templates.length !== 1 ? "s" : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
