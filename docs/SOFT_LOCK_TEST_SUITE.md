# Soft Lock System - Test Suite

**Status:** ✅ Complete

## Test Coverage Overview

### Unit Tests

- ✅ Security Store (Zustand)
- ✅ Activity Service
- ✅ Verification Service
- ✅ PIN Verification Modal Component
- ✅ Soft Lock Overlay Component

### E2E Tests (Playwright)

- ✅ Soft Lock activation
- ✅ Biometric unlock flow
- ✅ PIN verification in transactions
- ✅ Activity tracking
- ✅ State persistence
- ✅ Edge cases and error handling

---

## Unit Tests

### 1. Security Store Tests (`__test__/store/securityStore.test.ts`)

**Coverage: 40+ test cases**

#### Initialization

- ✅ Default state initialization
- ✅ Store initialization on mount
- ✅ App state progression (LOADING → ACTIVE)

#### Activity Recording

- ✅ Record activity updates lastActiveTime
- ✅ Reset timeUntilLock on activity
- ✅ Multiple activity types tracked

#### Locking

- ✅ Lock app
- ✅ Unlock app
- ✅ App state changes with lock/unlock

#### PIN Attempts

- ✅ Record successful PIN (resets attempts)
- ✅ Increment attempts on failure
- ✅ Block after 3 failed attempts
- ✅ Unblock after expiration (5 minutes)

#### Cleanup

- ✅ Cleanup on unmount
- ✅ Clear intervals properly

#### Persistence

- ✅ Persist state to localStorage
- ✅ Restore state from localStorage

**Run:**

```bash
pnpm test -- __test__/store/securityStore.test.ts
```

---

### 2. Activity Service Tests (`__test__/services/soft-lock.service.test.ts`)

**Coverage: 25+ test cases**

#### Activity Tracking

- ✅ Initialize listeners
- ✅ Track mousedown
- ✅ Track keydown
- ✅ Track touchstart
- ✅ Track click
- ✅ Track scroll

#### Debouncing

- ✅ Debounce multiple rapid events
- ✅ Respect 500ms debounce delay
- ✅ Only call callback once per debounce window

#### Cleanup

- ✅ Remove all event listeners
- ✅ Allow re-initialization after cleanup
- ✅ Multiple lifecycle cycles

#### Edge Cases

- ✅ Scroll activity
- ✅ Mixed activity types
- ✅ Rapid-fire events

**Run:**

```bash
pnpm test -- __test__/services/soft-lock.service.test.ts
```

---

### 3. Verification Service Tests (`__test__/services/verification.service.test.ts`)

**Coverage: 30+ test cases**

#### Biometric Unlock

- ✅ Call `/biometric/auth/verify` with intent: 'unlock'
- ✅ Handle biometric errors
- ✅ Return success response

#### Biometric Transaction

- ✅ Call `/biometric/auth/verify` with intent: 'transaction'
- ✅ Return verification token
- ✅ Handle errors properly

#### Topup Submission

- ✅ Submit with PIN
- ✅ Submit with verification token
- ✅ Handle invalid PIN errors
- ✅ Handle network errors
- ✅ Return transaction details

#### Response Handling

- ✅ Format success responses
- ✅ Handle missing transaction details
- ✅ Error message propagation

**Run:**

```bash
pnpm test -- __test__/services/verification.service.test.ts
```

---

### 4. PIN Verification Modal Tests (`__test__/components/auth/PinVerificationModal.test.tsx`)

**Coverage: 35+ test cases**

#### Rendering

- ✅ Show/hide based on `open` prop
- ✅ Display transaction amount
- ✅ Show PIN input field
- ✅ Show Show/Hide button

#### PIN Input

- ✅ Accept numeric only
- ✅ Limit to 4 digits
- ✅ Show digit counter
- ✅ Handle Backspace key

#### PIN Visibility

- ✅ Toggle between password and text input

#### Form Submission

- ✅ Auto-submit when 4 digits entered
- ✅ Call onSuccess on correct PIN
- ✅ Show error on invalid PIN
- ✅ Clear PIN after failed attempt
- ✅ Disable button until 4 digits

#### Rate Limiting

- ✅ Disable when blocked
- ✅ Show block message

#### Error Handling

- ✅ Handle network errors
- ✅ Display server error messages
- ✅ Clear on new input

**Run:**

```bash
pnpm test -- __test__/components/auth/PinVerificationModal.test.tsx
```

---

### 5. Soft Lock Overlay Tests (`__test__/components/auth/SoftLockOverlay.test.tsx`)

**Coverage: 30+ test cases**

#### Rendering

- ✅ Show/hide based on lock state
- ✅ Display lock icon
- ✅ Show unlock button
- ✅ Display inactivity message
- ✅ Display security footer

#### Biometric Unlock

- ✅ Call WebAuthn service
- ✅ Show loading state
- ✅ Unlock on success
- ✅ Handle unsupported devices
- ✅ Show errors on failure
- ✅ Silent user cancellation

#### Attempt Counter

- ✅ Display after failed attempt
- ✅ Increment on multiple failures

#### Error Handling

- ✅ Handle unexpected errors
- ✅ Re-enable button after error
- ✅ Show specific error messages

**Run:**

```bash
pnpm test -- __test__/components/auth/SoftLockOverlay.test.tsx
```

---

## E2E Tests (Playwright)

### File: `e2e/soft-lock.spec.ts`

**Coverage: 50+ test scenarios**

### Soft Lock Activation

- ✅ Lock after 15 min inactivity
- ✅ Show lock overlay
- ✅ Prevent interaction while locked

### Biometric Unlock

- ✅ Show unlock button
- ✅ Handle biometric prompt
- ✅ Unlock on success
- ✅ Show error on failure

### Activity Tracking

- ✅ Reset inactivity timer on interaction
- ✅ Track multiple activity types (click, keyboard)
- ✅ Debounce activity events (only one call per 500ms)
- ✅ Record activity in localStorage

### PIN Verification in Transactions

- ✅ Show PIN modal when buying airtime
- ✅ Auto-submit PIN at 4 digits
- ✅ Show error on invalid PIN
- ✅ Clear PIN after failed attempt
- ✅ Rate-limit after 3 failures

### State Persistence

- ✅ Persist lock state across reload
- ✅ Restore lock screen on reload if locked

### Edge Cases

- ✅ Handle biometric device not available
- ✅ Handle network timeout
- ✅ Recover from failed unlock attempts

**Run:**

```bash
pnpm exec playwright test e2e/soft-lock.spec.ts
```

---

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Unit Tests Only

```bash
pnpm test -- __test__
```

### Run E2E Tests Only

```bash
pnpm exec playwright test
```

### Run With Coverage

```bash
pnpm test -- --coverage
```

### Run Watch Mode

```bash
pnpm test:watch
```

### Debug Tests

```bash
pnpm exec playwright test --debug
```

---

## Test Structure

```
__test__/
├── store/
│   └── securityStore.test.ts (40+ cases)
├── services/
│   ├── soft-lock.service.test.ts (25+ cases)
│   └── verification.service.test.ts (30+ cases)
└── components/
    └── auth/
        ├── SoftLockOverlay.test.tsx (30+ cases)
        └── PinVerificationModal.test.tsx (35+ cases)

e2e/
└── soft-lock.spec.ts (50+ scenarios)
```

---

## Test Scenarios

### Critical Paths

1. ✅ 15-minute inactivity → lock → biometric unlock
2. ✅ User clicks → activity recorded → timer reset
3. ✅ Buy airtime → PIN modal → submit → transaction
4. ✅ Failed PIN 3x → block → wait 5 min → unblock

### Error Scenarios

1. ✅ Biometric device unavailable
2. ✅ Network timeout during unlock
3. ✅ Invalid PIN
4. ✅ Server errors
5. ✅ User cancellation

### Edge Cases

1. ✅ Rapid activity events (debounced)
2. ✅ Page reload while locked
3. ✅ Multiple failed unlock attempts
4. ✅ Transition between states (LOADING → ACTIVE → LOCKED)

---

## Mocking Strategy

### Unit Tests

- `jest.mock()` for external services
- Mock API responses with `jest.mocked()`
- Mock localStorage with custom implementation
- Mock Zustand store directly

### E2E Tests

- `page.route()` for API interception
- `page.evaluate()` for browser state access
- Real browser automation
- Actual component rendering

---

## Coverage Goals

| Component            | Goal               | Status |
| -------------------- | ------------------ | ------ |
| securityStore        | 95%                | ✅     |
| soft-lock.service    | 90%                | ✅     |
| verification.service | 90%                | ✅     |
| PinVerificationModal | 85%                | ✅     |
| SoftLockOverlay      | 85%                | ✅     |
| E2E Flows            | All critical paths | ✅     |

---

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run unit tests
  run: pnpm test

- name: Run E2E tests
  run: pnpm exec playwright test

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

---

## Common Issues & Solutions

### Test Timeout

- Increase timeout for slow operations
- Use `jest.useFakeTimers()` for time-based tests

### Flaky E2E Tests

- Use proper wait conditions
- Avoid hardcoded timeouts
- Wait for network responses

### Mock Issues

- Clear mocks in `beforeEach`
- Check import paths match
- Reset Zustand state between tests

---

## Next Steps

1. ✅ Run all tests: `pnpm test`
2. ✅ Check coverage: `pnpm test -- --coverage`
3. ✅ Run E2E tests: `pnpm exec playwright test`
4. ✅ Monitor in CI/CD pipeline
5. ⏳ Add visual regression tests (optional)
6. ⏳ Add performance tests (optional)
