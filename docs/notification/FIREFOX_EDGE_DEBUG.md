# Firefox & Edge Notification Debugging Guide

Since Chrome works but Edge/Firefox don't, this guide focuses on the specific differences.

## Quick Diagnosis

### Test in Each Browser

**Chrome (Baseline - Should Work):**

```
✅ App open: Toast notification + system notification in notification center
✅ App closed: System notification appears
✅ Click notification: Navigates to detail page
```

**Edge (Currently Not Working):**

```
❌ Notifications not showing even when app is closed
? Check Windows notification settings
? Check Service Worker status
```

**Firefox (Currently Not Working):**

```
❌ Notifications not showing even when app is closed
? Check about:preferences notification settings
? Check Service Worker cache
```

---

## Firefox-Specific Debugging

### 1. Check Notification Permission

```javascript
// In browser console:
Notification.permission;
// Should return: "granted"

// If not granted, request:
Notification.requestPermission().then((perm) =>
  console.log("Permission:", perm)
);
```

### 2. Clear Firefox Service Worker Cache

Firefox is **very aggressive** with SW caching. This is the most common cause:

**Option A (Browser UI):**

```
about:debugging
→ This Firefox
→ Service Workers
→ Find your SW and click "Unregister"
→ Refresh page
→ Check if new SW registers
```

**Option B (Clear Cache):**

```
Ctrl+Shift+Delete
→ Clear All
→ Refresh your app page
→ Hard refresh: Ctrl+Shift+R
```

### 3. Check Notification Settings

```
about:preferences
→ Privacy & Security
→ Permissions
→ Notifications
→ Look for your domain
→ Should be "Allow" (not "Block" or missing)
```

### 4. Inspect Service Worker Console

```
about:debugging
→ This Firefox
→ Service Workers
→ Click "Inspect" next to your SW

// In the SW console, you should see:
[SW] Service Worker initialized
[SW] Background message received: {...}
[SW] Notification shown successfully for ID: abc123
```

### 5. Test Manual Notification

```javascript
// In browser console (NOT SW console):
navigator.serviceWorker.getRegistrations().then((regs) => {
  if (regs.length > 0) {
    regs[0].showNotification("Firefox Test", {
      body: "If you see this, notifications work!",
      icon: "/images/notification-icon.png",
      badge: "/images/notification-badge.png",
      tag: "firefox-test",
      data: { notificationId: "test-123" },
    });
  } else {
    console.log("No SW registered");
  }
});
```

If the manual notification shows but backend notifications don't:

- Backend payload might not match expectations
- Check Firebase configuration

---

## Edge-Specific Debugging

### 1. Windows Notification Settings

Edge relies on Windows system notifications:

```
Settings
→ System
→ Notifications & actions
→ Scroll down to "Notifications from apps and senders"
→ Find "Microsoft Edge"
→ Make sure it's enabled (toggle on)
```

### 2. Check Notification Permission

```javascript
// In browser console:
Notification.permission;
// Should return: "granted"

// If not granted:
Notification.requestPermission().then((perm) =>
  console.log("Permission:", perm)
);
```

### 3. Inspect Service Worker Console

```
F12 → DevTools
→ Application
→ Service Workers
→ Click "Inspect" next to your SW

// You should see:
[SW] Service Worker initialized
[SW] Background message received: {...}
[SW] Notification shown successfully for ID: abc123
```

### 4. Test Manual Notification

```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then((regs) => {
  if (regs.length > 0) {
    regs[0].showNotification("Edge Test", {
      body: "If you see this in Windows notification center, notifications work!",
      icon: "/images/notification-icon.png",
      badge: "/images/notification-badge.png",
      tag: "edge-test",
      data: { notificationId: "test-123" },
    });
  }
});
```

**Important for Edge:** The notification might appear in:

- Windows Notification Center (bottom right)
- Action Center (if that's enabled)
- Not as a popup toast

### 5. Restart Edge Notifications Service

Sometimes Edge's notification service gets stuck:

```
Settings
→ System
→ Notifications & actions
→ Scroll down and toggle "Notifications" OFF
→ Wait 10 seconds
→ Toggle back ON
→ Restart Edge
```

---

## Common Issues & Fixes

### Issue: Permission Prompt Never Appears

**Firefox:**

- Service Worker might not be ready
- Fix: Hard refresh (Ctrl+Shift+R) after page loads
- Fix: Click "Enable Notifications" button (requires user interaction)

**Edge:**

- Service Worker might not be ready
- Fix: Hard refresh (F5 then Ctrl+Shift+R)
- Fix: Check if permission was previously blocked:
  ```
  Settings → Privacy & security → Site permissions → Notifications
  → Find your domain and change from "Block" to "Allow"
  ```

### Issue: Permission Granted But No Notification Shows

**Firefox:**

- SW cache issue (most common)
- Fix: Go to about:debugging and unregister SW
- Fix: Clear cache (Ctrl+Shift+Delete) and hard refresh

**Edge:**

- Windows notification settings disabled
- Fix: Check Settings → System → Notifications
- Fix: Check Edge notification settings (Settings → Notifications)

### Issue: Notification Shows But Click Does Nothing

**Both:**

- SW `notificationclick` handler not firing
- Check SW console for errors
- Try fallback with `clients.openWindow()`

### Issue: Notification Shows for App, Disappears Immediately

**Both:**

- Likely due to `requireInteraction: false`
- Change to `requireInteraction: true` if you want persistent notifications

---

## Step-by-Step Testing Procedure

### Firefox

1. **Hard Clear Everything**

   ```
   Ctrl+Shift+Delete → Clear All
   Close Firefox completely
   Reopen Firefox
   ```

2. **Unregister Old Service Worker**

   ```
   about:debugging
   → This Firefox
   → Service Workers
   → Unregister any existing SWs
   ```

3. **Visit App**

   ```
   Visit your app URL
   Hard refresh: Ctrl+Shift+R
   Check console: Notification.permission should be "granted"
   ```

4. **Check Service Worker**

   ```
   about:debugging
   → This Firefox
   → Service Workers
   → Click "Inspect" on your new SW
   ```

5. **Send Test Notification**

   ```
   From backend, send a test notification
   Watch SW console for:
     [SW] Background message received: {...}
     [SW] Notification shown successfully...
   ```

6. **Check System Notification**
   ```
   Look for notification at top of screen or in notification center
   Click it
   Should navigate to detail page
   ```

### Edge

1. **Hard Clear Everything**

   ```
   Settings → Privacy & security → Clear browsing data
   Select "Cached images and files"
   Select "All time"
   Clear now
   ```

2. **Restart Edge**

   ```
   Completely close and reopen Edge
   Visit your app
   Hard refresh: F5 then Ctrl+Shift+R
   ```

3. **Check Windows Notifications**

   ```
   Settings → System → Notifications & actions
   Verify Edge is enabled
   ```

4. **Check Service Worker**

   ```
   F12 → Application
   → Service Workers
   → Inspect your SW
   ```

5. **Send Test Notification**

   ```
   From backend, send a test notification
   Watch SW console for:
     [SW] Background message received: {...}
     [SW] Notification shown successfully...
   ```

6. **Check Windows Notification Center**
   ```
   Look in Windows notification center (bottom right)
   Click notification
   Should navigate to detail page
   ```

---

## Logging to Check

When you send a test notification, check these logs:

**Browser Console:**

```
[Foreground] Message received: {...}  // If app is open
```

**Service Worker Console:**

```
[SW] Service Worker initialized       // On page load
[SW] Background message received: {...} // When notification sent
[SW] Notification shown successfully for ID: xyz
[SW] Notification clicked: ...       // When user clicks
[SW] Opening URL: /dashboard/notifications/xyz
```

If any step is missing, that's where the problem is.

---

## Nuclear Option: Complete Service Worker Reset

If nothing works, do a complete reset:

**Firefox:**

```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then((regs) => {
  Promise.all(regs.map((r) => r.unregister())).then(() => {
    console.log("All SWs unregistered");
    // Reload page
    location.reload();
  });
});

// Then:
// about:debugging → This Firefox → Service Workers
// Verify no SWs listed
// Refresh your app page
```

**Edge:**

```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then((regs) => {
  Promise.all(regs.map((r) => r.unregister())).then(() => {
    console.log("All SWs unregistered");
    // Reload page
    location.reload();
  });
});

// Then:
// DevTools → Application → Service Workers
// Verify list is empty
// Refresh your app page
```

---

## Success Indicators

### All browsers working when you see:

✅ **Browser Console:**

```
[Foreground] Message received: {...}
Foreground notification toast appears
```

✅ **Service Worker Console:**

```
[SW] Background message received: {...}
[SW] Notification shown successfully for ID: abc123
```

✅ **System Notification:**

- Chrome: In notification center or popup
- Edge: In Windows notification center
- Firefox: At top of screen or in notification center

✅ **Click Handling:**

- App focuses or opens
- Navigates to `/dashboard/notifications/abc123`
- Notification detail page loads

---

## Still Not Working? Collect This Info

When asking for help, include:

1. Browser: [ ] Chrome [ ] Edge [ ] Firefox
2. OS: [ ] Windows [ ] Mac [ ] Linux
3. App state when notification sent: [ ] Open [ ] Closed
4. Permission status: [ ] Granted [ ] Denied [ ] Prompt never showed
5. Service Worker status: [ ] Registered [ ] Not registered
6. Error messages from:
   - [ ] Browser console
   - [ ] Service Worker console
7. Backend notification payload (sanitized)
