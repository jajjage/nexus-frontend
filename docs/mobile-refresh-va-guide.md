# Mobile Refresh & Virtual Account Guide

This document covers two critical dashboard features: the global "Pull-to-Refresh" strategy and the "Add Money" (Virtual Account) workflow.

## 1. Pull-to-Refresh Strategy

The dashboard relies on real-time data. The mobile app should implement a `RefreshControl` on the main `ScrollView` that triggers a refetch of these key data points.

### What to Refetch

When the user pulls down, you must invalidate or refetch the following query keys to ensure all data is fresh:

| Data Point              | Query Key                           | Hook Source                    |
| ----------------------- | ----------------------------------- | ------------------------------ |
| **Wallet Balance**      | `['wallet', 'balance']`             | `useWalletBalance()`           |
| **Transaction History** | `['wallet', 'transactions']`        | `useRecentTransactions()`      |
| **User Profile**        | `['auth', 'current-user']`          | `useAuth()`                    |
| **Notifications**       | `['notifications', 'unread-count']` | `useUnreadNotificationCount()` |

### Implementation Pattern (React Native + React Query)

```typescript
const { refetch: refetchBalance } = useWalletBalance();
const { refetch: refetchTransactions } = useRecentTransactions();
const { refetch: refetchUser } = useAuth();

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  try {
    // Run all refetches in parallel
    await Promise.all([
      refetchBalance(),
      refetchTransactions(),
      refetchUser(),
      // ...others
    ]);
  } finally {
    setRefreshing(false);
  }
}, []);

return (
  <ScrollView refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }>
    {/* Dashboard Content */}
  </ScrollView>
);
```

---

## 2. "Add Money" (Virtual Account) Workflow

This feature allows users to fund their wallet via bank transfer. It handles two states:

1.  **Account Exists:** Show details (Copy/Share).
2.  **Account Missing:** Generate one on the fly.

### A. The "Account Missing" Flow (Generation)

If `user.virtualAccountNumber` is null/empty when the user clicks "Add Money":

1.  **UI State:** Show a **Loading/Creating** modal immediately.
    - _Message:_ "Creating your virtual account... This may take a few seconds."
    - _Icon:_ Spinner / Loader.

2.  **API Call:** Trigger the creation endpoint.
    - **Endpoint:** `POST /user/virtual-account`
    - **Payload:** `{}` (Empty object, no BVN required currently).
    - **Hook:** `useMutation` calling `userService.createVirtualAccount({})`.

3.  **On Success:**
    - **Critical:** Refetch the **User Profile** immediately (`useAuth().refetch()`).
    - The backend will return the new account details in the user object.
    - **UI Transition:** Switch the modal view from "Loading" to "Account Details" once the new user data is loaded.

### B. The "Account Exists" Flow (Display)

If `user.virtualAccountNumber` exists:

1.  **UI State:** Show **Account Details** modal directly.

2.  **Display Fields:**
    - **Bank Name:** `user.virtualAccountBankName` (e.g., "Wema Bank")
    - **Account Number:** `user.virtualAccountNumber` (Display large & copyable)
    - **Account Name:** `user.virtualAccountAccountName` (User's full name)

3.  **Actions:**
    - **Copy Button:** Copies number to clipboard.
    - **Share Button:** Uses native share sheet to share details text.

### Logic Summary Table

| Condition                     | Action                                        | API Call                             |
| ----------------------------- | --------------------------------------------- | ------------------------------------ |
| `!virtualAccountNumber`       | specific modal opens -> Auto-trigger creation | `POST /user/virtual-account`         |
| `virtualAccountNumber` exists | Open modal with details                       | None (Data already in `user` object) |

### API Reference

**Service:** `src/services/user.service.ts`

```typescript
// Create Virtual Account
createVirtualAccount: async (data: {}) => {
  return apiClient.post("/user/virtual-account", data);
};
```

### Mobile UI Recommendations

- Use a **Modal** or **Bottom Sheet** for this feature.
- Use `Clipboard.setStringAsync` (Expo Clipboard) for copying.
- Use `Share.share` (React Native) for sharing the details.
- Store the "Attempted Creation" flag in a `useRef` or state to prevent duplicate API calls if the modal re-renders.
