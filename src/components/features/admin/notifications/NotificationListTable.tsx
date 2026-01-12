"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  useAdminNotifications,
  useCreateNotification,
  useDeleteNotification,
  useScheduleNotification,
  useUpdateNotification,
} from "@/hooks/admin/useAdminNotifications";
import {
  Notification,
  NotificationTargetCriteria,
  NotificationType,
} from "@/types/admin/notification.types";
import { format } from "date-fns";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const typeIcons: Record<NotificationType, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  alert: <Bell className="h-4 w-4 text-purple-500" />,
};

export function NotificationListTable() {
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [editingNotification, setEditingNotification] =
    useState<Notification | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Create Form state (immediate notification)
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [category, setCategory] = useState("");
  // Create Target Criteria
  const [createRegStart, setCreateRegStart] = useState("");
  const [createRegEnd, setCreateRegEnd] = useState("");
  const [createMinTx, setCreateMinTx] = useState("");
  const [createMaxTx, setCreateMaxTx] = useState("");
  const [createMinTopup, setCreateMinTopup] = useState("");
  const [createMaxTopup, setCreateMaxTopup] = useState("");
  const [createLastActive, setCreateLastActive] = useState("");

  // Schedule Form state (scheduled notification with targeting)
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleBody, setScheduleBody] = useState("");
  const [scheduleType, setScheduleType] = useState<NotificationType>("info");
  const [scheduleCategory, setScheduleCategory] = useState("");
  const [publishAt, setPublishAt] = useState("");
  // Target Criteria
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [minTransactionCount, setMinTransactionCount] = useState("");
  const [maxTransactionCount, setMaxTransactionCount] = useState("");
  const [minTopupCount, setMinTopupCount] = useState("");
  const [maxTopupCount, setMaxTopupCount] = useState("");
  const [lastActiveWithinDays, setLastActiveWithinDays] = useState("");

  const { data, isLoading, isError, refetch } = useAdminNotifications({
    archived: showArchived,
  });
  const createMutation = useCreateNotification();
  const scheduleMutation = useScheduleNotification();
  const updateMutation = useUpdateNotification();
  const deleteMutation = useDeleteNotification();

  const notifications = data?.data?.notifications || [];

  const resetCreateForm = () => {
    setTitle("");
    setBody("");
    setType("info");
    setCategory("");
    setCreateRegStart("");
    setCreateRegEnd("");
    setCreateMinTx("");
    setCreateMaxTx("");
    setCreateMinTopup("");
    setCreateMaxTopup("");
    setCreateLastActive("");
  };

  const resetScheduleForm = () => {
    setScheduleTitle("");
    setScheduleBody("");
    setScheduleType("info");
    setScheduleCategory("");
    setPublishAt("");
    setRegistrationStart("");
    setRegistrationEnd("");
    setMinTransactionCount("");
    setMaxTransactionCount("");
    setMinTopupCount("");
    setMaxTopupCount("");
    setLastActiveWithinDays("");
  };

  // Create immediate notification
  const handleCreate = () => {
    // Build targetCriteria for create
    const targetCriteria: NotificationTargetCriteria = {};

    if (createRegStart || createRegEnd) {
      targetCriteria.registrationDateRange = {
        start: createRegStart
          ? new Date(createRegStart).toISOString()
          : new Date().toISOString(),
        end: createRegEnd
          ? new Date(createRegEnd).toISOString()
          : new Date().toISOString(),
      };
    }
    if (createMinTx) targetCriteria.minTransactionCount = parseInt(createMinTx);
    if (createMaxTx) targetCriteria.maxTransactionCount = parseInt(createMaxTx);
    if (createMinTopup) targetCriteria.minTopupCount = parseInt(createMinTopup);
    if (createMaxTopup) targetCriteria.maxTopupCount = parseInt(createMaxTopup);
    if (createLastActive)
      targetCriteria.lastActiveWithinDays = parseInt(createLastActive);

    createMutation.mutate(
      {
        title,
        body,
        type,
        category: category || undefined,
        targetCriteria:
          Object.keys(targetCriteria).length > 0 ? targetCriteria : undefined,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          resetCreateForm();
        },
      }
    );
  };

  // Schedule notification with targeting
  const handleSchedule = () => {
    // Build targetCriteria object with only fields that have values
    const targetCriteria: NotificationTargetCriteria = {};

    if (registrationStart || registrationEnd) {
      targetCriteria.registrationDateRange = {
        start: registrationStart
          ? new Date(registrationStart).toISOString()
          : new Date().toISOString(),
        end: registrationEnd
          ? new Date(registrationEnd).toISOString()
          : new Date().toISOString(),
      };
    }
    if (minTransactionCount)
      targetCriteria.minTransactionCount = parseInt(minTransactionCount);
    if (maxTransactionCount)
      targetCriteria.maxTransactionCount = parseInt(maxTransactionCount);
    if (minTopupCount) targetCriteria.minTopupCount = parseInt(minTopupCount);
    if (maxTopupCount) targetCriteria.maxTopupCount = parseInt(maxTopupCount);
    if (lastActiveWithinDays)
      targetCriteria.lastActiveWithinDays = parseInt(lastActiveWithinDays);

    scheduleMutation.mutate(
      {
        title: scheduleTitle,
        body: scheduleBody,
        type: scheduleType,
        category: scheduleCategory || undefined,
        targetCriteria,
        publish_at: new Date(publishAt).toISOString(),
      },
      {
        onSuccess: () => {
          setIsScheduleOpen(false);
          resetScheduleForm();
        },
      }
    );
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setTitle(notification.title);
    setBody(notification.body);
    setType(notification.type);
    setCategory(notification.category || "");
  };

  const handleUpdate = () => {
    if (!editingNotification) return;

    updateMutation.mutate(
      {
        notificationId: editingNotification.id,
        data: {
          title,
          body,
          type,
          category: category || undefined,
        },
      },
      {
        onSuccess: () => {
          setEditingNotification(null);
          resetCreateForm();
        },
      }
    );
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
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
            {[...Array(5)].map((_, i) => (
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
          <p className="text-muted-foreground">Failed to load notifications</p>
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
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage system-wide notifications and alerts.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          {/* Create Immediate Notification Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetCreateForm}>
                <Plus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Notification</DialogTitle>
                <DialogDescription>
                  Send an immediate notification to all users.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="create-title">Title *</Label>
                  <Input
                    id="create-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Notification title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-body">Body *</Label>
                  <Textarea
                    id="create-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Notification message..."
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
                    <Label htmlFor="create-category">Category</Label>
                    <Input
                      id="create-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {/* Target Criteria Section */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="mb-3 text-sm font-medium">
                    Target Criteria (Optional)
                  </h4>
                  <p className="text-muted-foreground mb-4 text-xs">
                    Filter which users receive this notification. Leave empty to
                    send to all users.
                  </p>

                  <div className="space-y-4">
                    {/* Registration Date Range */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="create-reg-start">
                          Registered After
                        </Label>
                        <Input
                          id="create-reg-start"
                          type="datetime-local"
                          value={createRegStart}
                          onChange={(e) => setCreateRegStart(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-reg-end">
                          Registered Before
                        </Label>
                        <Input
                          id="create-reg-end"
                          type="datetime-local"
                          value={createRegEnd}
                          onChange={(e) => setCreateRegEnd(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Transaction Count */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="create-min-tx">Min Transactions</Label>
                        <Input
                          id="create-min-tx"
                          type="number"
                          min="0"
                          value={createMinTx}
                          onChange={(e) => setCreateMinTx(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-max-tx">Max Transactions</Label>
                        <Input
                          id="create-max-tx"
                          type="number"
                          min="0"
                          value={createMaxTx}
                          onChange={(e) => setCreateMaxTx(e.target.value)}
                          placeholder="No limit"
                        />
                      </div>
                    </div>

                    {/* Topup Count */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="create-min-topup">Min Topups</Label>
                        <Input
                          id="create-min-topup"
                          type="number"
                          min="0"
                          value={createMinTopup}
                          onChange={(e) => setCreateMinTopup(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-max-topup">Max Topups</Label>
                        <Input
                          id="create-max-topup"
                          type="number"
                          min="0"
                          value={createMaxTopup}
                          onChange={(e) => setCreateMaxTopup(e.target.value)}
                          placeholder="No limit"
                        />
                      </div>
                    </div>

                    {/* Last Active */}
                    <div className="space-y-2">
                      <Label htmlFor="create-last-active">
                        Last Active Within (Days)
                      </Label>
                      <Input
                        id="create-last-active"
                        type="number"
                        min="0"
                        value={createLastActive}
                        onChange={(e) => setCreateLastActive(e.target.value)}
                        placeholder="e.g., 30"
                      />
                    </div>
                  </div>
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
                  disabled={createMutation.isPending || !title || !body}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Now
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Schedule Notification Dialog */}
          <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" onClick={resetScheduleForm}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule Notification</DialogTitle>
                <DialogDescription>
                  Schedule a notification with optional targeting criteria.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Label htmlFor="schedule-title">Title *</Label>
                  <Input
                    id="schedule-title"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    placeholder="Notification title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-body">Body *</Label>
                  <Textarea
                    id="schedule-body"
                    value={scheduleBody}
                    onChange={(e) => setScheduleBody(e.target.value)}
                    placeholder="Notification message..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={scheduleType}
                      onValueChange={(v) =>
                        setScheduleType(v as NotificationType)
                      }
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
                    <Label htmlFor="schedule-category">Category</Label>
                    <Input
                      id="schedule-category"
                      value={scheduleCategory}
                      onChange={(e) => setScheduleCategory(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publish-at">Publish At *</Label>
                    <Input
                      id="publish-at"
                      type="datetime-local"
                      value={publishAt}
                      onChange={(e) => setPublishAt(e.target.value)}
                    />
                  </div>
                </div>

                {/* Target Criteria Section */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="mb-3 text-sm font-medium">
                    Target Criteria (Optional)
                  </h4>
                  <p className="text-muted-foreground mb-4 text-xs">
                    Filter which users receive this notification.
                  </p>

                  <div className="space-y-4">
                    {/* Registration Date Range */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="reg-start">Registered After</Label>
                        <Input
                          id="reg-start"
                          type="datetime-local"
                          value={registrationStart}
                          onChange={(e) => setRegistrationStart(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-end">Registered Before</Label>
                        <Input
                          id="reg-end"
                          type="datetime-local"
                          value={registrationEnd}
                          onChange={(e) => setRegistrationEnd(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Transaction Count */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="min-tx">Min Transactions</Label>
                        <Input
                          id="min-tx"
                          type="number"
                          min="0"
                          value={minTransactionCount}
                          onChange={(e) =>
                            setMinTransactionCount(e.target.value)
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-tx">Max Transactions</Label>
                        <Input
                          id="max-tx"
                          type="number"
                          min="0"
                          value={maxTransactionCount}
                          onChange={(e) =>
                            setMaxTransactionCount(e.target.value)
                          }
                          placeholder="No limit"
                        />
                      </div>
                    </div>

                    {/* Topup Count */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="min-topup">Min Topups</Label>
                        <Input
                          id="min-topup"
                          type="number"
                          min="0"
                          value={minTopupCount}
                          onChange={(e) => setMinTopupCount(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-topup">Max Topups</Label>
                        <Input
                          id="max-topup"
                          type="number"
                          min="0"
                          value={maxTopupCount}
                          onChange={(e) => setMaxTopupCount(e.target.value)}
                          placeholder="No limit"
                        />
                      </div>
                    </div>

                    {/* Last Active */}
                    <div className="space-y-2">
                      <Label htmlFor="last-active">
                        Last Active Within (Days)
                      </Label>
                      <Input
                        id="last-active"
                        type="number"
                        min="0"
                        value={lastActiveWithinDays}
                        onChange={(e) =>
                          setLastActiveWithinDays(e.target.value)
                        }
                        placeholder="e.g., 30"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsScheduleOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSchedule}
                  disabled={
                    scheduleMutation.isPending ||
                    !scheduleTitle ||
                    !scheduleBody ||
                    !publishAt
                  }
                >
                  {scheduleMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Schedule Notification
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
                <TableHead className="w-[60px]">Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="max-w-[250px]">Body</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    No notifications found
                  </TableCell>
                </TableRow>
              ) : (
                notifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={
                      notification.isArchived || notification.archived
                        ? "opacity-50"
                        : ""
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {typeIcons[notification.type]}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {notification.title}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">
                      {notification.body}
                    </TableCell>
                    <TableCell>
                      {notification.category ? (
                        <Badge variant="outline">{notification.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {notification.sent ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Sent
                        </Badge>
                      ) : notification.publish_at || notification.publishAt ? (
                        <Badge variant="secondary">
                          Scheduled:{" "}
                          {format(
                            new Date(
                              notification.publish_at ||
                                notification.publishAt ||
                                ""
                            ),
                            "PP"
                          )}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link
                            href={`/admin/dashboard/notifications/${notification.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(notification)}
                          disabled={
                            notification.isArchived || notification.archived
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteId(notification.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {notifications.length > 0 && (
          <div className="text-muted-foreground mt-4 text-sm">
            {notifications.length} notification
            {notifications.length !== 1 ? "s" : ""}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingNotification}
        onOpenChange={(open) => {
          if (!open) {
            setEditingNotification(null);
            resetCreateForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Notification</DialogTitle>
            <DialogDescription>Update notification details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-body">Body *</Label>
              <Textarea
                id="edit-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notification message..."
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
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingNotification(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !title || !body}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
