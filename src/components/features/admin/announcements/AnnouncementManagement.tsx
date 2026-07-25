"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncementDraft,
  useExpireAnnouncement,
  usePublishAnnouncement,
  useUpdateAnnouncement,
} from "@/hooks/admin/useAdminAnnouncements";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import {
  Announcement,
  AnnouncementAudienceType,
  AnnouncementPayload,
} from "@/types/admin/announcement.types";
import { MegaphoneIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useMemo, useState } from "react";

const emptyForm: AnnouncementPayload = {
  title: "",
  message: "",
  startsAt: "",
  endsAt: "",
  audienceType: "all",
  recipientUserIds: [],
};

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function statusVariant(status: Announcement["status"]) {
  if (status === "published") return "default";
  if (status === "expired") return "secondary";
  return "outline";
}

export function AnnouncementManagement() {
  const [form, setForm] = useState<AnnouncementPayload>(emptyForm);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const { data, isLoading, isError, refetch } = useAdminAnnouncements();
  const usersQuery = useAdminUsers({
    page: 1,
    limit: 20,
    search: userSearch,
    role: "user",
  });
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const publishMutation = usePublishAnnouncement();
  const expireMutation = useExpireAnnouncement();
  const deleteMutation = useDeleteAnnouncementDraft();

  const announcements = data?.data || [];
  const users = usersQuery.data?.data?.users || [];
  const selectedUsers = useMemo(
    () => users.filter((user) => form.recipientUserIds.includes(user.userId)),
    [form.recipientUserIds, users]
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setUserSearch("");
  };

  const submit = (publishAfterCreate = false) => {
    if (editing) {
      updateMutation.mutate(
        { announcementId: editing.id, data: form },
        { onSuccess: resetForm }
      );
      return;
    }
    createMutation.mutate(form, {
      onSuccess: (response) => {
        if (publishAfterCreate && response.data?.id) {
          publishMutation.mutate(response.data.id, { onSuccess: resetForm });
          return;
        }
        resetForm();
      },
    });
  };

  const editAnnouncement = (announcement: Announcement) => {
    setEditing(announcement);
    setForm({
      title: announcement.title,
      message: announcement.message,
      startsAt: toDatetimeLocal(announcement.startsAt),
      endsAt: toDatetimeLocal(announcement.endsAt),
      audienceType: announcement.audienceType,
      recipientUserIds: announcement.recipientUserIds,
    });
  };

  const toggleUser = (userId: string) => {
    setForm((current) => ({
      ...current,
      recipientUserIds: current.recipientUserIds.includes(userId)
        ? current.recipientUserIds.filter((id) => id !== userId)
        : [...current.recipientUserIds, userId],
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editing ? "Edit Announcement Draft" : "Create Announcement Draft"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Announcement"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Long announcement text</Label>
            <Textarea
              id="message"
              className="min-h-40"
              value={form.message}
              onChange={(event) =>
                setForm({ ...form, message: event.target.value })
              }
              placeholder="Dear customer, ..."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Audience</Label>
              <Select
                value={form.audienceType}
                onValueChange={(value: AnnouncementAudienceType) =>
                  setForm({
                    ...form,
                    audienceType: value,
                    recipientUserIds:
                      value === "all" ? [] : form.recipientUserIds,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="selected">Selected users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startsAt">Starts at</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm({ ...form, startsAt: event.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endsAt">Ends at</Label>
              <Input
                id="endsAt"
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) =>
                  setForm({ ...form, endsAt: event.target.value })
                }
              />
            </div>
          </div>
          {form.audienceType === "selected" && (
            <div className="grid gap-3 rounded-lg border p-3">
              <Label htmlFor="userSearch">Search and select users</Label>
              <Input
                id="userSearch"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search by name, email, or phone"
              />
              <div className="grid max-h-48 gap-2 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user.userId}
                    type="button"
                    onClick={() => toggleUser(user.userId)}
                    className="hover:bg-muted flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm"
                  >
                    <span>
                      <span className="font-medium">{user.fullName}</span>
                      <span className="text-muted-foreground ml-2">
                        {user.email}
                      </span>
                    </span>
                    {form.recipientUserIds.includes(user.userId) && (
                      <Badge>Selected</Badge>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-muted-foreground text-sm">
                {form.recipientUserIds.length} selected
                {selectedUsers.length > 0
                  ? `: ${selectedUsers.map((user) => user.fullName).join(", ")}`
                  : ""}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => submit(false)} disabled={isSaving}>
              {editing ? "Save Draft" : "Create Draft"}
            </Button>
            {!editing && (
              <Button
                variant="outline"
                onClick={() => submit(true)}
                disabled={isSaving || publishMutation.isPending}
              >
                Create & Publish
              </Button>
            )}
            {editing && (
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dashboard Announcement Modals</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : isError ? (
            <p className="text-destructive text-sm">
              Failed to load announcements.
            </p>
          ) : announcements.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-sm">
              <MegaphoneIcon className="h-8 w-8" />
              No announcements yet.
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{announcement.title}</h3>
                      <Badge variant={statusVariant(announcement.status)}>
                        {announcement.status}
                      </Badge>
                      <Badge variant="outline">
                        {announcement.audienceType === "all"
                          ? "All users"
                          : `${announcement.recipientCount} selected`}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {announcement.message}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(announcement.startsAt).toLocaleString()} →{" "}
                      {new Date(announcement.endsAt).toLocaleString()} ·{" "}
                      {announcement.viewCount} views
                    </p>
                    {announcement.status === "draft" && (
                      <p className="text-muted-foreground text-xs">
                        Drafts are not shown on mobile until you publish them.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {announcement.status === "draft" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editAnnouncement(announcement)}
                        >
                          <PencilIcon className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            publishMutation.mutate(announcement.id)
                          }
                        >
                          Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(announcement.id)}
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )}
                    {announcement.status === "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => expireMutation.mutate(announcement.id)}
                      >
                        Expire
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
