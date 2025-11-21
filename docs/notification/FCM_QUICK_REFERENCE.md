# FCM Notification Service - Quick Reference

## One-Page Cheat Sheet

### Timeline: How FCM Tokens Flow Through the App

```
┌─────────────────────────────────────────────────────────────────┐
│ REGISTRATION                                                    │
├─────────────────────────────────────────────────────────────────┤
│ User fills form → clicks "Create Account"                       │
│                              ↓                                  │
│ useRegister() mutation runs (via React Query)                   │
│                              ↓                                  │
│ onSuccess callback:                                             │
│   1. queryClient.setQueryData() → cache user                    │
│   2. syncFcmToken("web")       → get token & send to backend   │
│   3. router.push()             → navigate to dashboard          │
│                              ↓                                  │
│ Backend: userId → FCM_token mapping stored                      │
│ localStorage: "last_fcm_token" = FCM_token                      │
│                              ↓                                  │
│ ✅ User can receive notifications                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LOGIN                                                           │
├─────────────────────────────────────────────────────────────────┤
│ User enters email + password → clicks "Login"                   │
│                              ↓                                  │
│ useLogin() mutation runs                                        │
│                              ↓                                  │
│ onSuccess callback:                                             │
│   1. queryClient.setQueryData() → cache user                    │
│   2. syncFcmToken("web") checks:                                │
│      • Gets current token from Firebase                         │
│      • Reads "last_fcm_token" from localStorage                │
│      • If same? → Skip API call ✨ (smart!)                    │
│      • If different? → Send to backend                          │
│   3. router.push()             → navigate to dashboard          │
│                              ↓                                  │
│ Backend: userId → new FCM_token mapping                         │
│ localStorage: updated with new token                            │
│                              ↓                                  │
│ ✅ Device linked to this user account                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ APP OPEN (User already logged in)                               │
├─────────────────────────────────────────────────────────────────┤
│ User opens app (already logged in)                              │
│                              ↓                                  │
│ Root layout renders                                             │
│                              ↓                                  │
│ useSyncFcmOnMount() hook runs:                                  │
│   • useAuth() checks if user logged in                          │
│   • If yes → calls syncFcmToken()                               │
│   • Checks localStorage for last token                          │
│   • Only sends to backend if token changed                      │
│                              ↓                                  │
│ ✅ Token refreshed (if Firebase refreshed it)                  │
│ ✅ No redundant API calls (localStorage check)                 │
│ ✅ Device stays linked                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LOGOUT ⚠️  CRITICAL                                              │
├─────────────────────────────────────────────────────────────────┤
│ User clicks "Logout"                                            │
│                              ↓                                  │
│ useLogout() mutation runs                                       │
│                              ↓                                  │
│ mutationFn:                                                     │
│   1. unlinkFcmToken():                                          │
│      • Read "last_fcm_token" from localStorage                 │
│      • Send POST /notifications/unlink-token                   │
│      • Backend deletes: userId → FCM_token mapping             │
│      • Clear localStorage                                      │
│   2. authService.logout():                                      │
│      • Send POST /auth/logout                                  │
│      • Backend clears HTTP-only cookies                        │
│                              ↓                                  │
│ onSuccess callback:                                             │
│   • queryClient.clear() → clear all cached data                │
│   • router.push("/login") → back to login page                 │
│                              ↓                                  │
│ ✅ Device cleaned up, ready for next user!                    │
│ ✅ Old user won't get new user's notifications                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Function Reference

### Main Functions

#### `syncFcmToken(platform = "web"): Promise<boolean>`

**Use this** - Main function, handles everything

```typescript
// Called in: useRegister(), useLogin(), useSyncFcmOnMount()
const success = await syncFcmToken("web");

// What it does:
// 1. Register service worker
// 2. Get FCM token from Firebase
// 3. Check localStorage for last sent token
// 4. Only send to API if token changed
// 5. Save to localStorage
```

#### `unlinkFcmToken(): Promise<boolean>`

**Use this on logout** - Removes token from backend

```typescript
// Called in: useLogout() before logout
const success = await unlinkFcmToken();

// What it does:
// 1. Read token from localStorage
// 2. Send to backend for deletion
// 3. Clear localStorage
// CRITICAL: Prevents next user from getting alerts
```

#### `requestNotificationPermission(): Promise<boolean>`

**Request browser permission** - Optional, called automatically in syncFcmToken

```typescript
const granted = await requestNotificationPermission();
```

#### `areNotificationsEnabled(): boolean`

**Check permission status** - Returns true if user granted permission

```typescript
if (areNotificationsEnabled()) {
  // User has notifications enabled
}
```

---

## Code Structure

### Authentication Hooks (`src/hooks/useAuth.ts`)

```typescript
// Register
useRegister() → onSuccess → syncFcmToken() ✅

// Login
useLogin() → onSuccess → syncFcmToken() ✅

// Logout
useLogout() → mutationFn → unlinkFcmToken() ✅
           → onSuccess → queryClient.clear() + router.push()
```

### App Lifecycle (`src/hooks/useSyncFcmOnMount.ts`)

```typescript
useEffect(() => {
  if (user && !isLoading) {
    syncFcmToken("web"); // Sync when app opens and user logged in
  }
}, [user, isLoading]);
```

---

## localStorage Keys

```typescript
// Last token sent to backend
localStorage.getItem("last_fcm_token");
// Example: "c8v7Zx9nL2mPqR4tB1wXyZaB3dC2fG5hI8jK0lM9nO6pQ1rS4tU7v..."

// When it was saved
localStorage.getItem("fcm_token_timestamp");
// Example: "1700500000000" (milliseconds since epoch)

// Clear both on logout
localStorage.removeItem("last_fcm_token");
localStorage.removeItem("fcm_token_timestamp");
```

---

## API Endpoints (Your Backend)

### Register Token

```
POST /notifications/register-token
Headers:
  Content-Type: application/json
  Cookie: accessToken=...

Body:
{
  "token": "FCM_TOKEN_STRING",
  "platform": "web"
}

Response:
{
  "success": true,
  "message": "Token registered",
  "data": { ... }
}
```

### Unlink Token

```
POST /notifications/unlink-token
Headers:
  Content-Type: application/json
  Cookie: accessToken=...

Body:
{
  "token": "FCM_TOKEN_STRING"
}

Response:
{
  "success": true,
  "message": "Token unlinked"
}
```

---

## Common Scenarios

### Scenario 1: User Logs In, Then Logs Out, Then Another User Logs In

```
User A Login:
  └─ syncFcmToken() → token_A sent to backend
  └─ Backend: userId_A → token_A

User A Logout:
  └─ unlinkFcmToken() → POST /notifications/unlink-token
  └─ Backend: userId_A → (deleted)
  └─ localStorage cleared

User B Login:
  └─ syncFcmToken() → token_B sent to backend
  └─ Backend: userId_B → token_B
  └─ ✅ User A won't get User B's notifications
```

### Scenario 2: Same User Logs In, Browser Refreshes, Logs Out

```
User A Login:
  └─ syncFcmToken() → token_A sent, saved to localStorage

Browser Refresh:
  └─ useSyncFcmOnMount() runs
  └─ syncFcmToken() called
  └─ localStorage has token_A
  └─ Firebase returns token_A (same)
  └─ ✅ Skip API call (smart!)

User A Logout:
  └─ unlinkFcmToken() → uses token_A from localStorage
  └─ Backend deletes token_A
  └─ ✅ Token properly cleaned up
```

### Scenario 3: Firebase Refreshes Token

```
User A Login Day 1:
  └─ Firebase token_A → sent to backend
  └─ localStorage: token_A

App Opened Day 2:
  └─ Firebase refreshed: now token_B
  └─ syncFcmToken() checks:
     ├─ Current: token_B
     ├─ localStorage: token_A
     └─ Different! Send to backend
  └─ Backend: userId_A → token_B (updated)
  └─ localStorage: token_B (updated)
  └─ ✅ Old token replaced with new one
```

---

## Error Handling

All FCM operations are **fire-and-forget**:

```typescript
// Even if FCM sync fails, user isn't blocked
syncFcmToken("web").catch((err) => {
  console.warn("FCM sync failed (non-blocking):", err);
  // User still logs in, notifications just might not work
});

// Even if FCM unlink fails, user still logs out
unlinkFcmToken().catch((err) => {
  console.warn("FCM unlink failed (non-blocking):", err);
  // User still logs out, we clear localStorage anyway
});
```

---

## Integration Checklist

- [ ] Backend has `/notifications/register-token` endpoint
- [ ] Backend has `/notifications/unlink-token` endpoint
- [ ] Root layout calls `useSyncFcmOnMount()`
- [ ] `useLogin()` automatically calls `syncFcmToken()`
- [ ] `useRegister()` automatically calls `syncFcmToken()`
- [ ] `useLogout()` automatically calls `unlinkFcmToken()`
- [ ] Test all 4 scenarios above

---

## Key Takeaways

1. **Token syncing is automatic** - No manual management needed
2. **localStorage prevents spam** - Checks before sending to API
3. **Logout cleanup is critical** - Prevents notification leakage
4. **Fire-and-forget** - Never blocks user actions
5. **Four lifecycle events** - Register, Login, App Open, Logout

---

## Visual: Token State Machine

```
                              ┌─────────────────┐
                              │  App Launches   │
                              │  (user logged   │
                              │   in from       │
                              │  before)        │
                              └────────┬────────┘
                                       ↓
                        ┌──────────────────────────┐
                        │  useSyncFcmOnMount runs  │
                        │  syncFcmToken()          │
                        └────────┬─────────────────┘
                                 ↓
                    ┌────────────────────────────┐
                    │ Check localStorage         │
                    └────────┬───────────┬───────┘
                             ↓           ↓
                    ┌─────────────┐  ┌──────────────┐
                    │ Token same? │  │ Token changed│
                    │ Skip API    │  │ Send to API  │
                    │ ✅ Efficient│  │ ✅ Up-to-date│
                    └─────────────┘  └──────────────┘
                             │           │
                             └─────┬─────┘
                                   ↓
                        ┌──────────────────────┐
                        │ User can receive     │
                        │ notifications ✅     │
                        └──────────┬───────────┘
                                   ↓
        ┌──────────────────────────────────────────────┐
        │               User Logs Out                   │
        └────────────────┬─────────────────────────────┘
                         ↓
        ┌──────────────────────────────────────────────┐
        │     unlinkFcmToken() called                   │
        │     POST /notifications/unlink-token          │
        │     Backend deletes token mapping             │
        │     localStorage cleared                      │
        └────────────────┬─────────────────────────────┘
                         ↓
        ┌──────────────────────────────────────────────┐
        │  User logged out ✅                           │
        │  Device cleaned up for next user ✅           │
        └──────────────────────────────────────────────┘
```

---

## Testing Commands (Frontend Console)

```javascript
// Check localStorage
localStorage.getItem("last_fcm_token");

// Clear localStorage (simulate fresh device)
localStorage.removeItem("last_fcm_token");
localStorage.removeItem("fcm_token_timestamp");

// Check notification permission
Notification.permission;

// Request permission
Notification.requestPermission();
```

---

## Files You'll Be Working With

```
src/
├── hooks/
│   ├── useAuth.ts                    ← useLogin, useRegister, useLogout
│   └── useSyncFcmOnMount.ts          ← NEW: syncs on app open
├── services/
│   └── notification.service.ts       ← syncFcmToken, unlinkFcmToken
└── app/
    └── layout.tsx                    ← Add useSyncFcmOnMount()
```

Documentation:

```
├── FCM_NOTIFICATION_LIFECYCLE.md     ← Full detailed docs
├── IMPLEMENTATION_EXAMPLES.md        ← Code examples
└── NOTIFICATION_SERVICE_SUMMARY.md   ← Overview
```
