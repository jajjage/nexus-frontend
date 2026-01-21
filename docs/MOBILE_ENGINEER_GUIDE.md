# Mobile Engineer Guide: Setup & Architecture

This guide documents the **Setup Wizard** flow, **State Management**, and **Authentication Architecture** used in the Web Frontend. Use this as a reference for implementing or aligning the Mobile (React Native) application.

## 1. The "Setup Wizard" Flow

**Entry Point (Web):** `src/app/(auth)/setup/page.tsx`
**Core Component (Web):** `src/components/features/auth/setup-wizard.tsx`

The "Setup" phase occurs immediately after a new user logs in (or if they are missing critical security configs). It is a **sequential** process.

### Step 1: Transaction PIN Setup

- **Condition:** `!user.hasPin`
- **Web Logic:** Checks `user` object from API. If false, shows `SetPinForm`.
- **Mobile Implementation:**
  - Check `user.hasPin` in your Auth Context.
  - If false, navigate to a `SetPinScreen`.
  - **Action:** User enters 4-digit PIN -> API POST -> Update local user state (`hasPin = true`).

### Step 2: App Passcode (Soft Lock)

- **Condition:** `!user.hasPasscode`
- **Context:** This is a **local** app-lock code (like 6 digits) used to unlock the app after it goes to the background.
- **Web Logic:**
  - Checks if `user.hasPasscode` is false.
  - If false, prompts user to create a 6-digit code.
  - **Important:** This code is hashed/sent to the server (via `useSetPasscode` hook/API) so it can be verified later, OR stored locally via `SecureStore` depending on your specific mobile security requirements. _In this web project, it syncs to server via `POST /api/auth/passcode`._
- **Mobile Implementation:**
  - **Crucial for Mobile:** This is your "App Lock" screen.
  - Store the passcode in `Expo SecureStore` for offline verification if desired, but primarily follow the API flow to sync status.

### Step 3: Biometrics (FaceID / TouchID)

- **Condition:** `WebAuthnService.isSupported()` AND `localStorage.getItem("biometric_prompt_status")` is empty.
- **Web Logic:**
  - Checks if device supports WebAuthn.
  - Checks if user has already "Skipped" or "Enabled" it locally (to avoid nagging).
  - Prompts to "Enable" or "Skip".
- **Mobile Implementation:**
  - **Library:** `expo-local-authentication`.
  - Check hardware availability.
  - If available and preference not set in `AsyncStorage`:
    - Show "Enable FaceID" screen.
    - On "Enable": keypair generation (if using WebAuthn/Passkeys) or just Local Auth flag in `AsyncStorage`.

### Step 4: Completion

- **Action:** Local storage flag `is_setup_done = true`.
- **Transition:** Redirect to Dashboard.

---

## 2. State Management Architecture

### Global Auth State

**File (Web):** `src/context/AuthContext.tsx`

- **Pattern:** React Context + React Query + Local Storage Cache.
- **Caching Strategy:**
  - User profile is cached in `localStorage` (`AsyncStorage` on mobile) to allow instant app launch without waiting for network.
  - **Stale Time:** 3 minutes.
  - **GC Time:** 7 minutes.
- **Mobile Adaptation:**
  - Use `AsyncStorage` to persist the `user` object.
  - On App Launch: Load from `AsyncStorage` immediately -> Show App -> Background fetch `GET /api/auth/me` to update.

### Security Store (Zustand)

**File (Web):** `src/store/securityStore.ts`

- **Purpose:** Tracks PIN attempts to prevent brute-force on the client side (in addition to server limits).
- **Library:** `zustand` (Works perfectly in React Native too).
- **Logic:**
  - `pinAttempts`: Counter.
  - `isBlocked`: Boolean.
  - `blockExpireTime`: Timestamp.
  - **Rule:** 5 failed attempts = Block for 5 minutes.
- **Mobile Adaptation:**
  - Copy the `src/store/securityStore.ts` logic almost verbatim.
  - Use `zustand` with `createJSONStorage(() => AsyncStorage)` for persistence.

### Soft Lock Context

**File (Web):** `src/context/SoftLockContext.tsx`

- **Purpose:** Locks the app when it goes to the background to protect sensitive data.
- **Web Logic:** Listens to `visiblitychange`.
- **Mobile Implementation:**
  - **Event:** `AppState.addEventListener('change', ...)`
  - **Logic:**
    - `active` -> `background`: Save timestamp `last_active = Date.now()`.
    - `background` -> `active`: Check `Date.now() - last_active`.
    - **Timeout:** If > 5 minutes (or 30s depending on security setting), show `LockScreen`.
    - **Grace Period:** The web app uses a 90s grace period. Mobile usually uses "immediate" or "1 minute".

---

## 3. Key Hooks & Logic Porting

| Hook Name        | Web Location                      | Mobile Implementation Notes                                                                                                                                                                |
| :--------------- | :-------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useAuth`        | `src/hooks/useAuth.ts`            | **Core Hook**. Replicate `useQuery` logic. Replace `window.location` redirects with React Navigation (`navigation.reset(...)`).                                                            |
| `useCurrentUser` | `src/hooks/useAuth.ts`            | **Keep**. Ensure `refetchOnWindowFocus` is handled by `useFocusEffect` or AppState changes in RN.                                                                                          |
| `useLogin`       | `src/hooks/useAuth.ts`            | **Keep**. Identical mutation logic.                                                                                                                                                        |
| `useLogout`      | `src/hooks/useAuth.ts`            | **Keep**. Ensure `AsyncStorage` is cleared.                                                                                                                                                |
| `useBiometric`   | `src/hooks/useBiometric.ts`       | **Replace/Adapt**. Web uses `navigator.credentials` (WebAuthn). Mobile should primarily use `expo-local-authentication` for local app unlock, and Passkeys (if supported) for server auth. |
| `useSoftLock`    | `src/context/SoftLockContext.tsx` | **Adapt**. Use `AppState` API instead of `document.visibilityState`.                                                                                                                       |

## 4. API & Error Handling

**File (Web):** `src/lib/api-client.ts` (implied)

- **Interceptor Pattern:** The web app uses an Axios interceptor to handle `401 Unauthorized`.
- **Logic:**
  1.  Catch 401.
  2.  Try `POST /api/auth/refresh`.
  3.  If success -> Retry original request.
  4.  If fail -> Log out / Redirect to Login.
- **Mobile:** **Mandatory** to replicate this. Mobile tokens expire just like web tokens.

---

## 5. Feature-by-Feature Hooks & API Guide

This section details exactly which hook handles which feature and the underlying API endpoint to call.

| Feature / Action        | Web Hook                  | API Endpoint                           | Mobile Implementation Note                                         |
| :---------------------- | :------------------------ | :------------------------------------- | :----------------------------------------------------------------- |
| **Login**               | `useLogin`                | `POST /api/auth/login`                 | Returns JWT + User object. Store `user` in Context + AsyncStorage. |
| **Register**            | `useRegister`             | `POST /api/auth/register`              | Redirects to Login on success.                                     |
| **Get Current User**    | `useCurrentUser`          | `GET /api/auth/me`                     | Run in background on app open. Updates local user state.           |
| **Set PIN**             | `useSetPin` (implied)     | `POST /api/auth/pin`                   | Call when `!user.hasPin`.                                          |
| **Set Passcode**        | `useSetPasscode`          | `POST /api/auth/passcode`              | Syncs 6-digit soft-lock code to server.                            |
| **List Transactions**   | `useInfiniteTransactions` | `GET /user/wallet/transactions?page=1` | Use `FlatList` with `onEndReached`.                                |
| **Transaction Details** | `useTransaction(id)`      | `GET /user/wallet/transactions/:id`    | Fetch full details (including `related` object) for Receipt view.  |
| **Wallet Balance**      | `useWalletBalance`        | `GET /user/wallet/balance`             | Poll every 5m or invalidate on new transaction.                    |
| **Biometric Enable**    | `useBiometric`            | N/A (Local)                            | Use `expo-local-authentication`. Store preference locally.         |

### Detail: Transaction Receipt Logic

**File:** `src/components/features/dashboard/transactions/transaction-detail-page.tsx`

When a user taps a transaction:

1.  **Navigation:** Go to `TransactionDetailScreen` with `transactionId`.
2.  **Fetch:** Call `useTransaction(transactionId)` to get fresh data (especially `related` object).
3.  **Display:**
    - **Amount:** Big central display.
    - **Status:** Badge (Success/Pending/Failed).
    - **Fields:** Show `recipient_phone`, `operatorCode`, `reference` based on `relatedType`.
4.  **Sharing:**
    - **Mobile:** Use `react-native-view-shot` to capture the receipt view info an image.
    - **Action:** `Share.open(imageURI)`.

---

---

## 5. Summary Checklist for Mobile Dev

- [ ] **Dependencies:** Install `tanstack/react-query`, `zustand`, `axios`, `expo-secure-store`, `expo-local-authentication`.
- [ ] **Stores:** Port `securityStore.ts` (Zustand).
- [ ] **Context:** Create `AuthContext` with AsyncStorage persistence.
- [ ] **Locking:** Create `SoftLockContext` using `AppState`.
- [ ] **Screens:** Create `SetupPinScreen`, `SetupPasscodeScreen`, `SetupBiometricScreen`.
- [ ] **Navigation:** Ensure the "Auth Stack" checks `!user.hasPin` and redirects to Setup before Dashboard.
