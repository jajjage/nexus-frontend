# Quick Reference: Soft Lock Implementation Checklist

**Status:** Ready to Implement
**Estimated Duration:** 3-4 days for full implementation
**Complexity:** Medium (security-critical, moderate scope)

---

## 📊 Overview

```
Core Concept: After 15 min of inactivity, hide the UI behind a lock screen.
              User must verify with PASSCODE or BIOMETRIC to unlock.
              Session remains valid (not logged out).
```

---

## 🔒 What Gets Built

| Component                | Lines      | Complexity | Dependencies                 |
| ------------------------ | ---------- | ---------- | ---------------------------- |
| useSecurityStore         | ~150       | Medium     | Zustand                      |
| SoftLockService          | ~120       | Medium     | None                         |
| VerificationService      | ~80        | Low        | Axios                        |
| VerificationTokenService | ~60        | Low        | None                         |
| SecurityGuard            | ~40        | Low        | React                        |
| SoftLockOverlay          | ~250       | Medium     | React + UI components        |
| PinVerificationModal     | ~200       | Medium     | React + UI components        |
| Tests                    | ~400       | Medium     | Jest + React Testing Library |
| **TOTAL**                | **~1,300** |            |                              |

---

## 📋 Phase-by-Phase Checklist

### Phase 1️⃣: Foundation (Services & State)

**Time: ~4 hours** | **Difficulty: ⭐⭐⭐**

**Create Files:**

- [ ] `src/store/securityStore.ts` (Zustand store with persist)
- [ ] `src/services/soft-lock.service.ts` (Inactivity detection)
- [ ] `src/services/verification.service.ts` (API calls to backend)
- [ ] `src/services/verification-token.service.ts` (Token lifecycle)

**Checklist:**

- [ ] Store has all required state fields (isLocked, appState, lastActiveTime, etc.)
- [ ] Store persists to localStorage automatically
- [ ] SoftLockService initializes activity listeners on mount
- [ ] SoftLockService cleans up listeners on unmount
- [ ] Activity listeners are debounced (500ms)
- [ ] PIN attempts track and block after 3 failures
- [ ] PASSCODE attempts track and block after 5 failures
- [ ] All services have TypeScript interfaces

**Test It:**

```bash
npm test -- store/securityStore.test.ts
npm test -- services/soft-lock.service.test.ts
```

---

### Phase 2️⃣: UI Components (User Interface)

**Time: ~6 hours** | **Difficulty: ⭐⭐**

**Create Files:**

- [ ] `src/components/guards/SecurityGuard.tsx` (Root wrapper)
- [ ] `src/components/auth/SoftLockOverlay.tsx` (Lock screen)
- [ ] `src/components/auth/PinVerificationModal.tsx` (PIN entry)

**Checklist for SoftLockOverlay:**

- [ ] Shows lock icon and messaging
- [ ] Has two tabs: Biometric & PASSCODE
- [ ] PASSCODE tab shows 6-digit input
- [ ] Shows attempt counter (5 max)
- [ ] Shows block timer when blocked (10 min)
- [ ] Password visibility toggle
- [ ] Auto-submits when 6 digits entered
- [ ] Calls `verificationService.verifyPasscode()`
- [ ] Calls store's `unlock()` on success
- [ ] Shows clear error messages

**Checklist for PinVerificationModal:**

- [ ] Shows transaction amount and recipient
- [ ] Shows 4-digit PIN input
- [ ] Auto-submits when 4 digits entered
- [ ] Numeric keypad for mobile UX
- [ ] Shows attempt counter (3 max)
- [ ] Shows block timer when blocked (5 min)
- [ ] Password visibility toggle
- [ ] Does NOT call verification endpoint (server validates in /user/topup)
- [ ] Calls `onSuccess(pin)` to let parent handle submission

**Checklist for SecurityGuard:**

- [ ] Wraps entire app in layout.tsx
- [ ] Initializes store on mount
- [ ] Cleans up store on unmount
- [ ] Shows spinner while appState === "LOADING"
- [ ] Shows SoftLockOverlay when appState === "LOCKED"
- [ ] Shows children when appState === "ACTIVE"

**Test It:**

```bash
npm test -- components/auth/SoftLockOverlay.test.tsx
npm test -- components/auth/PinVerificationModal.test.tsx
```

---

### Phase 3️⃣: Integration (Wiring It Together)

**Time: ~4 hours** | **Difficulty: ⭐⭐⭐**

**Update Files:**

- [ ] `src/app/layout.tsx` - Wrap with `SecurityGuard`
- [ ] `src/services/auth.service.ts` - Add `recordActivity()` call after login
- [ ] `src/lib/api-client.ts` - Call `recordActivity()` on successful requests
- [ ] `src/components/features/topup/*` - Add PIN modal integration
- [ ] Any other transaction flows - Add PIN modal

**Checklist:**

- [ ] SecurityGuard is inside AuthProvider
- [ ] Activity is recorded on:
  - [ ] User login
  - [ ] Any successful API response
  - [ ] User interactions (clicks, keys, scrolls)
- [ ] PIN modal shown for transactions > ₦10,000
- [ ] Biometric shown for transactions ≤ ₦10,000
- [ ] Transaction includes PIN in request: `{ auth: { pin } }`
- [ ] Biometric transaction flow stores verification token
- [ ] Verification token passed to /user/topup if using biometric

**Integration Test:**

```typescript
// Test that activity resets lock
recordActivity();
expect(isLocked).toBe(false);

// Test that 15 min inactivity locks
jest.advanceTimersByTime(15 * 60 * 1000);
expect(isLocked).toBe(true);
```

---

### Phase 4️⃣: Testing (Quality Assurance)

**Time: ~4 hours** | **Difficulty: ⭐⭐⭐**

**Unit Tests:**

- [ ] `store/securityStore.test.ts` (10+ tests)
  - [ ] Initialize with correct state
  - [ ] Record activity resets timer
  - [ ] PIN attempts increment
  - [ ] PIN block after 3 attempts
  - [ ] PASSCODE block after 5 attempts
  - [ ] Blocks expire after timeout

- [ ] `services/soft-lock.service.test.ts` (8+ tests)
  - [ ] Initialize sets callbacks
  - [ ] Activity listeners added
  - [ ] Activity listeners debounced
  - [ ] Lock triggered after 15 min
  - [ ] Cleanup removes listeners

- [ ] `services/verification-token.service.test.ts` (6+ tests)
  - [ ] Store token with TTL
  - [ ] Retrieve valid token
  - [ ] Expire expired token
  - [ ] Check validity without retrieval

**Integration Tests:**

- [ ] `flows/soft-lock.integration.test.ts`
  - [ ] Complete unlock flow with PASSCODE
  - [ ] Complete unlock flow with biometric
  - [ ] Rate limiting blocks user
  - [ ] Session refresh while locked

**Component Tests:**

- [ ] `components/auth/SoftLockOverlay.test.tsx`
  - [ ] Renders when locked
  - [ ] Hides when unlocked
  - [ ] PASSCODE auto-submits at 6 digits
  - [ ] Shows attempts remaining
  - [ ] Shows block countdown

- [ ] `components/auth/PinVerificationModal.test.tsx`
  - [ ] Shows transaction details
  - [ ] PIN auto-submits at 4 digits
  - [ ] Calls onSuccess with PIN
  - [ ] Shows attempts remaining
  - [ ] Disables when blocked

**E2E Tests:**

- [ ] `e2e/soft-lock.spec.ts`
  - [ ] App locks after 15 min inactivity
  - [ ] User can unlock with PASSCODE
  - [ ] Lock screen doesn't show dashboard content
  - [ ] User can access app after unlock
  - [ ] PIN modal shows for transaction

---

### Phase 5️⃣: Polish & Documentation

**Time: ~2 hours** | **Difficulty: ⭐**

**Code Quality:**

- [ ] All TypeScript types defined
- [ ] No `any` types used
- [ ] ESLint passes
- [ ] Prettier formatted
- [ ] No console.logs in production code

**Accessibility:**

- [ ] All buttons have aria-labels
- [ ] Modal is keyboard navigable
- [ ] Focus visible on interactive elements
- [ ] Error messages associated with inputs
- [ ] High contrast colors (WCAG AA)

**Documentation:**

- [ ] JSDoc comments on all functions
- [ ] README updated with soft-lock section
- [ ] Configuration section documented
- [ ] Error recovery guide added

**Performance:**

- [ ] Activity listeners debounced (verify in DevTools)
- [ ] No memory leaks on cleanup (verified with DevTools)
- [ ] localStorage writes are minimal (~2/sec max)
- [ ] CPU usage low during inactivity (<5%)

---

## 🎯 Implementation Order (Recommended)

```
Day 1:
  └─ Create securityStore (2h)
  └─ Create soft-lock.service (2h)
  └─ Create verification.service (1h)
  └─ Create verification-token.service (1h)

Day 2:
  └─ Create SecurityGuard (1h)
  └─ Create SoftLockOverlay (3h)
  └─ Test components with Storybook (2h)

Day 3:
  └─ Create PinVerificationModal (2h)
  └─ Integrate into layout.tsx (1h)
  └─ Integrate into transaction flows (2h)
  └─ Manual testing (1h)

Day 4:
  └─ Unit tests (3h)
  └─ Integration tests (2h)
  └─ E2E tests (1h)
  └─ Bug fixes & polish (2h)
```

---

## ✅ Pre-Implementation Checklist

**Before you start, confirm:**

- [ ] Backend has `/verification/passcode` endpoint
- [ ] Backend has `/verification/pin` endpoint (optional, for pre-check)
- [ ] Backend returns `verificationToken` from biometric `intent: 'transaction'`
- [ ] Backend validates PIN in `/user/topup` (server-side, not frontend)
- [ ] Zustand is installed in `package.json`
- [ ] All UI components (Button, Input, Dialog, Card) exist in `src/components/ui/`
- [ ] Lucide icons package is available
- [ ] Sonner toast library is available
- [ ] Jest is configured and working
- [ ] Your codebase uses ShadCN/Radix components

---

## 🚀 Quick Start Template

### Step 1: Create the store

```bash
cat > src/store/securityStore.ts << 'EOF'
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SoftLockService } from "@/services/soft-lock.service";

interface SecurityState {
  isLocked: boolean;
  appState: "LOADING" | "LOCKED" | "ACTIVE";
  // ... (copy full implementation from guide)
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      // ... (implementation)
    }),
    { name: "security-store" }
  )
);
EOF
```

### Step 2: Create the service

```bash
cat > src/services/soft-lock.service.ts << 'EOF'
export class SoftLockService {
  // ... (copy full implementation from guide)
}
EOF
```

### Step 3: Create the component

```bash
mkdir -p src/components/guards
cat > src/components/guards/SecurityGuard.tsx << 'EOF'
// ... (copy full implementation from guide)
EOF
```

### Step 4: Update layout

```typescript
// In src/app/layout.tsx, add:
import { SecurityGuard } from "@/components/guards/SecurityGuard";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <SecurityGuard>
            {children}
          </SecurityGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 🐛 Debugging Tips

**Lock screen not appearing?**

```typescript
// Check store state
const state = useSecurityStore.getState();
console.log({
  isLocked: state.isLocked,
  appState: state.appState,
  lastActiveTime: state.lastActiveTime,
  timeSinceActive: Date.now() - state.lastActiveTime,
});
```

**Activity not recording?**

```typescript
// Check localStorage
localStorage.getItem("security_last_active");
// Should update every 30 seconds

// Check if listeners are attached
document.addEventListener("click", () => console.log("click"));
```

**PIN not submitting?**

```typescript
// Check if handler is called
const handleSubmit = () => {
  console.log("Submit called with PIN:", pin);
  // ... rest of logic
};
```

**Rate limiting not working?**

```typescript
// Check if block time is set correctly
const now = Date.now();
const blockExpireTime = state.blockExpireTime;
console.log("Blocked:", now < blockExpireTime);
console.log("Minutes remaining:", Math.ceil((blockExpireTime - now) / 60000));
```

---

## 📊 Success Criteria

✅ **All of these should be true:**

1. User is active → No lock screen
2. User inactive 15 min → Lock screen appears
3. User enters correct PASSCODE → Lock screen disappears
4. User enters wrong PASSCODE 5x → Account blocked for 10 min
5. User accesses /user/topup with amount > 10,000 → PIN modal shows
6. User enters PIN → Transaction sent with `auth.pin`
7. User accesses /user/topup with biometric → Verification token returned
8. Lock can be unlocked via PASSCODE fallback if biometric unavailable
9. All localStorage persists across page reload
10. No sensitive data shown while appState === "LOADING"

---

## 🔗 Cross-References

| Document                                     | Purpose                                    |
| -------------------------------------------- | ------------------------------------------ |
| `SOFT_LOCK_IMPLEMENTATION_GUIDE.md`          | **Start here** - Full implementation guide |
| `IMPLEMENTATION_GUIDE_COMPARISON.md`         | Why we chose this architecture             |
| `FRONTEND_PIN_PASSCODE_INTEGRATION_GUIDE.md` | Alternative approach (reference)           |
| `SOFT_LOCK_DISCOVERY_REPORT.md`              | Initial analysis                           |

---

## 📞 Support

**Questions During Implementation?**

1. Check the "Troubleshooting" section in `SOFT_LOCK_IMPLEMENTATION_GUIDE.md`
2. Review the comparison document for architecture decisions
3. Look at test examples for expected behavior

**Common Issues:**

- "Why doesn't my lock screen appear?" → Check appState initialization
- "PIN works but should fail?" → Backend might not be validating
- "Rate limiting not resetting?" → Check blockExpireTime timestamp logic

---

_Last Updated: December 28, 2025_
_Ready to Implement: YES ✅_
