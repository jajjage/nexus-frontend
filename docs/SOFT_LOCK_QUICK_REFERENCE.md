# Soft Lock System - Quick Reference

## Quick Start (3 Steps)

### 1. Wrap Layout

```tsx
// src/app/layout.tsx
import { SecurityGuard } from "@/components/guards/SecurityGuard";

<AuthProvider>
  <SecurityGuard>{children}</SecurityGuard>
</AuthProvider>;
```

### 2. Use in Transactions

```tsx
// src/app/dashboard/airtime/page.tsx
import { PinVerificationModal } from "@/components/auth/PinVerificationModal";

const [showPin, setShowPin] = useState(false);

<button onClick={() => setShowPin(true)}>Buy Airtime</button>

<PinVerificationModal
  open={showPin}
  onClose={() => setShowPin(false)}
  onSuccess={() => console.log("Transaction done")}
  reason="transaction"
  transactionAmount={amount}
  productCode={productCode}
/>
```

### 3. Use Biometric (Optional)

```tsx
// Custom transaction component
import { BiometricTransaction } from "@/components/auth/BiometricTransaction";

<BiometricTransaction
  amount={amount}
  productCode={productCode}
  onSuccess={handleSuccess}
/>;
```

---

## What Happens

| Scenario                    | Action               | Result                |
| --------------------------- | -------------------- | --------------------- |
| User inactive 15 min        | System locks         | SoftLockOverlay shown |
| User clicks "Unlock"        | Biometric prompt     | Session unlocked      |
| User enters PIN (wrong)     | 3x failures          | 5-min block enforced  |
| User enters PIN (correct)   | Transaction verified | `/user/topup` called  |
| User has biometric          | Auto-offered         | Biometric used first  |
| Biometric fails/unavailable | Falls back           | PIN modal shown       |

---

## Key Files

- **State Management**: `src/store/securityStore.ts`
- **Activity Tracking**: `src/services/soft-lock.service.ts`
- **API Calls**: `src/services/verification.service.ts`
- **Root Wrapper**: `src/components/guards/SecurityGuard.tsx`
- **Lock Screen**: `src/components/auth/SoftLockOverlay.tsx`
- **PIN Modal**: `src/components/auth/PinVerificationModal.tsx`

---

## API Endpoints Used

```
POST /biometric/auth/verify
  intent: 'unlock'     → { success: true }
  intent: 'transaction' → { success: true, verificationToken }

POST /user/topup
  { pin: "1234", ... }           → { success: true, transaction }
  { verificationToken: "...", ... } → { success: true, transaction }
```

---

## Configuration

| Setting            | Value      | Purpose                    |
| ------------------ | ---------- | -------------------------- |
| Inactivity Timeout | 15 minutes | Lock after inactivity      |
| Activity Debounce  | 500ms      | Prevent excessive updates  |
| PIN Length         | 4 digits   | Standard PIN length        |
| PIN Failure Limit  | 3 attempts | Rate limiting              |
| PIN Block Duration | 5 minutes  | Cooldown after 3 failures  |
| Check Interval     | 1 second   | Inactivity check frequency |

---

## State Structure

```typescript
// In Zustand store
{
  isLocked: boolean; // Is app currently locked?
  appState: "LOADING" | "LOCKED" | "ACTIVE"; // Prevents UI flash
  lastActiveTime: number; // Timestamp of last activity
  timeUntilLock: number; // ms until lock
  pinAttempts: number; // Failed PIN attempts
  isBlocked: boolean; // Rate-limit block active?
  blockExpireTime: number | null; // When block expires
}
```

---

## Debug

### Check Lock State

```typescript
import { useSecurityStore } from "@/store/securityStore";

const { isLocked, appState, timeUntilLock } = useSecurityStore();
console.log(
  `Locked: ${isLocked}, State: ${appState}, Time until lock: ${timeUntilLock}ms`
);
```

### Simulate Inactivity

```typescript
// In browser console
const store = document.querySelector("[data-security-store]");
// Access Zustand store directly (depends on your setup)
// Manually set lastActiveTime to past
```

### Check localStorage

```javascript
JSON.parse(localStorage.getItem("security-store"));
```

---

## Common Issues

| Issue                       | Solution                                  |
| --------------------------- | ----------------------------------------- |
| Lock never triggers         | Check `lastActiveTime` in localStorage    |
| PIN block stuck             | Clear localStorage, reload                |
| Biometric not working       | Check browser support (Chrome, Safari)    |
| SoftLockOverlay not showing | Verify SecurityGuard wraps layout         |
| Activity not tracked        | Check softLockService.initialize() called |

---

## Biometric Support

| Browser | OS                  | Support        |
| ------- | ------------------- | -------------- |
| Chrome  | Windows/Mac/Android | ✅ Full        |
| Safari  | Mac/iOS             | ✅ Full        |
| Firefox | Windows/Mac/Linux   | ✅ Full (v60+) |
| Edge    | Windows/Mac         | ✅ Full        |

---

## Notes

- 🔒 Soft-lock ≠ Logout (session valid, UI hidden)
- 🔑 PIN only for transactions (not soft-lock unlock)
- 👆 Biometric is primary unlock method
- 💾 Lock state persists via localStorage
- ⏱️ Inactivity tracked with 500ms debounce
- 🛡️ PIN rate-limited (3 failures = 5 min block)
