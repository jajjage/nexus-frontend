# Implementation Examples

This document shows how to integrate the notification service into your components.

---

## 1. Root Layout - Sync FCM on App Open

**File:** `src/app/layout.tsx`

```tsx
"use client";

import { useSyncFcmOnMount } from "@/hooks/useSyncFcmOnMount";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sync FCM token when app opens (if user already logged in)
  // This ensures the device token is still valid and linked to the user
  useSyncFcmOnMount();

  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 2. Login Form - Automatic FCM Sync After Login

**File:** `src/components/features/auth/login-form.tsx`

The `useLogin()` hook already handles FCM syncing automatically:

```tsx
"use client";

import { useLogin } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export function LoginForm() {
  const loginMutation = useLogin();
  // ✅ useLogin() automatically calls syncFcmToken() on success
  // You don't need to do anything extra!

  const onSubmit = (data) => {
    // 1. User fills form and clicks login
    loginMutation.mutate(data);
    // 2. Backend validates credentials
    // 3. On success: user data cached + FCM token synced + navigated to dashboard
    // All automatic! ✨
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* form fields */}
      <button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Logging in..." : "Login"}
      </button>
      {loginMutation.isError && (
        <p>{loginMutation.error?.response?.data?.message}</p>
      )}
    </form>
  );
}
```

---

## 3. Register Form - Automatic FCM Sync After Registration

**File:** `src/components/features/auth/register-form.tsx`

The `useRegister()` hook already handles FCM syncing automatically:

```tsx
"use client";

import { useRegister } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";

export function RegisterForm() {
  const registerMutation = useRegister();
  // ✅ useRegister() automatically calls syncFcmToken() on success
  // You don't need to do anything extra!

  const onSubmit = (data) => {
    // 1. User fills registration form and clicks create account
    registerMutation.mutate(data);
    // 2. Backend creates account
    // 3. On success: user data cached + FCM token synced + navigated to dashboard
    // All automatic! ✨
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* form fields */}
      <button type="submit" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
```

---

## 4. Logout - Automatic FCM Unlink Before Logout

**File:** (Use in any component that needs logout)

```tsx
"use client";

import { useLogout } from "@/hooks/useAuth";

export function LogoutButton() {
  const logoutMutation = useLogout();
  // ✅ useLogout() automatically calls unlinkFcmToken() before logout
  // You don't need to do anything extra!

  const handleLogout = () => {
    // 1. User clicks logout
    logoutMutation.mutate();
    // 2. FCM token unlinked from backend (prevents next user from getting alerts)
    // 3. User logged out and redirected to /login
    // All automatic and safe! ✨
  };

  return (
    <button onClick={handleLogout} disabled={logoutMutation.isPending}>
      {logoutMutation.isPending ? "Logging out..." : "Logout"}
    </button>
  );
}
```

---

## 5. Dashboard - Check Notification Permission

**File:** `src/app/dashboard/page.tsx`

```tsx
"use client";

import { areNotificationsEnabled } from "@/services/notification.service";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Check if notifications are enabled when component mounts
    const enabled = areNotificationsEnabled();
    setNotificationsEnabled(enabled);
  }, []);

  if (!notificationsEnabled) {
    return (
      <div className="p-4">
        <p>
          Notifications are disabled. Please enable them in your browser
          settings.
        </p>
        {/* Maybe show a button to request permission again */}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1>Welcome to Dashboard</h1>
      <p>✅ Notifications are enabled</p>
    </div>
  );
}
```

---

## 6. Request Notification Permission (Optional)

**File:** (Any component where you want to request permission)

```tsx
"use client";

import { requestNotificationPermission } from "@/services/notification.service";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function EnableNotificationsButton() {
  const [loading, setLoading] = useState(false);

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        // Sync the FCM token now that permission is granted
        // (It will be synced on next login anyway, but you can do it now)
        alert("Notifications enabled!");
      } else {
        alert("Notification permission denied");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleRequestPermission} disabled={loading}>
      {loading ? "Enabling..." : "Enable Notifications"}
    </Button>
  );
}
```

---

## 7. Custom Hook - Use Auth with Notifications

**File:** (If you want to combine auth checks with notification status)

```tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { areNotificationsEnabled } from "@/services/notification.service";

export function useAuthWithNotifications() {
  const auth = useAuth();
  const notificationsEnabled = areNotificationsEnabled();

  return {
    ...auth,
    notificationsEnabled,
  };
}

// Usage in a component:
export function MyComponent() {
  const { user, isAuthenticated, notificationsEnabled } =
    useAuthWithNotifications();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <p>User: {user?.fullName}</p>
      <p>
        Notifications: {notificationsEnabled ? "✅ Enabled" : "❌ Disabled"}
      </p>
    </div>
  );
}
```

---

## Complete User Journey Example

### Scenario: New User on Fresh Device

```
1. User visits landing page
   └─ App loads (no FCM sync since user not logged in)

2. User clicks "Create Account"
   └─ Navigates to /register

3. User fills registration form and submits
   └─ useRegister() triggered
   └─ Backend creates account
   └─ onSuccess callback:
      ├─ User data cached
      ├─ syncFcmToken("web") called
      │  ├─ Requests notification permission
      │  ├─ Gets FCM token from Firebase
      │  ├─ localStorage is empty (first time)
      │  ├─ Sends token to backend
      │  └─ Saves to localStorage
      └─ Navigation to /dashboard
   └─ Root layout useSyncFcmOnMount() also runs
      └─ Sees token in localStorage, skips API call ✅ (smart!)

4. User is on dashboard
   └─ App working normally
   └─ Backend can send push notifications

5. User closes browser

6. User opens app again next day (same device)
   └─ App loads
   └─ Root layout useSyncFcmOnMount() runs
   └─ syncFcmToken() checks:
      ├─ localStorage has token from yesterday
      ├─ Firebase returns same token (hasn't refreshed)
      └─ Skips API call (already synced) ✅ (efficient!)

7. User logs out
   └─ useLogout() triggered
   └─ unlinkFcmToken():
      ├─ Reads token from localStorage
      ├─ Sends to backend for deletion
      ├─ Backend removes mapping
      └─ Clears localStorage
   └─ authService.logout():
      └─ Backend clears cookies
   └─ Navigation to /login
   └─ Device is now clean, ready for next user
```

---

## Shared Device Scenario

### Why FCM Unlink is Critical

```
❌ BAD (without FCM unlink):

Device shared by User A and User B

Day 1:
  User A registers
    └─ Backend: userId_A → FCM_token_123
  User A logs out (but token NOT unlinked)
    └─ FCM_token_123 still linked to userId_A

Day 2:
  User B registers
    └─ Backend: userId_B → FCM_token_456 (new Firebase token)
  Backend STILL has: userId_A → FCM_token_123 (old link!)

Day 3:
  Company sends notification "User A, your order shipped!"
    └─ Backend looks up userId_A → FCM_token_123
    └─ Sends push notification
    └─ User B's device receives it! ❌ Security issue!


✅ GOOD (with FCM unlink):

Device shared by User A and User B

Day 1:
  User A registers
    └─ Backend: userId_A → FCM_token_123
  User A logs out
    └─ unlinkFcmToken() called
    └─ Backend deletes: userId_A → FCM_token_123
    └─ localStorage cleared

Day 2:
  User B registers
    └─ Backend: userId_B → FCM_token_456 (new Firebase token)
    └─ No old links to worry about

Day 3:
  Company sends notification "User A, your order shipped!"
    └─ Backend looks up userId_A
    └─ No token found (was deleted on logout)
    └─ Notification not sent ✅ Secure!
```

---

## Testing Checklist

### ✅ Test These Scenarios

1. **Registration with FCM:**
   - [ ] Register new account
   - [ ] Check browser notification permission request appears
   - [ ] Grant permission
   - [ ] Check backend has FCM token registered
   - [ ] Check localStorage has token saved

2. **Login with FCM:**
   - [ ] Clear localStorage (simulate fresh login)
   - [ ] Log in
   - [ ] Check FCM token synced to backend
   - [ ] Check localStorage has token saved

3. **App Refresh with FCM:**
   - [ ] Log in (token saved)
   - [ ] Refresh page
   - [ ] Check localStorage STILL has token
   - [ ] Check network tab: /notifications/register-token NOT called (smart skip!)
   - [ ] Token wasn't redundantly sent

4. **Token Refresh from Firebase:**
   - [ ] Log in
   - [ ] Clear browser storage (Force new FCM token)
   - [ ] Refresh page
   - [ ] Check NEW token sent to backend
   - [ ] Old token mapping removed

5. **Logout with FCM Unlink:**
   - [ ] Log in
   - [ ] Check backend has token
   - [ ] Click logout
   - [ ] Check network: /notifications/unlink-token called
   - [ ] Check backend token deleted
   - [ ] Check localStorage cleared

6. **Shared Device (Critical):**
   - [ ] User A logs in
   - [ ] User A logs out
   - [ ] User B logs in
   - [ ] Send test notification to User A
   - [ ] Verify User B does NOT receive it ✅
