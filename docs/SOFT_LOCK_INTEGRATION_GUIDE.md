# Soft Lock Security System - Integration Guide

## Overview

Soft Lock is a 15-minute inactivity timeout system that locks the app UI without logging the user out. When the user is inactive for 15 minutes, the app shows a lock screen requiring biometric verification to unlock. The session remains valid—no re-login required.

**Key Design Principle: Biometric-First**

- Biometric is the PRIMARY unlock method
- PIN is ONLY for transaction verification (fallback if biometric unavailable)

---

## Architecture

### Core Files Created

#### 1. **Security Store** (`src/store/securityStore.ts`)

- **Purpose**: Centralized state for lock status, inactivity tracking, PIN attempts
- **Key State**:
  - `isLocked` - Current lock state
  - `appState` - "LOADING" | "LOCKED" | "ACTIVE" (prevents UI flash)
  - `lastActiveTime` - Unix timestamp of last activity
  - `timeUntilLock` - Milliseconds remaining before lock
  - `pinAttempts` - Failed PIN attempts counter
  - `isBlocked` - Rate-limit block flag (after 3 PIN failures)
  - `blockExpireTime` - When 5-min block expires

- **Key Methods**:
  - `initialize()` - Called on app start, checks if should be locked
  - `recordActivity()` - Called on user interaction, resets inactivity timer
  - `recordPinAttempt(success: boolean)` - Tracks PIN attempts, enforces 3-strike/5-min block
  - `unlock()` - Releases lock, resets activity timer
  - `cleanup()` - Clears intervals on unmount

- **Persistence**: Auto-saves `isLocked` and `lastActiveTime` to localStorage via Zustand persist middleware

#### 2. **Activity Service** (`src/services/soft-lock.service.ts`)

- **Purpose**: Monitor user activity (clicks, key presses, touches, scrolls)
- **Implementation**:
  - Registers debounced event listeners (500ms debounce to prevent excessive updates)
  - Activities tracked: `mousedown`, `keydown`, `touchstart`, `click`, `scroll`
  - Calls callback (`recordActivity()`) when user interacts
  - Cleanup removes all listeners on unmount

#### 3. **Verification Service** (`src/services/verification.service.ts`)

- **Purpose**: API wrapper for biometric and PIN verification
- **Methods**:
  - `verifyBiometricForUnlock(request)` - POST `/biometric/auth/verify` with `intent: 'unlock'`
    - Returns: `{ success: true }`
  - `verifyBiometricForTransaction(request)` - POST `/biometric/auth/verify` with `intent: 'transaction'`
    - Returns: `{ success: true, verificationToken: "JWT" }`
  - `submitTopup(request)` - POST `/user/topup` with either `pin` OR `verificationToken`
    - Returns: `{ success: true, transaction: {...} }`

#### 4. **SecurityGuard Component** (`src/components/guards/SecurityGuard.tsx`)

- **Purpose**: Root wrapper that initializes soft-lock system
- **Placement**: Must wrap children in `src/app/layout.tsx` inside `AuthProvider`
- **Behavior**:
  - Initializes store and activity listeners on mount
  - Shows spinner while `appState === "LOADING"`
  - Renders `SoftLockOverlay` when `appState === "LOCKED"`
  - Passes all activity up to security store

#### 5. **SoftLockOverlay Component** (`src/components/auth/SoftLockOverlay.tsx`)

- **Purpose**: Full-screen lock screen displayed after 15 min inactivity
- **Features**:
  - Biometric unlock button (primary method)
  - No PIN fallback for soft-lock (only biometric)
  - Attempt counter for UX feedback
  - Clear error handling for unsupported devices
  - Uses `WebAuthnService.getAuthenticationOptions()` for biometric verification

#### 6. **PinVerificationModal Component** (`src/components/auth/PinVerificationModal.tsx`)

- **Purpose**: Modal for 4-digit PIN entry during transactions
- **Features**:
  - Auto-submit when 4 digits entered
  - Shows/hide PIN option
  - PIN attempt tracking (enforces 3-strike block)
  - Shows transaction amount for context
  - Keyboard support (Backspace to delete)
- **Usage**: Fallback for transactions when biometric unavailable

---

## Data Flows

### Flow 1: Soft Lock (15 Min Inactivity)

```
User Activity (click, type, scroll)
    ↓
Activity Listener (debounced 500ms)
    ↓
recordActivity() in Store
    ↓
Update lastActiveTime (localStorage + state)
    ↓
Reset timeUntilLock counter
```

```
Every 1 second:
Check if (now - lastActiveTime) >= 15 minutes
    ↓
YES → Set isLocked = true, appState = "LOCKED"
    ↓
SecurityGuard renders SoftLockOverlay
    ↓
User clicks "Unlock with Biometric"
    ↓
POST /biometric/auth/verify { intent: 'unlock', ... }
    ↓
Backend returns { success: true }
    ↓
Call unlock() → Set isLocked = false, appState = "ACTIVE"
    ↓
SoftLockOverlay disappears
```

### Flow 2: Transaction with Biometric (Primary)

```
User clicks "Buy Airtime"
    ↓
App shows biometric prompt
    ↓
User confirms with Face/Touch
    ↓
POST /biometric/auth/verify {
  intent: 'transaction',
  id, rawId, response, type: 'public-key'
}
    ↓
Backend returns {
  success: true,
  verificationToken: "eyJhbGc..."
}
    ↓
POST /user/topup {
  verificationToken: "eyJhbGc...",
  amount, productCode, ...
}
    ↓
Backend validates token, executes transaction
    ↓
Return { success: true, transaction: {...} }
```

### Flow 3: Transaction with PIN (Fallback)

```
User clicks "Buy Airtime"
    ↓
[Biometric unavailable OR user chooses PIN]
    ↓
Show PinVerificationModal
    ↓
User enters 4-digit PIN (auto-submit at 4 digits)
    ↓
POST /user/topup {
  pin: "1234",
  amount, productCode, ...
}
    ↓
Backend validates PIN against user.pin (hashed)
    ↓
Return { success: true, transaction: {...} }
```

### Flow 4: PIN Rate Limiting

```
Failed PIN Attempt #1
    ↓
recordPinAttempt(false) → pinAttempts = 1

Failed PIN Attempt #2
    ↓
recordPinAttempt(false) → pinAttempts = 2

Failed PIN Attempt #3
    ↓
recordPinAttempt(false) → pinAttempts = 3
    ↓
Set isBlocked = true, blockExpireTime = now + 5 minutes
    ↓
User cannot enter PIN (button disabled, error shown)
    ↓
After 5 minutes: blockExpireTime expires, isBlocked = false
```

---

## Integration Steps

### Step 1: Wrap Root Layout with SecurityGuard

**File**: `src/app/layout.tsx`

```tsx
import { SecurityGuard } from "@/components/guards/SecurityGuard";
import { AuthProvider } from "@/context/auth-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SecurityGuard>{children}</SecurityGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Important**: `SecurityGuard` must be INSIDE `AuthProvider` to access auth context if needed.

### Step 2: Use PIN Verification in Transaction Flows

**Example**: `src/app/dashboard/airtime/page.tsx` or equivalent transaction flow

```tsx
"use client";

import { useState } from "react";
import { PinVerificationModal } from "@/components/auth/PinVerificationModal";

export default function AirtimePage() {
  const [showPinModal, setShowPinModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [productCode, setProductCode] = useState("");

  const handleBuyAirtime = async () => {
    // Option 1: Use biometric if available
    // (This would be implemented in a separate BiometricTransaction component)

    // Option 2: Use PIN fallback
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    // Transaction is complete
    // PIN modal handles the actual /user/topup call
    console.log("Transaction successful");
    // Refresh data, show success, etc.
  };

  return (
    <>
      <div className="space-y-4">
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
        />
        <button onClick={handleBuyAirtime}>Buy Airtime</button>
      </div>

      <PinVerificationModal
        open={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        reason="transaction"
        transactionAmount={amount}
        productCode={productCode}
      />
    </>
  );
}
```

### Step 3: Create BiometricTransaction Wrapper (Optional, Recommended)

For consistent biometric handling across transaction flows:

```tsx
// src/components/auth/BiometricTransaction.tsx
"use client";

import { useState } from "react";
import { WebAuthnService } from "@/services/webauthn.service";
import { verificationService } from "@/services/verification.service";
import { PinVerificationModal } from "./PinVerificationModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BiometricTransactionProps {
  amount: string;
  productCode: string;
  onSuccess: () => void;
}

export function BiometricTransaction({
  amount,
  productCode,
  onSuccess,
}: BiometricTransactionProps) {
  const [loading, setLoading] = useState(false);
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [hasBiometric, setHasBiometric] = useState<boolean | null>(null);

  const handleBiometricTransaction = async () => {
    setLoading(true);

    try {
      // Check if biometric is available
      if (hasBiometric === null) {
        const supported = await WebAuthnService.isWebAuthnSupported();
        setHasBiometric(supported);

        if (!supported) {
          setShowPinFallback(true);
          return;
        }
      }

      if (!hasBiometric) {
        setShowPinFallback(true);
        return;
      }

      // Get biometric options
      const options = await WebAuthnService.getAuthenticationOptions();

      // User confirms with biometric
      const assertion = await WebAuthnService.signAssertion(options);

      // Verify with backend (gets verification token)
      const verifyResponse =
        await verificationService.verifyBiometricForTransaction({
          id: assertion.id,
          rawId: assertion.rawId,
          response: assertion.response,
          type: "public-key",
          intent: "transaction",
        });

      if (!verifyResponse.success) {
        throw new Error(verifyResponse.message);
      }

      // Submit transaction with token
      const topupResponse = await verificationService.submitTopup({
        verificationToken: verifyResponse.verificationToken,
        amount,
        productCode,
      });

      if (topupResponse.success) {
        toast.success("Transaction completed successfully");
        onSuccess();
      } else {
        toast.error(topupResponse.message || "Transaction failed");
      }
    } catch (error: any) {
      if (error.name !== "NotAllowedError") {
        toast.error("Biometric verification failed. Using PIN instead.");
        setShowPinFallback(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleBiometricTransaction} disabled={loading}>
        {loading ? "Verifying..." : "Confirm with Biometric"}
      </Button>

      <PinVerificationModal
        open={showPinFallback}
        onClose={() => setShowPinFallback(false)}
        onSuccess={onSuccess}
        reason="transaction"
        transactionAmount={amount}
        productCode={productCode}
      />
    </>
  );
}
```

---

## Important Notes

### 1. No PIN for Soft Lock Unlock

- Soft-lock unlock uses ONLY biometric (no PIN fallback)
- If biometric unavailable, only option is to wait for refresh or restart app
- PIN is strictly for transaction verification

### 2. Activity Tracking

- Debounced to 500ms to prevent performance issues
- Passive event listeners used (won't block user input)
- Activities tracked: `mousedown`, `keydown`, `touchstart`, `click`, `scroll`

### 3. PIN Rate Limiting

- 3 failed attempts = 5-minute block
- Block is tracked in Zustand state + localStorage
- Block persists across page refreshes

### 4. Inactivity Check

- Runs every 1 second in setInterval
- Compares current time against `lastActiveTime`
- 15-minute timeout = 900,000 milliseconds
- Checks are CPU-efficient (simple timestamp comparison)

### 5. Session Persistence

- Soft-lock doesn't invalidate the session
- Access token still valid in HTTPOnly cookie
- User doesn't need to login again
- Just UI is hidden behind lock screen

### 6. Storage Strategy

```
localStorage:
  - securityStore (via Zustand persist):
    - isLocked
    - lastActiveTime

Zustand State (in-memory + persist):
  - appState: "LOADING" | "LOCKED" | "ACTIVE"
  - pinAttempts: number
  - isBlocked: boolean
  - blockExpireTime: number | null
```

---

## Testing Checklist

- [ ] Open app, wait 15 minutes of inactivity → soft-lock appears
- [ ] Click any element → soft-lock disappears, timer resets
- [ ] Submit wrong PIN 3 times → 5-minute block enforced
- [ ] After 5-minute block expires → can try PIN again
- [ ] Biometric verification unlocks soft-lock (if device supports)
- [ ] PIN verification completes transaction (if biometric unavailable)
- [ ] Refresh page while locked → lock screen persists
- [ ] Close/reopen browser → lock state restored from localStorage

---

## File Structure

```
src/
├── store/
│   └── securityStore.ts (155 lines)
├── services/
│   ├── soft-lock.service.ts (58 lines)
│   └── verification.service.ts (170 lines)
└── components/
    ├── guards/
    │   └── SecurityGuard.tsx (65 lines)
    └── auth/
        ├── SoftLockOverlay.tsx (140 lines)
        └── PinVerificationModal.tsx (190 lines)
```

---

## Endpoints Used (No New Endpoints Required)

| Endpoint                 | Method | Purpose                              | Response                               |
| ------------------------ | ------ | ------------------------------------ | -------------------------------------- |
| `/biometric/auth/verify` | POST   | Unlock soft-lock                     | `{ success: true }`                    |
| `/biometric/auth/verify` | POST   | Get token for transaction            | `{ success: true, verificationToken }` |
| `/user/topup`            | POST   | Submit transaction with PIN or token | `{ success: true, transaction }`       |

**Query Parameters**:

- `intent: 'unlock'` - For soft-lock unlock (no token returned)
- `intent: 'transaction'` - For transaction verification (token returned)

---

## Next Steps

1. ✅ Integrate SecurityGuard in root layout.tsx
2. ✅ Use BiometricTransaction or PinVerificationModal in transaction flows
3. ⏳ Test inactivity timeout (15 minutes)
4. ⏳ Test PIN rate limiting (3 failures)
5. ⏳ Test biometric flow (if device supports)
6. ⏳ Add to E2E tests (Playwright)
