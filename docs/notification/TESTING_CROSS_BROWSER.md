# Cross-Browser Notification Testing Checklist

## Pre-Testing Setup

- [ ] Ensure backend is sending `notificationId` in FCM data payload
- [ ] Clear all browser caches (Ctrl+Shift+Delete)
- [ ] Uninstall old service workers if present
- [ ] Hard refresh all tabs (Ctrl+Shift+R)

---

## Chrome Testing

1. **Grant Permissions**
   - [ ] Visit app and grant notification permission when prompted
   - [ ] Verify `Notification.permission === 'granted'` in console

2. **Check Service Worker**
   - [ ] Open DevTools → Application → Service Workers
   - [ ] Verify `/firebase-messaging-sw.js` is registered and active
   - [ ] Click "Inspect" to view SW console

3. **Check FCM Token**
   - [ ] Open DevTools → Console
   - [ ] Send a test notification from backend
   - [ ] Look for log: "Background message received: {...}"
   - [ ] Should see: "Notification shown successfully for ID: xxx"

4. **Test Notification Display**
   - [ ] Notification should appear in system tray
   - [ ] Click notification
   - [ ] Should navigate to `/dashboard/notifications/{notificationId}`

**Status:** ✅ If this works, backend and frontend are both correct

---

## Edge Testing

1. **System Notifications Enabled**
   - [ ] Check Settings → System → Notifications & actions
   - [ ] Edge should be enabled in notification settings

2. **Grant Permissions**
   - [ ] Visit app in Edge
   - [ ] Grant notification permission when prompted
   - [ ] Open DevTools → Console
   - [ ] Verify: `Notification.permission === 'granted'`

3. **Check Service Worker**
   - [ ] Open DevTools → Application → Service Workers
   - [ ] Verify `/firebase-messaging-sw.js` is registered
   - [ ] Click "Inspect" for SW console

4. **Send Test Notification**
   - [ ] Send from backend
   - [ ] Check console for: "Background message received"
   - [ ] **Critical:** Check Windows Notification Center (not browser)
   - [ ] Notification should appear in notification center

5. **Test Click**
   - [ ] Click notification in notification center
   - [ ] Edge should focus/open
   - [ ] Should navigate to notification detail page

**If Notification Doesn't Show:**

- [ ] Check Windows Settings → Notifications → Allow notifications from Edge
- [ ] Try `requireInteraction: true` in code (should stay visible)
- [ ] Hard refresh with Ctrl+Shift+R
- [ ] Uninstall SW and reload

---

## Firefox Testing

1. **Grant Permissions**
   - [ ] Visit app in Firefox
   - [ ] Grant notification permission when prompted
   - [ ] Open DevTools → Console
   - [ ] Verify: `Notification.permission === 'granted'`

2. **Check Firefox Notification Settings**
   - [ ] About:preferences → Privacy & Security
   - [ ] Check "Notifications" whitelist includes your domain
   - [ ] Status should be "Allow"

3. **Clear Service Worker Cache**
   - [ ] Firefox caches SWs aggressively
   - [ ] Hard refresh: Ctrl+Shift+R
   - [ ] Or go to: about:debugging → This Firefox → Service Workers
   - [ ] Unregister and reload

4. **Check Service Worker**
   - [ ] about:debugging → This Firefox → Service Workers
   - [ ] Verify your SW is listed
   - [ ] Click "Inspect" to open SW console

5. **Send Test Notification**
   - [ ] Send from backend
   - [ ] Watch Firefox console AND SW console
   - [ ] Should see: "Background message received"
   - [ ] Should see: "Notification shown successfully"

6. **Test Notification Display**
   - [ ] Notification should appear at top of screen or notification center
   - [ ] Click notification
   - [ ] Should navigate to detail page

**If Notification Doesn't Show in Firefox:**

- [ ] Check about:preferences → Privacy & Security → Permissions → Notifications
- [ ] Whitelist your domain
- [ ] Hard refresh with Ctrl+Shift+Delete then Ctrl+Shift+R
- [ ] Try `requireInteraction: true`
- [ ] Check Firefox notification center (may appear there instead of popup)

---

## Debugging Console Commands

Run these in your browser console:

```javascript
// Check notification permission status
console.log("Permission:", Notification.permission);

// List all registered service workers
navigator.serviceWorker.getRegistrations().then((regs) => {
  console.log("Registered SWs:", regs);
  regs.forEach((reg) => console.log("Scope:", reg.scope));
});

// Check if service worker ready
navigator.serviceWorker.ready.then((reg) => {
  console.log("SW Ready:", reg);
});

// Test manual notification (requires SW)
navigator.serviceWorker.getRegistrations().then((regs) => {
  if (regs.length > 0) {
    regs[0].showNotification("Test Notification", {
      body: "This is a test",
      icon: "/images/notification-icon.png",
      badge: "/images/notification-badge.png",
      tag: "test-123",
      data: { notificationId: "123" },
    });
  }
});
```

---

## Service Worker Console Access

To see service worker logs:

**Chrome/Edge:**

- DevTools → Application → Service Workers → Click "Inspect"

**Firefox:**

- about:debugging → This Firefox → Service Workers → Click "Inspect"

---

## Expected Log Messages

When everything works, you should see in SW console:

```
✅ "Background message received: {notification: {...}, data: {...}}"
✅ "Notification shown successfully for ID: abc123"
✅ "Notification clicked: [object Notification]"
✅ "Opening URL: /dashboard/notifications/abc123"
```

---

## Common Issues & Fixes

| Issue                                     | Chrome                         | Edge                           | Firefox                        |
| ----------------------------------------- | ------------------------------ | ------------------------------ | ------------------------------ |
| No permission prompt                      | ✅ Usually auto                | ⚠️ May need SW ready first     | ⚠️ May need SW ready first     |
| Permission granted but no notification    | ❌ Unlikely                    | Check Windows settings         | Check about:preferences        |
| Notification shows but click does nothing | Check data property            | Check navigate() support       | Check SW console               |
| Notification disappears immediately       | Add `requireInteraction: true` | Add `requireInteraction: true` | Add `requireInteraction: true` |
| SW not receiving messages                 | Check Firebase config          | Check Firebase config          | Clear cache & hard refresh     |

---

## Final Validation

Once all browsers show notifications correctly:

- [ ] Chrome: ✅ Working
- [ ] Edge: ✅ Working
- [ ] Firefox: ✅ Working
- [ ] All notifications navigate to correct detail page
- [ ] Clicking back button goes to notifications list
- [ ] Delete button removes notification

**You're done! 🎉**
