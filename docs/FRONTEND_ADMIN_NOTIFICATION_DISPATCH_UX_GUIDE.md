# Frontend Guide: Admin Notification Dispatch UX (Create, Schedule, Resend, Recurrence)

This is the full frontend integration guide for the notification dispatch features now available in backend.

## Scope

Use this guide for:

1. Creating notifications (immediate or scheduled).
2. Resending existing notifications (immediate or scheduled).
3. Viewing send attempt history (dispatches).
4. Configuring daily recurring resend.

The backend now tracks every send attempt in dispatch logs. Resend and recurrence do not create duplicate notification rows.

## Endpoints

### Create & Schedule

1. `POST /api/v1/admin/notifications`
2. `POST /api/v1/admin/notifications/schedule`
3. `POST /api/v1/admin/notifications/from-template`

### Resend & Dispatch Visibility

1. `POST /api/v1/admin/notifications/:notificationId/resend`
2. `GET /api/v1/admin/notifications/:notificationId/dispatches?limit=&offset=`

### Daily Recurrence

1. `PUT /api/v1/admin/notifications/:notificationId/recurrence`
2. `GET /api/v1/admin/notifications/:notificationId/recurrence`

## Key Backend Behavior (Frontend must match)

1. Resend is exact replay of the existing notification content/target.
2. Resend does not create another `notifications` record.
3. Read/unread state for users is not reset by resend.
4. Dispatch table is source of truth for send attempts (`initial`, `resend`, `legacy`).
5. Recurrence sends once per local day after configured `time_of_day` + `timezone`.

## Request/Response Patterns

## 1) Resend existing notification

`POST /api/v1/admin/notifications/:notificationId/resend`

Immediate:

```json
{}
```

Scheduled:

```json
{
  "publish_at": "2026-03-08T08:00:00.000Z"
}
```

Success response includes:

1. `notification` object (existing record)
2. `dispatch` object (new send attempt)

## 2) Dispatch history

`GET /api/v1/admin/notifications/:notificationId/dispatches?limit=50&offset=0`

Use this to render attempt timeline/status:

1. `queued`
2. `processing`
3. `sent`
4. `retrying`
5. `failed`
6. `cancelled`

## 3) Daily recurrence config

`PUT /api/v1/admin/notifications/:notificationId/recurrence`

```json
{
  "time_of_day": "08:00",
  "timezone": "Africa/Lagos",
  "enabled": true
}
```

`GET /api/v1/admin/notifications/:notificationId/recurrence`

If recurrence not configured yet, backend returns `404` (treat as empty/default state).

## Recommended UX Structure

## A) Notification list row actions

For each notification row:

1. `Resend now`
2. `Resend later`
3. `Daily schedule`
4. `View dispatch history`

## B) Resend modal UX

Fields:

1. Optional date-time picker (`publish_at`)

Behavior:

1. Empty date => immediate resend.
2. Future date => scheduled resend.
3. On success, show toast and append a local optimistic dispatch item with `queued`.

## C) Dispatch history drawer/panel

Show table or timeline with:

1. Trigger (`initial`, `resend`, `legacy`)
2. Status
3. Scheduled time
4. Sent time
5. Attempts / max attempts
6. Last error (if failed)

Pagination:

1. Keep `limit=50` default.
2. Provide load more (`offset += limit`).

## D) Daily recurrence modal UX

Fields:

1. `enabled` toggle
2. `time_of_day` (`HH:mm`)
3. `timezone` (IANA)

Defaults when `GET /recurrence` is `404`:

1. `enabled=false`
2. `time_of_day=08:00`
3. `timezone=browser timezone` (fallback `UTC`)

Show preview sentence:
`This notification will resend every day at 08:00 (Africa/Lagos).`

## E) Notification detail page badges

Recommended badges:

1. `Dispatch: Active` if latest dispatch status is queued/processing/retrying.
2. `Daily: ON/OFF` from recurrence config.
3. `Last daily run: <date/time or Never>`.

## Error Handling Contract

1. `400`: validation issue (show field-level message).
2. `401`: auth expired (redirect/login flow).
3. `403`: missing permission (show forbidden UI state).
4. `404` on recurrence GET: not configured yet (normal empty state).
5. `404` on resend/put recurrence: notification missing.
6. `409` on resend/recurrence: archived notification (disable actions).

## Suggested Frontend Service Types

```ts
type NotificationDispatch = {
  id: string;
  notification_id: string;
  trigger: "initial" | "resend" | "legacy";
  status:
    | "queued"
    | "processing"
    | "sent"
    | "failed"
    | "cancelled"
    | "retrying";
  attempts: number;
  max_attempts: number;
  scheduled_for: string;
  sent_at: string | null;
  last_error: string | null;
  created_at: string;
};

type NotificationRecurrence = {
  id: string;
  notification_id: string;
  time_of_day: string;
  timezone: string;
  is_active: boolean;
  last_run_at: string | null;
};
```

## Suggested Query Hooks

1. `useNotificationDispatches(notificationId, limit, offset)`
2. `useResendNotification()`
3. `useNotificationRecurrence(notificationId)`
4. `useUpsertNotificationRecurrence()`

Invalidate/refetch:

1. After resend success: refetch dispatch list.
2. After recurrence save: refetch recurrence + dispatch list.

## QA Checklist for Frontend

1. Resend now creates dispatch entry without creating duplicate notification row in UI list.
2. Scheduled resend shows queued status first, then updates later from refresh.
3. Recurrence can be enabled, edited, disabled.
4. Recurrence `404` is handled as empty config (not red error screen).
5. Archived notification disables resend and recurrence actions.
6. Dispatch panel handles pagination and failed statuses cleanly.
