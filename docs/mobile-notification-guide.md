# Mobile Notifications Guide

This guide covers the implementation of the Notification Center and the Home Screen Banner logic.

## 1. Notification Types & Categories

Notifications are structured with specific types and categories that determine where and how they are displayed.

```typescript
interface Notification {
  id: string;
  created_at: string;
  read: boolean;
  notification: {
    title: string;
    body: string;
    type: "info" | "success" | "warning" | "error" | "alert";
    category: "all" | "updates" | "transaction" | "system";
  };
}
```

## 2. Home Screen Banner Logic

The Banner on the dashboard home screen is **filtered**. It does not show every notification.

- **Filter Criteria:** Only show notifications where `category` is `"updates"` OR `"all"`.
- **Purpose:** Critical announcements, app updates, or maintenance alerts.
- **Dismissal:**
  - Web implementation uses local state (dismissing hides it for the session).
  - **Mobile Recommendation:** Store dismissed IDs in `AsyncStorage` to keep them hidden across app restarts, or implement "Session-only" dismissal if preferred.

## 3. Notification Page Logic

The specific route `/dashboard/notifications` displays the full list.

### Features to Implement

1.  **Tabs:**
    - **All:** Shows full list.
    - **Unread:** Filters locally: `notifications.filter(n => !n.read)`.

2.  **Actions:**
    - **Mark as Read:** Single item tap or swipe action.
    - **Mark All Read:** Button in header (only if `unreadCount > 0`).
    - **Delete:** Remove item from list.

3.  **UI States:**
    - **Unread Styling:** Highlight background (e.g., light blue `bg-blue-50`) + "New" Badge.
    - **Read Styling:** Standard white/transparent background.
    - **Empty State:** Centered bell icon with "You're all caught up" text.

### Visual Coding (Iconography)

Map `notification.type` to specific icons/colors:

| Type              | Icon          | Color        |
| ----------------- | ------------- | ------------ |
| `info`            | Info          | Blue         |
| `success`         | CheckCircle   | Green        |
| `warning`         | AlertTriangle | Yellow/Amber |
| `error` / `alert` | AlertCircle   | Red          |

## 4. API Hooks Reference

**File:** `src/hooks/useNotifications.ts`

| Hook                              | Operation                      | Notes                                              |
| --------------------------------- | ------------------------------ | -------------------------------------------------- |
| `useNotifications()`              | `GET /notifications`           | Returns `{ data: { notifications, unreadCount } }` |
| `useMarkNotificationAsRead()`     | `PUT /notifications/{id}/read` | Optimistically updates cache                       |
| `useMarkAllNotificationsAsRead()` | `PUT /notifications/read-all`  | Refetch list on success                            |
| `useDeleteNotification()`         | `DELETE /notifications/{id}`   | Removes from list                                  |

## 5. Mobile Adaptation (React Native / Expo)

### Replace "Toasts"

The web app uses `sonner` for toasts. On mobile:

- **Success:** Use a subtle in-app notification header or a native-like snackbar.
- **Error:** Use `Alert.alert()` for critical failures or a red snackbar.

### Swipe Actions

Instead of cluttering the UI with trash/check icons on every row:

- **Swipe Right:** Mark as Read.
- **Swipe Left:** Delete.
- **Library Recommendation:** `react-native-swipe-list-view` or `react-native-reanimated` swipeable rows.

### Badge Count

- Use `useUnreadNotificationCount()` hook to fetch the integer count.
- Display this badge on the **Bell Icon** (Top Bar) and the **Bottom Tab Bar**.

### Pull-to-Refresh

Ensure the `FlatList` component on this page supports `refreshControl` to call `refetch()` from the `useNotifications` hook.
