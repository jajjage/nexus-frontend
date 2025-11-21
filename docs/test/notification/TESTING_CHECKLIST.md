# FCM Notification Testing Checklist

## Overview

This document provides a comprehensive testing checklist for all FCM notification scenarios. Tests are organized by user journey and use cases.

---

## Test Files Location

- Unit Tests: `__test__/services/notification.service.test.ts`
- Auth Hook Tests: `__test__/hooks/useAuth.fcm.test.ts`
- App Mount Tests: `__test__/hooks/useSyncFcmOnMount.test.ts`
- Integration Tests: `__test__/integration/fcm.integration.test.ts`

---

## 1. Registration with FCM

### Test Cases

- [ ] **New user registers → FCM token obtained → Synced to backend**
  - File: `__test__/integration/fcm.integration.test.ts`
  - Test: "Scenario 1: User Registration with FCM"
  - Verifies: Token is registered on first link
  - Expected: Token saved in localStorage, API called with correct payload

- [ ] **Registration mutation triggers FCM sync**
  - File: `__test__/hooks/useAuth.fcm.test.ts`
  - Test: "useRegister → should sync FCM token after successful registration"
  - Verifies: FCM sync called as part of registration flow
  - Expected: syncFcmToken called with "web" platform

- [ ] **FCM failure does not block registration**
  - File: `__test__/hooks/useAuth.fcm.test.ts`
  - Test: "useRegister → should establish first FCM link during registration"
  - Verifies: Fire-and-forget pattern (non-blocking)
  - Expected: User redirected to dashboard even if FCM fails

### Manual Testing

```
Steps:
1. Open registration page
2. Fill form with valid data
3. Grant notification permission when prompted
4. Submit form
5. Check browser DevTools → Application → LocalStorage
   - last_fcm_token should be populated
6. Check network tab
   - POST /notifications/register-token should be called
```

---

## 2. Login with FCM

### Test Cases

- [ ] **User logs in → Token linked to account**
  - File: `__test__/integration/fcm.integration.test.ts`
  - Test: "Scenario 2: User Login with FCM"
  - Verifies: Token synced after login
  - Expected: Backend links device token to user account

- [ ] **Login mutation triggers FCM sync**
  - File: `__test__/hooks/useAuth.fcm.test.ts`
  - Test: "useLogin → should sync FCM token after successful login"
  - Verifies: syncFcmToken called after authentication
  - Expected: FCM sync happens before redirect to dashboard

- [ ] **Email login variant**
  - File: `__test__/hooks/useAuth.fcm.test.ts`
  - Test: "useLogin → should sync FCM token after successful login (email)"
  - Verifies: Works with email-based login
  - Expected: Token synced regardless of login method

- [ ] **Phone login variant**
  - File: `__test__/hooks/useAuth.fcm.test.ts`
  - Test: "useLogin → should handle login with phone number"
  - Verifies: Works with phone-based login
  - Expected: Token synced regardless of login method

- [ ] **FCM failure doesn't block login**
  - File: `__test__/hooks/useAuth.fcm.test.ts`
  - Test: "useLogin → should not block login if FCM token sync fails"
  - Verifies: Non-blocking pattern
  - Expected: User still redirected to dashboard if FCM fails

### Manual Testing

```
Steps:
1. Open login page
2. Enter valid credentials
3. Clear localStorage (simulate fresh device login)
4. Submit login
5. Check DevTools → LocalStorage → last_fcm_token
   - Should be populated after login
6. Check network tab
   - POST /notifications/register-token should appear
7. Verify user is on dashboard
```

---

## 3. App Refresh with FCM

### Test Cases

- [ ] **App refreshes → Token synced if changed**
  - File: `__test__/integration/fcm.integration.test.ts`
  - Test: "Scenario 3: App Refresh with FCM Token Check"
  - Verifies: useSyncFcmOnMount detects new token
  - Expected: New token sent to backend if different

- [ ] **App refresh with unchanged token**
  - File: `__test__/services/notification.service.test.ts`
  - Test: "syncFcmToken → should skip sync when token hasn't changed"
  - Verifies: Avoids redundant API calls
  - Expected: API not called when token is same

- [ ] **App refresh with cleared localStorage**
  - File: `__test__/integration/fcm.integration.test.ts`
  - Test: "Scenario 3 → should handle localStorage cleared scenario"
  - Verifies: Handles missing token history
  - Expected: New token synced even with cleared storage

- [ ] **Token expiration on app open**
  - File: `__test__/integration/fcm.integration.test.ts`
  - Test: "Scenario 3 → should handle Firebase token expiration"
  - Verifies: Detects expired tokens and syncs new ones
  - Expected: New token from Firebase synced to backend

- [ ] **useSyncFcmOnMount only runs once per mount**
  - File: `__test__/hooks/useSyncFcmOnMount.test.ts`
  - Test: "should sync only once on mount"
  - Verifies: No duplicate sync calls on rerender
  - Expected: syncFcmToken called exactly once

### Manual Testing

```
Steps:
1. Login to app (verify token synced)
2. Take note of last_fcm_token value in localStorage
3. Hard refresh browser (Ctrl+Shift+R)
4. Check network tab → POST /notifications/register-token
   - May or may not appear depending on if Firebase refreshed token
5. Check localStorage → last_fcm_token
   - Should be present and possibly updated
6. Verify app still functional and user still logged in
```

---

## 4. Token Refresh from Firebase

### Test Cases

- [ ] **Firebase silently refreshes token**
  - File: `__test__/integration/fcm.integration.test.ts`
  - Test: "Scenario 4: Token Refresh from Firebase"
  - Verifies: Detects new token from Firebase
  - Expected: New token synced to backend

- [ ] **Multiple token refreshes handled correctly**
  - File: `__test__/integration/fcm.integration.test.ts`
  - Test: "Scenario 4 → should handle multiple token refreshes"
  - Verifies: Each refresh properly synced
  - Expected: Backend always has latest token

- [ ] **Token refresh scenario on app mount**
  - File: `__test__/hooks/useSyncFcmOnMount.test.ts`
  - Test: "should detect and sync new token on app restart"
  - Verifies: useSyncFcmOnMount catches refreshed tokens
  - Expected: New token available and synced

- [ ] **Token invalidation recovery**
  - File: `__test__/hooks/useSyncFcmOnMount.test.ts`
  - Test: "should handle case where token was invalidated"
  - Verifies: Recovery from token invalidation
  - Expected: New token obtained and synced

- [ ] **Old token removed from storage after refresh**
  - File: `__test__/services/notification.service.test.ts`
  - Test: "syncFcmToken → should sync when token changes"
  - Verifies: Storage updated with new token
  - Expected: localStorage.last_fcm_token = new token

### Manual Testing

```
Steps:
1. Login and verify token is synced
2. Simulate Firebase token refresh:
   - Option A: Wait for natural refresh (may take time)
   - Option B: Clear Firebase cache and restart
3. Monitor network tab for POST /notifications/register-token
   - Should appear if token changed
4. Check localStorage for updated token value
5. Verify notifications still work with new token
```

---

## 5. Logout with Token Unlink

### Test Cases

- [ ] **Logout calls unlink API**
  - File: `__test__/services/notification.service.test.ts`
  - Test: "unlinkFcmToken → should unlink token on logout"
  - Verifies: Backend notified of logout
  - Expected: DELETE/POST call to /notifications/unlink-token

- [ ] **localStorage cleared after unlink**
  - File: `__test__/services/notification.service.test.ts`
  - Test: "unlinkFcmToken → should unlink token on logout"
  - Verifies: Local state cleaned up
  - Expected: localStorage.last_fcm_token = null

- [ ] **Logout mutation triggers unlink**
  - File: `__test__/hooks/useAuth.fcm.test.ts`
  - Test: "useLogout → should unlink FCM token on logout"
  - Verifies: useLogout calls unlinkFcmToken
  - Expected: unlinkFcmToken called during logout

- [ ] **Unlink failure still clears localStorage**
  - File: `__test__/services/notification.service.test.ts`
  - Test: "unlinkFcmToken → should clear localStorage even if API fails"
  - Verifies: Safety measure against orphaned tokens
  - Expected: localStorage cleared even on API error

- [ ] **No token to unlink gracefully handled**
  - File: `__test__/services/notification.service.test.ts`
  - Test: "unlinkFcmToken → should return true when no token exists"
  - Verifies: Handles edge case
  - Expected: Returns true (success) when nothing to unlink

- [ ] **User data cleared after logout**
  - File: `__test__/hooks/useAuth.fcm.test.ts`
  - Test: "useLogout → should clear all cached queries"
  - Verifies: React Query cache cleared
  - Expected: All user data removed from cache

- [ ] **Redirect to login after logout**
  - File: `__test__/hooks/useAuth.fcm.test.ts`
  - Test: "useLogout → should redirect to login"
  - Verifies: User navigated away from protected pages
  - Expected: router.push("/login") called

### Manual Testing

```
Steps:
1. Login to app (verify token synced)
2. Note token value in localStorage
3. Click logout button
4. Check network tab:
   - POST /notifications/unlink-token should appear
   - Should contain the old token
5. Check localStorage:
   - last_fcm_token should be cleared
6. Verify redirected to login page
7. Verify you cannot access dashboard without logging in again
```

---

## 6. Shared Device Scenario - Multi-User

### CRITICAL SECURITY TEST

This scenario is essential to prevent privacy breaches.

### Test Cases

- [ ] **User A login → User A logout → User B login (no notification leak)**
  - File: `__test__/integration/fcm.integration.test.ts`
  - Test: "Scenario 6: Shared Device - Multi-User Sequence"
  - Verifies: Token properly unlinked before new user logs in
  - Expected: User B cannot receive User A's notifications
  - **CRITICAL**: This test MUST pass

- [ ] **Token unlinked prevents next user notifications**
  - File: `__test__/integration/fcm.integration.test.ts`
  - Test: "should prevent User A notifications from reaching User B"
  - Verifies: Complete isolation between users
  - Expected: User A's token invalid after logout

- [ ] **Different Firebase tokens for different users**
  - File: `__test__/integration/fcm.integration.test.ts`
  - Test: "should handle same physical device with different Firebase tokens"
  - Verifies: Handles case where Firebase gives different token per user
  - Expected: Correct token registered for each user

- [ ] **localStorage isolated per user context**
  - File: `__test__/services/notification.service.test.ts`
  - Test: "unlinkFcmToken → should prevent next user from receiving previous user's notifications"
  - Verifies: Storage properly cleared between users
  - Expected: Previous user's token completely removed

### Manual Testing (Shared Device Simulation)

```
Steps:
1. User A logs in:
   - Check localStorage.last_fcm_token = tokenA
   - Check network: POST /notifications/register-token with tokenA
2. User A logs out:
   - Check network: POST /notifications/unlink-token with tokenA
   - Check localStorage.last_fcm_token = null
3. User B logs in (same device):
   - Check localStorage.last_fcm_token = tokenB (may be different)
   - Check network: POST /notifications/register-token with tokenB
4. Send test notification to User A's account
   - Verify User B DOES NOT receive it
5. Send test notification to User B's account
   - Verify User B DOES receive it
```

---

## 7. Error Scenarios

### Test Cases

- [ ] **No FCM token available**
  - File: `__test__/services/notification.service.test.ts`
  - Test: "syncFcmToken → should return false when no token is available"
  - Verifies: Graceful handling of unavailable FCM
  - Expected: Returns false, no API call made

- [ ] **API call fails (network error)**
  - File: `__test__/services/notification.service.test.ts`
  - Test: "syncFcmToken → should return false when API call fails"
  - Verifies: Error handling
  - Expected: Token not saved to localStorage

- [ ] **Notification API not supported**
  - File: `__test__/services/notification.service.test.ts`
  - Test: "areNotificationsEnabled → should return false when Notification API not available"
  - Verifies: Handles browsers without Notification API
  - Expected: Returns false, app continues to work

- [ ] **Permission denied by user**
  - File: `__test__/services/notification.service.test.ts`
  - Test: "requestNotificationPermission → should return false if permission denied"
  - Verifies: Handles user declining permissions
  - Expected: App works without notifications

- [ ] **Server-side rendering (SSR) handling**
  - File: `__test__/services/notification.service.test.ts`
  - Test: "syncFcmToken → should return false when window is undefined"
  - Verifies: Works in SSR environments
  - Expected: Gracefully handles missing window object

- [ ] **Retry on network failure**
  - File: `__test__/integration/fcm.integration.test.ts`
  - Test: "Scenario 7: Network Error Handling → should allow retry of failed sync"
  - Verifies: Failed syncs can be retried
  - Expected: Success on subsequent attempt

- [ ] **Unlink failure handling**
  - File: `__test__/integration/fcm.integration.test.ts`
  - Test: "Scenario 7 → should handle unlink failure but still clear localStorage"
  - Verifies: Safety measure on unlink failure
  - Expected: localStorage cleared even if API fails

### Manual Testing

```
Steps:
1. Disable notifications in browser
   - Observe: areNotificationsEnabled() returns false
   - App still works

2. Simulate network error:
   - Open DevTools → Network → offline
   - Try to login
   - Observe: FCM sync fails but login succeeds
   - Observe: localStorage.last_fcm_token is empty
   - Go online
   - Refresh app
   - Observe: Sync is retried successfully

3. Test in private/incognito window
   - Should work normally

4. Test with VPN/Proxy
   - App should work normally
```

---

## 8. Session Management Tests

### Test Cases

- [ ] **App loading state handling**
  - File: `__test__/hooks/useSyncFcmOnMount.test.ts`
  - Test: "should not sync during loading state"
  - Verifies: Waits for auth state to load
  - Expected: No sync until user data loaded

- [ ] **Suspended user doesn't sync**
  - File: `__test__/hooks/useSyncFcmOnMount.test.ts`
  - Test: "should not sync when authenticated user becomes suspended"
  - Verifies: Respects account status
  - Expected: No sync for suspended accounts

- [ ] **Unauthenticated user doesn't sync**
  - File: `__test__/hooks/useSyncFcmOnMount.test.ts`
  - Test: "should not sync FCM token when no user is authenticated"
  - Verifies: Prevents sync before login
  - Expected: No sync without authentication

### Manual Testing

```
Steps:
1. Start app without logging in
   - Check network: No POST to /notifications/register-token
2. Log in
   - Check network: POST to /notifications/register-token appears
3. Have admin suspend your account (via backend)
   - Refresh app
   - Check network: No notification sync attempts
4. Unsuspend account
   - Refresh app
   - Check network: POST to /notifications/register-token appears again
```

---

## 9. Running Tests

### Unit Tests

```bash
# Run all notification service tests
npm test -- notification.service.test.ts

# Run all auth FCM tests
npm test -- useAuth.fcm.test.ts

# Run all mount sync tests
npm test -- useSyncFcmOnMount.test.ts

# Run with coverage
npm test -- --coverage
```

### Integration Tests

```bash
# Run integration tests
npm test -- fcm.integration.test.ts

# Run specific scenario
npm test -- fcm.integration.test.ts -t "Shared Device"
```

### Run All FCM Tests

```bash
npm test -- --testPathPattern="(notification|useAuth\.fcm|useSyncFcmOnMount|fcm\.integration)"
```

---

## 10. Test Coverage Goals

Target coverage for FCM functionality:

- **Line Coverage**: >90%
- **Branch Coverage**: >85%
- **Function Coverage**: >90%
- **Statement Coverage**: >90%

### Coverage Command

```bash
npm test -- --coverage --testPathPattern="(notification|useAuth\.fcm|useSyncFcmOnMount|fcm\.integration)"
```

---

## 11. Continuous Integration Checks

These tests should run on:

- ✅ Every pull request
- ✅ Before merge to main
- ✅ Before production deploy
- ✅ On schedule (daily)

---

## 12. Manual Browser Testing Checklist

### Prerequisites

- Two test user accounts
- A test device (real phone or Android emulator for mobile testing)
- Firebase Console access

### Checklist

- [ ] Desktop Chrome/Firefox/Safari (all modern browsers)
- [ ] Mobile (iOS Safari, Android Chrome)
- [ ] PWA installation and notifications
- [ ] Shared device scenario with real users
- [ ] Network throttling (simulate slow network)
- [ ] Offline mode handling
- [ ] Token expiration scenarios
- [ ] Permission grant/deny flows
- [ ] Background app behavior
- [ ] App wake from sleep

---

## 13. Known Issues and Workarounds

### Issue 1: Firebase Service Worker Conflicts

**Description**: Multiple service workers can cause conflicts
**Workaround**: Ensure only one service worker registered
**Test**: `registerServiceWorker` called before token request

### Issue 2: Browser Private Mode

**Description**: localStorage may be unavailable
**Workaround**: Gracefully handle missing localStorage
**Test**: Works in private browsing mode

### Issue 3: Token Timing

**Description**: Firebase token may take time to generate
**Workaround**: Implement retry logic with exponential backoff
**Test**: Covered in network error scenarios

---

## 14. Performance Benchmarks

Target performance metrics:

- **Sync time**: <500ms (excluding network)
- **Unlink time**: <300ms (excluding network)
- **localStorage operations**: <10ms
- **Complete login flow**: <2s (with FCM)

---

## 15. Debugging Guide

### Enable Debug Logging

```typescript
// In notification.service.ts
console.log("FCM Debug:", {
  token: currentToken.substring(0, 20) + "...",
  lastSent: getLastSentToken()?.substring(0, 20) + "...",
  timestamp: new Date().toISOString(),
});
```

### Check localStorage

```javascript
// In browser console
localStorage.getItem("last_fcm_token");
localStorage.getItem("fcm_token_timestamp");
```

### Check Network Requests

1. Open DevTools → Network tab
2. Filter for: "register-token" and "unlink-token"
3. Verify request payload and response status

### Monitor Service Worker

1. Open DevTools → Application → Service Workers
2. Verify service worker is registered
3. Check service worker status (running/stopped)

---

## Summary

This checklist covers:

- ✅ 7 major user scenarios
- ✅ 40+ test cases
- ✅ 3 test files with 100+ tests
- ✅ Integration tests for complex flows
- ✅ Error handling and edge cases
- ✅ Security (shared device) scenarios
- ✅ Manual testing procedures

**All tests must pass before deployment to production.**
