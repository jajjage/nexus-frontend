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
import {
  useNotificationRecurrence,
  useUpsertNotificationRecurrence,
} from "@/hooks/admin/useAdminNotifications";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

interface NotificationRecurrenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificationId: string | null;
  isArchived?: boolean;
}

const defaultTimezone = () => {
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return browserZone || "UTC";
};

const getTimezones = () => {
  const intlWithSupportedValues = Intl as typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  if (intlWithSupportedValues.supportedValuesOf) {
    return intlWithSupportedValues.supportedValuesOf("timeZone");
  }
  return ["UTC", "Africa/Lagos"];
};

const isValidTimeOfDay = (value: string) =>
  /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

export function NotificationRecurrenceModal({
  open,
  onOpenChange,
  notificationId,
  isArchived = false,
}: NotificationRecurrenceModalProps) {
  const timezones = useMemo(() => getTimezones(), []);
  const [draft, setDraft] = useState<{
    enabled: boolean;
    timeOfDay: string;
    timezone: string;
  } | null>(null);

  const recurrenceQuery = useNotificationRecurrence(notificationId || "");
  const upsertMutation = useUpsertNotificationRecurrence();
  const recurrence = recurrenceQuery.data?.data;

  const initialValues = useMemo(
    () => ({
      enabled: recurrence?.isActive ?? false,
      timeOfDay: recurrence?.timeOfDay || "08:00",
      timezone: recurrence?.timezone || defaultTimezone(),
    }),
    [recurrence?.isActive, recurrence?.timeOfDay, recurrence?.timezone]
  );

  const values = draft ?? initialValues;
  const { enabled, timeOfDay, timezone } = values;

  const timezoneIsValid = useMemo(
    () => !!timezone && timezones.includes(timezone),
    [timezone, timezones]
  );
  const timeOfDayIsValid = isValidTimeOfDay(timeOfDay);
  const canSubmit = Boolean(
    notificationId &&
      !isArchived &&
      !upsertMutation.isPending &&
      timeOfDayIsValid &&
      timezoneIsValid
  );

  const handleSave = () => {
    if (!notificationId || !canSubmit) return;
    upsertMutation.mutate(
      {
        notificationId,
        data: {
          enabled,
          time_of_day: timeOfDay,
          timezone,
        },
      },
      {
        onSuccess: () => {
          setDraft(null);
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setDraft(null);
    }
  };

  const lastRunAt = recurrence?.lastRunAt;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daily Schedule</DialogTitle>
          <DialogDescription>
            Configure daily resend for this notification in your selected timezone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Enable Daily Resend</p>
              <p className="text-muted-foreground text-xs">
                Sends once per local day after the configured time.
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={(checked) =>
                setDraft((prev) => ({
                  ...(prev ?? initialValues),
                  enabled: checked,
                }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="time-of-day">Time of day (HH:mm)</Label>
              <Input
                id="time-of-day"
                type="time"
                value={timeOfDay}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...(prev ?? initialValues),
                    timeOfDay: event.target.value,
                  }))
                }
              />
              {!timeOfDayIsValid ? (
                <p className="text-destructive text-xs">
                  Use a valid 24-hour time in HH:mm format.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                list="notification-timezones"
                value={timezone}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...(prev ?? initialValues),
                    timezone: event.target.value,
                  }))
                }
                placeholder="Africa/Lagos"
              />
              <datalist id="notification-timezones">
                {timezones.map((zone) => (
                  <option key={zone} value={zone} />
                ))}
              </datalist>
              {!timezoneIsValid ? (
                <p className="text-destructive text-xs">
                  Select a valid IANA timezone.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-md border p-3 text-sm">
            This notification will resend every day at{" "}
            <span className="font-medium">{timeOfDay}</span> (
            <span className="font-medium">{timezone}</span>).
          </div>

          <p className="text-muted-foreground text-sm">
            Last daily run:{" "}
            <span className="font-medium">
              {lastRunAt ? format(new Date(lastRunAt), "PPpp") : "Not yet"}
            </span>
          </p>

          {isArchived ? (
            <p className="text-destructive text-sm">
              Archived notifications cannot be configured for daily resend.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSubmit}>
            {upsertMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Schedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
