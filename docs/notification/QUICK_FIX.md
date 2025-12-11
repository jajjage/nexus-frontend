# Quick Reference: Fixing Edge/Firefox Notifications

## TL;DR - Most Likely Fixes

### Firefox (Most Common Issue)

```
1. Hard refresh: Ctrl+Shift+R
2. Go to about:debugging
3. Find your Service Worker and click "Unregister"
4. Refresh app page
5. Hard refresh again: Ctrl+Shift+R
6. Try sending notification again
```

**Why?** Firefox caches Service Workers aggressively. Old SW might still be running.

### Edge (Second Most Common)

```
1. Check Settings → System → Notifications & actions
2. Scroll to "Notifications from apps and senders"
3. Find "Microsoft Edge" and toggle ON
4. Refresh app: F5
5. Hard refresh: Ctrl+Shift+R
6. Try sending notification again
```

**Why?** Edge ties to Windows notification system. Must be enabled in Windows settings.

### Chrome (Baseline - Usually Works)

If Chrome works but Edge/Firefox doesn't, the problem is **browser-specific**, not backend.

---

## Verification Checklist (Do This First)

```javascript
// Paste in browser console and check each result:

// 1. Check permission
Notification.permission; // Should be "granted"

// 2. Check service worker registered
navigator.serviceWorker.getRegistrations().then(
  (r) => console.log("SW count:", r.length) // Should be 1+
);

// 3. Test manual notification
navigator.serviceWorker.getRegistrations().then((regs) => {
  if (regs.length > 0) {
    regs[0].showNotification("Test", {
      body: "If you see this, notifications work!",
      tag: "test-123",
      data: { notificationId: "test-123" },
    });
  }
});
```

If manual notification works but backend doesn't:

- Check Service Worker console (not browser console)
- Look for `[SW]` prefixed logs
- Verify `onBackgroundMessage` is firing

---

## Service Worker Console (Important!)

This is where the real logs are. Don't look at the browser console!

**Chrome/Edge:**

```
F12 → Application → Service Workers
→ Click "Inspect" next to your SW
→ Look at the Console tab
```

**Firefox:**

```
about:debugging
→ This Firefox
→ Service Workers
→ Click "Inspect"
→ Look at the Console tab
```

**Expected Logs:**

```
[SW] Service Worker initialized
[SW] Background message received: {...}
[SW] Notification shown successfully for ID: abc123
[SW] Notification clicked: [object Notification]
[SW] Opening URL: /dashboard/notifications/abc123
```

---

## Step-by-Step Debugging

### Step 1: Check Permission

```
Browser console:
Notification.permission
// Result: "granted" ✅ OR "denied" ❌ OR "default" ❓
```

If not "granted":

```javascript
Notification.requestPermission().then((perm) => {
  console.log("New permission:", perm);
  location.reload();
});
```

### Step 2: Check Service Worker Registered

```
Browser console:
navigator.serviceWorker.getRegistrations().then(r => {
  r.forEach(sw => console.log('SW Scope:', sw.scope));
})
// Should show your app's scope
```

### Step 3: Clear and Re-Register (Firefox Fix)

```
about:debugging
→ This Firefox
→ Service Workers
→ Click "Unregister" on your SW
→ Refresh app page
→ Hard refresh: Ctrl+Shift+R
```

### Step 4: Send Test Notification

From backend, send a test notification and immediately:

**Watch Service Worker Console:**

```
[SW] Background message received: {...}
```

If you see this, the backend is sending and SW is receiving. ✅

If you don't see this:

- App might be in foreground (shows toast instead)
- Check browser console for `[Foreground] Message received`
- If neither, backend issue

### Step 5: Check System Notification

Look in the system notification center:

- **Chrome:** Notification center or popup at corner
- **Edge:** Windows Notification Center (bottom right)
- **Firefox:** Top of screen or notification center

If notification doesn't show but logs say "Notification shown successfully":

- Might be permission issue at OS level
- Check system notification settings

### Step 6: Test Click

Click the notification and verify:

- App focuses/opens
- URL changes to `/dashboard/notifications/{id}`
- Page loads with notification details

---

## Nuclear Option: Complete Reset

If nothing works:

```javascript
// Browser console:
navigator.serviceWorker.getRegistrations().then((regs) => {
  Promise.all(regs.map((r) => r.unregister())).then(() => {
    console.log("All SWs unregistered");
    location.reload();
  });
});
```

Then:

1. Clear entire browser cache (Ctrl+Shift+Delete)
2. Close and reopen browser
3. Visit app fresh
4. Hard refresh (Ctrl+Shift+R)
5. Request permission when prompted
6. Try again

---

## What NOT to Do

❌ Test with app open and expect system notification

- That's what the toast is for
- Close app and send notification

❌ Test in Incognito/Private mode

- Use normal browsing mode
- Permissions may not persist in private mode

❌ Assume Chrome fix applies to Edge/Firefox

- Each has different requirements
- Test each separately

❌ Only check browser console

- Service Worker has its own console
- That's where the real logs are

❌ Clear cache once and think it's fixed

- Hard refresh after EVERY change
- Especially important with SWs

---

## When to Check What

| Symptom                                   | Check                                      | Fix                           |
| ----------------------------------------- | ------------------------------------------ | ----------------------------- |
| No permission prompt                      | Browser console: `Notification.permission` | Request permission explicitly |
| Permission shows "denied"                 | Browser settings → Notifications           | Remove from block list        |
| SW doesn't register                       | DevTools → Application → SWs               | Hard refresh + clear cache    |
| Logs show received but no notification    | Windows/system settings                    | Enable notifications for app  |
| Notification shows but click does nothing | SW console for click logs                  | Check browser support         |
| Different behavior in each browser        | Each browser section below                 | Apply browser-specific fix    |

---

## Browser-Specific Commands

### Firefox Only

```
// Check notification settings
about:preferences
→ Privacy & Security
→ Permissions
→ Notifications

// Debugging
about:debugging
→ This Firefox
→ Service Workers
```

### Edge Only

```
// Check Windows notification settings
Settings
→ System
→ Notifications & actions

// Reset Edge notifications
Settings
→ Notifications
→ Find your domain → Remove → Re-add
```

### Chrome (Baseline)

```
// Check notification settings
Settings
→ Privacy and security
→ Site settings
→ Notifications

// View notifications
Ctrl+` (backtick) opens DevTools
Application → Service Workers → Inspect
```

---

## Troubleshooting Decision Tree

```
Notifications working in Chrome?
├─ YES: Problem is browser-specific
│  ├─ Firefox: Clear SW cache (about:debugging → Unregister)
│  └─ Edge: Check Windows notification settings (Settings → Notifications)
│
└─ NO: Problem is backend or general setup
   ├─ Check: Notification.permission === "granted"?
   │  ├─ NO: Request permission explicitly
   │  └─ YES: Continue
   ├─ Check: SW registered? (DevTools → Application → SWs)
   │  ├─ NO: Hard refresh + clear cache
   │  └─ YES: Continue
   ├─ Check: Backend sending notificationId in data?
   │  ├─ NO: Fix backend payload
   │  └─ YES: Continue
   ├─ Check: SW console shows "Background message received"?
   │  ├─ NO: App might be open (check browser console for [Foreground])
   │  └─ YES: Check system notification center
   └─ Check: System notification visible?
      ├─ NO: OS notification settings, try requireInteraction: true
      └─ YES: Click it and verify navigation
```

---

## Success Checklist

- [ ] All 3 browsers (Chrome, Edge, Firefox) show notifications
- [ ] Notifications show both when app open (toast) and closed (system)
- [ ] Clicking notification navigates to detail page
- [ ] Permission persists across browser sessions
- [ ] Service Worker console shows all `[SW]` logs
- [ ] No errors in browser console or SW console
- [ ] Different notification types show correct colors
- [ ] Unread badge shows correctly on notification list

---

## Last Resort: Minimal Test Case

If you still can't figure it out, test with this minimal code:

```javascript
// In browser console:
// 1. Check permission
console.log("Permission:", Notification.permission);

// 2. Register SW if not done
navigator.serviceWorker
  .register("/firebase-messaging-sw.js")
  .then((r) => console.log("SW registered:", r))
  .catch((e) => console.error("SW registration failed:", e));

// 3. Wait a moment then show test notification
setTimeout(() => {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    if (regs.length > 0) {
      regs[0].showNotification("Minimal Test", {
        body: "This tests the basics",
        tag: "minimal-test",
        data: { notificationId: "minimal-123" },
      });
    }
  });
}, 1000);
```

If even this minimal test doesn't work:

- It's a fundamental setup issue (permissions, SW registration, etc.)
- Not related to backend payload
- Focus on the verification checklist above

---

## Summary

1. **Chrome works?** → Problem is Firefox/Edge specific
2. **Permission granted?** → Yes? Continue. No? Request it.
3. **SW registered?** → Yes? Continue. No? Hard refresh + clear.
4. **Backend sending notificationId?** → Yes ✅
5. **SW console shows logs?** → Yes? Notification should show. No? Check browser console.
6. **System notification visible?** → Yes? Click it. No? Check OS settings.

If stuck at any step, follow the browser-specific guide for Firefox/Edge.
