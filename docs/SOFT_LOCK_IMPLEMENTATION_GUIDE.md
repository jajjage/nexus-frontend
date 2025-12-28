# Soft Lock & Biometric Transaction Implementation Guide

## Fintech-Grade Architecture (Biometric-First Design)

**Status:** Implementation-Ready
**Backend Endpoints Used:** ✅ Existing endpoints only (no new endpoints needed)
**Architecture:** Biometric-first, PIN fallback for transactions

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Actual Backend Flows](#actual-backend-flows)
3. [State Management](#state-management)
4. [Service Layer](#service-layer)
5. [UI Components](#ui-components)
6. [Integration Points](#integration-points)
7. [Implementation Checklist](#implementation-checklist)

---

## Architecture Overview

### What We're Building

```
User inactive 15 min
        ↓
    SOFT LOCK TRIGGERED
        ↓
┌───────────────────────────────┐
│  Lock Screen Appears          │
│  ┌─────────────────────────┐  │
│  │ "Unlock with Biometric" │  │
│  │   (WebAuthn)            │  │
│  └─────────────────────────┘  │
│  ↓ User clicks                │
│  POST /biometric/verify       │
│  { intent: 'unlock', ... }    │
│  ↓ Success                    │
│  UI UNLOCKS                   │
└───────────────────────────────┘
```

### Transaction Flow with Biometric-First Design

```
User clicks "Buy Airtime"
        ↓
┌───────────────────────────────────┐
│ User has Biometric enrolled?      │
└───────────────────────────────────┘
     ↙         ↘
   YES         NO
    │           │
    ↓           ↓
BIOMETRIC    PIN MODAL
FLOW         FLOW
    │           │
    ↓           ↓
POST /biometric/verify   POST /user/topup
intent: 'transaction'    { pin: "1234" }
    │                    │
    ↓                    ↓
Get verificationToken    Backend validates
    │                    │
    ↓                    ↓
POST /user/topup         Success
{ verificationToken }
    │
    ↓
Success
```

---

## Actual Backend Flows

### 1. Soft Lock Unlock with Biometric

**Endpoint:** `POST /biometric/verify`

```javascript
// Frontend
{
  id: "credential-id",
  rawId: "...",
  response: {
    clientDataJSON: "...",
    authenticatorData: "...",
    signature: "..."
  },
  type: "public-key",
  intent: "unlock"  // ← Key: Tells backend this is unlock, not login
}

// Backend returns
{
  success: true,
  message: "Verified"
}
```

### 2. Transaction with Biometric

**Endpoint:** `POST /biometric/verify`

```javascript
// Frontend
{
  id: "credential-id",
  rawId: "...",
  response: {
    clientDataJSON: "...",
    authenticatorData: "...",
    signature: "..."
  },
  type: "public-key",
  intent: "transaction"  // ← Key: Tells backend to return verification token
}

// Backend returns
{
  success: true,
  verificationToken: "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Transaction with PIN

**Endpoint:** `POST /user/topup` (No separate PIN verification endpoint)

```javascript
// Frontend
{
  pin: "1234",           // ← User's 4-digit PIN
  amount: 1000,
  productCode: "airtime",
  phoneNumber: "08012345678"
}

// Backend:
// 1. Extracts PIN from request
// 2. Hashes it using same algorithm as stored password
// 3. Compares with users.pin in database
// 4. If matches → Execute transaction
// 5. If doesn't match → Return error

// Returns
{
  success: true,
  transaction: {
    id: "txn-123",
    amount: 1000,
    status: "completed"
  }
}
```

### 4. Transaction After Biometric (Using Verification Token)

**Endpoint:** `POST /user/topup`

```javascript
// Frontend
{
  verificationToken: "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
  amount: 1000,
  productCode: "airtime",
  phoneNumber: "08012345678"
}

// Backend:
// 1. Extracts JWT token
// 2. Verifies JWT signature
// 3. Checks token hasn't expired
// 4. Checks token has 'transaction' scope
// 5. If valid → Execute transaction
// 6. If invalid → Return 401 Unauthorized

// Returns
{
  success: true,
  transaction: {
    id: "txn-456",
    amount: 1000,
    status: "completed"
  }
}
```

---

## State Management

### Zustand Store: `useSecurityStore`

```typescript
// src/store/securityStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SecurityState {
  // App lock state
  isLocked: boolean;
  appState: "LOADING" | "LOCKED" | "ACTIVE";
  lastActiveTime: number;

  // Inactivity warning
  timeUntilLock: number;
  showInactivityWarning: boolean;

  // PIN attempt tracking (for transactions)
  pinAttempts: number;
  isBlocked: boolean;
  blockExpireTime: number | null;

  // Actions
  initialize: () => void;
  recordActivity: () => void;
  setLocked: (locked: boolean) => void;
  unlock: () => void;
  recordPinAttempt: (success: boolean) => void;
  cleanup: () => void;
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      // Initial state
      isLocked: false,
      appState: "LOADING",
      lastActiveTime: Date.now(),
      timeUntilLock: 15 * 60 * 1000,
      showInactivityWarning: false,
      pinAttempts: 0,
      isBlocked: false,
      blockExpireTime: null,

      initialize: () => {
        // Check if should start in locked state
        const lastActive = parseInt(
          localStorage.getItem("security_last_active") || "0"
        );
        const timeSinceActive = Date.now() - lastActive;
        const shouldStartLocked = timeSinceActive > 15 * 60 * 1000;

        set({
          appState: shouldStartLocked ? "LOCKED" : "ACTIVE",
          isLocked: shouldStartLocked,
          lastActiveTime: shouldStartLocked ? lastActive : Date.now(),
        });

        // Set up inactivity timer
        const checkInterval = setInterval(() => {
          const state = get();
          const now = Date.now();
          const timeSinceActivity = now - state.lastActiveTime;
          const timeRemaining = Math.max(0, 15 * 60 * 1000 - timeSinceActivity);

          // Check if block expired
          if (
            state.isBlocked &&
            state.blockExpireTime &&
            now > state.blockExpireTime
          ) {
            set({ isBlocked: false, blockExpireTime: null, pinAttempts: 0 });
          }

          // Update warning
          set({
            timeUntilLock: timeRemaining,
            showInactivityWarning:
              timeRemaining < 2 * 60 * 1000 && timeRemaining > 0,
          });

          // Check if should lock
          if (timeSinceActivity >= 15 * 60 * 1000 && !state.isLocked) {
            set({
              isLocked: true,
              appState: "LOCKED",
            });
          }
        }, 1000);

        (get as any)._checkInterval = checkInterval;
      },

      recordActivity: () => {
        const now = Date.now();
        localStorage.setItem("security_last_active", now.toString());

        set({
          lastActiveTime: now,
          isLocked: false,
          appState: "ACTIVE",
          timeUntilLock: 15 * 60 * 1000,
          showInactivityWarning: false,
        });
      },

      setLocked: (locked: boolean) => {
        set({
          isLocked: locked,
          appState: locked ? "LOCKED" : "ACTIVE",
        });
      },

      unlock: () => {
        set({
          isLocked: false,
          appState: "ACTIVE",
        });
        get().recordActivity();
      },

      recordPinAttempt: (success: boolean) => {
        if (success) {
          set({ pinAttempts: 0, isBlocked: false, blockExpireTime: null });
        } else {
          const attempts = get().pinAttempts + 1;
          if (attempts >= 3) {
            // Block for 5 minutes after 3 failed PIN attempts
            const blockUntil = Date.now() + 5 * 60 * 1000;
            set({
              pinAttempts: attempts,
              isBlocked: true,
              blockExpireTime: blockUntil,
            });
          } else {
            set({ pinAttempts: attempts });
          }
        }
      },

      cleanup: () => {
        const interval = (get as any)._checkInterval;
        if (interval) {
          clearInterval(interval);
        }
      },
    }),
    {
      name: "security-store",
      partialize: (state) => ({
        lastActiveTime: state.lastActiveTime,
        isLocked: state.isLocked,
      }),
    }
  )
);
```

---

## Service Layer

### 1. Soft Lock Service

```typescript
// src/services/soft-lock.service.ts

export class SoftLockService {
  private static activityListeners: Map<string, EventListener> = new Map();

  /**
   * Initialize soft-lock activity tracking
   * Debounced to prevent performance issues
   */
  static initialize(onActivity: () => void): void {
    const debouncedActivity = this.debounce(onActivity, 500);
    const activities = [
      "mousedown",
      "keydown",
      "touchstart",
      "click",
      "scroll",
    ];

    activities.forEach((activity) => {
      const listener = (e: Event) => debouncedActivity();
      this.activityListeners.set(activity, listener);
      document.addEventListener(activity, listener, { passive: true });
    });
  }

  /**
   * Debounce utility
   */
  private static debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): T {
    let timeout: ReturnType<typeof setTimeout>;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    }) as T;
  }

  /**
   * Cleanup listeners
   */
  static cleanup(): void {
    const activities = [
      "mousedown",
      "keydown",
      "touchstart",
      "click",
      "scroll",
    ];

    activities.forEach((activity) => {
      const listener = this.activityListeners.get(activity);
      if (listener) {
        document.removeEventListener(activity, listener);
        this.activityListeners.delete(activity);
      }
    });
  }
}
```

### 2. Verification Service (Uses Existing Endpoints)

```typescript
// src/services/verification.service.ts

import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";

interface BiometricVerificationRequest {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
  };
  type: "public-key";
  intent: "unlock" | "transaction";
}

interface BiometricVerificationResponse {
  success: boolean;
  verificationToken?: string;
  message?: string;
}

interface TopupRequest {
  pin?: string;
  verificationToken?: string;
  amount: number;
  productCode: string;
  phoneNumber: string;
}

interface TopupResponse {
  success: boolean;
  transaction?: {
    id: string;
    amount: number;
    status: string;
  };
  message?: string;
}

/**
 * Verification Service
 * Uses EXISTING backend endpoints only:
 * - POST /biometric/verify (with intent: 'unlock' | 'transaction')
 * - POST /user/topup (with pin OR verificationToken)
 */
export const verificationService = {
  /**
   * Verify biometric for soft-lock unlock
   * Uses intent: 'unlock'
   */
  verifyBiometricForUnlock: async (
    request: BiometricVerificationRequest
  ): Promise<BiometricVerificationResponse> => {
    try {
      const response = await apiClient.post<
        ApiResponse<BiometricVerificationResponse>
      >("/biometric/auth/verify", {
        ...request,
        intent: "unlock",
      });

      return (
        response.data.data || { success: false, message: "Verification failed" }
      );
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || "Biometric verification failed",
      };
    }
  },

  /**
   * Verify biometric for transaction
   * Uses intent: 'transaction'
   * Returns verification token
   */
  verifyBiometricForTransaction: async (
    request: BiometricVerificationRequest
  ): Promise<BiometricVerificationResponse> => {
    try {
      const response = await apiClient.post<
        ApiResponse<BiometricVerificationResponse>
      >("/biometric/auth/verify", {
        ...request,
        intent: "transaction",
      });

      return (
        response.data.data || { success: false, message: "Verification failed" }
      );
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || "Biometric verification failed",
      };
    }
  },

  /**
   * Complete topup with either PIN or verification token
   * POST /user/topup
   *
   * PIN Flow: { pin: "1234", amount, ... }
   * Biometric Flow: { verificationToken: "JWT", amount, ... }
   */
  submitTopup: async (request: TopupRequest): Promise<TopupResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<TopupResponse>>(
        "/user/topup",
        request
      );

      return response.data.data || { success: false, message: "Topup failed" };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || "Topup failed",
      };
    }
  },
};
```

---

## UI Components

### 1. Security Guard (Root Wrapper)

```typescript
// src/components/guards/SecurityGuard.tsx

"use client";

import { useEffect } from "react";
import { useSecurityStore } from "@/store/securityStore";
import { SoftLockOverlay } from "@/components/auth/SoftLockOverlay";
import { SoftLockService } from "@/services/soft-lock.service";

/**
 * SecurityGuard
 *
 * - Initializes soft-lock on mount
 * - Shows loading spinner while determining lock state
 * - Shows lock overlay when inactive for 15 min
 * - Tracks user activity
 */
export function SecurityGuard({ children }: { children: React.ReactNode }) {
  const { appState, initialize, cleanup, recordActivity } = useSecurityStore();

  useEffect(() => {
    // Initialize security store (checks inactivity timer, starts checks)
    initialize();

    // Setup activity tracking
    SoftLockService.initialize(() => {
      recordActivity();
    });

    return () => {
      cleanup();
      SoftLockService.cleanup();
    };
  }, [initialize, cleanup, recordActivity]);

  // Prevent flash of content while checking lock state
  if (appState === "LOADING") {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {appState === "LOCKED" && <SoftLockOverlay />}
    </>
  );
}
```

### 2. Soft Lock Overlay (Biometric-First)

```typescript
// src/components/auth/SoftLockOverlay.tsx

"use client";

import { useState } from "react";
import { useSecurityStore } from "@/store/securityStore";
import { WebAuthnService } from "@/services/webauthn.service";
import { verificationService } from "@/services/verification.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Fingerprint } from "lucide-react";
import { toast } from "sonner";

/**
 * SoftLockOverlay
 *
 * Displays full-screen lock after 15 min inactivity
 * Uses Biometric (WebAuthn) to unlock
 *
 * Key: If user has biometric enrolled, they MUST use it to unlock
 * No PIN fallback for soft-lock (biometric only)
 */
export function SoftLockOverlay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const { isLocked, unlock } = useSecurityStore();

  const handleUnlockWithBiometric = async () => {
    setLoading(true);
    setError("");

    try {
      // Step 1: Check biometric support
      const supported = await WebAuthnService.isWebAuthnSupported();
      if (!supported) {
        setError(
          "Biometric authentication not available on this device. Please restart the app."
        );
        return;
      }

      // Step 2: Get authentication options
      const options = await WebAuthnService.getAuthenticationOptions();

      // Step 3: User completes biometric
      const assertion = await WebAuthnService.signAssertion(options);

      // Step 4: Verify with backend using intent: 'unlock'
      const response = await verificationService.verifyBiometricForUnlock({
        id: assertion.id,
        rawId: assertion.rawId,
        response: assertion.response,
        type: "public-key",
        intent: "unlock",
      });

      if (response.success) {
        unlock();
        toast.success("App unlocked successfully");
      } else {
        setAttempts((prev) => prev + 1);
        setError(response.message || "Biometric verification failed");
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        // User cancelled - don't show error
        setError("");
      } else {
        setAttempts((prev) => prev + 1);
        setError(err.message || "Biometric verification failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-center pt-6 pb-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
            App Locked
          </h2>
          <p className="text-center text-slate-600 text-sm mb-8">
            Your app was locked due to inactivity. Verify your identity to continue.
          </p>

          {/* Biometric Button */}
          <Button
            onClick={handleUnlockWithBiometric}
            disabled={loading}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
          >
            <Fingerprint className="w-5 h-5 mr-2" />
            {loading ? "Verifying..." : "Unlock with Biometric"}
          </Button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Attempt Counter */}
          {attempts > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                Verification attempts: {attempts}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            Your session remains secure. This is just a verification step.
          </p>
        </div>
      </Card>
    </div>
  );
}
```

### 3. PIN Verification Modal (For Transactions)

```typescript
// src/components/auth/PinVerificationModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useSecurityStore } from "@/store/securityStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

interface PinVerificationModalProps {
  isOpen: boolean;
  amount: number;
  recipient: string;
  onSuccess: (pin: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * PIN Verification Modal
 *
 * Used ONLY for transactions (not for soft-lock)
 * - 4-digit PIN
 * - Auto-submits when 4 digits entered
 * - Rate limited: 3 attempts = 5 min block
 *
 * PIN is sent to /user/topup endpoint for server-side validation
 */
export function PinVerificationModal({
  isOpen,
  amount,
  recipient,
  onSuccess,
  onCancel,
}: PinVerificationModalProps) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { recordPinAttempt, isBlocked, blockExpireTime, pinAttempts } =
    useSecurityStore();

  // Auto-submit when PIN is 4 digits
  useEffect(() => {
    if (pin.length === 4 && !loading && !isBlocked) {
      handleSubmit();
    }
  }, [pin, loading, isBlocked]);

  const handlePinChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    setPin(cleaned);
    setError("");
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    if (isBlocked && blockExpireTime && Date.now() < blockExpireTime) {
      const minutesRemaining = Math.ceil(
        (blockExpireTime - Date.now()) / 60000
      );
      setError(`Too many attempts. Try again in ${minutesRemaining} min.`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Pass PIN to parent component
      // Parent will call /user/topup with { pin, amount, ... }
      await onSuccess(pin);
      recordPinAttempt(true);
      setPin("");
    } catch (err: any) {
      recordPinAttempt(false);
      const errorMsg = err?.message || "PIN verification failed";
      setError(errorMsg);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Transaction</DialogTitle>
          <DialogDescription>
            Enter your 4-digit PIN to confirm this payment
          </DialogDescription>
        </DialogHeader>

        {/* Transaction Details */}
        <div className="bg-slate-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Amount:</span>
            <span className="font-semibold">₦{amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">To:</span>
            <span className="font-semibold">{recipient}</span>
          </div>
        </div>

        {/* PIN Input with Visibility Toggle */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enter PIN
          </label>
          <div className="relative mb-4">
            <Input
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="••••"
              maxLength="4"
              disabled={loading || isBlocked}
              className="text-center text-2xl tracking-widest font-bold"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              disabled={loading}
            >
              {showPin ? (
                <EyeOff className="w-4 h-4 text-slate-600" />
              ) : (
                <Eye className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {Array.from({ length: 10 }).map((_, i) => {
            const digit = i === 9 ? 0 : i + 1;
            return (
              <button
                key={digit}
                onClick={() => handlePinChange(pin + digit)}
                disabled={loading || pin.length >= 4 || isBlocked}
                className="py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-sm disabled:opacity-50 transition"
              >
                {digit}
              </button>
            );
          })}
          <button
            onClick={handleBackspace}
            disabled={loading || pin.length === 0 || isBlocked}
            className="col-span-2 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-sm disabled:opacity-50 transition"
          >
            Clear
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Attempt Counter */}
        {pinAttempts > 0 && !isBlocked && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <p className="text-xs text-amber-700">
              {3 - pinAttempts} attempts remaining
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || pin.length !== 4 || isBlocked}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Verifying..." : "Verify PIN"}
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-slate-500 text-center">
          Your PIN is securely validated on our servers
        </p>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Integration Points

### 1. Update Root Layout

```typescript
// src/app/layout.tsx

import { SecurityGuard } from "@/components/guards/SecurityGuard";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <AuthProvider>
          {/* SecurityGuard initializes soft-lock and renders overlay */}
          <SecurityGuard>
            {children}
          </SecurityGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Transaction Flow (Biometric-First Design)

```typescript
// src/components/features/topup/TopupFlow.tsx

import { useState } from "react";
import { PinVerificationModal } from "@/components/auth/PinVerificationModal";
import { useSecurityStore } from "@/store/securityStore";
import { WebAuthnService } from "@/services/webauthn.service";
import { verificationService } from "@/services/verification.service";
import { useBiometricEnrollments } from "@/hooks/useBiometric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface TopupPayload {
  amount: number;
  productCode: string;
  phoneNumber: string;
}

/**
 * Topup Flow - Biometric-First Design
 *
 * 1. Check if user has biometric enrolled
 * 2. If YES → Show biometric prompt
 * 3. If NO → Show PIN modal
 */
export function TopupFlow() {
  const [amount, setAmount] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { recordActivity } = useSecurityStore();
  const { data: biometricEnrollments } = useBiometricEnrollments();

  // Check if user has biometric enrolled
  const hasBiometric = (biometricEnrollments || []).length > 0;

  const handleInitiateTopup = async () => {
    if (amount < 100) {
      toast.error("Minimum amount is ₦100");
      return;
    }

    if (!phoneNumber) {
      toast.error("Please enter a phone number");
      return;
    }

    // BIOMETRIC-FIRST: If user has biometric, use it
    if (hasBiometric) {
      await handleBiometricFlow();
    } else {
      // PIN FALLBACK: If no biometric, use PIN
      setShowPinModal(true);
    }
  };

  const handleBiometricFlow = async () => {
    setLoading(true);
    try {
      // Step 1: Get WebAuthn options
      const options = await WebAuthnService.getAuthenticationOptions();

      // Step 2: User completes biometric
      const assertion = await WebAuthnService.signAssertion(options);

      // Step 3: Verify with backend using intent: 'transaction'
      const verifyResponse = await verificationService.verifyBiometricForTransaction(
        {
          id: assertion.id,
          rawId: assertion.rawId,
          response: assertion.response,
          type: "public-key",
          intent: "transaction",
        }
      );

      if (!verifyResponse.success || !verifyResponse.verificationToken) {
        toast.error("Biometric verification failed. Please try PIN instead.");
        setShowPinModal(true);
        return;
      }

      // Step 4: Submit topup with verification token
      const topupResponse = await verificationService.submitTopup({
        verificationToken: verifyResponse.verificationToken,
        amount,
        productCode: "airtime",
        phoneNumber,
      });

      if (topupResponse.success) {
        toast.success("Topup successful!");
        recordActivity();
        // Reset form...
      } else {
        toast.error(topupResponse.message || "Topup failed");
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        // User cancelled - show PIN option
        toast.info("Biometric cancelled. Using PIN instead.");
        setShowPinModal(true);
      } else {
        toast.error("Biometric failed. Please use PIN instead.");
        setShowPinModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinFlow = async (pin: string) => {
    setLoading(true);
    try {
      // Submit topup with PIN
      // Backend validates PIN in /user/topup
      const response = await verificationService.submitTopup({
        pin,
        amount,
        productCode: "airtime",
        phoneNumber,
      });

      if (response.success) {
        toast.success("Topup successful!");
        setShowPinModal(false);
        recordActivity();
        // Reset form...
      } else {
        toast.error(response.message || "Topup failed");
        throw new Error(response.message || "PIN validation failed");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Topup Form */}
      <div className="space-y-4 max-w-md">
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Enter amount (₦)"
        />
        <Input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Phone number"
        />
        <Button
          onClick={handleInitiateTopup}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Processing..." : "Buy Airtime"}
        </Button>

        {/* Show which method will be used */}
        {hasBiometric && (
          <p className="text-xs text-slate-500">
            ✓ Biometric will be used for verification
          </p>
        )}
      </div>

      {/* PIN Modal (shown if biometric not available or user cancels) */}
      <PinVerificationModal
        isOpen={showPinModal}
        amount={amount}
        recipient={phoneNumber}
        onSuccess={handlePinFlow}
        onCancel={() => setShowPinModal(false)}
      />
    </>
  );
}
```

---

## Implementation Checklist

### Phase 1: Core Services (4 hours)

- [ ] Create `src/store/securityStore.ts`
  - [ ] Initialize with LOADING state
  - [ ] Check localStorage for last activity time
  - [ ] Set up inactivity timer (check every 1 second)
  - [ ] Track PIN attempts (3 max = 5 min block)
  - [ ] Persist to localStorage automatically

- [ ] Create `src/services/soft-lock.service.ts`
  - [ ] Initialize activity listeners (debounced 500ms)
  - [ ] Clean up listeners on unmount
  - [ ] No API calls (local only)

- [ ] Create `src/services/verification.service.ts`
  - [ ] `verifyBiometricForUnlock()` - POST /biometric/auth/verify with intent: 'unlock'
  - [ ] `verifyBiometricForTransaction()` - POST /biometric/auth/verify with intent: 'transaction'
  - [ ] `submitTopup()` - POST /user/topup with pin OR verificationToken

### Phase 2: UI Components (6 hours)

- [ ] Create `src/components/guards/SecurityGuard.tsx`
  - [ ] Initialize store on mount
  - [ ] Show spinner while appState === "LOADING"
  - [ ] Show SoftLockOverlay when locked
  - [ ] Cleanup on unmount

- [ ] Create `src/components/auth/SoftLockOverlay.tsx`
  - [ ] Show lock icon and messaging
  - [ ] Biometric button only (no PIN fallback)
  - [ ] Call `verifyBiometricForUnlock()` with intent: 'unlock'
  - [ ] Show error messages
  - [ ] Disable button while loading

- [ ] Create `src/components/auth/PinVerificationModal.tsx`
  - [ ] Show transaction details
  - [ ] 4-digit PIN input
  - [ ] Auto-submit at 4 digits
  - [ ] Numeric keypad
  - [ ] Show attempt counter (3 max)
  - [ ] Show block countdown

### Phase 3: Integration (4 hours)

- [ ] Update `src/app/layout.tsx`
  - [ ] Wrap with `SecurityGuard`

- [ ] Create `src/components/features/topup/TopupFlow.tsx`
  - [ ] Check if user has biometric enrolled
  - [ ] If YES → Use biometric first
  - [ ] If NO → Use PIN modal
  - [ ] Handle biometric cancellation (fallback to PIN)

- [ ] Update transaction components
  - [ ] Add PIN modal to existing flows
  - [ ] Call `recordActivity()` after success

### Phase 4: Testing (4 hours)

- [ ] Unit tests for `securityStore`
- [ ] Unit tests for `soft-lock.service`
- [ ] Component tests for overlays
- [ ] Integration tests for flows
- [ ] E2E tests

---

## Key Design Decisions

✅ **Biometric-First:** If user has biometric, it's shown first (soft-lock AND transactions)
✅ **No Separate PIN Verification:** PIN validated by `/user/topup` endpoint (already exists)
✅ **No Separate PASSCODE Endpoint:** Only biometric for soft-lock unlock
✅ **Verification Token:** Only returned by biometric with `intent: 'transaction'`
✅ **Session Stays Valid:** Soft lock doesn't log user out
✅ **Activity Debounced:** 500ms debounce prevents performance issues

---

## Success Criteria

- [ ] App locks after 15 min inactivity
- [ ] Biometric unlocks soft lock (intent: 'unlock')
- [ ] Biometric authorizes transaction (intent: 'transaction')
- [ ] PIN visible if biometric not enrolled or fails
- [ ] PIN validated by /user/topup endpoint
- [ ] No new endpoints created (uses existing ones)
- [ ] All sensitive data hidden during LOADING state
- [ ] Rate limiting: 3 PIN failures = 5 min block
- [ ] Biometric-first (always shown first if available)

---

_Implementation Ready: YES ✅_
_Backend Endpoints Required: ZERO NEW ENDPOINTS_
_Uses Existing Endpoints: /biometric/auth/verify + /user/topup_
