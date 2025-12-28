# Soft Lock Implementation Discovery Report

## Executive Summary

This document outlines the current codebase infrastructure and gaps for implementing the Soft Lock security feature. The frontend is well-structured with modern patterns already in place.

---

## 1. Current Architecture Overview

### 1.1 State Management Approach

- **Current Pattern:** React Context API (`AuthContext`) for global auth state
- **Location:** `src/context/AuthContext.tsx`
- **Status:** ✅ No Zustand/Redux yet - decision needed for Security Store
- **What's Available:**
  - `AuthContext` provides: user, isLoading, isAuthenticated, isSessionExpired, hasRefreshTokens
  - `setIsAuthLoadingGlobal()` for showing global loading states
  - localStorage caching of auth state
  - Session expiration management callbacks

### 1.2 Authentication Flow

- **Token Strategy:** HTTPOnly cookies + axios interceptors
- **Tokens:**
  - accessToken: 15 minutes lifetime (short-lived)
  - refreshToken: 24 hours lifetime (long-lived)
- **API Client:** `src/lib/api-client.ts` (Axios-based with automatic refresh logic)
- **Architecture:** Request interceptor + Response interceptor with token refresh queue

### 1.3 UI Library

- **Framework:** Radix UI (ShadCN components)
- **Available UI Components:** Full suite in `src/components/ui/`
  - dialog, button, input, input-otp, card, spinner, etc.
  - Perfect for building Lock Screen

---

## 2. Existing Services & Hooks

### 2.1 Authentication Services

**Location:** `src/services/auth.service.ts`

**Current Endpoints:**

```
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /user/profile/me
POST /auth/refresh
POST /password/forgot-password
POST /password/reset-password
POST /password/update-password
```

**Gap:** ❌ No PIN verification endpoint
**Gap:** ❌ No verification intent pattern (unlock/transaction/login)

### 2.2 Biometric Services

**Location:** `src/services/biometric.service.ts`

**Current Endpoints:**

```
GET  /biometric/register/options
POST /biometric/register/verify
GET  /biometric/auth/options
POST /biometric/auth/verify
GET  /biometric/enrollments
DELETE /biometric/enrollments/{id}
GET  /biometric/audit-log
```

**Status:** ✅ WebAuthn fully implemented
**Library:** `@github/webauthn-json` for binary handling
**Note:** These are for biometric registration/authentication, NOT for quick unlock verification

### 2.3 User Hooks

**Location:** `src/hooks/useAuth.ts`, `useBiometric.ts`, `useUser.ts`

**Available:**

- `useAuth()` - Current user, authentication state
- `useBiometric()` - Biometric enrollment management
- `useSetPin()` - Hook to set/update transaction PIN
- React Query hooks with caching strategy (5-minute cache for user profile)

---

## 3. Persistence Patterns

### 3.1 localStorage Patterns (Already in Use)

- `auth_user_cache` - Cached user profile
- `auth_user_cache_time` - Cache timestamp
- Cookies (httpOnly) - tokens managed by browser/server

### 3.2 Recommendation

- Use `lastActiveTime` in localStorage for "soft lock" timing
- Key suggestion: `security_last_active_time`

---

## 4. Layout Structure & Provider Nesting

**Current Layout:** `src/app/layout.tsx`

```
html
└── body
    └── ThemeProvider
        └── QueryProvider (React Query)
            └── AuthProvider (Auth Context)
                ├── AuthRedirectLoader
                ├── MarkupSyncer
                ├── ServiceWorkerNavigationListener
                ├── PWAInstallPrompt
                ├── Toaster (Sonner)
                └── {children}
```

**Key Points:**

- ✅ Perfect nesting for adding `<SecurityGuard />` after `<AuthProvider>`
- ✅ PWA components already in place
- ✅ Toast notifications available via Sonner

---

## 5. Backend API Gaps (TO CLARIFY WITH USER)

### Critical Unknown Endpoints

These endpoints are **referenced in the task description** but NOT yet found in the services:

1. **PIN Verification Endpoint**

   ```
   POST /verification/pin
   Payload: { intent: 'unlock', pin: "..." }
   Response: { success: boolean, message?: string }
   ```

2. **Biometric Verification Endpoint** (unlock intent)

   ```
   POST /verification/biometric/verify
   Payload: { intent: 'unlock', signature: "..." }
   Response: { success: boolean, message?: string }
   ```

3. **Transaction Biometric Endpoint**

   ```
   POST /verification/biometric/verify
   Payload: { intent: 'transaction', signature: "..." }
   Response: { success: boolean, verificationToken: string }
   ```

4. **Login Biometric Endpoint**
   ```
   POST /verification/biometric/verify
   Payload: { intent: 'login', signature: "..." }
   Response: { success: boolean, accessToken: string, refreshToken: string }
   ```

**Questions for Backend/User:**

- Are these endpoints already implemented?
- Are they variations of existing endpoints or completely new?
- What is the exact request/response structure?
- Does biometric verification use WebAuthn or a different mechanism?

---

## 6. Component Patterns & Conventions

### 6.1 Form Components

- Uses **React Hook Form** + **Zod** for validation
- Example: `src/components/features/security/set-pin-form.tsx`
- Pattern: Controlled components with form validation

### 6.2 Global Components

- Guard/wrapper components in `src/components/`
- Examples: `AuthRedirectLoader`, `FcmSyncer`, `ServiceWorkerNavigationListener`
- Pattern: useEffect for side effects, no UI rendering

### 6.3 Hook Patterns

- Custom hooks in `src/hooks/`
- React Query mutations for API calls
- Toast notifications via Sonner for user feedback

---

## 7. Testing Infrastructure

**Current Test Structure:**

- Jest configured (`jest.config.mjs`)
- Playwright for e2e tests
- Test files in `__test__/` directory
- Existing hooks tests: `useAuth.test.tsx`, `useBiometric.test.ts`

---

## 8. Recommendations for Implementation

### 8.1 State Management Decision

**Options:**

1. **Extend AuthContext** - Add security state fields (easiest, already familiar pattern)
2. **New Zustand Store** - Separate `useSecurityStore` (cleaner separation, but needs new dependency check)
3. **Use React Query** - Store lock status as query state (redundant given Context API)

**Recommendation:** Start with **Zustand** for `useSecurityStore` (separate concerns, simpler to test)

### 8.2 API Service Strategy

**Current Pattern:** Services expose endpoints grouped by domain

- `authService.ts` - Auth endpoints
- `biometricService.ts` - Biometric endpoints
- **Need:** `verificationService.ts` OR extend existing services

**Recommendation:** Create new `src/services/verification.service.ts` for PIN/biometric unlock verification

### 8.3 Component Architecture

```
components/
├── guards/
│   └── SecurityGuard.tsx          (new - lifecycle manager)
├── auth/
│   └── LockScreen.tsx              (new - UI)
├── (existing auth components...)
```

### 8.4 Hooks Architecture

```
hooks/
├── useSecurityStore.ts             (Zustand hook - already created)
├── useLockScreen.ts                (new - unlock logic)
├── useBiometricTransaction.ts      (new - transaction auth)
├── (existing hooks...)
```

---

## 9. Critical Implementation Order

1. **Confirm Backend API Structure** ← BLOCKER
   - Verify PIN/biometric verification endpoints exist
   - Get exact payloads and responses

2. **Create Zustand Store** (`useSecurityStore`)
   - State: isLocked, lastActiveTime, appState
   - Persistence: localStorage sync

3. **Create Verification Service** (if endpoints confirmed)
   - Wrapper around API endpoints
   - Handle intent pattern

4. **Create SecurityGuard Component**
   - Visibility listener
   - Idle timer
   - Interaction watcher

5. **Create LockScreen Component**
   - UI with numeric keypad + biometric button
   - Integration with verification service

6. **Create useBiometricTransaction Hook**
   - Reusable for future transactions

---

## 10. File Checklist (Deliverables)

```
✅ DISCOVERED:
  - src/context/AuthContext.tsx (existing auth state)
  - src/services/auth.service.ts (existing auth service)
  - src/services/biometric.service.ts (existing biometric service)
  - src/lib/api-client.ts (axios client with refresh logic)
  - src/hooks/useAuth.ts (existing auth hook)
  - src/components/ui/* (Radix/ShadCN components)

❌ NEEDED (TO BE CREATED):
  - src/store/securityStore.ts (Zustand store)
  - src/services/verification.service.ts (new verification endpoints)
  - src/components/guards/SecurityGuard.tsx (lifecycle manager)
  - src/components/auth/LockScreen.tsx (lock screen UI)
  - src/hooks/useLockScreen.ts (unlock logic)
  - src/hooks/useBiometricTransaction.ts (transaction auth)
```

---

## 11. Dependencies Check

**Already installed:**

- ✅ React 19.2.0
- ✅ Next.js 16.0.1
- ✅ React Hook Form
- ✅ Zod
- ✅ Axios
- ✅ @tanstack/react-query
- ✅ Sonner (toast)
- ✅ @github/webauthn-json (biometric)
- ✅ Lucide React (icons)

**May need:**

- ❓ Zustand (for state management) - CHECK if already installed
- ❓ Other dependencies based on PIN keypad UI choice

---

## 12. Next Steps: User Decision Required

Please clarify the following **BEFORE implementation starts:**

### Q1: Backend API Structure

- [ ] Are the PIN/biometric verification endpoints already implemented?
- [ ] What is the exact endpoint path and request/response format?
- [ ] Is the "intent" pattern (`intent: 'unlock' | 'transaction' | 'login'`) already in the backend?

### Q2: State Management

- [ yes ] Do you prefer **Zustand** or **extending AuthContext** for security state?
- [ ] Any preference for how `lastActiveTime` should be stored/synced?

### Q3: PIN Keypad UI

- [ ] Should PIN entry use the `input-otp` component (already available)?
- [ ] Or numeric keypad with buttons (custom)?

### Q4: Biometric Flow

- [ ] Should quick unlock use the existing WebAuthn service or a different mechanism?
- [ ] Should it be a simplified flow vs. the registration flow?

### Q5: Security Strictness

- [ ] For "Unlock" verification, always call backend OR check token validity first?
- [ ] Should lock trigger on tab switch OR inactivity (or both)?

---

## Summary for User

**Your codebase is well-architected and ready for this feature.** Here's what exists:

✅ **Strong Foundation:**

- React Context for global state
- Axios with token refresh logic
- WebAuthn biometric infrastructure
- ShadCN/Radix UI components
- React Query for server state

⚠️ **Gaps to Fill:**

- No Zustand store yet (needed for security state)
- No PIN verification endpoint (need confirmation from backend)
- No quick biometric verification flow (different from registration)
- No lifecycle manager component yet

🚀 **Ready to proceed once you clarify:**

1. Backend API structure for PIN/biometric verification
2. Preference for state management approach
3. UI preferences for PIN entry and biometric button

---

_This report was generated during discovery. Once clarifications are provided, implementation will proceed systematically through the 4 main deliverables._
