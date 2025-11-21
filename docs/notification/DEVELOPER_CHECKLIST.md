# Developer Checklist - FCM Notification Service

## Pre-Implementation

### Understanding Phase

- [ ] Read `FCM_QUICK_REFERENCE.md` (5 min)
- [ ] Review `IMPLEMENTATION_EXAMPLES.md` (10 min)
- [ ] Understand the 4 lifecycle events:
  - [ ] Register → syncFcmToken()
  - [ ] Login → syncFcmToken()
  - [ ] App Open → useSyncFcmOnMount()
  - [ ] Logout → unlinkFcmToken()
- [ ] Review code changes in:
  - [ ] `src/services/notification.service.ts`
  - [ ] `src/hooks/useAuth.ts`
  - [ ] `src/hooks/useSyncFcmOnMount.ts`

### Backend Preparation

- [ ] Implement `POST /notifications/register-token`
  - [ ] Accepts: `{ token: string, platform: string }`
  - [ ] Authenticates via HTTP-only cookie (accessToken)
  - [ ] Stores/updates: userId → token mapping
  - [ ] Returns: `{ success: true, message: "...", data: {...} }`

- [ ] Implement `POST /notifications/unlink-token`
  - [ ] Accepts: `{ token: string }`
  - [ ] Authenticates via HTTP-only cookie (accessToken)
  - [ ] Deletes/deactivates: token mapping
  - [ ] Returns: `{ success: true, message: "..." }`

- [ ] Backend ready for testing
  - [ ] Endpoints tested with curl/Postman
  - [ ] Error handling implemented
  - [ ] Logging in place for debugging

---

## Integration Phase

### File Updates (Already Done ✅)

- [x] `src/services/notification.service.ts` - Enhanced with syncFcmToken, unlinkFcmToken
- [x] `src/hooks/useAuth.ts` - Updated useLogin, useRegister, useLogout
- [x] `src/hooks/useSyncFcmOnMount.ts` - Created new hook

### App Integration

- [ ] Update `src/app/layout.tsx`:

  ```tsx
  import { useSyncFcmOnMount } from "@/hooks/useSyncFcmOnMount";

  export default function RootLayout({ children }) {
    useSyncFcmOnMount(); // ← Add this line
    return (
      <html>
        <body>{children}</body>
      </html>
    );
  }
  ```

- [ ] Verify TypeScript compiles without errors

  ```bash
  npm run type-check
  # or
  tsc --noEmit
  ```

- [ ] Verify no lint errors
  ```bash
  npm run lint
  ```

---

## Local Testing Phase

### Test 1: Registration with FCM

**Objective:** Verify FCM token syncs after registration

Steps:

- [ ] Clear browser data (localStorage, cookies)
- [ ] Open DevTools Network tab
- [ ] Go to `/register` page
- [ ] Fill in registration form
- [ ] Click "Create Account"
- [ ] Monitor network requests:
  - [ ] `POST /auth/register` → succeeds with user data
  - [ ] `POST /notifications/register-token` → succeeds with token
- [ ] Check browser console:
  - [ ] No errors logged
  - [ ] Log: "FCM token synced successfully"
- [ ] Check localStorage:
  ```javascript
  localStorage.getItem("last_fcm_token");
  // Should return FCM token string, not null
  ```
- [ ] Verify backend:
  - [ ] User record created
  - [ ] FCM token stored in database
  - [ ] userId → token mapping exists

**Expected Result:** ✅ User can receive notifications

---

### Test 2: Login with FCM Syncing

**Objective:** Verify FCM token syncs and uses smart checking

Setup: Have registered user account

Steps:

- [ ] Clear localStorage (simulate fresh login)
- [ ] Open DevTools Network tab
- [ ] Go to `/login` page
- [ ] Fill in login form
- [ ] Click "Login"
- [ ] Monitor network requests:
  - [ ] `POST /auth/login` → succeeds with user data
  - [ ] `POST /notifications/register-token` → succeeds (new device)
- [ ] Check browser localStorage:
  ```javascript
  localStorage.getItem("last_fcm_token");
  // Should return FCM token
  ```
- [ ] Verify logged in and redirected to dashboard

**Expected Result:** ✅ Device linked to user account

---

### Test 3: App Refresh - Smart localStorage Check

**Objective:** Verify unnecessary API calls are skipped

Setup: Already logged in

Steps:

- [ ] Open Network tab (filter: XHR/Fetch)
- [ ] Refresh page (F5)
- [ ] Check network requests:
  - [ ] `GET /user/profile/me` → user data (normal)
  - [ ] `POST /notifications/register-token` → SHOULD NOT APPEAR ✨
- [ ] Console should log:
  - [ ] "FCM token unchanged, skipping sync (already up-to-date)"
- [ ] Verify:
  - [ ] Page loads quickly (no extra API call)
  - [ ] localStorage still has token
  - [ ] User still logged in

**Expected Result:** ✅ No redundant API call (optimization working)

---

### Test 4: Firebase Token Refresh

**Objective:** Verify new token sent when Firebase refreshes token

Setup: Already logged in

Steps:

- [ ] Open DevTools Storage tab
- [ ] Manually clear IndexedDB (Firebase stores token there)
- [ ] Refresh page
- [ ] Check:
  - [ ] Firebase generates NEW FCM token
  - [ ] `POST /notifications/register-token` should appear (different token)
  - [ ] localStorage updated with new token
  - [ ] Backend has new token mapping

**Expected Result:** ✅ Updated token sent to backend

---

### Test 5: Logout - FCM Token Unlink (CRITICAL)

**Objective:** Verify token is unlinked before logout

Setup: Already logged in

Steps:

- [ ] Open Network tab
- [ ] Click Logout button
- [ ] Monitor network requests IN ORDER:
  - [ ] First: `POST /notifications/unlink-token` → succeeds
  - [ ] Then: `POST /auth/logout` → succeeds
- [ ] Check browser localStorage:
  ```javascript
  localStorage.getItem("last_fcm_token");
  // Should return null (cleared)
  ```
- [ ] Check browser console:
  - [ ] "FCM token unlinked successfully"
- [ ] Verify redirected to `/login`
- [ ] Verify backend:
  - [ ] Token deleted from FCM Tokens table
  - [ ] userId → no token mapping

**Expected Result:** ✅ Token properly cleaned up, ready for next user

---

### Test 6: Shared Device - Notification Leakage Prevention (CRITICAL)

**Objective:** Verify old user doesn't get new user's notifications

Setup: Test with two user accounts

Steps:

1. **User A: Login**
   - [ ] Log in as User A
   - [ ] Note device's FCM token
   - [ ] Verify backend: userId_A → token mapping

2. **User A: Logout**
   - [ ] Click Logout
   - [ ] Verify network: `POST /notifications/unlink-token` succeeds
   - [ ] Verify backend: token deleted from database
   - [ ] Check localStorage: token cleared

3. **User B: Login**
   - [ ] Log in as User B on same device
   - [ ] Firebase generates new FCM token
   - [ ] `POST /notifications/register-token` succeeds
   - [ ] Verify backend: userId_B → new token mapping

4. **Send Notification Test**
   - [ ] Backend: Send notification to userId_A
   - [ ] Expected: No notification on device ✅
   - [ ] Backend: Send notification to userId_B
   - [ ] Expected: Notification appears on device ✅

**Expected Result:** ✅ User A doesn't receive User B's notifications (SECURE)

---

## Production Deployment Checklist

### Code Quality

- [ ] All TypeScript types correct
- [ ] ESLint passes
- [ ] No console errors
- [ ] No console warnings
- [ ] Code reviews completed

### Backend Ready

- [ ] Endpoints implemented and tested
- [ ] Error handling in place
- [ ] Logging implemented
- [ ] Database migrations done
- [ ] Backup plan if needed

### Environment Variables

- [ ] `NEXT_PUBLIC_API_URL` configured
- [ ] `NEXT_PUBLIC_FIREBASE_*` variables set
- [ ] Backend API URL correct for production

### Testing Coverage

- [ ] ✅ All 6 test scenarios passed locally
- [ ] ✅ Staging environment tested
- [ ] ✅ Edge cases tested:
  - [ ] Network failures
  - [ ] Slow internet
  - [ ] Multiple rapid refreshes
  - [ ] Mixed Chrome/Firefox/Safari

### Documentation

- [ ] Team trained on new flow
- [ ] Documentation updated if needed
- [ ] Error messages clear for debugging
- [ ] Monitoring alerts set up (optional)

### Rollback Plan

- [ ] Documented how to revert if issues
- [ ] Know how to manually clean FCM tokens if needed
- [ ] Have hotline ready for urgent issues

---

## Post-Deployment Monitoring

### Week 1

- [ ] Monitor error logs for FCM failures
- [ ] Check that tokens are being registered
- [ ] Verify notifications are being sent/received
- [ ] Monitor user reports
- [ ] Check database for orphaned tokens

### Weekly

- [ ] Review FCM token cleanup logs (from logout)
- [ ] Check if any users reporting notification issues
- [ ] Monitor database growth (tokens table)
- [ ] Analyze sync vs skip ratio (should see good optimization)

### Metrics to Track

- [ ] Registration with FCM success rate (target: >95%)
- [ ] Login with FCM success rate (target: >95%)
- [ ] Logout with FCM unlink success rate (target: >99%)
- [ ] Duplicate API call prevention (localStorage optimization)
- [ ] Average time from login to dashboard (should be similar)

---

## Troubleshooting Guide

### Issue: FCM Token Never Registered

**Symptoms:** Notifications not received after login

Debug steps:

```javascript
// Check localStorage
localStorage.getItem("last_fcm_token");
// Should have a value, not null

// Check notification permission
Notification.permission;
// Should be "granted", not "denied"

// Check browser console
// Should see "FCM token synced successfully"
```

**Possible causes:**

- [ ] User hasn't granted notification permission
- [ ] Firebase not initialized (check env vars)
- [ ] Backend endpoint failing
- [ ] Network issue

**Fix:**

- [ ] Verify Firebase credentials in env vars
- [ ] Check backend /notifications/register-token endpoint
- [ ] Test with curl: `curl -X POST http://localhost:3000/api/v1/notifications/register-token`

---

### Issue: Logout Takes Too Long

**Symptoms:** Logout button hangs for several seconds

Debug steps:

```javascript
// Check network tab during logout
// Should see:
// 1. POST /notifications/unlink-token (should be fast)
// 2. POST /auth/logout (should be fast)
```

**Possible causes:**

- [ ] Backend /notifications/unlink-token slow
- [ ] Backend /auth/logout slow
- [ ] Database query slow

**Fix:**

- [ ] Profile backend endpoint
- [ ] Add database indexes
- [ ] Check backend logs for slow queries

---

### Issue: Token Keeps Getting Re-registered

**Symptoms:** Many duplicate POST /notifications/register-token calls

Debug steps:

```javascript
// Check localStorage
localStorage.getItem("last_fcm_token");
// Should match current Firebase token

// Check browser console
// Should NOT see "New or updated FCM token detected"
// Should see "FCM token unchanged, skipping sync"
```

**Possible causes:**

- [ ] localStorage not persisting (privacy mode?)
- [ ] Firebase token changing frequently
- [ ] Bug in token comparison

**Fix:**

- [ ] Check if browser is in private/incognito mode
- [ ] Verify localStorage working: localStorage.setItem("test", "123")
- [ ] Check Firebase setup

---

### Issue: User Gets Wrong User's Notifications

**Symptoms:** User A logs out, User B logs in, User A's notifications received

**CRITICAL FIX:**

- [ ] Verify `unlinkFcmToken()` called BEFORE logout
- [ ] Check backend: /notifications/unlink-token exists
- [ ] Check backend logs: token being deleted on logout
- [ ] If not: implement unlink endpoint immediately

```typescript
// Quick test
// 1. Log in as User A
// 2. Check browser Network during logout
// 3. Should see POST /notifications/unlink-token BEFORE POST /auth/logout
```

---

## Common Mistakes to Avoid

❌ **Don't:**

- Await FCM operations in logout (blocks user)
- Send token in request body instead of using cookies
- Forget to clear localStorage on logout
- Skip unlink endpoint
- Test only on one device

✅ **Do:**

- Use fire-and-forget pattern
- Let HTTP-only cookies handle authentication
- Always clear localStorage after unlink
- Implement unlink endpoint on backend
- Test on multiple devices and browsers

---

## Success Criteria

### Implementation Complete When:

✅ All code changes applied without errors
✅ Backend endpoints implemented and tested
✅ App layout calls `useSyncFcmOnMount()`
✅ TypeScript compilation succeeds
✅ ESLint passes

### Testing Complete When:

✅ Test 1: Registration with FCM - PASS
✅ Test 2: Login with FCM - PASS
✅ Test 3: App Refresh (smart check) - PASS
✅ Test 4: Firebase Token Refresh - PASS
✅ Test 5: Logout unlink (CRITICAL) - PASS
✅ Test 6: Shared device (CRITICAL) - PASS

### Deployment Ready When:

✅ All testing passed
✅ Backend ready
✅ Team trained
✅ Documentation complete
✅ Rollback plan documented

---

## Quick Links to Documentation

| Document                                                             | Time   | Purpose                           |
| -------------------------------------------------------------------- | ------ | --------------------------------- |
| [FCM_QUICK_REFERENCE.md](./FCM_QUICK_REFERENCE.md)                   | 5 min  | Start here - one page cheat sheet |
| [IMPLEMENTATION_EXAMPLES.md](./IMPLEMENTATION_EXAMPLES.md)           | 10 min | See code examples                 |
| [FCM_NOTIFICATION_LIFECYCLE.md](./FCM_NOTIFICATION_LIFECYCLE.md)     | 15 min | Full detailed explanation         |
| [FCM_ARCHITECTURE_DIAGRAMS.md](./FCM_ARCHITECTURE_DIAGRAMS.md)       | 10 min | Visual flows and diagrams         |
| [NOTIFICATION_SERVICE_SUMMARY.md](./NOTIFICATION_SERVICE_SUMMARY.md) | 5 min  | Overview                          |

---

## Contact & Support

For questions about:

- **Implementation**: Check IMPLEMENTATION_EXAMPLES.md
- **Architecture**: Check FCM_ARCHITECTURE_DIAGRAMS.md
- **Lifecycle**: Check FCM_NOTIFICATION_LIFECYCLE.md
- **Quick answers**: Check FCM_QUICK_REFERENCE.md
- **Code issues**: Review src/services/notification.service.ts
- **Backend issues**: Check API endpoints section in documentation

---

## Final Sign-Off

After completing all checks above:

Developer: **\*\*\*\***\_**\*\*\*\*** Date: **\_\_\_**
Reviewer: **\*\*\*\***\_**\*\*\*\*** Date: **\_\_\_**

All tests passed: YES / NO
Ready for production: YES / NO
Concerns documented: YES / NO

---

**Version:** 1.0
**Last Updated:** November 2024
**Status:** Ready for Implementation ✅
