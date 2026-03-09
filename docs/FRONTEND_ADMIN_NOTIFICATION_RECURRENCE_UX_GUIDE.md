# Frontend Guide: Admin Notification Daily Recurrence

This guide explains how frontend should integrate the new admin recurrence API so admins can schedule an existing notification to resend every day at a chosen morning time.

## Goal

Let admin configure a daily resend schedule on an existing notification without creating duplicate notifications.

## Endpoints

1. `PUT /api/v1/admin/notifications/:notificationId/recurrence`
2. `GET /api/v1/admin/notifications/:notificationId/recurrence`
3. Optional monitoring: `GET /api/v1/admin/notifications/:notificationId/dispatches`

Auth: admin bearer token.

## Request/Response Contract

### Upsert recurrence

`PUT /api/v1/admin/notifications/:notificationId/recurrence`

```json
{
  "time_of_day": "08:00",
  "timezone": "Africa/Lagos",
  "enabled": true
}
```

Response:

```json
{
  "success": true,
  "message": "Notification recurrence saved successfully",
  "data": {
    "id": "uuid",
    "notification_id": "uuid",
    "time_of_day": "08:00",
    "timezone": "Africa/Lagos",
    "is_active": true,
    "last_run_at": null
  }
}
```

### Get recurrence

`GET /api/v1/admin/notifications/:notificationId/recurrence`

If exists: `200` with same `data` shape above.
If not configured: `404` (`Notification recurrence not found`).

## Backend Behavior You Should Reflect in UX

1. Scheduler checks every minute.
2. Notification is sent once per local day after configured `time_of_day` in configured `timezone`.
3. `last_run_at` updates when daily send is triggered.
4. Archived notifications cannot be configured (`409`).

## Recommended UX Flow

## 1) Entry point in notification details/list

Add action button: `Daily Schedule`.
Open a modal/drawer with:

1. `Enable daily resend` toggle.
2. Time picker (`HH:mm`).
3. Timezone selector (IANA zones).
4. Live summary text:
   `This notification will resend every day at 08:00 (Africa/Lagos).`

## 2) Initial load behavior

On open:

1. Call `GET /recurrence`.
2. If `200`: hydrate form.
3. If `404`: show defaults:
   - `enabled = false`
   - `time_of_day = "08:00"`
   - `timezone = browser timezone` (fallback `UTC`)

## 3) Save behavior

On save:

1. Validate locally:
   - `time_of_day` required, format `HH:mm`.
   - `timezone` required and valid option from selector.
2. Call `PUT /recurrence`.
3. On success:
   - Show success toast.
   - Update UI badge/state immediately (`Daily: ON` or `OFF`).

## 4) Monitoring behavior

After enabling recurrence, show:

1. `Last daily run`: formatted from `last_run_at` or `Not yet`.
2. Link/button to view dispatch history (`/dispatches`) for audit/debug.

## Error Handling UX

1. `400`: show field-level validation message.
2. `404` on GET: treat as not configured (not a hard error).
3. `404` on PUT: notification no longer exists; show blocking message.
4. `409`: notification archived; disable schedule form and explain why.
5. `401/403`: show permission/auth message and route to login if needed.

## Suggested Frontend Service API

```ts
type NotificationRecurrence = {
  id: string;
  notification_id: string;
  time_of_day: string;
  timezone: string;
  is_active: boolean;
  last_run_at: string | null;
};

async function getNotificationRecurrence(notificationId: string) {}
async function upsertNotificationRecurrence(
  notificationId: string,
  payload: { time_of_day: string; timezone: string; enabled: boolean }
) {}
```

## UX Quality Checklist

1. Timezone selector is searchable and defaults to browser zone.
2. Save button disabled while request is in flight.
3. Clear success/error toasts.
4. Human-readable schedule summary shown before save.
5. Distinguish this from one-time resend action.
6. Dispatch history visible for trust/traceability.
