# 2FA Login Implementation Plan

## 1. Overview

Enhance the authentication flow to support Two-Factor Authentication (2FA) for all users, with strict enforcement for Admin accounts.

## 2. Architecture & Data Flow

### 2.1 Type Definitions (`src/types/auth.types.ts`)

Extend `LoginRequest` to include optional 2FA fields:

```typescript
export type LoginRequest = {
  password: string;
  totpCode?: string; // 6-digit authenticator code
  backupCode?: string; // Emergency backup code
} & ({ email: string; phone?: never } | { email?: never; phone: string });
```

### 2.2 Service Layer (`src/services/auth.service.ts`)

Update `login` method to accept the extended `LoginRequest`.

- No URL change needed (`/auth/login`).
- Needs to handle a specific response payload indicating 2FA is required.

**Expected Server Response for 2FA Challenge:**

```json
{
  "success": false,
  "message": "2FA code is required",
  "require2fa": true
}
```

_Note: We need to align with the backend developer on the exact status code. A `403 Forbidden` or `401 Unauthorized` with a specific error code is standard, but a `200 OK` with `success: false` is also possible depending on current conventions._

### 2.3 Hook Layer (`src/hooks/useAuth.ts` or `useLogin.ts`)

Modify `useLogin` mutation:

1.  **Intercept Success/Error**: Check if the response indicates `require2fa`.
2.  **State Management**: If 2FA is required, do **not** resolve the promise or redirect. Instead:
    - Set a local state `isTwoFactorStep(true)`.
    - Keep the credentials (email/password) in memory (or cached safely).
3.  **Resubmit**: Provide a method to call login again _with_ the `totpCode`.

---

## 3. UI/UX Strategy

### 3.1 Components

- **`LoginForm`**: Existing form. Needs to listen to the hook's `isTwoFactorStep`.
- **`TwoFactorInput`**: New component.
  - Input field for 6-digit code (Input OTP pattern).
  - "Use Backup Code" toggle.
  - "Cancel" button to go back to email/password.

### 3.2 Flows

1.  **Standard Login**:
    - User enters Email + Password.
    - Click "Login".
    - **Scenario A (No 2FA)**: Success -> Redirect to Dashboard.
    - **Scenario B (2FA Enabled)**:
      - API returns `require2fa: true`.
      - UI transitions to `TwoFactorInput` screen (same modal/page).
      - User enters 6-digit code.
      - Auto-submit or Click "Verify".
      - API returns Success -> Redirect to Dashboard.

2.  **Admin Route (`/admin/login`)**:
    - Visually distinct from user login (different background/branding).
    - Uses the same logical flow (reusable `LoginForm` component).
    - _Enforcement_: If an admin tries to login and 2FA is _not_ enabled on their account, the backend generally allows login but the frontend should redirect them to `/admin/setup-2fa` immediately (Middleware or Layout check).

---

## 4. Implementation Steps

### Phase 1: Types & Service

- [ ] Update `LoginRequest` in `src/types/auth.types.ts`.
- [ ] Verify `authService.login` allows the new fields.

### Phase 2: UI Components

- [ ] Create `src/components/auth/TwoFactorForm.tsx`.
  - Use `input-otp` from shadcn/ui.
  - Handle `totpCode` state.

### Phase 3: Login Logic Update

- [ ] Refactor `useLogin` in `src/hooks/useAuth.ts`.
  - Add `step` state ('credentials' | '2fa').
  - Handle the "intermediate" success state where 2FA is requested.

### Phase 4: Integration

- [ ] Update `/login` page to support the transition.
- [ ] Create `/admin/login` page reusing the logic.

## 5. Testing

- **Unit**: Mock `authService.login` to return `require2fa`. Verify hook state changes.
- **Manual**:
  - Test login with a user that has 2FA disabled.
  - Test login with a user that has 2FA enabled (requires backend data setup).
