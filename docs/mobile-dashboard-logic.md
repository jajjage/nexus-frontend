# Mobile Dashboard Logic & Hooks Guide

This guide documents the core logic, API endpoints, and React Hooks used in the `UserDashboard` for mobile app implementation.

## 1. Key Navigation Links

These routes correspond to the main actions available on the dashboard home screen.

| Action                 | Web Route                      | Purpose                                    |
| ---------------------- | ------------------------------ | ------------------------------------------ |
| **Transactions**       | `/dashboard/transactions`      | Full history of all wallet transactions    |
| **Notifications**      | `/dashboard/notifications`     | List of all system alerts and messages     |
| **Rewards**            | `/dashboard/rewards`           | User rewards and referral bonuses          |
| **Profile**            | `/dashboard/profile`           | User settings, security, and personal info |
| **Transfer**           | `/dashboard/transfer`          | Send money functionality                   |
| **Airtime**            | `/dashboard/airtime`           | Purchase airtime                           |
| **Data**               | `/dashboard/data`              | Purchase data bundles                      |
| **Bills**              | `/dashboard/bills`             | Pay utilities and bills                    |
| **Transaction Detail** | `/dashboard/transactions/[id]` | View specific receipt for a transaction    |

---

## 2. API Hooks Reference

The frontend uses **TanStack Query (React Query)** for all data fetching. Below are the specific hooks you will need to implement in the mobile app.

### Authentication & User Profile

**File:** `src/hooks/useAuth.ts`

| Hook          | Purpose           | Key Data / Actions                                  |
| ------------- | ----------------- | --------------------------------------------------- |
| `useAuth()`   | Global auth state | `user`, `isAuthenticated`, `isLoading`, `refetch()` |
| `useLogout()` | Sign out          | Clears session and redirects to login               |
| `useLogin()`  | Sign in           | `login(credentials)`                                |

**User Object Structure (`user`):**

```typescript
{
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "user" | "admin" | "reseller";
  balance: string; // "1000.00"
  virtualAccountNumber: string;
  virtualAccountBankName: string;
  virtualAccountAccountName: string;
  profilePictureUrl?: string;
  hasPin: boolean;
  // ...other fields
}
```

### Wallet & Transactions

**File:** `src/hooks/useWallet.ts`

| Hook                      | Purpose           | Usage / Parameters                           |
| ------------------------- | ----------------- | -------------------------------------------- |
| `useWalletBalance()`      | Real-time balance | Fetches just the balance text string         |
| `useRecentTransactions()` | Dashboard list    | Fetches last 10 transactions for home screen |
| `useTransactions()`       | Full history      | Params: `{ page, filters... }`               |
| `useTransaction(id)`      | Receipt detail    | Fetches single transaction by ID             |

**Hooks Source Location:**

- `src/hooks/useWallet.ts`

### Notifications

**File:** `src/hooks/useNotifications.ts`

| Hook                           | Purpose           | Usage                                 |
| ------------------------------ | ----------------- | ------------------------------------- |
| `useUnreadNotificationCount()` | Bell badge        | Polls every 30s for count (e.g., "5") |
| `useNotifications()`           | Notification list | Fetches full list of notifications    |
| `useMarkAsRead(id)`            | Action            | Marks single item as read             |
| `useMarkAllAsRead()`           | Action            | Marks all items as read               |

**Hooks Source Location:**

- `src/hooks/useNotifications.ts`

### User Settings & Security

**File:** `src/hooks/useUser.ts`

| Hook                  | Purpose  | Usage                                      |
| --------------------- | -------- | ------------------------------------------ |
| `useSetPin()`         | Security | Sets transaction PIN (`{ pin, password }`) |
| `useUpdateProfile()`  | Profile  | Updates name, phone, etc.                  |
| `useUpdatePassword()` | Security | Changes login password                     |

---

## 3. Important Logic Implementation Details

### Session Recovery (Self-Healing)

In `UserDashboard.tsx` (Lines 79-90), there is logic to handle "session recovery".

- **Problem:** Authenticated cookie exists, but user data is missing in memory.
- **Mobile Solution:** If `isAuthenticated` is true but `user` object is null, trigger `useAuth().refetch()` **once**. Do not loop infinitely.

### Balance Visibility Logic

- **Persistence:** Save visibility state to `AsyncStorage` (or equivalent).
- **Default:** Default to `true` (visible).
- **Masking:** When hidden (`false`), display `••••••••` instead of the balance string.

### Transaction "Blur" Privacy Mode

- When balance is hidden, the transaction list on the dashboard is also visually obscured.
- **Mobile Implementation:** Apply a blur view (e.g., `BlurView` from Expo) over the list or simply hide the items and show a "Hidden" placeholder text.

### Admin Redirect

- **Logic:** If `user.role === 'admin'`, they should not interact with the User Dashboard.
- **Mobile Action:** Show an "Access Denied" screen or redirect to an Admin specific view if built.

## 4. API Service & Types Sources

For exact API request/response types and endpoint URLs, refer to these services:

- **Auth Service:** `src/services/auth.service.ts`
- **Wallet Service:** `src/services/wallet.service.ts`
- **Notification Service:** `src/services/notifications.service.ts`
- **User Service:** `src/services/user.service.ts`

All service files use a shared `api-client.ts` instance for Axios configuration (interceptors, base URL).
