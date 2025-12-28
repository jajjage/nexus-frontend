# Frontend PIN/PASSCODE Integration Guide

## Overview

This guide walks through integrating three new features with existing biometric authentication:

1. **PIN Verification** (4-digit) - For transaction authorization (validated directly by `/user/topup`, no JWT issued)
2. **PASSCODE Verification** (6-digit) - For app unlock after 15-minute inactivity (soft-lock)
3. **Soft-Lock** - Automatic app unlock timeout after 15 minutes of inactivity

### Key Principle: NO Changes to Existing Endpoints

- ✅ `/biometric/register/options` - unchanged
- ✅ `/biometric/register/verify` - unchanged
- ✅ `/biometric/auth/options` - unchanged
- ✅ `/biometric/auth/verify` - unchanged (now supports new intent parameter)
- ✅ `/user/topup` - unchanged (but now validates both PIN and verification token)

### New/Modified Endpoints

- ✅ `POST /biometric/verify` - Unified biometric endpoint with `intent` parameter (login/unlock/transaction)
- 🆕 `POST /biometric/verify-passcode` - Verify 6-digit PASSCODE, get success status
- ✅ `POST /user/topup` - Submit topup; for PIN flows include `auth.pin` (validated server-side). For biometric transaction flows include `auth.verificationToken` (from `/biometric/verify?intent=transaction`).

---

## Phase 1: Service Layer Extension

### Step 1.1: Extend BiometricApiService

Add PASSCODE verification method to your existing `BiometricApiService`:

```typescript
// src/services/api/biometric.api.service.ts

interface PASSCODEVerificationRequest {
  passcode: string;
}

interface PASSCODEVerificationResponse {
  success: boolean;
  message: string;
}

export class BiometricApiService {
  // ... existing methods ...

  /**
   * Verify 6-digit PASSCODE for app unlock (soft-lock release)
   * Returns success status only (no token)
   * Used to unlock app after 15-minute inactivity timeout
   */
  async verifyPASSCODE(
    request: PASSCODEVerificationRequest
  ): Promise<PASSCODEVerificationResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/biometric/verify-passcode`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new BiometricVerificationError(
          error.message || "PASSCODE verification failed",
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      this.handleError("PASSCODE verification", error);
    }
  }

  // ... rest of existing methods ...
}
```

### Step 1.2: Extend TransactionApiService for PIN Verification

Add PIN verification to your existing `TransactionApiService`:

```typescript
// src/services/api/transaction.api.service.ts

interface TopupAuthData {
  pin?: string; // 4-digit PIN for direct authorization
  verificationToken?: string; // JWT from biometric verification (intent='transaction')
}

interface TopupRequest {
  amount: number;
  accountNumber: string;
  bankCode: string;
  auth: TopupAuthData; // Either pin OR verificationToken
}

export class TransactionApiService {
  // ... existing methods ...

  /**
   * Submit topup request with PIN or biometric verification token
   * PIN (4-digit): Direct authorization in /user/topup endpoint
   * VerificationToken: JWT from /biometric/verify with intent='transaction'
   */
  async createTopup(request: TopupRequest): Promise<TopupResponse> {
    try {
      const response = await fetch(`${this.baseURL}/user/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new TransactionError(
          error.message || "Topup request failed",
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      this.handleError("Topup request", error);
    }
  }

  // ... rest of existing methods ...
}
```

```typescript
// src/services/verification-token.service.ts

interface TokenPayload {
  userId: string;
  scope: string; // 'pin-verification' | 'passcode-verification'
  iat: number;
  exp: number;
}

export class VerificationTokenService {
  private static readonly TOKEN_STORAGE_KEY = "verification_token";

  /**
   * Store verification token returned from biometric verification (intent='transaction')
   */
  static storeToken(token: string, expiresIn: number): void {
    const expirationTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(
      this.TOKEN_STORAGE_KEY,
      JSON.stringify({
        token,
        expiresAt: expirationTime,
      })
    );
  }

  /**
   * Retrieve stored verification token if still valid
   */
  static getToken(): string | null {
    const stored = localStorage.getItem(this.TOKEN_STORAGE_KEY);
    if (!stored) return null;

    try {
      const { token, expiresAt } = JSON.parse(stored);

      // Check if token is still valid
      if (Date.now() > expiresAt) {
        this.clearToken();
        return null;
      }

      return token;
    } catch (error) {
      this.clearToken();
      return null;
    }
  }

  /**
   * Check if a valid verification token exists (without retrieving it)
   */
  static hasValidToken(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Clear stored verification token
   */
  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
  }

  /**
   * Get remaining time in seconds for verification token
   */
  static getTimeRemaining(): number {
    const stored = localStorage.getItem(this.TOKEN_STORAGE_KEY);
    if (!stored) return 0;

    try {
      const { expiresAt } = JSON.parse(stored);
      const remaining = Math.max(
        0,
        Math.floor((expiresAt - Date.now()) / 1000)
      );
      return remaining;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get token expiration timestamp (milliseconds)
   */
  static getExpirationTime(): number | null {
    const stored = localStorage.getItem(this.TOKEN_STORAGE_KEY);
    if (!stored) return null;

    try {
      const { expiresAt } = JSON.parse(stored);
      return expiresAt;
    } catch (error) {
      return null;
    }
  }
}
```

---

## Phase 2: Soft-Lock Management

### Step 2.1: Create Soft-Lock Service

```typescript
// src/services/soft-lock.service.ts

export class SoftLockService {
  private static readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  private static readonly LAST_ACTIVITY_KEY = "last_activity_time";
  private static readonly SOFT_LOCK_STATE_KEY = "soft_lock_active";
  private static inactivityTimer: NodeJS.Timeout | null = null;
  private static onLockCallback: (() => void) | null = null;

  /**
   * Initialize soft-lock service
   * Call this in your app's main initialization (e.g., useEffect in root component)
   */
  static initialize(onLock: () => void): void {
    this.onLockCallback = onLock;
    this.recordActivity();
    this.setupActivityListeners();
  }

  /**
   * Setup listeners for user activity
   */
  private static setupActivityListeners(): void {
    const activities = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    activities.forEach((activity) => {
      document.addEventListener(activity, () => this.recordActivity(), {
        passive: true,
      });
    });
  }

  /**
   * Record timestamp of user activity
   */
  static recordActivity(): void {
    const wasLocked = this.isLocked();

    // Update last activity time
    localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());

    // If app was locked, unlock it
    if (wasLocked) {
      this.unlock();
    }

    // Reset inactivity timer
    this.resetInactivityTimer();
  }

  /**
   * Reset the inactivity timer
   */
  private static resetInactivityTimer(): void {
    // Clear existing timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    // Set new timer
    this.inactivityTimer = setTimeout(() => {
      const lastActivity = parseInt(
        localStorage.getItem(this.LAST_ACTIVITY_KEY) || "0"
      );
      const timeSinceLastActivity = Date.now() - lastActivity;

      if (timeSinceLastActivity >= this.INACTIVITY_TIMEOUT) {
        this.lock();
      }
    }, this.INACTIVITY_TIMEOUT);
  }

  /**
   * Lock the app (show soft-lock overlay)
   */
  private static lock(): void {
    localStorage.setItem(this.SOFT_LOCK_STATE_KEY, "true");
    this.onLockCallback?.();
  }

  /**
   * Unlock the app
   */
  static unlock(): void {
    localStorage.removeItem(this.SOFT_LOCK_STATE_KEY);
    this.recordActivity();
  }

  /**
   * Check if app is currently locked
   */
  static isLocked(): boolean {
    return localStorage.getItem(this.SOFT_LOCK_STATE_KEY) === "true";
  }

  /**
   * Get time remaining until soft-lock activates (milliseconds)
   */
  static getTimeUntilLock(): number {
    const lastActivity = parseInt(
      localStorage.getItem(this.LAST_ACTIVITY_KEY) || "0"
    );
    const timeSinceLastActivity = Date.now() - lastActivity;
    const timeRemaining = Math.max(
      0,
      this.INACTIVITY_TIMEOUT - timeSinceLastActivity
    );
    return timeRemaining;
  }

  /**
   * Get time remaining until soft-lock activates (seconds, rounded up)
   */
  static getTimeUntilLockSeconds(): number {
    return Math.ceil(this.getTimeUntilLock() / 1000);
  }

  /**
   * Cleanup (call on app unmount)
   */
  static cleanup(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    const activities = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    activities.forEach((activity) => {
      document.removeEventListener(activity, () => this.recordActivity());
    });
  }
}
```

### Step 2.2: Create Soft-Lock Zustand Store

```typescript
// src/stores/soft-lock.store.ts

import { create } from "zustand";
import { SoftLockService } from "../services/soft-lock.service";

interface SoftLockState {
  isLocked: boolean;
  timeUntilLock: number; // milliseconds
  timeUntilLockSeconds: number; // seconds

  // Actions
  initialize: () => void;
  unlock: (passcode?: string) => Promise<boolean>;
  recordActivity: () => void;
  cleanup: () => void;
}

export const useSoftLockStore = create<SoftLockState>((set, get) => ({
  isLocked: false,
  timeUntilLock: 15 * 60 * 1000,
  timeUntilLockSeconds: 900,

  initialize: () => {
    // Initialize soft-lock service with callback to update state
    SoftLockService.initialize(() => {
      set({ isLocked: true });
    });

    // Set up interval to update countdown timer
    const interval = setInterval(() => {
      const timeRemaining = SoftLockService.getTimeUntilLock();
      set({
        timeUntilLock: timeRemaining,
        timeUntilLockSeconds: Math.ceil(timeRemaining / 1000),
        isLocked: SoftLockService.isLocked(),
      });
    }, 1000);

    // Store interval ID for cleanup
    (get as any).intervalId = interval;
  },

  unlock: async (passcode?: string) => {
    // If PASSCODE verification is implemented, verify it
    if (passcode) {
      try {
        const response = await biometricApi.verifyPASSCODE({ passcode });
        if (response.success) {
          SoftLockService.unlock();
          set({ isLocked: false });
          return true;
        }
      } catch (error) {
        console.error("PASSCODE verification failed:", error);
        return false;
      }
    } else {
      // Direct unlock (e.g., after biometric verification)
      SoftLockService.unlock();
      set({ isLocked: false });
      return true;
    }

    return false;
  },

  recordActivity: () => {
    SoftLockService.recordActivity();
    set({
      timeUntilLock: SoftLockService.getTimeUntilLock(),
      timeUntilLockSeconds: SoftLockService.getTimeUntilLockSeconds(),
      isLocked: SoftLockService.isLocked(),
    });
  },

  cleanup: () => {
    SoftLockService.cleanup();
    const intervalId = (get as any).intervalId;
    if (intervalId) {
      clearInterval(intervalId);
    }
  },
}));
```

---

## Phase 3: UI Components

### Step 3.1: PIN Verification Modal

```typescript
// src/components/modals/PINVerificationModal.tsx

import React, { useState, useRef } from 'react';

interface PINVerificationModalProps {
  isOpen: boolean;
  // Returns the entered PIN to the caller for direct submission to /user/topup
  onSuccess: (pin: string) => Promise<void>;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export const PINVerificationModal: React.FC<PINVerificationModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  title = 'Enter your PIN',
  description = 'Enter your 4-digit PIN to confirm this action',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePinChange = (value: string) => {
    // Allow only digits, max 4
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setPin(cleaned);
    setError('');

    // Auto-submit when 4 digits are entered
    if (cleaned.length === 4) {
      handleSubmit(cleaned);
    }
  };

  const handleSubmit = async (pinToVerify: string = pin) => {
    if (pinToVerify.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For PIN-based transaction flows we do not call a separate verify endpoint.
      // Instead, pass the entered PIN back to the parent (caller) which will
      // submit the topup to `/user/topup` with `auth.pin` for server-side
      // validation and completion of the transaction.
      await onSuccess(pinToVerify);

      // Reset form
      setPin('');
      setAttempts(0);
    } catch (err: any) {
      const errorMessage = err?.message || 'PIN verification failed';
      setError(errorMessage);
      setAttempts(prev => prev + 1);

      // Lock after multiple failed attempts
      if (attempts >= 2) {
        setError('Too many failed attempts. Please try again later.');
        setTimeout(onCancel, 2000);
      }

      // Clear PIN on error
      setPin('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content pin-modal">
        <h2>{title}</h2>
        <p className="modal-description">{description}</p>

        <div className="pin-input-container">
          {/* Masked PIN display */}
          <div className="pin-display">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`pin-digit ${i < pin.length ? 'filled' : ''}`}
              >
                {i < pin.length ? '●' : ''}
              </div>
            ))}
          </div>

          {/* Hidden input for mobile keyboard */}
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={e => handlePinChange(e.target.value)}
            maxLength="4"
            autoFocus
            aria-label="PIN input"
            style={{ display: 'none' }}
          />
        </div>

        {/* Numeric keypad (optional, for better UX) */}
        <div className="numeric-keypad">
          {Array.from({ length: 10 }).map((_,i) => {
            const digit = i === 9 ? 0 : i + 1;
            return (
              <button
                key={digit}
                onClick={() => handlePinChange(pin + digit)}
                disabled={loading || pin.length >= 4}
                className="key"
              >
                {digit}
              </button>
            );
          })}
          <button
            onClick={handleBackspace}
            disabled={loading || pin.length === 0}
            className="key backspace"
          >
            ⌫
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="modal-footer">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={loading || pin.length !== 4}
            className="btn-primary"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Step 3.2: Soft-Lock Overlay Component

```typescript
// src/components/overlays/SoftLockOverlay.tsx

import React, { useState } from 'react';
import { useSoftLockStore } from '../../stores/soft-lock.store';
import { BiometricApiService } from '../../services/api/biometric.service';

export const SoftLockOverlay: React.FC = () => {
  const { isLocked, unlock } = useSoftLockStore();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usePasscode, setUsePasscode] = useState(false);

  const handleUnlockWithBiometric = async () => {
    setLoading(true);
    setError('');

    try {
      // Get biometric challenge and verify
      const challengeResponse = await BiometricApiService.getInstance().generateAuthOptions();
      const verificationResponse = await BiometricApiService.getInstance().verifyBiometric(
        challengeResponse.challenge
      );

      // Unlock app
      await unlock();
    } catch (err: any) {
      setError('Biometric verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockWithPasscode = async () => {
    if (passcode.length !== 6) {
      setError('PASSCODE must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await unlock(passcode);
      if (!result) {
        setError('Invalid PASSCODE. Please try again.');
        setPasscode('');
      }
    } catch (err: any) {
      setError('PASSCODE verification failed.');
      setPasscode('');
    } finally {
      setLoading(false);
    }
  };

  if (!isLocked) return null;

  return (
    <div className="soft-lock-overlay">
      <div className="soft-lock-content">
        <h2>App Locked</h2>
        <p>Your app has been locked due to inactivity. Please unlock to continue.</p>

        {!usePasscode ? (
          <>
            <button
              onClick={handleUnlockWithBiometric}
              disabled={loading}
              className="btn-primary btn-large"
            >
              {loading ? 'Verifying...' : 'Unlock with Biometric'}
            </button>

            <button
              onClick={() => setUsePasscode(true)}
              disabled={loading}
              className="btn-secondary"
            >
              Use PASSCODE Instead
            </button>
          </>
        ) : (
          <>
            <div className="passcode-input-container">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={passcode}
                onChange={e => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit PASSCODE"
                maxLength="6"
                autoFocus
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              onClick={handleUnlockWithPasscode}
              disabled={loading || passcode.length !== 6}
              className="btn-primary btn-large"
            >
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>

            <button
              onClick={() => {
                setUsePasscode(false);
                setPasscode('');
                setError('');
              }}
              disabled={loading}
              className="btn-secondary"
            >
              Back
            </button>
          </>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};
```

---

## Phase 4: Integration with Existing Flows

### Step 4.1: Root App Component Setup

```typescript
// src/App.tsx

import React, { useEffect } from 'react';
import { useSoftLockStore } from './stores/soft-lock.store';
import { SoftLockOverlay } from './components/overlays/SoftLockOverlay';

export const App: React.FC = () => {
  const { initialize, cleanup } = useSoftLockStore();

  useEffect(() => {
    // Initialize soft-lock on app mount
    initialize();

    return () => {
      cleanup();
    };
  }, [initialize, cleanup]);

  return (
    <>
      <SoftLockOverlay />
      {/* Rest of your app */}
    </>
  );
};
```

### Step 4.2: Transaction Flow with PIN Verification

```typescript
// src/components/payments/TransactionConfirmation.tsx

import React, { useState } from 'react';
import { PINVerificationModal } from '../modals/PINVerificationModal';
import { VerificationTokenService } from '../../services/verification-token.service';

interface TransactionConfirmationProps {
  amount: number;
  recipient: string;
  // Caller should accept either a pin (for direct /user/topup submission)
  // or a verificationToken (from biometric intent='transaction').
  onConfirm: (auth: { pin?: string; verificationToken?: string }) => Promise<void>;
  onCancel: () => void;
}

export const TransactionConfirmation: React.FC<TransactionConfirmationProps> = ({
  amount,
  recipient,
  onConfirm,
  onCancel,
}) => {
  const [showPINModal, setShowPINModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    // Check if PIN verification is available
    const verificationMethod = amount > 10000 ? 'pin' : 'biometric';

    if (verificationMethod === 'pin') {
      setShowPINModal(true);
    } else {
      // Use existing biometric verification
      await handleBiometricVerification();
    }
  };

  const handleBiometricVerification = async () => {
    setLoading(true);
    try {
      // Use existing biometric auth flow
      const response = await biometricApi.generateAuthOptions({
        intent: 'transaction',
      });

      const verification = await biometricApi.verifyBiometric(response);

      // Get or create verification token from biometric flow
      const token = VerificationTokenService.getToken() || verification.verificationToken;
      await onConfirm({ verificationToken: token });
    } finally {
      setLoading(false);
    }
  };

  const handlePINVerifySuccess = async (pin: string) => {
    setShowPINModal(false);
    setLoading(true);

    try {
      await onConfirm({ pin });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-confirmation">
      <div className="transaction-details">
        <h3>Confirm Transaction</h3>
        <p>Amount: <strong>${amount.toFixed(2)}</strong></p>
        <p>To: <strong>{recipient}</strong></p>
      </div>

      <div className="confirmation-actions">
        <button
          onClick={onCancel}
          disabled={loading}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Processing...' : 'Confirm & Pay'}
        </button>
      </div>

      <PINVerificationModal
        isOpen={showPINModal}
        onSuccess={handlePINVerifySuccess}
        onCancel={() => setShowPINModal(false)}
        title="Authorize Payment"
        description={`Enter your PIN to authorize $${amount.toFixed(2)} to ${recipient}`}
      />
    </div>
  );
};
```

---

## Phase 5: Integration Points with Existing Flows

### Existing `BiometricRegistrationFlow` - NO CHANGES REQUIRED

```typescript
// This component remains UNCHANGED
// ✅ /biometric/register/options still works
// ✅ /biometric/register/verify still works
// ✅ PIN/PASSCODE setup happens on backend during enrollment

export const BiometricRegistrationFlow: React.FC = () => {
  // ... existing code unchanged ...
};
```

### Existing `BiometricAuthenticationFlow` - NO CHANGES REQUIRED

```typescript
// This component remains UNCHANGED
// ✅ /biometric/auth/options still works
// ✅ /biometric/auth/verify still works with optional intent parameter

export const BiometricAuthenticationFlow: React.FC = () => {
  // ... existing code unchanged ...
};
```

### NEW: Transaction Authorization Flow

```typescript
// src/flows/TransactionAuthorizationFlow.tsx

import React, { useState } from "react";
import { VerificationTokenService } from "../services/verification-token.service";

interface TransactionAuthRequest {
  transactionId: string;
  amount: number;
  recipient: string;
  type: "pin" | "biometric";
}

export const useTransactionAuthorization = () => {
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null
  );

  const authorizeTransaction = async (
    request: TransactionAuthRequest
  ): Promise<string> => {
    if (request.type === "pin") {
      // Show PIN modal and wait for verification
      // Returns verification token
      const token = await showPINVerification();
      setVerificationToken(token);
      return token;
    } else {
      // Use existing biometric flow with intent='transaction'
      // May return verification token or null
      const token = await showBiometricVerification("transaction");
      if (token) {
        setVerificationToken(token);
      }
      return token || "";
    }
  };

  const hasValidAuthorization = (): boolean => {
    return VerificationTokenService.hasValidToken();
  };

  const getAuthorizationToken = (): string | null => {
    return VerificationTokenService.getToken();
  };

  const clearAuthorization = (): void => {
    VerificationTokenService.clearToken();
    setVerificationToken(null);
  };

  return {
    authorizeTransaction,
    hasValidAuthorization,
    getAuthorizationToken,
    clearAuthorization,
    verificationToken,
  };
};
```

---

## Phase 6: Testing Strategy

### Unit Tests for Verification Token Service

```typescript
// src/__tests__/unit/services/verification-token.service.test.ts

describe("VerificationTokenService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("storeToken", () => {
    it("should store token with expiration time", () => {
      VerificationTokenService.storeToken("test-token", 60);
      const stored = localStorage.getItem("verification_token");
      expect(stored).toBeDefined();
    });
  });

  describe("getToken", () => {
    it("should return null if token is expired", () => {
      // Store with 0 seconds expiration
      VerificationTokenService.storeToken("test-token", 0);
      // Wait and check
      setTimeout(() => {
        const token = VerificationTokenService.getToken();
        expect(token).toBeNull();
      }, 100);
    });
  });

  describe("hasValidToken", () => {
    it("should return true if valid token exists", () => {
      VerificationTokenService.storeToken("test-token", 60);
      expect(VerificationTokenService.hasValidToken()).toBe(true);
    });
  });
});
```

### Integration Tests for Soft-Lock

```typescript
// src/__tests__/integration/soft-lock.test.ts

describe("Soft-Lock Flow", () => {
  it("should lock app after 15 minutes of inactivity", async () => {
    const { renderHook, act } = renderHookWithZustand(() => useSoftLockStore());

    act(() => {
      renderHook().result.current.initialize();
    });

    // Simulate 15 minutes of no activity
    jest.useFakeTimers();
    act(() => {
      jest.advanceTimersByTime(15 * 60 * 1000);
    });

    expect(renderHook().result.current.isLocked).toBe(true);
  });

  it("should unlock with valid PASSCODE", async () => {
    // ... test setup ...
    const result = await unlock("123456");
    expect(result).toBe(true);
  });

  it("should unlock with biometric verification", async () => {
    // ... test setup ...
    const result = await unlock(); // Uses biometric
    expect(result).toBe(true);
  });
});
```

### Component Tests for PIN Modal

```typescript
// src/__tests__/components/PINVerificationModal.test.tsx

describe('PINVerificationModal', () => {
  it('should auto-submit when 4 digits are entered', async () => {
    const onSuccess = jest.fn();
    const { getByRole } = render(
      <PINVerificationModal
        isOpen={true}
        onSuccess={onSuccess}
        onCancel={jest.fn()}
      />
    );

    const input = getByRole('textbox');

    await userEvent.type(input, '1234');

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should show error after failed verification', async () => {
    // Mock parent rejection to simulate failed verification after submit
    const onSuccess = jest.fn().mockRejectedValue(new Error('Invalid PIN'));

    const { getByText } = render(
      <PINVerificationModal
        isOpen={true}
        onSuccess={onSuccess}
        onCancel={jest.fn()}
      />
    );

    // Enter PIN
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '9999');

    await waitFor(() => {
      expect(getByText('PIN verification failed')).toBeInTheDocument();
    });
  });
});
```

---

## Phase 7: State Management Updates

### Extend Biometric Store with PIN/PASSCODE

```typescript
// src/stores/biometric.store.ts (ADDITIONS)

interface BiometricState {
  // ... existing fields ...

  // PIN/PASSCODE state
  verificationToken: string | null;
  verificationTokenExpiration: number | null;

  // Actions
  verifyPASSCODE: (passcode: string) => Promise<boolean>;
  clearVerificationToken: () => void;
}

export const useBiometricStore = create<BiometricState>((set, get) => ({
  // ... existing ...
  verificationToken: null,
  verificationTokenExpiration: null,

  // Note: PIN validation happens during the `/user/topup` submission and is
  // therefore not implemented as a separate store action. Biometric flows
  // produce `verificationToken` values and should update the store via the
  // biometric verification logic (intent='transaction').

  verifyPASSCODE: async (passcode: string) => {
    set({ loading: true });
    try {
      const response = await biometricApi.verifyPASSCODE({ passcode });
      set({ error: null });
      return response.success;
    } catch (error) {
      set({ error: error.message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  clearVerificationToken: () => {
    set({ verificationToken: null, verificationTokenExpiration: null });
  },
}));
```

---

## Phase 8: API Integration Checklist

- [ ] Add `verifyPASSCODE()` method to BiometricApiService
- [ ] Create VerificationTokenService with token storage/retrieval
- [ ] Create SoftLockService with inactivity detection
- [ ] Create useSoftLockStore Zustand store
- [ ] Create PINVerificationModal component
- [ ] Create SoftLockOverlay component
- [ ] Update root App component to initialize soft-lock
- [ ] Create TransactionConfirmation component
- [ ] Create TransactionAuthorizationFlow with custom hook
- [ ] Update authentication interceptor to use verification tokens
- [ ] Add unit tests for VerificationTokenService
- [ ] Add integration tests for soft-lock behavior
- [ ] Add component tests for PIN modal and overlay
- [ ] Update biometric store with PIN/PASSCODE actions

---

## Key Architectural Principles

### 1. Backward Compatibility ✅

- Existing `/biometric/register/options` and `/biometric/register/verify` unchanged
- Existing `/biometric/auth/options` and `/biometric/auth/verify` unchanged
- PIN/PASSCODE are opt-in features added to existing biometric framework

### 2. Token Management ✅

- Verification tokens from biometric verification stored separately from auth tokens
- 60-second TTL ensures tokens are time-limited
- Automatic cleanup when expired

### 3. Soft-Lock Implementation ✅

- 15-minute inactivity timeout
- Activity detection on user interaction
- Dual unlock: biometric or PASSCODE
- Graceful degradation (PASSCODE fallback if biometric unavailable)

### 4. Security Features ✅

- Rate limiting on PIN/PASSCODE verification attempts
- Audit logging for all verification events
- PIN/PASSCODE hashed in database (bcrypt)
- Verification tokens validate userId and scope

### 5. UX Improvements ✅

- Auto-submit PIN when 4 digits entered
- Numeric keypad for better mobile experience
- Clear error messages with attempt tracking
- Countdown timer for soft-lock warning

---

## Troubleshooting

### PIN/PASSCODE returns 401

Check:

- User is authenticated (valid accessToken)
- User has PIN/PASSCODE set (check database users.pin, users.passcode)
- Rate limiting not exceeded

### Verification token expires immediately

Check:

- Backend JWT_VERIFICATION_SECRET is set correctly
- Token expiration time (expiresIn) received from backend
- Client clock is synchronized

### Soft-lock won't trigger

Check:

- SoftLockService.initialize() called on app mount
- Activity listeners registered (mousedown, keydown, etc.)
- localStorage permissions enabled
- Inactivity timeout (15 minutes) actually elapsed

### Transaction won't complete with verification token

Check:

- Verification token is still valid (< 60 seconds old)
- Token includes correct userId and 'pin-verification' scope
- Backend endpoint expects Authorization header with token
- Token passed correctly in request body or header
