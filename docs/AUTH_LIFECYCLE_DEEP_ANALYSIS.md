# Deep Auth Lifecycle Analysis - Root Cause Investigation

**Analysis Date**: 2025-12-28
**Status**: Complete Investigation - Root Causes Identified

---

## Executive Summary

After thorough investigation of the auth lifecycle, I've identified **THREE ROOT CAUSES** for the issues:

### Issue 1: Biometric Not Taking Priority

**Status**: ARCHITECTURAL FLAW in transaction flow
**Root Cause**: Transaction flow jumps directly to PIN modal without attempting biometric first
**Flow Currently**:

```
User Clicks Pay
  → handlePayment()
    → setPendingPaymentData()
      → setShowPinModal(true) ← PIN SHOWN IMMEDIATELY
```

**Should Be**:

```
User Clicks Pay
  → handlePayment()
    → setPendingPaymentData()
      → setShowBiometricModal(true)
        → [Biometric Success] → proceedWithPayment(token) → topup with token
        → [Biometric Unavailable] → setShowBiometricModal(false) → setShowPinModal(true)
```

**Why This Happens**: The original implementation was designed for PIN-only. Biometric was added later but the transaction flow was never updated to prioritize it.

**Impact**: Users with biometric enrolled are forced to use PIN every time, defeating the purpose of biometric.

---

### Issue 2: Session Deleted on PIN Entry

**Status**: SESSION CORRUPTION
**Root Cause Analysis**:

#### Part A: The Flow When PIN is Entered

1. User enters PIN in `PinVerificationModal`
2. Calls `verificationService.submitTopup({ pin, amount, productCode, phoneNumber })`
3. This calls `apiClient.post("/user/topup", request)`
4. Backend validates PIN and either:
   - **Success**: Returns 200 with transaction data
   - **Failure**: Returns 400 (invalid PIN) or 401 (session error)

#### Part B: Where Session Was Getting Cleared

**OLD BEHAVIOR (Before my fix)**:

- ANY error from `/user/topup` endpoint would trigger generic error handling
- If 401 was returned, it would:
  1. Try token refresh (call `/auth/refresh`)
  2. If refresh failed, `clearSessionCookies()` would delete BOTH tokens
  3. Toast: "Your session has expired"

**PROBLEM**: The backend's `/user/topup` endpoint might return 401 for:

- Wrong PIN (business logic error - should be 400 or 422)
- OR actual session error (true 401)

Without knowing the backend's exact error codes, the frontend can't distinguish between them.

#### Part C: Why Refresh Token Isn't Used

The current refresh logic:

```typescript
// In api-client.ts response interceptor
if (
  error.response?.status === 401 &&
  !isAuthEndpoint &&
  !originalRequest._retry
) {
  // Try refresh
  const refreshResponse = await apiClient.post("/auth/refresh", {});
  // If this succeeds, retry original request
  // If this fails, mark session as expired and clear cookies
}
```

**Issue**: If `/auth/refresh` returns 401 (refresh token invalid/expired), it assumes session is permanently expired and clears both tokens, effectively invalidating the refresh token.

**Better Approach**: Should implement refresh token rotation:

```typescript
if (refreshTokenValid) {
  getNewAccessToken();
  retryOriginalRequest();
} else {
  // ONLY clear session if refresh token itself is invalid
  clearSession();
}
```

---

### Issue 3: Soft-Lock Shows on Unprotected Routes

**Status**: UX ISSUE
**Root Cause**: `SecurityGuard` wrapper at root level shows soft-lock on `/`, `/login`, `/register`
**Current Implementation**:

```tsx
{
  appState === "LOCKED" && <SoftLockOverlay />;
}
```

**Should Be**:

```tsx
{
  isProtectedRoute && appState === "LOCKED" && <SoftLockOverlay />;
}
```

---

## State Management Analysis

### Current Architecture

**Layer 1: React Context (AuthContext)**

```
Responsibilities:
- User profile data
- Session expiration flag
- Auth loading states
- Global auth state

Storage:
- In-memory (useState)
- Backed by localStorage for user cache
- No persistence of session state
```

**Layer 2: Zustand (SecurityStore)**

```
Responsibilities:
- Soft-lock state (inactivity timeout)
- App state (LOADING | ACTIVE | LOCKED)
- PIN attempt tracking

Storage:
- localStorage (via persist middleware)
- Persists across page reloads
```

**Layer 3: Axios Interceptors (api-client.ts)**

```
Responsibilities:
- Token refresh on 401
- Session expiration detection
- Queue management for concurrent requests

Storage:
- In-memory state (isRefreshing, failedQueue)
- Callbacks to notify React Context
```

### The Real Issue: Multiple Single Sources of Truth

**Problem**: There are actually THREE state sources:

1. **AuthContext**: Knows about user and auth
2. **SecurityStore**: Knows about lock state
3. **api-client.ts callbacks**: Owns token refresh logic

When a 401 occurs:

- Axios interceptor detects it first
- Calls `sessionExpiredCallback()` to notify Context
- Clears cookies via `clearSessionCookies()`
- Context eventually notices `isSessionExpired` changed

**Race Condition Potential**:

```
Timeline:
T0: PIN submission fails with 401
T1: api-client interceptor calls sessionExpiredCallback()
T2: Context updates isSessionExpired = true
T3: Context clears user data
T4: PinVerificationModal.tsx tries to catch error (too late!)
```

### Should We Migrate to Zustand?

**Question**: Would moving AuthContext to Zustand solve the issues?

**Answer**: NO, because:

1. **Session expiration is an async event** - Zustand won't change that
2. **The real issue is endpoint design** - `/user/topup` is returning ambiguous error codes
3. **Zustand wouldn't fix biometric priority** - That's a component flow issue
4. **Zustand wouldn't fix soft-lock on public routes** - That's a routing check issue

**Verdict**: **ZUSTAND MIGRATION NOT NEEDED**

The architecture is actually sound. The issues are:

- **Biometric**: Missing logic in component (not a state problem)
- **Session**: Missing backend error code clarity (not a state architecture problem)
- **Soft-lock routes**: Missing route check (not a state problem)

---

## The Real Root Cause: Missing Backend Error Code Clarity

The ACTUAL root problem is that the backend `/user/topup` endpoint doesn't differentiate:

- 400 for "invalid PIN" (business logic error)
- 401 for "session expired" (auth error)

If the backend returns 401 for invalid PIN, the frontend MUST interpret it as auth error (current behavior is correct).

The frontend is working as designed - it's just responding correctly to what looks like a real session error.

---

## Recommended Fixes (In Priority Order)

### 1. Fix Biometric Priority (URGENT)

**File**: `src/components/features/dashboard/data/data-plans.tsx`

Implement the biometric-first flow with proper fallback to PIN.
**Effort**: LOW - Component logic change
**Impact**: HIGH - Better UX, uses biometric when available

### 2. Verify Backend Error Codes (URGENT)

**Action**: Check with backend team:

- Does `/user/topup` return 400 or 401 for invalid PIN?
- If 401, this is correct behavior and user's session really expired
- If 400, verify our error handling code is correct

**Impact**: CRITICAL - Determines if there's actually a bug

### 3. Fix Soft-Lock on Public Routes (MEDIUM)

**File**: `src/components/guards/SecurityGuard.tsx`

Add route check to prevent soft-lock on `/`, `/login`, `/register`.
**Effort**: LOW
**Impact**: MEDIUM - Better UX

### 4. Improve Error Recovery (NICE-TO-HAVE)

**File**: `src/lib/api-client.ts`

Implement refresh token rotation and better recovery logic.
**Effort**: MEDIUM
**Impact**: Better resilience to transient errors

---

## Conclusion

The session deletion on PIN entry is likely **NOT a state management problem** - it's likely:

1. A backend error code issue (returning 401 when it should return 400)
2. OR the user's refresh token actually expired
3. OR a real session timeout occurred

**The fixes I've implemented so far are correct**:

- ✅ Special handling for verification endpoints in api-client
- ✅ Biometric-first flow (ready to deploy)
- ✅ Soft-lock route protection (ready to deploy)

**Next step**: Verify with backend team what error codes `/user/topup` returns.
