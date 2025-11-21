# Notification Service Updates - Summary

## What Was Done

Enhanced the FCM (Firebase Cloud Messaging) notification service with intelligent token synchronization and lifecycle management.

---

## Files Modified/Created

### 📝 Modified Files

1. **`src/services/notification.service.ts`**
   - ✅ Added `syncFcmToken()` - Main function with localStorage checking
   - ✅ Added `unlinkFcmToken()` - Removes token on logout (critical for security)
   - ✅ Added helper functions for localStorage management
   - ✅ Kept `registerFcmToken()` for backward compatibility (calls syncFcmToken)
   - ✅ Added `areNotificationsEnabled()` - Check permission status

2. **`src/hooks/useAuth.ts`**
   - ✅ Updated import to use `syncFcmToken` and `unlinkFcmToken`
   - ✅ Updated `useRegister()` - Calls syncFcmToken after registration
   - ✅ Updated `useLogin()` - Calls syncFcmToken after login
   - ✅ Updated `useLogout()` - Calls unlinkFcmToken before logout

### 📄 New Files Created

3. **`src/hooks/useSyncFcmOnMount.ts`** (NEW)
   - Hook for syncing FCM token when app opens
   - Use in root layout to sync if user already logged in
   - Prevents stale tokens after app restart

4. **`FCM_NOTIFICATION_LIFECYCLE.md`** (NEW)
   - Complete documentation of notification lifecycle
   - Explains all 4 user events: Register, Login, App Open, Logout
   - Shows flow diagrams and API endpoint requirements
   - Critical security info about shared devices

5. **`IMPLEMENTATION_EXAMPLES.md`** (NEW)
   - Code examples for integrating in components
   - Shows how to use in Login, Register, Logout, etc.
   - Complete user journey examples
   - Testing checklist

---

## Key Features

### 1. Smart Token Syncing

```typescript
// Before: Always sent token to backend
await registerFcmToken(); // ❌ Redundant API calls

// After: Only sends if token changed
await syncFcmToken(); // ✅ Checks localStorage first
```

**What it does:**

- Gets current FCM token from Firebase
- Checks if we already sent this token
- Only sends to backend if different
- Prevents API spam on app refreshes

### 2. Four Lifecycle Events

| Event        | Function                             | Purpose                                      |
| ------------ | ------------------------------------ | -------------------------------------------- |
| **Register** | `syncFcmToken()` in `useRegister()`  | Establish first device link                  |
| **Login**    | `syncFcmToken()` in `useLogin()`     | Link device to user account                  |
| **App Open** | `useSyncFcmOnMount()` in root layout | Verify token still valid                     |
| **Logout**   | `unlinkFcmToken()` in `useLogout()`  | ⚠️ Critical: Remove token to prevent leakage |

### 3. localStorage Optimization

```typescript
// Storage keys:
localStorage.getItem("last_fcm_token"); // "abc123..."
localStorage.getItem("fcm_token_timestamp"); // "1700000000000"

// Smart comparison:
const currentToken = await getTokenFromFirebase();
const lastToken = localStorage.getItem("last_fcm_token");

if (currentToken === lastToken) {
  return true; // ✅ Skip API call (already synced)
}

// Token changed, send to backend
await apiClient.post("/notifications/register-token", {
  token: currentToken,
  platform: "web",
});

localStorage.setItem("last_fcm_token", currentToken);
```

### 4. Logout Security 🔒

**Critical for shared devices:**

```typescript
// WITHOUT unlinkFcmToken():
// User A logs out → token still linked to User A
// User B logs in → still gets User A's notifications! ❌

// WITH unlinkFcmToken():
// User A logs out → calls unlinkFcmToken()
// Backend deletes token mapping
// User B logs in → gets clean mapping ✅
```

---

## Implementation Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                   User Journey                       │
└─────────────────────────────────────────────────────┘

1. USER REGISTERS
   └─ useRegister() → onSuccess → syncFcmToken()
      └─ Gets FCM token
      └─ Sends to backend: POST /notifications/register-token
      └─ Saves to localStorage
   ✅ Device linked to new user account

2. USER LOGS IN
   └─ useLogin() → onSuccess → syncFcmToken()
      └─ Gets FCM token
      └─ Compares with localStorage
      └─ Sends only if different
   ✅ Device linked to this user account

3. USER OPENS APP (NEXT DAY)
   └─ useSyncFcmOnMount() runs in layout
      └─ Calls syncFcmToken()
      └─ Checks localStorage
      └─ Skips API call if token same ✨
   ✅ Token refreshed from Firebase if needed

4. USER LOGS OUT ⚠️ CRITICAL
   └─ useLogout() → mutationFn → unlinkFcmToken()
      └─ Reads token from localStorage
      └─ Sends to backend: POST /notifications/unlink-token
      └─ Backend deletes token mapping
      └─ Clears localStorage
   └─ Then calls authService.logout()
   └─ Then navigates to /login
   ✅ Device cleaned up for next user
```

---

## API Endpoints Required

Your backend needs to handle these endpoints:

### 1. Register Token

```
POST /notifications/register-token
```

Called on: Register, Login, App Open
Purpose: Store device's FCM token linked to user

### 2. Unlink Token

```
POST /notifications/unlink-token
```

Called on: Logout
Purpose: Remove token before logout to prevent next user from getting alerts

---

## Usage in Your App

### In Root Layout (App opens)

```tsx
import { useSyncFcmOnMount } from "@/hooks/useSyncFcmOnMount";

export default function RootLayout({ children }) {
  useSyncFcmOnMount(); // ← Add this line
  return <html>{children}</html>;
}
```

### In Login Component

Already handled! `useLogin()` automatically syncs FCM token.

### In Register Component

Already handled! `useRegister()` automatically syncs FCM token.

### In Logout Button

Already handled! `useLogout()` automatically unlinks FCM token.

---

## Benefits

### ✅ Performance

- No redundant API calls (checks localStorage)
- App responds faster
- Reduced server load

### ✅ Security

- Tokens unlinked on logout
- Prevents notification leakage on shared devices
- Prevents alerts from going to wrong users

### ✅ User Experience

- Non-blocking (fire-and-forget)
- Notifications work seamlessly
- No manual token management needed

### ✅ Maintainability

- Single source of truth: `syncFcmToken()`
- Clear separation of concerns
- Well documented lifecycle

---

## Testing Quick Checklist

- [ ] User registers → FCM token sent to backend
- [ ] User logs in → FCM token synced
- [ ] App refresh → No redundant API call (localStorage prevents it)
- [ ] User logs out → FCM token deleted from backend
- [ ] Shared device test → Old user doesn't get new user's alerts

---

## Files to Review

1. **`FCM_NOTIFICATION_LIFECYCLE.md`** - Full detailed documentation
2. **`IMPLEMENTATION_EXAMPLES.md`** - Code examples and usage patterns
3. **`src/services/notification.service.ts`** - Implementation
4. **`src/hooks/useAuth.ts`** - Integration in auth hooks
5. **`src/hooks/useSyncFcmOnMount.ts`** - App open syncing

---

## Migration from Old Code

If you were using `registerFcmToken()` before:

```typescript
// Old code (still works, but suboptimal):
await registerFcmToken("web");

// New code (better):
await syncFcmToken("web");
// Automatically checks localStorage and skips if already synced
```

The old function still exists for backward compatibility, but now it just calls the new one.

---

## Summary

The notification service now has:
✅ Intelligent token syncing (checks localStorage)
✅ Four lifecycle events handled (Register, Login, App Open, Logout)
✅ Critical logout cleanup to prevent notification leakage
✅ Fire-and-forget architecture (never blocks user)
✅ Comprehensive documentation
✅ Implementation examples
✅ Zero breaking changes
