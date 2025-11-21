# FCM Token Lifecycle & Notification Service Documentation

## Overview

The notification service manages Firebase Cloud Messaging (FCM) token registration throughout the user's app lifecycle. This prevents notifications from being delivered to the wrong users on shared devices.

---

## Architecture & Flow

### 1. Key Functions in `notification.service.ts`

#### `syncFcmToken(platform = "web")`

**Main function to use** - Intelligently syncs FCM token with backend

```typescript
// Smart sync that checks localStorage to avoid redundant API calls
const success = await syncFcmToken("web");
```

**Flow:**

1. Gets current FCM token from Firebase
2. Checks localStorage for previously sent token
3. **Only sends to API if token has changed** (prevents spam)
4. Saves token to localStorage for future comparisons

**Returns:** `boolean` - true if sync succeeded or already synced

---

#### `unlinkFcmToken()`

Removes FCM token from backend before logout

```typescript
// Call during logout to prevent next user from getting alerts
await unlinkFcmToken();
```

**Important:** Must be called **before user logs out** to prevent:

- Next user on same device receiving notifications for previous user
- Security issue: alerts meant for one user reaching another

**Returns:** `boolean` - true if unlink succeeded

---

#### `requestNotificationPermission()`

Requests browser notification permission from user

```typescript
const granted = await requestNotificationPermission();
```

---

#### `areNotificationsEnabled()`

Checks if notifications are currently permitted

```typescript
if (areNotificationsEnabled()) {
  // User has granted notification permission
}
```

---

## Lifecycle Events & Implementation

### Event 1: User Registration ✅ Establish First Link

**When:** After successful registration

**Why:** User just created account on this device, need to establish link

**Where:** `useRegister()` hook in `hooks/useAuth.ts`

```typescript
export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: async (data) => {
      // Cache user data
      queryClient.setQueryData(authKeys.currentUser(), data.data?.user);

      // 👇 NEW: Sync FCM token to establish first link
      syncFcmToken("web").catch((err) => {
        console.warn("FCM sync failed (non-blocking):", err);
      });

      // Navigate to dashboard
      router.push("/dashboard");
    },
  });
};
```

**Execution Timeline:**

```
User fills form → Submit → API registers user → User data cached
    ↓
Browser returns FCM token → Sent to /notifications/register-token
    ↓
Backend stores: userId → FCM token mapping
    ↓
User navigated to dashboard (doesn't wait for FCM)
```

---

### Event 2: User Login 🔗 Link Device to Account

**When:** After successful login

**Why:** User logging in on this device, need to link device to this account

**Where:** `useLogin()` hook in `hooks/useAuth.ts`

```typescript
export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: async (data: any) => {
      // Cache user data
      queryClient.setQueryData(authKeys.currentUser(), data.data?.user);

      // 👇 IMPROVED: Sync FCM token (smart checking via localStorage)
      syncFcmToken("web").catch((err) => {
        console.warn("FCM sync failed (non-blocking):", err);
      });

      // Navigate to dashboard
      router.push("/dashboard");
    },
  });
};
```

**Execution Timeline:**

```
User enters credentials → Submit → API validates → User data returned
    ↓
Tokens stored in HTTP-only cookies
    ↓
syncFcmToken() called:
  ├─ Get current token from Firebase
  ├─ Check localStorage for last sent token
  └─ Only send to API if different (smart!)
    ↓
Backend updates: device FCM token → new userId (unlinks from old user)
    ↓
localStorage updated with new token
    ↓
User navigated to dashboard
```

**Smart Check Example:**

```
Scenario 1: Fresh login on new device
├─ localStorage has no token
├─ syncFcmToken() gets token from Firebase
├─ Calls API to register: POST /notifications/register-token
├─ Saves to localStorage
└─ ✅ API call made

Scenario 2: User already logged in, browser refreshes
├─ localStorage has token from earlier
├─ syncFcmToken() gets token from Firebase
├─ Token matches localStorage
├─ Skips API call (token already registered)
└─ ✅ No redundant API call
```

---

### Event 3: App Opens 🔄 Ensure Token Validity

**When:** App loads (if user already logged in)

**Why:** Token might have expired/refreshed, need to ensure device is still linked

**Where:** `useSyncFcmOnMount()` hook in `hooks/useSyncFcmOnMount.ts`

```typescript
// NEW HOOK
export function useSyncFcmOnMount() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Only sync if user is authenticated
    if (!isLoading && user) {
      syncFcmToken("web").catch((err) => {
        console.warn("FCM sync on app open failed (non-blocking):", err);
      });
    }
  }, [user, isLoading]);
}
```

**Usage in your layout:**

```tsx
// src/app/layout.tsx
import { useSyncFcmOnMount } from "@/hooks/useSyncFcmOnMount";

export default function RootLayout({ children }) {
  useSyncFcmOnMount(); // Sync FCM when app opens

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

**Execution Timeline:**

```
App opens (user already logged in)
    ↓
useSyncFcmOnMount runs
    ↓
syncFcmToken() called:
  ├─ Gets current FCM token
  ├─ Checks localStorage
  ├─ If token changed (Firebase refreshed it):
  │  └─ Sends new token to backend
  └─ If token same: skips API call
    ↓
Device remains properly linked with latest token
```

---

### Event 4: User Logout ⚠️ CRITICAL - Remove Token Link

**When:** User clicks logout button

**Why:** **CRITICAL SECURITY**: Prevent next user on same device from receiving alerts

**Where:** `useLogout()` hook in `hooks/useAuth.ts`

```typescript
export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      // 👇 IMPORTANT: Unlink token BEFORE logout
      // Prevents next user from getting alerts meant for current user
      unlinkFcmToken().catch((err) => {
        console.warn("FCM unlink failed (non-blocking):", err);
      });

      // Call logout endpoint
      return authService.logout();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Navigate to login
      router.push("/login");
    },
  });
};
```

**Execution Timeline:**

```
User clicks logout button
    ↓
useLogout mutation triggered
    ↓
unlinkFcmToken() called:
  ├─ Reads token from localStorage
  ├─ Sends POST /notifications/unlink-token
  ├─ Backend deletes/deactivates token
  └─ Clears localStorage
    ↓
authService.logout() called
    ↓
Backend clears HTTP-only cookies (tokens)
    ↓
React Query cache cleared
    ↓
User redirected to /login
    ↓
Next user logs in, gets new device mapping ✅
```

**Why This Matters:**

```
❌ WITHOUT unlinkFcmToken():
User A logs in on shared device
  └─ Backend: userId_A → FCM_token_123
User A logs out
  └─ FCM_token_123 still linked to userId_A
User B logs in on same device
  └─ New FCM_token_456 created
  └─ But old token_123 still sends alerts to User A!

✅ WITH unlinkFcmToken():
User A logs in on shared device
  └─ Backend: userId_A → FCM_token_123
User A logs out
  └─ unlinkFcmToken() removes mapping
  └─ Backend: FCM_token_123 deleted
User B logs in on same device
  └─ New FCM_token_456 created
  └─ Properly linked to userId_B
  └─ User A doesn't receive notifications ✅
```

---

## localStorage Keys

### `last_fcm_token`

Stores the last FCM token sent to backend

```typescript
localStorage.getItem("last_fcm_token");
// Returns: "c8v7Zx9nL2mPqR4tB1wXyZaB..." or null
```

### `fcm_token_timestamp`

Stores timestamp when token was last saved

```typescript
localStorage.getItem("fcm_token_timestamp");
// Returns: "1700000000000" (milliseconds since epoch)
```

---

## API Endpoints Required (Backend)

### 1. Register FCM Token

```
POST /notifications/register-token
Content-Type: application/json
Cookie: accessToken=...

{
  "token": "FCM_TOKEN_STRING",
  "platform": "web" // or "android", "ios"
}

Response:
{
  "success": true,
  "message": "Token registered successfully",
  "data": { ... }
}
```

### 2. Unlink FCM Token

```
POST /notifications/unlink-token
Content-Type: application/json
Cookie: accessToken=...

{
  "token": "FCM_TOKEN_STRING"
}

Response:
{
  "success": true,
  "message": "Token unlinked successfully"
}
```

---

## Data Flow Diagrams

### Complete Login → Notification Setup Flow

```
┌─────────────────────────────────────┐
│ LoginForm Component                 │
│ User enters email + password        │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ useLogin() mutation                 │
│ mutationFn: authService.login()     │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Backend validates & returns:        │
│ - accessToken                       │
│ - refreshToken                      │
│ - user object                       │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ onSuccess callback:                 │
│ 1. Cache user data                  │
│ 2. Call syncFcmToken()              │
│ 3. Navigate to dashboard            │
└────────────┬────────────────────────┘
             ↓
         ┌───┴───┐
         ↓       ↓
    ┌────────┐ ┌──────────────────────┐
    │ Cache  │ │ syncFcmToken()       │
    │ Update │ │                      │
    │ Quick  │ │ ┌──────────────────┐ │
    └────────┘ │ │1. Get FCM token  │ │
                │ │   from Firebase  │ │
                │ └────────┬─────────┘ │
                │          ↓           │
                │ ┌──────────────────┐ │
                │ │2. Check localStorage
                │ │   for last token │ │
                │ └────────┬─────────┘ │
                │          ↓           │
                │ ┌──────────────────┐ │
                │ │3. Compare tokens │ │
                │ │   - Same? Skip   │ │
                │ │   - Different?   │ │
                │ │     Send to API  │ │
                │ └────────┬─────────┘ │
                │          ↓           │
                │ ┌──────────────────┐ │
                │ │4. Save to        │ │
                │ │   localStorage   │ │
                │ └──────────────────┘ │
                └──────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Backend stores mapping:             │
│ userId_123 → FCM_token_abc123       │
└─────────────────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ User navigated to dashboard         │
│ (without waiting for FCM)           │
└─────────────────────────────────────┘
```

### Logout & Token Cleanup Flow

```
┌─────────────────────────────────────┐
│ User clicks Logout button           │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ useLogout() mutation triggered      │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ mutationFn executes:                │
│ 1. Call unlinkFcmToken()            │
│ 2. Call authService.logout()        │
└────────────┬────────────────────────┘
             ↓
         ┌───┴───────────────┐
         ↓                   ↓
    ┌──────────────┐   ┌──────────────────┐
    │unlinkFcmToken│   │authService.logout│
    │              │   │                  │
    │1. Read token │   │- Clear cookies   │
    │   from       │   │- Invalidate      │
    │   localStorage    │  refresh token   │
    │              │   │- Return response │
    │2. Send POST  │   └──────────────────┘
    │   /unlink-   │
    │   token      │
    │              │
    │3. Backend    │
    │   deletes    │
    │   mapping    │
    │              │
    │4. Clear      │
    │   localStorage
    └──────────────┘
             ↓
┌─────────────────────────────────────┐
│ onSuccess callback:                 │
│ 1. Clear React Query cache          │
│ 2. Navigate to /login               │
└─────────────────────────────────────┘
```

---

## Integration Checklist

### ✅ To implement this notification flow:

- [ ] **Backend ready with endpoints:**
  - [ ] `POST /notifications/register-token`
  - [ ] `POST /notifications/unlink-token`

- [ ] **Frontend updated:**
  - [ ] `notification.service.ts` - Updated with syncFcmToken & unlinkFcmToken
  - [ ] `hooks/useAuth.ts` - useLogin & useRegister call syncFcmToken
  - [ ] `hooks/useAuth.ts` - useLogout calls unlinkFcmToken
  - [ ] `hooks/useSyncFcmOnMount.ts` - NEW hook created
  - [ ] App layout - calls useSyncFcmOnMount()

- [ ] **Testing:**
  - [ ] Test registration → check backend token stored
  - [ ] Test login → check token synced
  - [ ] Test app refresh → check localStorage prevents duplicate API calls
  - [ ] Test logout → check token deleted from backend
  - [ ] Test shared device scenario → old user doesn't receive new user's alerts

---

## Error Handling

All FCM operations are **fire-and-forget** with error logging:

```typescript
// If FCM sync fails, user isn't blocked
syncFcmToken("web").catch((err) => {
  console.warn("FCM sync failed (non-blocking):", err);
  // User continues to use app - notifications might not work, but app does
});

// Same for logout - even if FCM unlink fails, user still logs out
unlinkFcmToken().catch((err) => {
  console.warn("FCM unlink failed (non-blocking):", err);
  // User still logs out - we try to clean up, but don't block on it
});
```

---

## Key Takeaways

1. **syncFcmToken()** - Use this as main function, handles all the smart logic
2. **unlinkFcmToken()** - CRITICAL on logout to prevent notification leakage
3. **localStorage** - Prevents duplicate API calls by tracking last sent token
4. **Fire-and-forget** - Never block user actions on FCM operations
5. **Multi-event** - Token synced on: Register, Login, App Open
6. **Security** - Token must be removed on logout for shared devices
